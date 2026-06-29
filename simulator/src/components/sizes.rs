#![allow(unused)]

pub type Byte = u8;
pub type HWord = u16;
pub type Word = u32;
pub type XWord = u64;

pub type Addr = XWord;

pub type Instruction = Word;

pub static WORD_SIZE_BYTES: usize = size_of::<Word>();
pub static ADDR_SIZE_BYTES: usize = size_of::<Addr>();
pub static INSTRUCTION_SIZE_BYTES: usize = size_of::<Instruction>();