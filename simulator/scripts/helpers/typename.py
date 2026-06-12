from abc import ABC, abstractmethod
from dataclasses import dataclass
import re
from re import compile
from typing import Callable

from scripts.helpers.misc_utils import CharStream


def strip_namespaces(name: str) -> str:
    return str(parse_typename(name).strip_namespaces())


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
            return get_referenced_type(match.group(1).strip())

    return name


def parse_typename(s: str) -> TypeName:
    s = normalize_whitespace(s)
    return _parse_type(CharStream(s))


def normalize_whitespace(s: str) -> str:
    # Mark significant whitespace
    s = re.sub(r'\b(mut|dyn|const) ', r'\1$', s)
    s = s.replace(' as ', '$as$')
    # Remove all other whitespace
    s = re.sub(r'\s', '', s)
    # Restore significant whitespace
    s = s.replace('$', ' ')
    s = s.replace(',', ', ')
    return s


def _parse_type(s: CharStream) -> TypeName:
    return _handle_postfix(_parse_type_prefix(s), s)


def _parse_namespaced_identifier(
    s: CharStream, parent: NamespacedIdentifier | None = None
) -> NamespacedIdentifier:
    ident = s.match(compile(r'\w+|\{\w+(?:#\d+)?}'))

    if not ident:
        raise RuntimeError('Expected identifier')

    ident_name = ident.group()
    if s.match("<"):
        parameters = parse_list(s)
        if not s.match(">"):
            raise RuntimeError('Mismatched angle brackets')
    else:
        parameters = []

    res = NamespacedIdentifier(parent, ident_name, parameters)

    if s.match('::'):
        res = _parse_namespaced_identifier(s, res)

    return res


def _parse_type_prefix(s: CharStream) -> TypeName:
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

    # Function pointer types
    if s.match(re.compile(r'fn\b')):
        args = _parse_parenthesized(s)
        args_list: list[TypeName]

        if isinstance(args, Unit):
            args_list = []
        else:
            args_list = args.elements

        if not s.match('->'):
            raise RuntimeError('Expected "->"')
        return_type = _parse_type(s)

        return FunctionPointer(args_list, return_type)

    # Trait object types
    if s.match('dyn '):
        return TraitObject(_parse_namespaced_identifier(s))

    # Reference types
    if s.match('&mut '):
        return Reference(False, True, _parse_type(s))
    if s.match('&'):
        return Reference(False, False, _parse_type(s))
    if s.match('*mut '):
        return Reference(True, True, _parse_type(s))
    if s.match(compile(r'\*(const )?')):
        return Reference(True, False, _parse_type(s))

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

    elements = parse_list(s)

    if not s.match(')'):
        raise RuntimeError('Mismatched parenthesis')

    return Tuple(elements)


def parse_list(s: CharStream) -> list[TypeName]:
    elements: list[TypeName] = [_parse_type(s)]
    while s.match(', '):
        elements.append(_parse_type(s))
    return elements


def _handle_postfix(t: TypeName, s: CharStream) -> TypeName:
    # Pointer type
    if s.match('*'):
        return _handle_postfix(Reference(True, True, t), s)

    # Pointer type (infix)
    if m := s.match(re.compile(r'\((\*+)\)')):
        levels = len(m.group(1))
        res = _handle_postfix(t, s)
        for _ in range(levels):
            res = Reference(False, False, res)
        return res

    # Function pointer type
    if s.peek_match('('):
        args = _parse_parenthesized(s)
        args_list: list[TypeName]

        if isinstance(args, Unit):
            args_list = []
        else:
            args_list = args.elements

        res = FunctionPointer(args_list, t)

        return _handle_postfix(res, s)

    # Array type
    if s.match('['):
        size = _parse_int(s)
        if not s.match(']'): raise RuntimeError('Mismatched brackets')
        return _handle_postfix(Array(t, size), s)

    return t


class TypeName(ABC):
    @abstractmethod
    def __str__(self):
        raise NotImplementedError

    @abstractmethod
    def apply_recursive(self, f: Callable[[TypeName], TypeName]):
        raise NotImplementedError

    def __eq__(self, other):
        return self.__class__ == other.__class__ and str(self) == str(other)

    def __hash__(self):
        return hash(str(self))

    def to_alphanumeric(self):
        name = str(self)
        name = strip_namespaces(name)

        name = name.replace('*', '_ptr_')
        name = name.replace('&', '_ref_')

        name = re.sub(r'[^a-zA-Z0-9_]', '_', name)
        name = re.sub(r'_+', '_', name)
        name = re.sub(r'\b_|_\b', '', name)
        return name

    def strip_namespaces(self) -> TypeName:
        def strip(t: NamespacedIdentifier) -> NamespacedIdentifier:
            return NamespacedIdentifier(None, t.name, t.template_args)

        def visit(t: TypeName) -> TypeName:
            # print(f'Visiting {t}')
            if isinstance(t, NamespacedIdentifier):
                return strip(t)
            if isinstance(t, TraitImplVtable):
                return TraitImplVtable(strip(t.trait), t.implementing_type)
            if isinstance(t, TraitObject):
                return TraitObject(strip(t.trait))
            return t

        return self.apply_recursive(visit)


