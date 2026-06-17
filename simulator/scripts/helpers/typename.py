from abc import ABC, abstractmethod
from dataclasses import dataclass
import re
from re import compile as r
from typing import Callable, final

from scripts.helpers.misc_utils import CharStream

__all__ = [
    "unwrap_simply_derived_type",
    "parse_typename",
    "_parse_name", "parse_name",  # TODO: remove _parse_name
    "TypeName", "Unit", "Never", "Tuple", "Array", "Slice", "TraitObject",
    "TraitImpl", "Reference", "FunctionPointer", "Name"
]


def unwrap_simply_derived_type(t: "TypeName") -> "TypeName":
    """
    Unwrap simply derived types whose layout is guaranteed, such as thin
    pointers and arrays
    """
    if isinstance(t, Reference) and not (
        # Don't unwrap fat pointers; their layout is not fixed
        isinstance(t.pointee, TraitObject) or isinstance(t.pointee, Slice)
    ):
        return unwrap_simply_derived_type(t.pointee)
    elif isinstance(t, Array):
        return unwrap_simply_derived_type(t.element_type)

    return t


def parse_typename(s: str | None, namespace: Name | None = None) -> TypeName:
    if s is None or not s.strip():
        return Unit.unit
    s = _normalize_whitespace(s)
    stream = CharStream(s)
    try:
        res = _parse_typename(stream)
        if stream.peek() != '':
            raise RuntimeError('Could not fully parse type')
    except RuntimeError:
        raise RuntimeError(
            f'Error parsing type {s}, remaining {stream[stream.pos():]}'
        )

    return Name.with_namespace(res, namespace).as_type()


def parse_name(name: str, namespace: Name | None = None) -> Name:
    name = _normalize_whitespace(name)
    stream = CharStream(name)

    try:
        res = _parse_name(stream, namespace)
        if stream.peek() != '':
            raise RuntimeError("Failed to fully parse name")
    except:
        raise RuntimeError(
            f'Error parsing name {name}, remaining {stream[stream.pos():]}'
        )

    return res


def _normalize_whitespace(s: str) -> str:
    # Mark significant whitespace
    s = re.sub(r'\b(mut|dyn|const) ', r'\1$', s)
    s = s.replace(' as ', '$as$')
    # Remove all other whitespace
    s = re.sub(r'\s', '', s)
    # Restore significant whitespace
    s = s.replace('$', ' ')
    s = s.replace(',', ', ')
    return s


def _parse_typename(s: CharStream) -> TypeName:
    return _handle_postfix(_parse_type_prefix(s), s)


def _parse_name(
    s: CharStream, parent: Name | None = None
) -> Name:
    # Bracketed type
    if s.match('<'):
        type = _parse_typename(s)

        if not s.match('>'):
            raise RuntimeError('Mismatched angle brackets')

        res = Name(parent, None, (type,)).normalize()
    else:
        ident = s.match(r(r'\w+|\{\w+(?:#\d+)?}'))

        if not ident:
            raise RuntimeError(f'Expected identifier')

        ident_name = ident.group()
        if s.match("<"):
            parameters = _parse_list(s)
            if not s.match(">"):
                raise RuntimeError('Mismatched angle brackets')
        else:
            parameters = ()

        res = Name(parent, ident_name, parameters)

    if s.match('::'):
        res = _parse_name(s, res)

    return res


def _parse_type_prefix(s: CharStream) -> TypeName:
    # Unit and Never types
    if s.match('!'): return Never.never
    if s.match('()'): return Unit.unit

    # Array / slice types
    if s.match('['):
        implementor = _parse_typename(s)
        if s.match(']'):
            return Slice(implementor)
        if s.match(';'):
            size = _parse_int(s)
            if s.match(']'):
                return Array(implementor, size)
        raise RuntimeError('Mismatched brackets')

    # Unit / tuple types
    if s.match('('):
        elements = _parse_list(s)

        if not s.match(')'):
            raise RuntimeError('Mismatched parenthesis')

        return Tuple(elements)

    # Function pointer types
    if s.match(r(r'fn\b')):
        if not s.match("("):
            raise RuntimeError('Expected "("')
        args = _parse_list(s)
        if not s.match(")"):
            raise RuntimeError('Mismatched parentheses')

        if not s.match('->'):
            raise RuntimeError('Expected "->"')
        return_type = _parse_typename(s)

        return FunctionPointer(args, return_type)

    # Trait object types
    if s.match('dyn '):
        return TraitObject(_parse_name(s))

    # Reference types
    if s.match('&mut '):
        return Reference(False, True, _parse_typename(s))
    if s.match('&'):
        return Reference(False, False, _parse_typename(s))
    if s.match('*mut '):
        return Reference(True, True, _parse_typename(s))
    if s.match(r(r'\*(const )?')):
        return Reference(True, False, _parse_typename(s))

    return _parse_name(s)


def _parse_int(s: CharStream) -> int:
    res = s.match(r(r'\d+'))
    if res is None:
        raise RuntimeError('Expected integer')
    return int(res.group())


