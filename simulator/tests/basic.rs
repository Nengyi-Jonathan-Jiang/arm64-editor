//! Test suite for the Web and headless browsers.

#[cfg(test)]
mod tests {

    #[test]
    fn pass() {
        println!("Doing stuff!");
        assert_eq!(1 + 1, 2);
    }
}