class Unit(TypeName):
    unit: Unit

    def __str__(self): return '()'

    def apply_recursive(self, f: Callable[[TypeName], TypeName]):
        return f(self)

    def __init__(self): raise RuntimeError("Use Unit.unit")


class Never(TypeName):
    never: Never

    def __str__(self): return '!'

    def apply_recursive(self, f: Callable[[TypeName], TypeName]):
        return f(self)

    def __init__(self): raise RuntimeError("Use Never.never")


# noinspection PyTypeChecker
Never.never, Unit.unit = Never.__new__(Never), Unit.__new__(Unit)


@dataclass(frozen=True, eq=False)
class Tuple(TypeName):
    elements: list[TypeName]

    def __post_init__(self):
        if len(self.elements) == 0:
            raise ValueError("Tuple must have at least one element")

    def __str__(self): return f'({", ".join(map(str, self.elements))})'

    def apply_recursive(self, f: Callable[[TypeName], TypeName]):
        return f(Tuple([e.apply_recursive(f) for e in self.elements]))


@dataclass(frozen=True, eq=False)
class Reference(TypeName):
    is_pointer: bool
    mutable: bool
    pointee: TypeName

    def __str__(self):
        prefix = '*' if self.is_pointer else '&'
        if self.mutable:
            prefix += 'mut '
        # Unlike Rust, which adds an extra 'const' on pointers, we omit that
        # here for concision
        return f'{prefix}{self.pointee}'

    def apply_recursive(self, f: Callable[[TypeName], TypeName]):
        return f(Reference(
            self.is_pointer, self.mutable,
            self.pointee.apply_recursive(f)
        ))


@dataclass(frozen=True, eq=False)
class TraitObject(TypeName):
    trait: NamespacedIdentifier

    def __str__(self): return f'dyn {self.trait}'

    def apply_recursive(self, f: Callable[[TypeName], TypeName]):
        return f(TraitObject(self.trait))


@dataclass(frozen=True, eq=False)
class Slice(TypeName):
    pointee: TypeName

    def __str__(self): return f'[{self.pointee}]'

    def apply_recursive(self, f: Callable[[TypeName], TypeName]):
        return f(Slice(self.pointee.apply_recursive(f)))


@dataclass(frozen=True, eq=False)
class Array(TypeName):
    element_type: TypeName
    size: int

    def __str__(self): return f'[{self.element_type} ; {self.size}]'

    def apply_recursive(self, f: Callable[[TypeName], TypeName]):
        return f(Array(self.element_type.apply_recursive(f), self.size))


@dataclass(frozen=True, eq=False)
class TraitImplVtable(TypeName):
    trait: NamespacedIdentifier
    implementing_type: TypeName

    def __str__(self):
        return f'<{self.implementing_type} as {self.trait}>::{{vtable_type}}'

    def apply_recursive(self, f: Callable[[TypeName], TypeName]):
        return f(TraitImplVtable(
            self.trait,
            self.implementing_type.apply_recursive(f)
        ))


@dataclass(frozen=True, eq=False)
class FunctionPointer(TypeName):
    params: list[TypeName]
    return_type: TypeName

    def __str__(self):
        return f'fn({", ".join(map(str, self.params))}) -> {self.return_type}'

    def apply_recursive(self, f: Callable[[TypeName], TypeName]):
        return f(FunctionPointer(
            [p.apply_recursive(f) for p in self.params],
            self.return_type.apply_recursive(f)
        ))


@dataclass(frozen=True, eq=False)
class NamespacedIdentifier(TypeName):
    parent: NamespacedIdentifier | None
    name: str
    template_args: list[TypeName]

    def __str__(self):
        namespace_prefix = f'{str(self.parent)}::' if self.parent else ''
        template_part = "" if not self.template_args \
            else f"<{", ".join(map(str, self.template_args))}>"
        return f'{namespace_prefix}{self.name}{template_part}'

    def apply_recursive(self, f: Callable[[TypeName], TypeName]):
        return f(NamespacedIdentifier(
            self.parent,
            self.name,
            [a.apply_recursive(f) for a in self.template_args]
        ))
