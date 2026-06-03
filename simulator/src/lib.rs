#![cfg_attr(not(test), no_std)]

mod components;
mod simulator;
mod params;

// Only include interop when not testing (otherwise a lot of stuff breaks)
#[cfg(not(test))]
mod js_interop;