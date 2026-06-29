import os
import re
import subprocess
import sys
from typing import Generator

from helpers.files import *
from helpers.misc_utils import *
from helpers.parse_decompiled import *
from helpers.parse_dwarf import *
from helpers.typename import *

print('Decompiling')
if not os.path.isfile(file_wasm_debug):
    print(f'Could not find {file_wasm_debug}', file=sys.stderr)
    exit(1)
try:
    decompiled_text = subprocess.run(
        f'wasm-decompile "{file_wasm_debug}"',
        stdout=subprocess.PIPE,
        check=True
    ).stdout.decode('utf-8')
    exported_vars, exported_funcs = parse_decompiled(decompiled_text)
except FileNotFoundError:
    print(
        'Could not decompile binary; is wasm-decompile installed?',
        file=sys.stderr
    )
    exit(1)

dwarf_parser = DwarfParser()

try:
    dwarf_text = subprocess.run(
        f'llvm-dwarfdump "{file_wasm_debug}"',
        stdout=subprocess.PIPE,
        check=False
    ).stdout.decode('utf-8')

    print('Parsing DWARF')

    tree, _ = dwarf_parser.parse(dwarf_text)

    # DEBUG ONLY: write dwarfdump output to a file to inspect
    with open(f'./pkg/{basename}.dwarfdump.txt', 'w') as f:
        str_opts = RawDwarfNode.ToStringOptions(
            {"inlined_subroutine"},
            set("""
                containing_type encoding address_class abstract_origin low_pc 
                high_pc call_file call_line call_column decl_file decl_line  
                inline ranges GNU_discriminator external linkage_name frame_base 
                name declaration accessibility noreturn
                """.strip().split()),
            {"compile_unit"},
            {"namespace", "subprogram", "compile_unit"}
        )

        f.write('\n'.join(
            i for i in (root.to_string(str_opts) for root in tree.children) if i
        ))

except FileNotFoundError:
    print(
        'llvm-dwarfdump (optional) not found; skipping dwarf info',
        file=sys.stderr
    )

print('Analyzing')

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

impls: dict[TraitObject, dset[TypeName]] = {}


def find_trait_impls(t: TypeName) -> TypeName:
    # print(t)
    if isinstance(t, TraitImpl):
        impls.setdefault(TraitObject(t.trait), dset()).add(t.implementing_type)
    return t


for type in dwarf_structs.values():
    type.name.apply_recursive(find_trait_impls)

print(impls)

used_names: dset[TypeName] = dset()
for exported_var in exported_vars:
    if exported_var.link_name not in dwarf_vars: continue
    used_names.add(unwrap_simply_derived_type(dwarf_vars[exported_var.link_name].type))
for exported_func in exported_funcs:
    if exported_func.link_name not in dwarf_funcs: continue
    d_func = dwarf_funcs[exported_func.link_name]
    for typename in [
        *(i.type for i in d_func.params),
        *([d_func.return_type] if d_func.return_type else [])
    ]:
        if not typename: continue
        typename = unwrap_simply_derived_type(typename)
        if not typename: continue
        used_names.add(typename)


def get_trait_object(t: TypeName) -> TraitObject | None:
    if isinstance(t, TraitObject):
        return t
    elif isinstance(t, Reference) and isinstance(t.pointee, TraitObject):
        return t.pointee
    return None


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
        if trait_object := get_trait_object(t):
            yield from impls.get(trait_object, [])


