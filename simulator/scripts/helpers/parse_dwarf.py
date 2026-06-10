import re
from dataclasses import dataclass


@dataclass
class DFunc:
    name: str
    link_name: str
    return_type: str
    params: list[DInnerVar]
    namespace: str


@dataclass
class DVar:
    name: str
    link_name: str
    type: str

    namespace: str


@dataclass
class DType:
    name: str
    size: int | None
    members: list[tuple[int | None, DInnerVar]]

    namespace: str

@dataclass
class DInnerVar:
    name: str | None
    type: str | None


_TAG_FUNC = 'DW_TAG_subprogram'
_TAG_VAR = 'DW_TAG_variable'
_TAG_PARAM = 'DW_TAG_formal_parameter'
_TAG_STRUCT = 'DW_TAG_structure_type'
_TAG_MEMBER = 'DW_TAG_member'
_TAG_NAMESPACE = 'DW_TAG_namespace'
_TAG_ENUM = 'DW_TAG_enumeration_type'
_TAG_ENUM_ENTRY = 'DW_TAG_enumerator'

_AT_LINK_NAME = 'DW_AT_linkage_name'
_AT_NAME = 'DW_AT_name'
_AT_TYPE = 'DW_AT_type'
_AT_LOC = 'DW_AT_location'

_AT_SIZE = 'DW_AT_byte_size'
_AT_MEMBER_LOC = 'DW_AT_data_member_location'

_AT_ENUM_VALUE = 'DW_AT_const_value'


