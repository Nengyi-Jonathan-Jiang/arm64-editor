import re
from dataclasses import dataclass
from typing import Generator, Callable, final

from .typename import *

__all__ = [
    "DFunc", "DVar", "DStruct", "DStructMember", "DEnum", "DEnumDiscriminant", "DEnumVariant",
    "DInnerVar", "DwarfParser", "RawDwarfNode"
]


@final
@dataclass(frozen=True, eq=False)
class DFunc:
    name: Name
    link_name: str
    return_type: TypeName
    params: list[DInnerVar]


@final
@dataclass(frozen=True, eq=False)
class DVar:
    name: Name
    link_name: str
    type: TypeName


@final
@dataclass(frozen=True, eq=False)
class DStruct:
    name: TypeName
    size: int | None
    members: list[DStructMember]


@final
@dataclass(frozen=True, eq=False)
class DStructMember:
    location: int | None
    name: Name
    type: TypeName


@final
@dataclass(frozen=True, eq=False)
class DInnerVar:
    name: str | None
    type: TypeName


@final
@dataclass(frozen=True, eq=False)
class DEnum:
    name: TypeName
    size: int | None
    discriminant: DEnumDiscriminant | None
    variants: list[DEnumVariant]


@final
@dataclass(frozen=True, eq=False)
class DEnumDiscriminant:
    type: TypeName
    location: int | None


@final
@dataclass(frozen=True, eq=False)
class DEnumVariant:
    discriminant: int | None
    type: DStruct
    location: int | None


TAG_NAMESPACE = 'DW_TAG_namespace'

TAG_VAR = 'DW_TAG_variable'

TAG_FUNC = 'DW_TAG_subprogram'
TAG_PARAM = 'DW_TAG_formal_parameter'

TAG_STRUCT = 'DW_TAG_structure_type'
TAG_MEMBER = 'DW_TAG_member'
TAG_VARIANT_PART = 'DW_TAG_variant_part'
TAG_VARIANT = 'DW_TAG_variant'
TAG_ENUM = 'DW_TAG_enumeration_type'
TAG_ENUM_ENTRY = 'DW_TAG_enumerator'

AT_LINK_NAME = 'DW_AT_linkage_name'
AT_NAME = 'DW_AT_name'
AT_TYPE = 'DW_AT_type'
AT_LOC = 'DW_AT_location'

AT_SIZE = 'DW_AT_byte_size'
AT_MEMBER_LOC = 'DW_AT_data_member_location'
AT_ALIGNMENT = 'DW_AT_alignment'

AT_DISCR = 'DW_AT_discr'
AT_DISCR_VALUE = 'DW_AT_discr_value'

AT_ENUM_VALUE = 'DW_AT_const_value'


