import os
import subprocess
import sys

from helpers.files import *
from helpers.parse_decompiled import *
from helpers.parse_dwarf import *
from scripts.helpers.type_util import *

print('Getting debug info')
if not os.path.isfile(file_wasm_debug):
    print(f'Could not find {file_wasm_debug}', file=sys.stderr)
    exit(1)
try:
    decompiled = subprocess.run(
        f'wasm-decompile "{file_wasm_debug}"',
        stdout=subprocess.PIPE,
        check=True
    ).stdout
except FileNotFoundError:
    print(
        'Could not decompile binary; is wasm-decompile installed?',
        file=sys.stderr
    )
    exit(1)
try:
    dwarf = subprocess.run(
        f'llvm-dwarfdump "{file_wasm_debug}"',
        stdout=subprocess.PIPE,
        check=False
    ).stdout
except FileNotFoundError:
    print(
        'llvm-dwarfdump (optional) not found; skipping dwarf info',
        file=sys.stderr
    )
    dwarf = None

print('Analyzing decompiled')

decompiled_text = decompiled.decode('utf-8')
exported_vars, exported_funcs = parse_decompiled(decompiled_text)

dwarf_parser = DwarfParser()
if dwarf is not None:
    print('Parsing dwarf')
    dwarf_text = dwarf.decode('utf-8')

    # DEBUG ONLY: write dwarfdump output to a file to inspect
    with open(f'./pkg/{basename}.dwarfdump.txt', 'w') as f:
        prettified = DwarfParser.preprocess_file(dwarf_text)
        # Remove excess indentation
        prettified = ('\n' + prettified).replace('\n' + ' ' * 12, '\n')[1:]
        # Remove NULL
        prettified = prettified.replace(' NULL\n', '')
        # Remove trailing whitespace
        prettified = re.sub(r'[ \t]*\n', '\n', prettified)
        # Remove excess lines
        prettified = re.sub(r'\n\n+', '\n\n', prettified)
        f.write(prettified)

    dwarf_parser.parse(dwarf_text)

    print('Analyzing dwarf')

dwarf_vars = {
    v.link_name: v
    for v in dwarf_parser.exported_variables
}

dwarf_funcs = {
    f.link_name: f
    for f in dwarf_parser.exported_functions
}

dwarf_types: dict[str, DType] = {
    (f'{i.namespace}::{i.name}' if i.namespace else i.name): i
    for i in dwarf_parser.types
}

dyn_impls: dict[str, list[str]] = {}
for type in dwarf_types.values():
    match = re.fullmatch(
        r'<([^ ]+) as ([^ ]+)>::\{vtable_type}',
        type.name
    )
    if match:
        dyn_impls.setdefault(match.group(2), []).append(match.group(1))

referenced_types: set[str] = set()
for var in exported_vars:
    if var.link_name not in dwarf_vars: continue
    t = dwarf_vars[var.link_name].type
    if not t: continue
    t = get_referenced_type(t)
    if not t: continue
    referenced_types.add(t)
for func in exported_funcs:
    if func.link_name not in dwarf_funcs: continue
    v = dwarf_funcs[func.link_name]
    for t in [
        *(i.type for i in v.params),
        *([v.return_type] if v.return_type else [])
    ]:
        if not t: continue
        t = get_referenced_type(t)
        if not t: continue
        referenced_types.add(t)

for m in referenced_types:
    print(f'Found new type {m}')

changed = referenced_types
while changed:
    print(f'Closure cycle (found {len(referenced_types)} so far)')
    edge = list(changed)
    changed = set()
    for t in edge:
        if t not in dwarf_types:
            continue

        # Include trait instantiations through dyn
        if re.fullmatch(r'dyn .*', t):
            trait = t[3:].strip()
            if trait not in dyn_impls:
                print('Unknown trait object', trait)
                continue
            for m in dyn_impls[trait]:
                if m in referenced_types: continue
                referenced_types.add(m)
                changed.add(m)
                print(f'Found new type {m}')
            continue

        for _, i in dwarf_types[t].members:
            m = i.type

            if m is None: continue
            m = get_referenced_type(m)
            if m is None: continue

            if m in referenced_types: continue

            referenced_types.add(m)
            changed.add(m)
            print(f'Found new type {m}')

dwarf_types = {
    k: v for k, v in dwarf_types.items() if k in referenced_types
}

print('Generating defs')

module_contents: list[str] = [
    '',
    'readonly memory: WebAssembly.Memory;'
]
aux_contents: list[str] = []

generated_type_obj_names: dict[str, str] = {}
for id, type in enumerate(dwarf_types.keys()):
    v = type_to_alphanumeric(type)
    if v in generated_type_obj_names.values() or v in typescript_reserved_words:
        v = f'{v}${id}'

    generated_type_obj_names[type] = f'{v}'


def quote_type(type_name: str) -> str:
    referenced = get_referenced_type(type_name)
    type_name = simplify_type_name(type_name)
    if referenced is not None and referenced in generated_type_obj_names:
        referenced = generated_type_obj_names[referenced]
        return f'{{@link {referenced} `{type_name}`}}'
    else:
        return f'`{type_name}`'


