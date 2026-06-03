from parse_dwarf import *
from parse_decompiled import *

print('Analyzing')

with open("./pkg/simulator.wasm.decompiled.txt", "r") as decompiled:
    decompiled_text = decompiled.read()
    exported_vars, exported_funcs = parse_decompiled(decompiled_text)

dwarf_vars: dict[str, DwarfVariable]
dwarf_funcs: dict[str, DwarfFunction]

try:
    dwarf_file = open("./pkg/simulator.wasm.dwarf.txt", "r")
except FileNotFoundError:
    dwarf_vars, dwarf_funcs = {}, {}
else:
    with dwarf_file as dwarf:
        dwarf_text = dwarf.read()
        dwarf_text = re.sub(r'^0x[0-9a-fA-F]{8}:', ' ' * 11, dwarf_text, flags=re.RegexFlag.M)

        dwarf_vars_list, dwarf_funcs_list = parse_dwarf(dwarf_text)
        dwarf_vars = {v.link_name: v for v in dwarf_vars_list}
        dwarf_funcs = {f.link_name: f for f in dwarf_funcs_list}

print('Generating defs')

module_contents: list[str] = [
    '',
    'readonly memory: WebAssembly.Memory;'
]

# Generate variable defs
for var in exported_vars:
    doc = [f'- WASM type: `{var.WASM_type}`']

    if var.link_name in dwarf_vars:
        var_info = dwarf_vars[var.link_name]
        doc.append(f'- Rust name: `{var_info.name}`')
        doc.append(f'- Rust type: `{var_info.type}`')

    module_contents.append('')
    module_contents.append(f'/**\n * {'\n * '.join(doc)}\n */')
    module_contents.append(f'readonly {var.link_name}: number;')

for func in exported_funcs:
    doc = []
    if func.WASM_type:
        doc.append(f'- Return type: `{func.WASM_type}`')

    param_docs: dict[str, list[str]] = {
        param.link_name: [
            f'WASM type: `{param.WASM_type}`'
        ] for param in func.params
    }

    if func.link_name in dwarf_funcs:
        func_info = dwarf_funcs[func.link_name]
        if func_info.return_type:
            doc.append(f'- Rust return type: `{func_info.return_type}`')
        doc.append(f'- Rust name: `{func_info.name}`')

        param_assignment: list[tuple[str, DwarfParam]] = []
        # wasm returns nothing but rust returns non-unit; we probably used RVO and added an extra param to wasm
        if not func.WASM_type and func_info.return_type != '()' and len(func.params) == len(func_info.params) + 1:
            param_assignment.append((func.params[0].link_name, DwarfParam('<RVO return value>', func_info.return_type)))
            param_assignment.extend(zip((p.link_name for p in func.params[1:]), func_info.params))

        elif len(func.params) != len(func_info.params):
            print(f'Param length mismatch for {func.link_name}:', func.params, func_info.params)
            doc.append(repr(func_info.params))
        else:
            param_assignment.extend(zip((p.link_name for p in func.params), func_info.params))

        for param_name, param_info in param_assignment:
            if param_info.type is not None:
                param_docs[param_name].append(f'Rust type: `{param_info.type}`')
            if param_info.name == '<RVO return value>':
                param_docs[param_name].insert(0, f'Converted from RVO return value')
            elif param_info.name is not None:
                param_docs[param_name].append(f'Rust name: `{param_info.name}`')

    for param in func.params:
        doc.append(f'@param {param.link_name}')
        doc.extend(f'     - {line}' for line in param_docs[param.link_name])

    module_contents.append('')
    module_contents.append(f'/**\n * {'\n * '.join(doc)}\n */')
    module_contents.append(
        f'{
        func.link_name
        }({
        ', '.join(i.link_name + ': number' for i in func.params)
        }): {
        'number' if func.WASM_type else 'void'
        };'
    )

print('Writing to file')

with open('pkg/simulator.d.ts', 'w') as out:
    module_contents_str = '\n'.join(module_contents)

    module_str = f'export const module : {{{
        ''.join('    ' + line + '\n' for line in module_contents_str.split('\n'))
    }}}\n// noinspection JSUnusedGlobalSymbols\nexport default module;'
    out.write(module_str)

print('Done')