class DwarfParser:
    def __init__(self) -> None:
        self.exported_functions: list[DFunc] = []
        self.exported_variables: list[DVar] = []
        self.structs: list[DStruct] = []
        self.enums: list[DEnum] = []

    def parse(self, dwarf: str) -> tuple[RawDwarfNode, dict[int, RawDwarfNode]]:
        # Collapse empty lines
        dwarf = re.sub(r'\s+\n', '\n', dwarf)
        tree, lookup = RawDwarfNode.parse('root', dwarf)

        return tree, lookup

    def visit(self, node: RawDwarfNode, namespace: Name | None = None) -> None:
        if node.tag == TAG_NAMESPACE:
            name = _get_string(node.attributes.get(AT_NAME, None))
            if name is None:
                raise RuntimeError("Namespace does not have a name")
            namespace = parse_name(name, namespace)

            for child in node.children:
                self.visit(child, namespace)
            return

        try:
            if node.tag == TAG_FUNC:
                if func := self.visit_func(node, namespace):
                    self.exported_functions.append(func)
                return
            elif node.tag == TAG_VAR:
                self.exported_variables.append(self.visit_var(node, namespace))
                return
            elif node.tag == TAG_STRUCT:
                if v := node.find(lambda x: x.tag == TAG_VARIANT_PART):
                    if enum := self.visit_enum(node, v, namespace):
                        self.enums.append(enum)
                else:
                    if struct := self.parse_struct(node, namespace):
                        self.structs.append(struct)
                return
            elif node.tag == TAG_ENUM:
                if enum := self.visit_basic_enum(node, namespace):
                    self.enums.append(enum)
                return
        except:
            raise ValueError(f"Error encountered while parsing node {node.tag} ({
            node.attributes.get('name', '<unknown>')
            }) @ 0x{node.location:08x}")

        for child in node.children:
            self.visit(child, namespace)

    @staticmethod
    def visit_var(node: RawDwarfNode, namespace: Name | None) -> DVar:
        export_data = DwarfParser.get_export_data(node)
        if export_data is None:
            raise RuntimeError("Missing variable data")

        name, link_name, type = export_data

        return DVar(
            parse_name(name, namespace),
            link_name,
            parse_typename(type)
        )

    @staticmethod
    def visit_func(node: RawDwarfNode, namespace: Name | None) -> DFunc | None:
        export_data = DwarfParser.get_export_data(node)
        if export_data is None:
            return None

        name, link_name, return_type = export_data

        params_nodes = list(node.children_matching(TAG_PARAM))

        params: list[DInnerVar] = []
        for node in params_nodes:
            param_name = _get_string(node.attributes.get(AT_NAME, None))
            param_type = _get_string(node.attributes.get(AT_TYPE, None))

            params.append(DInnerVar(param_name, parse_typename(param_type)))

        return DFunc(
            parse_name(name, namespace),
            link_name,
            parse_typename(return_type),
            params
        )

    @staticmethod
    def parse_struct(n: RawDwarfNode, namespace: Name | None) -> DStruct | None:
        name_str, size_str = (
            _get_string(n.attributes.get(AT_NAME, '')),
            _get_int(n.attributes.get(AT_SIZE, ''))
        )

        # Structure must have a name
        if name_str is None:
            return None

        size = None if size_str is None else int(size_str)

        members_nodes = list(n.children_matching(TAG_MEMBER))

        members: list[DStructMember] = []
        for n in members_nodes:
            member_name = _get_string(n.attributes.get(AT_NAME, ""))
            member_type = _get_string(n.attributes.get(AT_TYPE, ""))
            member_loc = _get_int(n.attributes.get(AT_MEMBER_LOC, ""))

            if member_name is None:
                raise RuntimeError("Expected member name")

            members.append(DStructMember(
                member_loc,
                parse_name(member_name),
                parse_typename(member_type)
            ))

        members.sort(
            key=lambda x: float('inf') if x.location is None else x.location
        )

        return DStruct(
            parse_typename(name_str, namespace),
            size,
            members
        )

    @staticmethod
    def visit_basic_enum(node: RawDwarfNode, namespace: Name | None) -> DEnum | None:
        name_str, size, type = (
            _get_string(node.attributes.get(AT_NAME, '')),
            _get_int(node.attributes.get(AT_SIZE, '')),
            _get_string(node.attributes.get(AT_TYPE, ''))
        )

        if name_str is None or type is None:
            return None

        name = parse_name(name_str, namespace)

        variants_nodes = list(node.children_matching(TAG_ENUM_ENTRY))

        variants: list[DEnumVariant] = []
        for node in variants_nodes:
            variant_name = _get_string(node.attributes.get(AT_NAME, ""))
            variant_disc_value = _get_int(node.attributes.get(AT_ENUM_VALUE))

            if variant_name is None:
                variant_name = '?'

            variants.append(DEnumVariant(
                variant_disc_value,
                DStruct(parse_name(variant_name, name), size, []),
                0
            ))

        return DEnum(
            name, size,
            DEnumDiscriminant(parse_typename(type), 0),
            variants
        )

    def visit_enum(
            self, node: RawDwarfNode, v: RawDwarfNode, namespace: Name | None
    ) -> DEnum | None:
        name_str, size = (
            _get_string(node.attributes.get(AT_NAME, '')),
            _get_int(node.attributes.get(AT_SIZE, ''))
        )

        if name_str is None or size is None:
            return None

        name = parse_name(name_str, namespace)

        discriminant = None
        if discr_info := v.find(lambda x: x.tag == TAG_MEMBER):
            type = discr_info.get_attr_str(AT_TYPE)
            discr_loc = discr_info.get_attr_int(AT_MEMBER_LOC)
            if type is not None and discr_loc is not None:
                discriminant = DEnumDiscriminant(
                    parse_typename(type), discr_loc
                )

        variants_nodes = list(v.children_matching(TAG_VARIANT))

        variants: list[DEnumVariant] = []
        for variant in variants_nodes:
            variant_disc_value = variant.get_attr_int(AT_DISCR_VALUE)
            if v2 := variant.find(lambda x: x.tag == TAG_MEMBER):
                variant_simple_name = v2.get_attr_str(AT_NAME)
                variant_loc = v2.get_attr_int(AT_MEMBER_LOC)
                variant_type_ref = v2.get_attr_ref(AT_TYPE)
            else:
                print(f'Missing variant info for ? in enum {name}')
                continue

            if variant_type_ref is None:
                continue

            v3 = node.find(lambda x: x.location == variant_type_ref[0])

            if v3 is None or v3.tag != TAG_STRUCT:
                print(f'Invalid variant {variant_simple_name} in {name}')
                continue

            variant_struct = self.parse_struct(v3, namespace=name)

            if variant_struct is None:
                print(f'Invalid variant type {variant_simple_name} in {name}')
                continue

            variants.append(
                DEnumVariant(variant_disc_value, variant_struct, variant_loc)
            )

        return DEnum(name, size, discriminant, variants)

    @staticmethod
    def get_export_data(node: RawDwarfNode) -> tuple[str, str, str] | None:
        name, link_name, type = (
            _get_string(node.attributes.get(AT_NAME, '')),
            _get_string(node.attributes.get(AT_LINK_NAME, '')),
            _get_string(node.attributes.get(AT_TYPE, ''))
        )

        # Exports must have a name
        if name is None:
            return None
        # Link name defaults to name
        if link_name is None:
            link_name = name
        # Type defaults to empty string
        if type is None:
            type = ''
        # wasm-decompile does some extra stuff to names that we approximate here
        link_name = _fix_link_name(link_name)

        return name, link_name, type


