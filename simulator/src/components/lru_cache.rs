struct LRUCache<T, const N: usize, M: LRUMatrix<N>> {
    matrix: M,
    data: [T; N],
    lru: usize,
}
impl<T: Copy, const N: usize, M: LRUMatrix<N>> LRUCache<T, N, M> {
    pub fn new(matrix: M, mut initial_data: impl FnMut() -> T) -> Self {
        Self {
            matrix,
            data: core::array::from_fn(|_| initial_data()),
            lru: 0, // Arbitrary, but 0 is fine.
        }
    }

    /// Get an entry satisfying the given predicate, if it exists. It is not guaranteed which entry
    /// is returned if multiple entries satisfy the predicate, although this is a deterministic
    /// function of the previous accesses to the cache modulo sequential access to the same entry.
    pub fn get(&mut self, mut cond: impl FnMut(&T) -> bool) -> Option<&mut T> {
        for i in 0..N {
            if cond(&self.data[i]) {
                self.lru = self.matrix.update(i);
                return Some(&mut self.data[i]);
            }
        }

        None
    }

    /// Get a mutable reference to the least recently used entry.
    pub fn get_lru(&mut self) -> &mut T {
        let res = &mut self.data[self.lru];
        self.lru = self.matrix.update(self.lru);
        res
    }
}

trait LRUMatrix<const ASSOCIATIVITY: usize> {
    /// Access the given element (0 <= access < Associativity) and return the new least recently
    /// used element
    fn update(&mut self, access: usize) -> usize;
}

/// Implementation of an LRU cache up to associativity 8 using a bit matrix
struct SimpleLRUMatrix<const ASSOCIATIVITY: usize> {
    matrix: u64,
}

impl<const A: usize> Default for SimpleLRUMatrix<A> {
    fn default() -> Self {
        Self { matrix: 0 }
    }
}

macro_rules! get_mask {
    ($n:expr) => {
        (2u64 << (($n) - 1)).wrapping_sub(1)
    };
}

impl<const A: usize> LRUMatrix<A> for SimpleLRUMatrix<A>
where
    [(); A - 1]:,
    [(); 8 - A]:,
{
    fn update(&mut self, access: usize) -> usize {
        assert!(access < A);

        // Generate masks to make fixed matrix size work with variable A
        let row_mask: u64 = !get_mask!(A * 8);
        let col_mask: u64 = {
            let mut mask = get_mask!(A);
            mask |= mask << 8; // spread using recursive doubling
            mask |= mask << 16;
            mask |= mask << 32;
            mask
        };

        // Update matrix
        let mut tmp: u64 = self.matrix; // Need; we do computations on matrix value later
        tmp |= 0x0101010101010101u64 << access;
        tmp &= !(0xffu64 << (access * 8));
        self.matrix = tmp;
        tmp = !tmp;

        // Mask out extra rows and columns of the matrix
        tmp |= row_mask; // Put 1's in extra rows so the target can be identified
        tmp &= col_mask; // Put 0's in extra columns to prevent wrong targets

        // Recursive doubling to extract the target column that has all 1's
        tmp &= tmp >> 32;
        tmp &= tmp >> 16;
        tmp &= tmp >> 8;

        // The column with the 1 in it is the new LRU element
        tmp.trailing_zeros() as usize
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
    fn test_simple_lru_matrix_8() {
        let mut cache = SimpleLRUMatrix::<8>::default();

        //                      v-- LRU        MRU --v
        cache_update!(cache <- 0, 5, 3, 6, 2, 7, 1, 4);

        assert_eq!(cache.update(4), 0); // Does not change order
        assert_eq!(cache.update(0), 5); // 5, 3, 6, 2, 7, 1, 4, 0
        assert_eq!(cache.update(4), 5); // 5, 3, 6, 2, 7, 1, 0, 4
        assert_eq!(cache.update(6), 5); // 5, 3, 2, 7, 1, 0, 4, 6

        cache_update!(cache <- 0, 5, 3); // 2, 7, 1, 4, 6, 0, 5, 3

        assert_eq!(cache.update(1), 2); // 2, 7, 4, 6, 0, 5, 3, 1
        assert_eq!(cache.update(2), 7); // 7, 4, 6, 0, 5, 3, 1, 2
        assert_eq!(cache.update(7), 4); // 4, 6, 0, 5, 3, 1, 2, 7
    }

    #[test]
    fn test_simple_lru_matrix_5() {
        let mut cache = SimpleLRUMatrix::<5>::default();

        cache_update!(cache <- 0, 3, 2, 1, 4);

        assert_eq!(cache.update(4), 0); // Does not change order
        assert_eq!(cache.update(0), 3); // 3, 2, 1, 4, 0
        assert_eq!(cache.update(4), 3); // 3, 2, 1, 0, 4
        assert_eq!(cache.update(0), 3); // 3, 2, 1, 4, 0
        assert_eq!(cache.update(2), 3); // 3, 1, 4, 0, 2
        assert_eq!(cache.update(3), 1); // 1, 4, 0, 2, 3
        assert_eq!(cache.update(1), 4); // 4, 0, 2, 3, 1
    }
}