def _parse_list(s: CharStream) -> tuple[TypeName, ...]:
    if s.peek_match(r(r'[)>\]]')):
        return ()
    elements: list[TypeName] = [_parse_typename(s)]
    while s.match(', '):
        elements.append(_parse_typename(s))
    return tuple(elements)


def _handle_postfix(t: TypeName, s: CharStream) -> TypeName:
    # Pointer type
    if s.match('*'):
        return _handle_postfix(Reference(True, True, t), s)

    # Trait impl
    if s.match(' as '):
        return _handle_postfix(TraitImpl(_parse_name(s), t), s)

    # Pointer type (infix)
    if m := s.match(r(r'\((\*+)\)')):
        levels = len(m.group(1))
        res = _handle_postfix(t, s)
        for _ in range(levels):
            res = Reference(False, False, res)
        return res

    # Function pointer type
    if s.match('('):
        args = _parse_list(s)

        if not s.match(")"):
            raise RuntimeError('Mismatched parenthesis')

        res = FunctionPointer(args, t)

        return _handle_postfix(res, s)

    # Array type
    if s.match('['):
        size = _parse_int(s)
        if not s.match(']'): raise RuntimeError('Mismatched brackets')
        return _handle_postfix(Array(t, size), s)

    return t


class TypeName(ABC):
    """
    Abstract class representing a Rust type name
    """

    @abstractmethod
    def __repr__(self) -> str:
        raise NotImplementedError

    @abstractmethod
    def apply_recursive(self, f: Callable[[TypeName], TypeName]) -> TypeName:
        raise NotImplementedError

    def __eq__(self, other: object) -> bool:
        return self.__class__ == other.__class__ and repr(self) == repr(other)

    def __hash__(self) -> int:
        return hash(repr(self))

    def to_alphanumeric(self) -> str:
        name = str(self.strip_namespaces())

        # Replace references/pointers with words
        name = name.replace('*', '_ptr_')
        name = name.replace('&', '_ref_')

        name = re.sub(r'[^a-zA-Z0-9_]', '_', name)  # Remove nonalphanumeric
        name = re.sub(r'_+', '_', name)  # Collapse underscores
        name = re.sub(r'\b_|_\b', '', name)  # Remove underscores on ends
        return name

    def strip_namespaces(self) -> TypeName:
        def strip(t: Name) -> Name:
            return Name(None, t.name, t.generic_args)

        def visit(t: TypeName) -> TypeName:
            # print(f'Visiting {t}')
            if isinstance(t, Name):
                return strip(t)
            if isinstance(t, TraitImpl):
                return TraitImpl(strip(t.trait), t.implementing_type)
            if isinstance(t, TraitObject):
                return TraitObject(strip(t.trait))
            return t

        return self.apply_recursive(visit)


@final
@dataclass(frozen=True, eq=False, repr=False)
class Tuple(TypeName):
    """
    A tuple type, such as ``(u8, u8)``. This must not empty (use Unit.unit
    instead)
    """
    elements: tuple[TypeName, ...]

    def __post_init__(self) -> None:
        if len(self.elements) == 0:
            raise ValueError("Tuple must have at least one element")

    def __repr__(self) -> str: return f'({", ".join(map(str, self.elements))})'

    def apply_recursive(self, f: Callable[[TypeName], TypeName]) -> TypeName:
        return f(Tuple(tuple(e.apply_recursive(f) for e in self.elements)))


@final
@dataclass(frozen=True, eq=False, repr=False)
class Reference(TypeName):
    """
    A pointer or reference type, such as ``&mut Foo``
    """
    is_pointer: bool
    mutable: bool
    pointee: TypeName

    def __repr__(self) -> str:
        prefix = '*' if self.is_pointer else '&'
        if self.mutable:
            prefix += 'mut '
        # Unlike Rust, which adds an extra 'const' on pointers, we omit that
        # here for concision
        return f'{prefix}{self.pointee}'

    def apply_recursive(self, f: Callable[[TypeName], TypeName]) -> TypeName:
        return f(Reference(
            self.is_pointer, self.mutable,
            self.pointee.apply_recursive(f)
        ))


@final
@dataclass(frozen=True, eq=False, repr=False)
class TraitObject(TypeName):
    """
    A trait object, such as ``dyn Foo``
    """
    trait: Name

    def __repr__(self) -> str: return f'dyn {self.trait}'

    def apply_recursive(self, f: Callable[[TypeName], TypeName]) -> TypeName:
        return f(TraitObject(self.trait))


@final
@dataclass(frozen=True, eq=False, repr=False)
class Slice(TypeName):
    """
    A slice type, such as ``[u8]``
    """
    pointee: TypeName

    def __repr__(self) -> str: return f'[{self.pointee}]'

    def apply_recursive(self, f: Callable[[TypeName], TypeName]) -> TypeName:
        return f(Slice(self.pointee.apply_recursive(f)))


