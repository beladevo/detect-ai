# AI Detector WASM Build

Build the Rust crate into the Next.js public assets.

```
rustup target add wasm32-unknown-unknown
cargo build --release --target wasm32-unknown-unknown
wasm-bindgen --target no-modules --out-dir ../../public/wasm --out-name detector ./target/wasm32-unknown-unknown/release/ai_detector.wasm
wasm-opt -Oz -o ../../public/wasm/detector.wasm ../../public/wasm/detector.wasm
```

Recommended release flags:

```
RUSTFLAGS="-C opt-level=z -C codegen-units=1 -C panic=abort -C strip=symbols"
```
