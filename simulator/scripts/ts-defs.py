import os
import subprocess
import sys
from typing import Generator

from helpers.files import *
from helpers.parse_decompiled import *
from helpers.parse_dwarf import *
from helpers.misc_utils import *
from helpers.typename import *

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

    tree, lookup = dwarf_parser.parse(dwarf_text)

    with open(f'./pkg/{basename}.raw.dwarfdump.txt', 'w') as f:
        f.write(dwarf_text)

    # DEBUG ONLY: write dwarfdump output to a file to inspect
    with open(f'./pkg/{basename}.dwarfdump.txt', 'w') as f:
        str_opts = RawDwarfNode.ToStringOptions(
            set("""
            DW_TAG_inlined_subroutine
            """.strip().split()),
            set("""
            DW_AT_containing_type
            DW_AT_encoding
            DW_AT_address_class
            DW_AT_abstract_origin
            DW_AT_low_pc         
            DW_AT_high_pc        
            DW_AT_call_file      
            DW_AT_call_line      
            DW_AT_call_column    
            DW_AT_decl_file  
            DW_AT_decl_line  
            DW_AT_inline     
            DW_AT_ranges
            DW_AT_GNU_discriminator
            DW_AT_external
            DW_AT_linkage_name
            DW_AT_frame_base
            DW_AT_name
            DW_AT_declaration
            DW_AT_accessibility
            DW_AT_noreturn
            """.strip().split()),
            set("""
            DW_TAG_compile_unit
            """.strip().split()),
            set("""
            DW_TAG_namespace
            DW_TAG_subprogram
            DW_TAG_compile_unit
            """.strip().split())
        )

        f.write('\n'.join(
            i for i in (root.to_string(str_opts) for root in tree.children) if i
        ))

    print('Analyzing dwarf')

dwarf_vars = {
    v.link_name: v
    for v in dwarf_parser.exported_variables
}

dwarf_funcs = {
    f.link_name: f
    for f in dwarf_parser.exported_functions
}

dwarf_structs: dict[TypeName, DStruct] = {
    i.name: i
    for i in dwarf_parser.structs
}

dwarf_enums: dict[TypeName, DEnum] = {
    i.name: i
    for i in dwarf_parser.enums
}

with open('pkg/types_all.wasm.decompiled.txt', 'w') as f:
    S: set[TypeName | None] = set()
    for func in dwarf_funcs.values():
        S.add(func.return_type)
        for param in func.params:
            S.add(param.type)
    for var in dwarf_vars.values():
        S.add(var.type)
    for type in dwarf_structs.values():
        S.add(type.name)
        for member in type.members:
            S.add(member.type)
    S.discard(None)
    S.discard('')
    S: set[TypeName]
    f.write('\n'.join(sorted(str(i) for i in S)))

impls: dict[TraitObject, set[TypeName]] = {}


def find_trait_impls(t: TypeName) -> TypeName:
    if isinstance(t, TraitImpl):
        impls.setdefault(TraitObject(t.trait), set()).add(t.implementing_type)
    return t


for type in dwarf_structs.values():
    type.name.apply_recursive(find_trait_impls)

used_names: set[TypeName] = set()
for var in exported_vars:
    if var.link_name not in dwarf_vars: continue
    used_names.add(unwrap_simply_derived_type(dwarf_vars[var.link_name].type))
for func in exported_funcs:
    if func.link_name not in dwarf_funcs: continue
    v = dwarf_funcs[func.link_name]
    for typename in [
        *(i.type for i in v.params),
        *([v.return_type] if v.return_type else [])
    ]:
        if not typename: continue
        typename = unwrap_simply_derived_type(typename)
        if not typename: continue
        used_names.add(typename)