# Collect used_names into a dict from type name strings to the corresponding DStruct/DEnums
dwarf_types: dict[TypeName, DStruct | DEnum] = {
    k: v
    for k in closure(
        used_names,
        lambda type_name: filter_none(
            map(unwrap_simply_derived_type, filter_none(
                traverse(type_name)
            ))
        ),
        on_find=lambda x: print(f'Found type {x}'),
        on_cycle=lambda: print(f'End closure cycle')
    )
    if (v := dwarf_structs.get(k, None) or dwarf_enums.get(k, None)) is not None
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

generated_type_references: dict[TypeName, str] = {}
for id, typename in enumerate([*dwarf_types.keys()]):
    type_str = typename.to_alphanumeric()
    if type_str in generated_type_references.values() or type_str in typescript_reserved_words:
        type_str = f'{type_str}${id}'

    generated_type_references[typename] = f'{type_str}'


def quote_type(type_name: TypeName) -> str:
    referenced_typename = unwrap_simply_derived_type(type_name)
    simple_typename = type_name.strip_namespaces()
    if referenced_typename is not None and referenced_typename in generated_type_references:
        return f'{{@link {generated_type_references[referenced_typename]} `{simple_typename}`}}'
    else:
        return f'`{simple_typename}`'


# Generate variable defs
for var2 in exported_vars:
    doc = [f'- WASM type: `{var2.WASM_type}`']

    if var2.link_name in dwarf_vars:
        var_info = dwarf_vars[var2.link_name]
        doc.append(f'- Rust name: `{var_info.name}`')
        doc.append(f'- Rust type: {quote_type(var_info.type)}')

    module_contents.append('')
    module_contents.append(f'/**\n * {'\n * '.join(doc)}\n */')
    module_contents.append(f'readonly {var2.link_name}: number;')

# Generate function defs
for func2 in exported_funcs:
    doc = []
    if func2.WASM_type:
        doc.append(f'- Return type: `{func2.WASM_type}`')

    param_docs: dict[str, list[str]] = {
        param.link_name: [
            f'WASM type: `{param.WASM_type}`'
        ] for param in func2.params
    }

    if func2.link_name in dwarf_funcs:
        func_info = dwarf_funcs[func2.link_name]
        if func_info.return_type:
            doc.append(
                f'- Rust return type: {quote_type(func_info.return_type)}')
        doc.append(f'- Rust name: `{func_info.name}`')

        param_assignment: list[tuple[str, DInnerVar]] = []
        if not func2.WASM_type and func_info.return_type != '()' and len(
            func2.params) == len(func_info.params) + 1:
            param_assignment.append((
                func2.params[0].link_name,
                DInnerVar(
                    '<RVO return value>',
                    Reference(False, True, func_info.return_type)
                )
            ))
            param_assignment.extend(
                zip((p.link_name for p in func2.params[1:]), func_info.params))

        elif len(func2.params) != len(func_info.params):
            print(f'Param length mismatch for {func2.link_name}:', func2.params,
                  func_info.params, file=sys.stderr)
            doc.append(repr(func_info.params))
        else:
            param_assignment.extend(
                zip((p.link_name for p in func2.params), func_info.params))

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

    for param2 in func2.params:
        doc.append(f'@param {param2.link_name}')
        doc.extend(f'     - {line}' for line in param_docs[param2.link_name])

    module_contents.append('')
    module_contents.append(f'/**\n * {'\n * '.join(doc)}\n */')
    module_contents.append(
        f'{
        func2.link_name
        }({
        ', '.join(i.link_name + ': number' for i in func2.params)
        }): {
        'number' if func2.WASM_type else 'void'
        };'
    )


def generate_members_table(members: list[DStructMember]) -> list[str]:
    res = []
    field_table_entries: list[tuple[str, str, str]] = [
        ('Name', '@', 'Type')
    ]

    for member in members:
        field_table_entries.append((
            f'`{member.name.strip_namespaces()}`',
            f'`{member.location}`',
            quote_type(member.type)
        ))

    w1 = max(len(i[0]) for i in field_table_entries)
    w2 = max(len(i[1]) for i in field_table_entries)
    w3 = max(len(i[2]) for i in field_table_entries)

    for entry in field_table_entries:
        res.append(
            f'| {entry[0]:{w1}} | {entry[1]:{w2}} | {entry[2]:{w3}} |'
        )
    res.insert(
        1,
        f'| {"-" * w1} | {"-" * w2} | {"-" * w3} |'
    )
    return res


# Generate type list
for id, (name, typ) in enumerate(dwarf_types.items()):
    doc = [
        f'- Name: `{typ.name.strip_namespaces()}`',
        f'- Size: `{typ.size}`',
    ]

    if isinstance(typ, DStruct):
        if typ.members:
            doc.append('')
            doc.append('Fields:')
            doc.extend(generate_members_table(typ.members))

        if trait_object := get_trait_object(name):
            if trait_object in impls:
                doc.append('')
                doc.append(f'Implementations: {
                ', '.join(quote_type(i) for i in impls[trait_object])
                }')

    elif isinstance(typ, DEnum):
        discriminant = typ.discriminant
        if discriminant is not None:
            doc.append(f'- Discriminant layout: `{discriminant.type}` @ `{discriminant.location}`')

        if typ.variants:
            doc.append("")
            doc.append("Variants:")
            for i in typ.variants:
                doc.append("")
                doc.append(f"- `{i.type.name.strip_namespaces()}` (discriminant value = `{
                '<default>' if i.discriminant is None else i.discriminant
                }`{
                f', offset = `{i.location}`' if i.location else ''
                }):")

                doc.extend(generate_members_table(i.type.members))

    aux_contents.append('')
    aux_contents.append(f'/**\n * {'\n * '.join(doc)}\n */')
    aux_contents.append(f'type {generated_type_references[name]} = any;')

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
            function_name = str(
                dwarf_funcs[function_name].name.strip_namespaces())

        # Add disambiguation chars back in
        if disambiguation:
            function_name += f"${disambiguation}"

        # Quote non-alphanumeric names
        if re.match(r'.*\W.*', function_name):
            function_name = f'"{function_name}"'

        return function_name + mangled.group(2)


    # Replace functions
    decompiled_text = re.sub(
        r'\b(\w+)( *\()',
        replace_mangled, decompiled_text
    )

    # Misc syntax cleaning up

    decompiled_text = re.sub(r'([,=])\s*', r'\1 ', decompiled_text)  # Spacing
    decompiled_text = re.sub(r'(\()\s*', '(', decompiled_text)  # Spacing
    decompiled_text = re.sub(r'\s*\)', ')', decompiled_text)  # Spacing

    decompiled_text = re.sub(r'(\w+)\[0]', r'*\1', decompiled_text)  # Deref

    # Write file
    out.write(decompiled_text)

print('Done')
