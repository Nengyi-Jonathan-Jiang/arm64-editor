from abc import ABC, abstractmethod
from dataclasses import dataclass
import re
from re import compile
from typing import Match, Pattern, overload

str_slice_key = int | slice


class StrView:
    def __init__(self, s: str, i: str_slice_key = slice(None)):
        self.s = s
        self.item = i

    def __str__(self):
        return self.s[self.item]


class CharStream:
    def __init__(self, s: str):
        self._s = s
        self._i = 0

    def pos(self):
        return self._i

    def __getitem__(self, i: str_slice_key) -> StrView:
        return StrView(self._s, i)

    def _clamp(self, i: int) -> int:
        return min(i, len(self._s))

    def peek(self, *, future=0, amount=1) -> str:
        start = self._clamp(self._i + future)
        end = self._clamp(start + amount)

        return self._s[start:end]

    def next(self, *, amount=1) -> str:
        res = self.peek(amount=amount)
        self._i += len(res)
        return res

    def skip(self, *, amount=1):
        self.next(amount=amount)

    @overload
    def match(self, m: Pattern[str]) -> Match[str] | None:
        ...

    @overload
    def match(self, m: str) -> str | None:
        ...

    def match(self, m: str | Pattern[str]) -> Match[str] | str | None:
        res = self.peek_match(m)
        if isinstance(res, str):
            self.skip(amount=len(res))
        elif isinstance(res, Match):
            self.skip(amount=len(res.group()))
        return res

    @overload
    def peek_match(self, m: Pattern[str]) -> Match[str] | None:
        ...

    @overload
    def peek_match(self, m: str) -> str | None:
        ...

    @overload
    def peek_match(self, m: str | Pattern[str]) -> Match[str] | str | None:
        ...

    def peek_match(self, m: str | Pattern[str]) -> Match[str] | str | None:
        if isinstance(m, str):
            if len(m) == 0:
                raise ValueError("Empty pattern")
            if self._s[self._i:self._i + len(m)] != m:
                return None
            return m

        res = m.match(self._s, self._i)
        if res is None or len(res.group()) == 0:
            return None
        return res


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


# language=bnf
"""
Type ::= Unit 
       | Never 
       | Tuple 
       | Reference 
       | TraitObject 
       | Slice 
       | Array 
       | TraitImplVtable 
       | NamespacedIdentifier
      
Unit ::= "()"
Never ::= "!"
Tuple ::= "(" [Type] ")"
Reference ::= ("&" "mut"? | "*" ("const" | "mut")?) Type
TraitObject ::= "dyn" NamespacedIdentifier
Slice ::= "[" Type "]"
Array ::= "[" Type ";" usize "]"
TraitImplVtable ::= "<" Type "as" NamespacedIdentifier ">::{vtable_type}"
NamespacedIdentifier ::= (NamespacedIdentifier "::")? id ("<" [Type] ">")?
"""


def parse_type(s: str) -> RustType:
    s = normalize_whitespace(s)
    print('normalized: ', s)
    return _parse_type(CharStream(s))


def normalize_whitespace(s: str) -> str:
    # Mark significant whitespace
    s = re.sub(r'.*\b(mut|dyn|const) ', r'\1$', s)
    s = s.replace(' as ', '$as$')
    # Remove all other whitespace
    s = re.sub(r'\s', '', s)
    # Restore significant whitespace
    s = s.replace('$', ' ')
    s = s.replace(',', ', ')
    return s


def _parse_type(s: CharStream) -> RustType:
    return _handle_postfix(_parse_type_prefix(s), s)


def _parse_namespaced_identifier(s: CharStream) -> NamespacedIdentifier:
    if s.match('::'):
        return NamespacedIdentifier(
            _parse_namespaced_identifier(s),
            s.next(),
            [_parse_type(s)]
        )
    return NamespacedIdentifier(None, s.next(), [])


def _parse_type_prefix(s: CharStream) -> RustType:
    if s.match('!'):
        return Never.never

    # Array / slice types
    if s.match('['):
        implementor = _parse_type(s)
        if s.match(']'):
            return Slice(implementor)
        if s.match(';'):
            size = _parse_int(s)
            if s.match(']'):
                return Array(implementor, size)
        raise RuntimeError('Mismatched brackets')

    # Unit / tuple types
    if s.peek_match('('):
        return _parse_parenthesized(s)

    # Reference types
    if s.match('&mut '):
        return Reference(False, True, _parse_type(s))
    if s.match('&'):
        return Reference(False, False, _parse_type(s))
    if s.match('*mut '):
        return Reference(False, True, _parse_type(s))
    if s.match(compile(r'\*(const )?')):
        return Reference(False, False, _parse_type(s))

    # Trait object types
    if s.match('dyn '):
        return TraitObject(_parse_namespaced_identifier(s))

    # Vtable type
    if s.match('<'):
        implementor = _parse_type(s)
        if not s.match(' as '):
            raise RuntimeError('Invalid UFCS')
        trait = _parse_namespaced_identifier(s)
        if not s.match('>'):
            raise RuntimeError('Mismatched angle brackets')
        if not s.match('::{vtable_type}'):
            raise RuntimeError('UFCS can only be used for vtables')
        return TraitImplVtable(trait, implementor)

    return _parse_namespaced_identifier(s)


