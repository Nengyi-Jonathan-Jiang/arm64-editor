import re
from dataclasses import dataclass

__all__ = ["DecompiledFunction", "DecompiledVariable", "parse_decompiled"]

@dataclass(frozen=True, eq=False)
class DecompiledFunction:
    link_name: str
    params: list[DecompiledVariable]
    WASM_type: str


@dataclass(frozen=True, eq=False)
class DecompiledVariable:
    link_name: str
    WASM_type: str


def parse_decompiled(disassembly: str) -> tuple[
    list[DecompiledVariable], list[DecompiledFunction]]:
    """
    Given the contents of a file generated with wasm-decompile,
    return the exported functions and static variables
    """

    # Finds substrings of the form "export global name:type ="
    raw_variables: list[tuple[str, str]] = re.findall(
        r"^export global (\w+):([^=]+) =",
        disassembly,
        flags=re.RegexFlag.M
    )
    # Finds substrings of the form "export function name(params):type {"
    raw_functions: list[tuple[str, str, str]] = re.findall(
        r"^export function (\w+)\(([^)]*)\)(?::([^{]+))? \{",
        disassembly,
        flags=re.RegexFlag.M
    )

    # Parse exports
    variables = _parse_variables(raw_variables)
    functions = _parse_methods(raw_functions)

    return variables, functions


def _parse_variables(raw_variables: list[tuple[str, str]]) -> list[
    DecompiledVariable]:
    variables: list[DecompiledVariable] = []
    for name, type_ in raw_variables:
        variables.append(DecompiledVariable(
            name.strip(),
            type_.strip()
        ))
    return variables


def _parse_methods(raw_methods: list[tuple[str, str, str]]) -> list[
    DecompiledFunction]:
    functions: list[DecompiledFunction] = []
    for name, raw_params, return_type in raw_methods:
        raw_params = raw_params.strip()
        params = _parse_params(raw_params)

        functions.append(DecompiledFunction(
            name,
            params,
            return_type
        ))
    return functions


def _parse_params(raw_params: str) -> list[DecompiledVariable]:
    params: list[DecompiledVariable] = []
    if raw_params == '':
        return params

    # Flatten types to get rid of struct types

    # List of structs that were substituted for placeholders
    substitution: list[str] = []

    def sub(m: re.Match[str]) -> str:
        """ Substitute a struct type for a placeholder """
        substitution.append(m.group(1))
        return f'#{len(substitution) - 1}'

    old_len = -1  # Help keep track of whether any substitutions were made
    while len(substitution) != old_len:
        old_len = len(substitution)
        # Substitute non-nested struct types with placeholder
        raw_params = re.sub(
            r"({\s*\w+\s*:\s*#?\w+(?:\s*,\s*\w+\s*:#?\s*\w+)*\s*})", sub,
            raw_params)

    # Now raw_params has no struct types

    param_parts = raw_params.split(',')
    for part in param_parts:
        param_name, param_type = part.split(':')
        # Substitution happened in to out so the most deeply nested
        # substitutions are first in the list. Thus, to expand
        # substitutions, we iterate backwards through the list
        for index, t in list(enumerate(substitution))[::-1]:
            param_type = param_type.replace(f'#{index}', t)

        params.append(
            DecompiledVariable(param_name.strip(), param_type.strip()))

    return params


if __name__ == '__main__':
    raise RuntimeError(
        'This is a module, not a script. Did you mean to run ts-defs.py?'
    )
