use crate::const_bound::const_bound;

pub trait LRUCache<T> {
    /// Search for an entry satisfying the given predicate. If multiple entries satisfy the
    /// predicate, there is no guarantee for which one is returned. The returned entry is promoted
    /// to be the most recently used entry.
    fn get(&mut self, cond: impl FnMut(&T) -> bool) -> Option<&mut T>;

    /// Get a mutable reference to the least recently used entry and promotes it to the most
    /// recently used entry.
    fn get_lru(&mut self) -> &mut T;
}

pub struct FixedSizeLRUCache<T, const N: usize>
where
    const_bound!(0 < N <= 8):,
{
    state: MatrixLRUState<N>,
    data: [T; N],
    lru: usize,
}

impl<T, const N: usize> LRUCache<T> for FixedSizeLRUCache<T, N>
where
    const_bound!(0 < N <= 8):,
{
    fn get(&mut self, mut cond: impl FnMut(&T) -> bool) -> Option<&mut T> {
        for i in 0..N {
            if cond(&self.data[i]) {
                self.lru = self.state.update(i);
                return Some(&mut self.data[i]);
            }
        }

        None
    }

    fn get_lru(&mut self) -> &mut T {
        let res = &mut self.data[self.lru];
        self.lru = self.state.update(self.lru);
        res
    }
}

impl<T: Default, const N: usize> FixedSizeLRUCache<T, N>
where
    const_bound!(0 < N <= 8):,
{
    fn new(mut initial_data: impl FnMut() -> T) -> Self {
        Self {
            state: Default::default(),
            data: core::array::from_fn(|_| initial_data()),
            lru: 0, // Arbitrary, but 0 is fine.
        }
    }
}

impl<T: Default, const N: usize> Default for FixedSizeLRUCache<T, N>
where
    const_bound!(0 < N <= 8):,
{
    fn default() -> Self {
        Self::new(|| Default::default())
    }
}

/// A data structure that tracks the least recently used element out of a fixed set of `N` elements
/// encoded as integers from `0` to `N - 1`
struct MatrixLRUState<const N: usize>
where
    const_bound!(0 < N <= 8):,
{
    /// Invariant: when interpreted as an 8 x 8 matrix of bits in row major order and considering
    /// only the top left N x N submatrix, the bit at row r, col c is set iff element c was accessed
    /// more recently than element r
    matrix: u64,
}

impl<const N: usize> Default for MatrixLRUState<N>
where
    const_bound!(0 < N <= 8):,
{
    fn default() -> Self {
        // The zero matrix trivially satisfies the invariant -- it represents the case where no
        // element was accessed more recently than any other element
        Self { matrix: 0 }
    }
}