# Generate variable defs
for var in exported_vars:
    doc = [f'- WASM type: `{var.WASM_type}`']

    if var.link_name in dwarf_vars:
        var_info = dwarf_vars[var.link_name]
        doc.append(f'- Rust name: `{var_info.name}`')
        doc.append(f'- Rust type: {quote_type(var_info.type)}')

    module_contents.append('')
    module_contents.append(f'/**\n * {'\n * '.join(doc)}\n */')
    module_contents.append(f'readonly {var.link_name}: number;')

# Generate function defs
for func in exported_funcs:
    doc = []
    if func.WASM_type:
        doc.append(f'- Return type: {quote_type(func.WASM_type)}')

    param_docs: dict[str, list[str]] = {
        param.link_name: [
            f'WASM type: `{param.WASM_type}`'
        ] for param in func.params
    }

    if func.link_name in dwarf_funcs:
        func_info = dwarf_funcs[func.link_name]
        if func_info.return_type:
            doc.append(
                f'- Rust return type: {quote_type(func_info.return_type)}')
        doc.append(f'- Rust name: `{func_info.name}`')

        param_assignment: list[tuple[str, DInnerVar]] = []
        if not func.WASM_type and func_info.return_type != '()' and len(
            func.params) == len(func_info.params) + 1:
            param_assignment.append((
                func.params[0].link_name,
                DInnerVar(
                    '<RVO return value>',
                    f'&mut {func_info.return_type}'
                )
            ))
            param_assignment.extend(
                zip((p.link_name for p in func.params[1:]), func_info.params))

        elif len(func.params) != len(func_info.params):
            print(f'Param length mismatch for {func.link_name}:', func.params,
                  func_info.params, file=sys.stderr)
            doc.append(repr(func_info.params))
        else:
            param_assignment.extend(
                zip((p.link_name for p in func.params), func_info.params))

        for param_name, param_info in param_assignment:
            if param_info.type is not None:
                param_docs[param_name].append(
                    f'Rust type: {quote_type(param_info.type)}')
            if param_info.name == '<RVO return value>':
                param_docs[param_name].insert(
                    0,
                    f'Converted from RVO return value'
                )
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

# Generate type list
for id, (fullname, type) in enumerate(dwarf_types.items()):

    doc = [
        f'- Name: `{re.sub(r'\b(\w+::)', '', type.name)}`',
        f'- Size: `{type.size}`',
    ]

    if len(type.members):
        doc.append('')
        doc.append('Fields:')

        field_table_entries: list[tuple[str, str, str]] = [
            ('Name', '@', 'Type')
        ]

        for offset, member in type.members:
            type = '' if member.type is None else member.type
            name = '?' if member.name is None else member.name

            type = quote_type(type)

            type = simplify_type_name(type)
            name = simplify_type_name(name)

            name = f'`{name}`'
            offset = f'`{offset}`'

            field_table_entries.append((name, offset, type))

        col_1_w = max(len(i[0]) for i in field_table_entries)
        col_2_w = max(len(i[1]) for i in field_table_entries)
        col_3_w = max(len(i[2]) for i in field_table_entries)

        for entry in field_table_entries:
            doc.append(
                f'| {entry[0]:{col_1_w}} | {entry[1]:{col_2_w}} | {entry[2]:{col_3_w}} |'
            )
        doc.insert(
            1 - len(field_table_entries),
            f'| {"-" * col_1_w} | {"-" * col_2_w} | {"-" * col_3_w} |'
        )

    if fullname.startswith('dyn '):
        trait = fullname[3:].strip()
        if trait in dyn_impls:
            doc.append('')
            doc.append(f'Implementations: {
                ', '.join(quote_type(i) for i in dyn_impls[trait])
            }')

    aux_contents.append('')
    aux_contents.append(f'/**\n * {'\n * '.join(doc)}\n */')
    aux_contents.append(f'type {generated_type_obj_names[fullname]} = any;')

print('Writing to file')

with open(file_ts_defs, 'w') as out:
    module_contents_str = '\n'.join(module_contents)
    aux_contents_str = '\n'.join(aux_contents)

    header_str = '// noinspection JSUnusedGlobalSymbols'

    module_str = f'export const module : {{{
    ''.join('    ' + line + '\n' for line in module_contents_str.split('\n'))
    }}}'

    aux_str = f'export namespace types {{{
    ''.join('    ' + line + '\n' for line in aux_contents_str.split('\n'))
    }}}'

    footer_str = 'export default module;'

    out.write('\n\n'.join([
        header_str, module_str, aux_str, footer_str
    ]))

with open(file_wasm_decompiled, 'w') as out:
    def replace_mangled(match: re.Match[str]) -> str:
        function_name = match.group(1)

        # wasm-decompile chops names at 100 chars and may add disambiguation
        # characters afterward. To make sure we don't discard disambiguation,
        # only match on the first 100 chars
        function_name, disambiguation = function_name[:100], function_name[100:]

        if function_name in dwarf_funcs:
            function_name = dwarf_funcs[function_name].name
            # Quote non-alphanumeric names
            if re.match(r'.*\W.*', function_name):
                function_name = f'"{function_name}"'

        # Add disambiguation chars back in
        function_name += disambiguation

        return function_name + match.group(2)


    out.write(re.sub(
        # Only match what appear to be actual function calls or definitions
        fr'\b(\w+)( *\()',
        replace_mangled,
        decompiled_text
    ))

print('Done')
