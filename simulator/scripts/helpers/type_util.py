import re


class CharStream:
    def __init__(self, s: str):
        self.s = s
        self.i = 0

    def peek(self, future=0) -> str | None:
        if self.i + future >= len(self.s):
            return None
        return self.s[self.i + future]

    def next(self) -> str | None:
        res = self.peek()
        self.i += 1
        return res


def parse_list():
    pass


def simplify_type_name(name: str) -> str:
    name = re.sub(r'\b(\w+::)', '', name)
    return name

def type_to_alphanumeric(name: str) -> str:
    name = simplify_type_name(name)

    name = name.replace('*', '_ptr_')
    name = name.replace('&', '_ref_')

    name = re.sub(r'[^a-zA-Z0-9_]', '_', name)
    name = re.sub(r'_+', '_', name)
    name = re.sub(r'\b_|_\b', '', name)
    return name

def get_referenced_type(name: str) -> str | None:
    if name == '()': return None

    # Don't muck with function pointers, closures, global vtables
    #
    # Raw vtable types can only appear by themselves or in the member of a dyn
    # type
    if re.fullmatch(r'.*(\(\*+\)\(|\{).*', name): return None

    # language=RegExp
    patterns = [
        # Unwrap thin pointers/references
        r'[&*](?:mut |const )?((?!mut |const |dyn |\[).+?)',
        # Unwrap arrays
        r'\[(.*); \d+]',
        # Unwrap thin pointers and arrays (postfix)
        r'(.*) (?:\*+|\[\d+])',
        r'\* (?:const|mut) (.*)',
    ]

    for pattern in patterns:
        match = re.fullmatch(pattern, name)
        if match:
            # print(f'"{name}" -> "{match.group(1)}"')
            return get_referenced_type(match.group(1).strip())

    return name


typescript_reserved_words = [
    "break",
    "case",
    "catch",
    "class",
    "const",
    "continue",
    "debugger",
    "default",
    "delete",
    "do",
    "else",
    "enum",
    "export",
    "extends",
    "false",
    "finally",
    "for",
    "function",
    "if",
    "import",
    "in",
    "instanceof",
    "new",
    "null",
    "return",
    "super",
    "switch",
    "this",
    "throw",
    "true",
    "try",
    "typeof",
    "var",
    "void",
    "while",
    "with",
    "as",
    "implements",
    "interface",
    "let",
    "package",
    "private",
    "protected",
    "public",
    "static",
    "yield",
    "any",
    "boolean",
    "constructor",
    "declare",
    "get",
    "module",
    "require",
    "number",
    "set",
    "string",
    "symbol",
    "type",
    "from",
    "of"
]
