from re import Pattern, Match
from typing import TypeVar, Callable, Iterable, overload, Generic, Iterator

__all__ = ["closure", "filter_none", "CharStream", "dset"]

T = TypeVar("T")


# noinspection PyPep8Naming
class dset(Generic[T]):
    """
    A deterministic set. This is literally just a builtin dict with None values, and has the same
    behavior and guarantees.

    Use `set_items()` to get the items in the set. This is equivalent to `keys()` but more readable

    This provides set methods such `add` and `extend`
    """

    def __init__(self, iterable: Iterable[T] = ()):
        self.dict: dict[T, None] = {i: None for i in iterable}

    def __iter__(self) -> Iterator[T]:
        return iter(self.dict.keys())

    def add(self, item: T) -> None:
        self.dict[item] = None

    def extend(self, iterable: Iterable[T]) -> None:
        for i in iterable:
            self.add(i)

    def __bool__(self) -> bool:
        return len(self.dict) > 0


def closure(
    s: Iterable[T],
    find: Callable[[T], Iterable[T]],
    *,
    on_find: Callable[[T], None] | None = None,
    on_cycle: Callable[[], None] | None = None
) -> Iterable[T]:
    if on_find:
        for y in s:
            on_find(y)

    # Use dict instead of set to preserve order between closure iterations and ensure determinism
    res: dset[T] = dset(s)
    edge: dset[T] = dset(res)
    while edge:
        if on_cycle:
            on_cycle()
        old_edge = list(edge)
        edge = dset()
        for x in old_edge:
            for y in find(x):
                if y in res: continue
                res.add(y)
                edge.add(y)
                if on_find:
                    on_find(y)
    return res


def filter_none(x: Iterable[T | None], /) -> Iterable[T]:
    return (i for i in x if i is not None)


class CharStream:
    def __init__(self, s: str):
        self._s = s
        self._i = 0

    def pos(self) -> int:
        return self._i

    def __getitem__(self, i: int | slice) -> str:
        return self._s[i]

    def _clamp(self, i: int) -> int:
        return min(i, len(self._s))

    def peek(self, *, future: int = 0, amount: int = 1) -> str:
        start = self._clamp(self._i + future)
        end = self._clamp(start + amount)

        return self._s[start:end]

    def next(self, *, amount: int = 1) -> str:
        res = self.peek(amount=amount)
        self._i += len(res)
        return res

    def skip(self, *, amount: int = 1) -> None:
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