impl<const N: usize> MatrixLRUState<N>
where
    const_bound!(0 < N <= 8):,
{
    /// Access the given element (`0 ≤ access < N`) and return the new least recently used element
    fn update(&mut self, n: usize) -> usize {
        assert!(n < N);

        /// Get a 64-bit mask for the first `n` bits, where `1 ≤ n ≤ 64`. Values outside this range
        /// are wrapped (as in modular arithmetic).
        fn get_mask(n: usize) -> u64 {
            // Put a 1 in the `n`th bit (one-indexed)
            let p = 0x_8000_0000_0000_0000_u64.rotate_left(n as u32);
            // Spread to all lower bits
            p | (p - 1)
        }

        // Generate masks to extract submatrix
        let row_mask: u64 = get_mask(N * 8);
        let col_mask: u64 = get_mask(N);

        // Set the nth column (this element was accessed more recently than all elements)
        self.matrix |= 0x0101010101010101u64 << n;
        // Unset the nth row (no element was accessed more recently than this element)
        self.matrix &= !(0xffu64 << (n * 8));

        // We want to find a fully unset column (whose element was not accessed more recently than
        // any element), which will be an LRU element.
        //
        // Due to the invariant, this will always exist. Since "used more recently than" is a strict
        // partial order and the set of elements we are concered with is finite, there exists at
        // least one element that was not "used more recently than" every other element. (This
        // follows from the fact that every finite poset has at least one maximal element)
        let mut tmp = self.matrix;

        // Unset all but the first N rows
        tmp &= row_mask;
        // Bitor all rows to extract the target columns that has all 0's
        tmp |= tmp >> 32;
        tmp |= tmp >> 16;
        tmp |= tmp >> 8;
        // Unset all but the first N bits
        tmp &= col_mask;
        // The number of trailing ones is the index of the first zero column
        tmp.trailing_ones() as usize
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    macro_rules! cache_update {
        ($cache: ident <- $($access: expr),+) => {
            $($cache.update($access);)+
        };
    }

    #[test]
    fn test_lru_state_matrix_1() {
        let mut state = MatrixLRUState::<1>::default();
        // It'd better always be 0
        assert_eq!(state.update(0), 0);
        assert_eq!(state.update(0), 0);
        assert_eq!(state.update(0), 0);
    }

    #[test]
    fn test_lru_state_matrix_2() {
        let mut state = MatrixLRUState::<2>::default();
        assert_eq!(state.update(0), 1);
        assert_eq!(state.update(0), 1);
        assert_eq!(state.update(1), 0);
        assert_eq!(state.update(1), 0);
        assert_eq!(state.update(0), 1);
    }

    #[test]
    fn test_lru_state_matrix_8() {
        let mut state = MatrixLRUState::<8>::default();

        //                      v-- LRU        MRU --v
        cache_update!(state <- 0, 5, 3, 6, 2, 7, 1, 4);

        assert_eq!(state.update(4), 0); // Does not change order
        assert_eq!(state.update(0), 5); // 5, 3, 6, 2, 7, 1, 4, 0
        assert_eq!(state.update(4), 5); // 5, 3, 6, 2, 7, 1, 0, 4
        assert_eq!(state.update(6), 5); // 5, 3, 2, 7, 1, 0, 4, 6

        cache_update!(state <- 0, 5, 3); // 2, 7, 1, 4, 6, 0, 5, 3

        assert_eq!(state.update(1), 2); // 2, 7, 4, 6, 0, 5, 3, 1
        assert_eq!(state.update(2), 7); // 7, 4, 6, 0, 5, 3, 1, 2
        assert_eq!(state.update(7), 4); // 4, 6, 0, 5, 3, 1, 2, 7
    }

    #[test]
    fn test_lru_state_matrix_5() {
        let mut state = MatrixLRUState::<5>::default();

        cache_update!(state <- 0, 3, 2, 1, 4);

        assert_eq!(state.update(4), 0); // Does not change order
        assert_eq!(state.update(0), 3); // 3, 2, 1, 4, 0
        assert_eq!(state.update(4), 3); // 3, 2, 1, 0, 4
        assert_eq!(state.update(0), 3); // 3, 2, 1, 4, 0
        assert_eq!(state.update(2), 3); // 3, 1, 4, 0, 2
        assert_eq!(state.update(3), 1); // 1, 4, 0, 2, 3
        assert_eq!(state.update(1), 4); // 4, 0, 2, 3, 1
    }

    #[test]
    fn test_lru_cache() {
        // Cache is initialized with zeros
        let mut c = FixedSizeLRUCache::<u8, 6>::default();
        let cache = &mut c;

        /// Get the entry in the cache with the given lower four bits
        fn cache_get(cache: &mut impl LRUCache<u8>, target: u8) -> Option<u8> {
            cache.get(|x| x & 0xf == target).cloned()
        }

        assert_eq!(cache_get(cache, 0x0), Some(0));
        assert_eq!(cache_get(cache, 0xe), None);
        assert_eq!(cache_get(cache, 0x5), None);

        *cache.get_lru() = 0xb5;

        assert_eq!(cache_get(cache, 0x0), Some(0));
        assert_eq!(cache_get(cache, 0xe), None);
        assert_eq!(cache_get(cache, 0x5), Some(0xb5));

        *cache.get_lru() = 0xce;

        assert_eq!(cache_get(cache, 0x0), Some(0));
        assert_eq!(cache_get(cache, 0xe), Some(0xce));
        assert_eq!(cache_get(cache, 0x5), Some(0xb5));

        //                       v--LRU          MRU--v
        // Now cache should have 0, 0, 0, 0, 0xce, 0xb5

        for _ in 0..4 {
            // Access the four LRU elements (0)
            assert_eq!(*cache.get_lru(), 0);
        }

        // Now cache should have 0xce, 0xb5, 0, 0, 0, 0

        let evicted = cache.get_lru();
        assert_eq!(*evicted, 0xce); // This should return the spot where 0xce is stored
        *evicted = 0x2f; // Replace 0xce with 0x2f

        // Now cache should have 0xb5, 0, 0, 0, 0x2f

        assert_eq!(cache_get(cache, 0xe), None);
        assert_eq!(cache_get(cache, 0x5), Some(0xb5));
        assert_eq!(cache_get(cache, 0xf), Some(0x2f));

        // By renewing access to 0xb5 and 0x2f above, we should have put them back near the front
        // Cache should have 0, 0, 0, 0, 0xb5, 0x2f

        for _ in 0..4 {
            assert_eq!(*cache.get_lru(), 0);
        }
        assert_eq!(*cache.get_lru(), 0xb5);
        assert_eq!(*cache.get_lru(), 0x2f);
    }
}