def traverse(t: TypeName) -> Generator[TypeName | None]:
    # Types defined in dwarf as enums
    if t in dwarf_enums:
        for enum_variant in dwarf_enums[t].variants:
            if isinstance(enum_variant.type, TypeName):
                yield enum_variant.type
            else:
                yield from (i.type for i in enum_variant.type.members)

    # Types defined in dwarf as structs
    if t in dwarf_structs:
        yield from (i.type for i in dwarf_structs[t].members)
        # Include trait instantiations through dyn
        if isinstance(t, TraitObject):
            yield from impls.get(t, [])


used_names = closure(
    used_names,
    lambda type_name: filter_none(
        map(unwrap_simply_derived_type, filter_none(
            traverse(type_name)
        ))
    ),
    on_find=lambda x: print(f'Found type {x}'),
    on_cycle=lambda: print(f'End closure cycle')
)

dwarf_structs = {
    k: v for k, v in dwarf_structs.items() if k in used_names
}
dwarf_enums = {
    k: v for k, v in dwarf_enums.items() if k in used_names
}

print('Generating defs')

module_contents: list[str] = [
    '',
    'readonly memory: WebAssembly.Memory;'
]
aux_contents: list[str] = []

typescript_reserved_words = """
any as boolean break case catch class const constructor continue debugger 
declare default delete do else enum export extends false finally for from 
function get if implements import in instanceof interface let module new null 
number of package private protected public require return set static string 
super switch symbol this throw true try type typeof var void while with yield
""".strip().split()

generated_type_obj_names: dict[TypeName, str] = {}
for id, type in enumerate(dwarf_structs.keys()):
    v = type.to_alphanumeric()
    if v in generated_type_obj_names.values() or v in typescript_reserved_words:
        v = f'{v}${id}'

    generated_type_obj_names[type] = f'{v}'


def quote_type(type_name: TypeName) -> str:
    referenced = unwrap_simply_derived_type(type_name)
    type_name = type_name.strip_namespaces()
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
        doc.append(f'- Return type: `{func.WASM_type}`')

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
                    Reference(False, True, func_info.return_type)
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
for id, (fullname, type) in enumerate(dwarf_structs.items()):

    doc = [
        f'- Name: `{type.name.strip_namespaces()}`',
        f'- Size: `{type.size}`',
    ]

    if len(type.members):
        doc.append('')
        doc.append('Fields:')

        field_table_entries: list[tuple[str, str, str]] = [
            ('Name', '@', 'Type')
        ]

        for member in type.members:
            member: DStructMember

            type = quote_type(member.type.strip_namespaces())
            name = f'`{member.name.strip_namespaces()}`'
            offset = f'`{member.location}`'

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

    if isinstance(fullname, TraitObject):
        if fullname in impls:
            doc.append('')
            doc.append(f'Implementations: {
            ', '.join(quote_type(i) for i in impls[fullname])
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
    def replace_mangled(mangled: re.Match[str]) -> str:
        function_name = mangled.group(1)

        # wasm-decompile chops names at 100 chars and may add disambiguation
        # characters afterward. To make sure we don't discard disambiguation,
        # only match on the first 100 chars
        function_name, disambiguation = function_name[:100], function_name[100:]

        if function_name in dwarf_funcs:
            function_name = str(dwarf_funcs[function_name].name.strip_namespaces())

        # Add disambiguation chars back in
        if disambiguation:
            function_name += f"${disambiguation}"

        # Quote non-alphanumeric names
        if re.match(r'.*\W.*', function_name):
            function_name = f'"{function_name}"'

        return function_name + mangled.group(2)


    decompiled_text = re.sub(
        # Only match what appear to be actual function calls or definitions
        r'\b(\w+)( *\()',
        replace_mangled, decompiled_text
    )
    decompiled_text = re.sub(
        r'([,=:])(?:\s*)?',
        r'\1 ',
        decompiled_text
    )
    decompiled_text = re.sub(
        r'\(\s*',
        '(',
        decompiled_text
    )
    decompiled_text = re.sub(
        r'\s*\)',
        ')',
        decompiled_text
    )

    out.write(decompiled_text)

print('Done')