def _parse_int(s: CharStream) -> int:
    res = s.match(compile(r'\d+'))
    if res is None:
        raise RuntimeError('Expected integer')
    return int(res.group())


def _parse_parenthesized(s: CharStream) -> Tuple | Unit:
    if not s.match('('):
        raise RuntimeError('Expected parenthesis')

    if s.match(')'):
        return Unit.unit

    elements: list[RustType] = [_parse_type(s)]
    while s.match(', '):
        elements.append(_parse_type(s))

    if not s.match(')'):
        raise RuntimeError('Mismatched parenthesis')

    return Tuple(elements)


def _handle_postfix(t: RustType, s: CharStream) -> RustType:
    # Pointer type
    if s.match('*'):
        return _handle_postfix(Reference(False, False, t), s)

    # Function pointer type or parenthesized pointer type
    if s.peek_match('('):
        extra_ref_levels_match = s.match(re.compile(r'\((\*+)\)'))

        is_bare_pointer = False
        if extra_ref_levels_match is None:
            extra_ref_levels = 0
        else:
            extra_ref_levels = len(extra_ref_levels_match.group(1))
            if not s.peek_match('('):
                is_bare_pointer = True

        if is_bare_pointer:
            res = t
        else:
            args = _parse_parenthesized(s)
            args_list: list[RustType]

            if isinstance(args, Unit):
                args_list = []
            else:
                args_list = args.elements

            res = FunctionPointer(args_list, t)

        for _ in range(extra_ref_levels):
            res = Reference(False, False, res)
        return _handle_postfix(res, s)

    # Array type
    if s.match('['):
        size = _parse_int(s)
        if not s.match(']'): raise RuntimeError('Mismatched brackets')
        return _handle_postfix(Array(t, size), s)

    return t


class RustType(ABC):
    @abstractmethod
    def __str__(self):
        return '?'


class Unit(RustType):
    unit: Unit

    def __str__(self): return '()'

    def __init__(self): raise RuntimeError("Use Unit.unit")


class Never(RustType):
    never: Never

    def __str__(self): return '!'

    def __init__(self): raise RuntimeError("Use Never.never")


# noinspection PyTypeChecker
Never.never, Unit.unit = Never.__new__(Never), Unit.__new__(Unit)


@dataclass
class Tuple(RustType):
    elements: list[RustType]

    def __post_init__(self):
        if len(self.elements) == 0:
            raise ValueError("Tuple must have at least one element")

    def __str__(self): return f'({", ".join(map(str, self.elements))})'


@dataclass
class Reference(RustType):
    is_pointer: bool
    mutable: bool
    pointee: RustType

    def __str__(self):
        prefix = '*' if self.is_pointer else '&'
        if self.mutable:
            prefix += 'mut '
        # Unlike Rust, which adds an extra 'const' on pointers, we omit that
        # here for concision
        return f'{prefix}{self.pointee}'


@dataclass
class TraitObject(RustType):
    trait: NamespacedIdentifier

    def __str__(self): return f'dyn {self.trait}'


@dataclass
class Slice(RustType):
    pointee: RustType

    def __str__(self): return f'[{self.pointee}]'


@dataclass
class Array(RustType):
    element_type: RustType
    size: int

    def __str__(self): return f'[{self.element_type} ; {self.size}]'


@dataclass
class TraitImplVtable(RustType):
    trait: NamespacedIdentifier
    implementing_type: RustType

    def __str__(self):
        return f'<{self.implementing_type} as {self.trait}>::{{vtable_type}}'


@dataclass
class FunctionPointer(RustType):
    params: list[RustType]
    return_type: RustType

    def __str__(self):
        return f'fn({", ".join(map(str, self.params))}) -> {self.return_type}'


@dataclass
class NamespacedIdentifier(RustType):
    parent: NamespacedIdentifier | None
    name: str
    template_args: list[RustType]

    def __str__(self):
        namespace_prefix = f'{str(self.parent)}::' if self.parent else ''
        template_part = "" if not self.template_args \
            else f"<{", ".join(map(str, self.template_args))}>"
        return f'{namespace_prefix}{self.name}{template_part}'


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
