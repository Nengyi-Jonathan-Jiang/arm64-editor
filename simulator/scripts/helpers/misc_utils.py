from re import Pattern, Match
from typing import TypeVar, Callable, Iterable, overload

__all__ = ["closure", "filter_none", "CharStream"]

T = TypeVar("T")


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
    res: dict[T, None] = dict((i, None) for i in s)
    edge: dict[T, None] = dict(res)
    while edge:
        if on_cycle:
            on_cycle()
        old_edge = list(edge.keys())
        edge = dict()
        for x in old_edge:
            for y in find(x):
                if y in res: continue
                res[y] = None
                edge[y] = None
                if on_find:
                    on_find(y)
    return res.keys()


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
