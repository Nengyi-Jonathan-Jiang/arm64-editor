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