class DwarfParser:
    def __init__(self):
        self.exported_functions: list[DFunc] = []
        self.exported_variables: list[DVar] = []
        self.types: list[DType] = []

    @staticmethod
    def preprocess_file(dwarf: str) -> str:
        # Remove address markers
        dwarf = re.sub(r'^0x[0-9a-fA-F]{8}: ', ' ' * 12, dwarf,
                       flags=re.RegexFlag.M)

        return dwarf

    def parse(self, dwarf: str):
        dwarf = self.preprocess_file(dwarf)
        lines = dwarf.splitlines()
        tree = _parse_tree('root', lines)

        self.visit(tree, '')

    def visit(self, node: _ParseNode, namespace: str):
        if node.tag == _TAG_NAMESPACE:
            namespace_name = _get_string(
                node.attributes.get(_AT_NAME, "")
            )
            for child in node.children:
                self.visit(child, f"{namespace}::{namespace_name}")
            pass
        elif node.tag == _TAG_FUNC:
            self.visit_func(node, namespace)
        elif node.tag == _TAG_VAR:
            self.visit_var(node, namespace)
        elif node.tag == _TAG_STRUCT:
            self.visit_struct(node, namespace)
        elif node.tag == _TAG_ENUM:
            self.visit_enum(node, namespace)
        else:
            for child in node.children:
                self.visit(child, namespace)

    def visit_var(self, node: _ParseNode, namespace: str):
        export_data = self.get_export_data(node)
        if export_data is None: return

        name, link_name, type = export_data

        self.exported_variables.append(
            DVar(name, link_name, type, namespace[2:])
        )

    def visit_func(self, node: _ParseNode, namespace: str):
        # Skip dead code
        if node.attributes.get('DW_AT_low_pc') == '(dead code)':
            return

        export_data = self.get_export_data(node)
        if export_data is None: return

        name, link_name, return_type = export_data

        params_nodes = [i for i in node.children if i.tag == _TAG_PARAM]

        params: list[DInnerVar] = []
        for node in params_nodes:
            param_name = _get_string(node.attributes.get(_AT_NAME, ""))
            param_type = _get_string(node.attributes.get(_AT_TYPE, ""))

            params.append(DInnerVar(param_name, param_type))

        self.exported_functions.append(
            DFunc(name, link_name, return_type, params, namespace[2:])
        )

    def visit_struct(self, node: _ParseNode, namespace: str):
        name, size_str = (
            _get_string(node.attributes.get(_AT_NAME, '')),
            _get_int(node.attributes.get(_AT_SIZE, ''))
        )

        # Structure must have a name
        if name is None:
            return

        size = None if size_str is None else int(size_str)

        members_nodes = [i for i in node.children if i.tag == _TAG_MEMBER]

        members: list[tuple[int | None, DInnerVar]] = []
        for node in members_nodes:
            member_name = _get_string(node.attributes.get(_AT_NAME, ""))
            member_type = _get_string(node.attributes.get(_AT_TYPE, ""))
            member_loc = _get_int(node.attributes.get(_AT_MEMBER_LOC, ""))

            members.append((member_loc, DInnerVar(member_name, member_type)))

        members.sort()

        self.types.append(
            DType(name, size, members, namespace[2:])
        )

    def visit_enum(self, node: _ParseNode, namespace: str):
        # name, size_str = (
        #     _get_string(node.attributes.get(_AT_NAME, '')),
        #     _get_int(node.attributes.get(_AT_SIZE, ''))
        # )
        #
        # # Structure must have a name
        # if name is None:
        #     return
        #
        # size = None if size_str is None else int(size_str)
        #
        # entries_nodes = [i for i in node.children if i.tag == _TAG_ENUM_ENTRY]
        #
        # members: list[tuple[int | None, DInnerVar]] = []
        # for node in entries_nodes:
        #     member_name = _get_string(node.attributes.get(_AT_NAME, ""))
        #     member_type = _get_string(node.attributes.get(_AT_TYPE, ""))
        #     member_loc = _get_int(node.attributes.get(_AT_MEMBER_LOC, ""))
        #
        #     members.append((member_loc, DInnerVar(member_name, member_type)))
        #
        # members.sort(key=lambda x: float('inf') if x[0] is None else x[0])
        #
        # self.types.append(
        #     DType(name, size, members, namespace[2:])
        # )
        pass

    @staticmethod
    def get_export_data(node: _ParseNode) -> tuple[str, str, str] | None:
        name, link_name, type = (
            _get_string(node.attributes.get(_AT_NAME, '')),
            _get_string(node.attributes.get(_AT_LINK_NAME, '')),
            _get_string(node.attributes.get(_AT_TYPE, ''))
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
        # wasm-decompile does some cleanup on names that we approximate here
        link_name = _cleanup_link_name(link_name)

        return name, link_name, type


def _cleanup_link_name(s: str) -> str:
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

    # TODO: wabt further disambiguates names, implement that too if necessary

    return s


def _get_string(s: str | None) -> str | None:
    """
    Parse an attribute of the format ``(<address>? "<string>")``
    """
    if s is None:
        return None

    match = re.fullmatch(
        r"\((?:0x[0-9a-fA-F]{8}\s+)?\"(.+)\"\)", s
    )
    if match is None:
        return None
    res = match.group(1)

    return res


def _get_int(s: str | None) -> int | None:
    """
    Parse an attribute of the format ``(<address>? "<string>")``
    """
    if s is None:
        return None

    match = re.fullmatch(
        r"\((?:(0x[a-fA-F\d]+)|([1-9]\d*))\)", s
    )
    if match is None:
        return None
    if match.group(1):
        res = int(match.group(1), 16)
    elif match.group(2):
        res = int(match.group(2), 10)
    else:
        return None

    return res


@dataclass
class _ParseNode:
    tag: str
    attributes: dict[str, str]
    children: list[_ParseNode]


def _get_indent(s: str) -> int:
    for i in range(len(s)):
        if s[i] != ' ':
            return i
    return len(s)


def _parse_tree(tag_name: str, lines: list[str]) -> _ParseNode:
    attributes: dict[str, str] = {}
    children: list[_ParseNode] = []

    line_index = 0
    while line_index < len(lines):
        line = lines[line_index]
        line_index += 1

        # Get tag/attribute name
        line_parts = line.strip().split(maxsplit=1)
        obj_name, rest = line_parts if len(line_parts) == 2 else (line, '')
        obj_name, rest = obj_name.strip(), rest.strip()

        # Figure out what kind of object we have
        if obj_name.startswith('DW_TAG'):
            is_tag = True
        elif obj_name.startswith('DW_AT'):
            is_tag = False
        else:
            continue

        # Get rest of object (need to track indentation)
        initial_indent = _get_indent(line)
        section_lines: list[str] = [rest] if rest else []
        while line_index < len(lines):
            line = lines[line_index]
            if line.strip() != '' and _get_indent(line) <= initial_indent:
                break
            section_lines.append(line[initial_indent:])
            line_index += 1

        # Convert to node/attribute
        if is_tag:
            children.append(_parse_tree(obj_name, section_lines))
        else:
            attribute_value = ' '.join(section_lines)
            attribute_value = re.sub(r'\s+', ' ', attribute_value).strip()
            attributes[obj_name] = attribute_value

    return _ParseNode(tag_name, attributes, children)


if __name__ == '__main__':
    raise RuntimeError(
        'This is a module, not a script. Did you mean to run ts-defs.py?'
    )