@final
@dataclass(frozen=True, eq=False, repr=False)
class Array(TypeName):
    """
    A (statically sized) array type, such as ``[u8;256]``
    """
    element_type: TypeName
    size: int

    def __repr__(self) -> str: return f'[{self.element_type} ; {self.size}]'

    def apply_recursive(self, f: Callable[[TypeName], TypeName]) -> TypeName:
        return f(Array(self.element_type.apply_recursive(f), self.size))


@final
@dataclass(frozen=True, eq=False, repr=False)
class TraitImpl(TypeName):
    trait: Name
    implementing_type: TypeName

    def __repr__(self) -> str:
        return f'{self.implementing_type} as {self.trait}'

    def apply_recursive(self, f: Callable[[TypeName], TypeName]) -> TypeName:
        return f(TraitImpl(
            self.trait,
            self.implementing_type.apply_recursive(f)
        ))


@final
@dataclass(frozen=True, eq=False, repr=False)
class FunctionPointer(TypeName):
    """
    A function pointer such as ``fn(u8,u8)->u16``
    """
    params: tuple[TypeName, ...]
    return_type: TypeName

    def __repr__(self) -> str:
        return f'fn({", ".join(map(str, self.params))}) -> {self.return_type}'

    def apply_recursive(self, f: Callable[[TypeName], TypeName]) -> TypeName:
        return f(FunctionPointer(
            tuple(p.apply_recursive(f) for p in self.params),
            self.return_type.apply_recursive(f)
        ))


@final
@dataclass(frozen=True, eq=False, repr=False)
class Name(TypeName):
    """
    A namespaced identifier (possibly with generic arguments) such as
    ``foo::bar<u8,()>::Baz<Option<i32>>``

    This can also be used to represent types within angle brackets, such as
    ``<[u8;256]>``
    which can be used as namespace parts
    """
    namespace: Name | None
    name: str | None
    generic_args: tuple[TypeName, ...]

    def __post_init__(self) -> None:
        if self.name is None and len(self.generic_args) != 1:
            raise ValueError("Invalid bracketed name")
        if self.name is not None and self.name == '':
            raise ValueError("Name must not be empty")

    def __repr__(self) -> str:
        namespace_part = f'{str(self.namespace)}::' if self.namespace else ''
        name_part = '' if self.name is None else self.name
        template_part = "" if not self.generic_args \
            else f"<{", ".join(map(str, self.generic_args))}>"

        return f'{namespace_part}{name_part}{template_part}'

    def apply_recursive(self, f: Callable[[TypeName], TypeName]) -> TypeName:
        return f(Name(
            Name.create(self.namespace.apply_recursive(f)) if self.namespace is not None else None,
            self.name,
            tuple(a.apply_recursive(f) for a in self.generic_args)
        ))

    def in_namespace(self, parent: Name | None) -> Name:
        if parent is None:
            return self

        if self.namespace is not None:
            parent = self.namespace.in_namespace(parent)

        return Name(
            parent,
            self.name,
            self.generic_args
        )

    def normalize(self) -> Name:
        """
        Reduce redundantly bracketed names
        """
        inner = self.as_type()

        if inner is not self and isinstance(inner, Name):
            if self.namespace is None:
                return inner.normalize()

            return inner.normalize().in_namespace(self.namespace.normalize())

        return self

    def as_type(self) -> TypeName:
        """
        Extract a bracketed type if possible
        """
        if self.name is None:
            return self.generic_args[0]
        return self

    @classmethod
    def with_namespace(cls, type: TypeName, namespace: Name | None) -> Name:
        return Name.create(type).in_namespace(namespace)

    @classmethod
    def create(cls, x: TypeName, *rest: TypeName) -> Name:
        """
        Given ``base`` and ``name``, returns ``base::name``
        """
        res = Name(None, None, (x,)).normalize()
        if len(rest):
            res = Name.create(*rest).in_namespace(res)
        return res


@final
class Unit(TypeName):
    """
        The Unit (``()``) type. Use Unit.unit
        """
    unit: Unit

    def __init__(self) -> None: raise RuntimeError("Use Unit.unit")

    def __repr__(self) -> str: return '()'

    def apply_recursive(self, f: Callable[[TypeName], TypeName]) -> TypeName:
        return f(self)


@final
class Never(TypeName):
    """
    The Never (``!``) type. Use Never.never
    """
    never: Never

    def __repr__(self) -> str: return '!'

    def apply_recursive(self, f: Callable[[TypeName], TypeName]) -> TypeName:
        return f(self)

    def __init__(self) -> None: raise RuntimeError("Use Never.never")


@final
class Unknown(TypeName):
    """
    Represents an unknown type
    """
    unknown: Unknown

    def __repr__(self) -> str: return '?'

    def apply_recursive(self, f: Callable[[TypeName], TypeName]) -> TypeName:
        return f(self)

    def __init__(self) -> None: raise RuntimeError("Use Unknown.unknown")


# noinspection PyTypeChecker
Never.never, Unit.unit, Unknown.unknown = \
    Never.__new__(Never), Unit.__new__(Unit), Unknown.__new__(Unknown)
