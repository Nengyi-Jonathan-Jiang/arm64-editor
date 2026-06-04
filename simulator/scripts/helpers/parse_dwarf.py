import re
from dataclasses import dataclass


@dataclass
class DwarfFunction:
    link_name: str
    name: str
    params: list[DwarfParam]
    return_type: str


@dataclass
class DwarfParam:
    name: str | None
    type: str | None


@dataclass
class DwarfVariable:
    link_name: str
    name: str
    type: str


_TAG_FUNC = 'DW_TAG_subprogram'
_TAG_VAR = 'DW_TAG_variable'
_TAG_PARAM = 'DW_TAG_formal_parameter'
_AT_LINK_NAME = 'DW_AT_linkage_name'
_AT_NAME = 'DW_AT_name'
_AT_TYPE = 'DW_AT_type'
_AT_LOCATION = 'DW_AT_location'
# These two are only used as indicators that methods aren't exported
_AT_INLINE = 'DW_AT_inline'
_AT_EXTERNAL = 'DW_AT_external'
_AT_FRAME = 'DW_AT_frame_base'


def parse_dwarf(dwarf: str) -> tuple[list[DwarfVariable], list[DwarfFunction]]:
    methods: list[DwarfFunction] = []
    variables: list[DwarfVariable] = []

    defs_raw = _find_objs([_TAG_FUNC, _TAG_VAR], dwarf.splitlines(),
                          any_level=True)
    for def_tag, def_lines in defs_raw:
        # Get basic info
        header_lines = _get_header(def_lines)
        if def_tag == _TAG_FUNC and header_lines[
            0].strip() == 'DW_AT_low_pc\t(dead code)':
            continue  # Dead code, cannot be an export

        header_info = dict(_find_objs([
            _AT_LINK_NAME,
            _AT_NAME,
            _AT_TYPE,
            _AT_INLINE,
            _AT_EXTERNAL,
            _AT_FRAME
        ], header_lines))

        if _AT_EXTERNAL not in header_info:
            continue
        if def_tag == _TAG_FUNC:
            if _AT_INLINE in header_info:
                continue
            if _AT_FRAME not in header_info:
                continue

        if _AT_NAME not in header_info:
            continue
        name = _parse_string_attribute(header_info[_AT_NAME][0])

        if _AT_LINK_NAME in header_info:
            linkage_name = _parse_string_attribute(
                header_info[_AT_LINK_NAME][0])
        else:
            linkage_name = name

        if _AT_TYPE in header_info:
            export_type = _parse_string_attribute(header_info[_AT_TYPE][0])
        else:
            export_type = ''

        if linkage_name is None or name is None or export_type is None:
            continue

        # Handle method
        if def_tag == _TAG_FUNC:
            params_raw = _find_objs([_TAG_PARAM], def_lines)

            params: list[DwarfParam] = []
            for _, param_lines in params_raw:
                param_info = dict(_find_objs(
                    [_AT_NAME, _AT_TYPE], param_lines
                ))

                param_name = _parse_string_attribute(
                    param_info.get(_AT_NAME, [""])[0])
                param_type = _parse_string_attribute(
                    param_info.get(_AT_TYPE, [""])[0])

                params.append(DwarfParam(param_name, param_type))

            methods.append(
                DwarfFunction(linkage_name, name, params, export_type))
        else:  # def_tag == _TAG_VAR
            variables.append(DwarfVariable(linkage_name, name, export_type))

    return variables, methods


def _parse_string_attribute(s: str) -> str | None:
    """
    Parse an attribute of the format ``(<address>? "<string>")``
    """
    match = re.fullmatch(
        r"\((?:0x[0-9a-fA-F]{8}\s+)?\"(.+)\"\)", ''.join(s)
    )
    if match is None:
        return None
    # Fix names to match wasm-decompile output
    return re.sub(r'\b_|___', '', match.group(1))


def _get_header(lines: list[str]):
    """
    Get the "header" of an object given a list of all
    the linse in the object. This returns all lines
    up to (not including) the first empty line
    """
    try:
        return lines[:lines.index('')]
    except ValueError:
        return lines


def _find_objs(match: list[str], lines: list[str], any_level: bool = False) -> \
        list[tuple[str, list[str]]]:
    """
    Find all objects matching the given list, given a
    list of lines. The objects' type and the lines in
    the objects are returned. Lines are unindented
    such that the object itself is at zero indentation

    :param match: What object types to match
    :param any_level: If false (default), only objects
    indented two spaces in will be matched. If true,
    all objects are matched.

    :return:
    """

    def _count_leading_space(s: str) -> int:
        return len(s) - len(s.lstrip())

    line_index = 0
    result: list[tuple[str, list[str]]] = []

    while line_index < len(lines):
        line = lines[line_index]
        line_index += 1

        if _count_leading_space(line) != 2 and not any_level:
            continue

        obj, rest = ('\0' + line.strip() + ' \0').split(maxsplit=1)
        obj, rest = obj[1:], rest[:-1].strip()

        if obj in match:
            initial_leading_space = _count_leading_space(line)
            section_lines: list[str] = []

            if rest != '':
                section_lines.append(rest)

            while line_index < len(lines):
                line = lines[line_index]
                if line != '' and _count_leading_space(
                        line) <= initial_leading_space:
                    break
                section_lines.append(line[initial_leading_space:])
                line_index += 1
            result.append((obj, section_lines))

    return result


if __name__ == '__main__':
    raise RuntimeError(
        'This is a module, not a script. Did you mean to run ts-defs.py?'
    )