def _fix_link_name(s: str) -> str:
    # Fix names to match wasm-decompile output
    # See include/wabt/decompiler-naming.h in github.com/WebAssembly/wabt/

    # Non-alphanumeric characters become underscores
    s = re.sub(r'\W', '_', s)
    # Collapse consecutive underscores
    s = re.sub(r'_+', '_', s)
    # Remove leading and trailing underscores
    s = re.sub(r'\b_|_\b', '', s)

    # Chop to 100 characters
    s = s[:100]

    # TODO: wabt uses further disambiguation, implement that too if necessary

    return s


def _get_string(s: str | None) -> str | None:
    """
    Parse an attribute of the format ``(<address>? "<string>")``
    """
    if s is None:
        return None

    match = re.fullmatch(
        r"\((0x[0-9a-fA-F]{8}\s+)?\"(.+)\"\)", s
    )
    if match is None:
        return None
    res = match.group(2)

    return res


def _get_ref(s: str | None) -> tuple[int, str] | None:
    if s is None:
        return None

    match = re.fullmatch(
        r"\((0x[0-9a-fA-F]{8})\s+\"(.+)\"\)", s
    )
    if match is None:
        return None

    return int(match.group(1), 16), match.group(2)


def _get_int(s: str | None) -> int | None:
    """
    Parse an attribute of the format ``(<int>)``
    """
    if s is None:
        return None

    match = re.fullmatch(
        r"\((?:(0x[a-fA-F\d]+)|([1-9]\d*))\)", s
    )
    if match is None:
        return None
    if match.group(1) is not None:
        res = int(match.group(1), 16)
    elif match.group(2) is not None:
        res = int(match.group(2), 10)
    else:
        return None

    return res


@dataclass(frozen=True, eq=False)
class RawDwarfNode:
    tag: str
    attributes: dict[str, str]
    children: list[RawDwarfNode]
    location: int | None = None

    @staticmethod
    def parse(root_tag: str, dwarf: str) -> tuple[
        RawDwarfNode, dict[int, RawDwarfNode]
    ]:
        # Preprocess lines (strip, get indentation, get location)
        lines: list[tuple[int, str, int | None]] = []
        for raw_line in dwarf.splitlines():
            line_loc = None
            if raw_loc := re.match(r'^(0x[0-9a-fA-F]{8}): ', raw_line):
                line_loc = int(raw_loc.group(1), 16)
                raw_line = ' ' * 12 + raw_line[12:]
            unindented = raw_line.lstrip()
            line_indent = len(raw_line) - len(unindented)
            lines.append((line_indent, unindented.rstrip(), line_loc))

        node_by_location: dict[int, RawDwarfNode] = {}

        line_index = 0

        def parse_node(
                base_indent: int, base_tag: str, base_location: int | None = None
        ) -> RawDwarfNode:
            nonlocal line_index

            attributes: dict[str, str] = {}
            children: list[RawDwarfNode] = []

            while line_index < len(lines):
                indent, line, location = lines[line_index]
                if indent <= base_indent:
                    break
                line_index += 1

                # Get tag/attribute name
                parts = line.split(maxsplit=1)
                obj, rest = parts if len(parts) == 2 else (line, '')
                obj, rest = obj, rest

                # Figure out what kind of object we have
                if obj.startswith('DW_AT'):
                    attributes[obj] = parse_attr(indent, rest)
                elif obj.startswith('DW_TAG'):
                    children.append(parse_node(indent, obj, location))

            res = RawDwarfNode(base_tag, attributes, children, base_location)
            if base_location is not None:
                node_by_location[base_location] = res
            return res

        def parse_attr(base_indent: int, attr_value: str) -> str:
            nonlocal line_index
            while line_index < len(lines):
                indent, line, _ = lines[line_index]
                if indent <= base_indent:
                    break
                line_index += 1
                attr_value += ' ' + line
            return attr_value if attr_value[0] != ' ' else attr_value[1:]

        return parse_node(-2, root_tag), node_by_location

    def children_matching(self, *tags: str) -> Generator[RawDwarfNode]:
        return (i for i in self.children if i.tag in tags)

    def find(self, p: Callable[[RawDwarfNode], bool]) -> RawDwarfNode | None:
        return next(filter(p, self.children), None)

    def get_attr_str(self, attr: str) -> str | None:
        return _get_string(self.attributes.get(attr))

    def get_attr_int(self, attr: str) -> int | None:
        return _get_int(self.attributes.get(attr))

    def get_attr_ref(self, attr: str) -> tuple[int, str] | None:
        return _get_ref(self.attributes.get(attr))

    @dataclass(frozen=True, eq=False)
    class ToStringOptions:
        ignored_tags: set[str]
        ignored_attrs: set[str]
        structural_tags: set[str]
        elidable_tags: set[str]

        def __post_init__(self) -> None:
            object.__setattr__(
                self, 'ignored_tags',
                set(f'DW_TAG_{i}' for i in self.ignored_tags)
            )
            object.__setattr__(
                self, 'ignored_attrs',
                set(f'DW_AT_{i}' for i in self.ignored_attrs)
            )
            object.__setattr__(
                self, 'structural_tags',
                set(f'DW_TAG_{i}' for i in self.structural_tags)
            )
            object.__setattr__(
                self, 'elidable_tags',
                set(f'DW_TAG_{i}' for i in self.elidable_tags)
            )

    default_tostring_opt = ToStringOptions(set(), set(), set(), set())

    def __str__(self) -> str:
        return self.to_string()

    def to_string(self, options: ToStringOptions = default_tostring_opt) -> str:
        return self._to_string(options, '').strip()

    def _to_string(self, options: ToStringOptions, indent: str) -> str:
        if self.tag in options.ignored_tags:
            return ''

        res = f'\n\n{indent}{self.tag}'

        if AT_NAME in self.attributes:
            res += f' {self.attributes[AT_NAME]}'
        if self.location is not None:
            res += f' @ 0x{self.location:08x}'

        indent += '  '
        contents = ''

        if self.tag not in options.structural_tags:
            filtered_attrs = {
                k: v for k, v in self.attributes.items() if
                k not in options.ignored_attrs
            }
            pad = max([*(len(i) for i in filtered_attrs.keys()), 0])
            for k, v in filtered_attrs.items():
                contents += f'\n{indent}{k.ljust(pad)} {v}'

        for child in self.children:
            contents += child._to_string(options, indent)

        if self.tag in options.elidable_tags and not contents:
            return ''

        return res + contents


if __name__ == '__main__':
    raise RuntimeError(
        'This is a module, not a script. Did you mean to run ts-defs.py?'
    )
