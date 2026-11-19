# Rust/WASM physics — setup

## File layout to commit
```
your-repo/
├── index.html                          (replace your existing one with this)
├── ferrari.glb                         (unchanged, already in your repo)
├── racing-physics/
│   ├── Cargo.toml
│   └── src/
│       └── lib.rs
└── .github/
    └── workflows/
        └── build-wasm.yml
```

## What happens on push
1. You push these files to `main`.
2. The GitHub Action (`build-wasm.yml`) spins up, installs Rust + `wasm-pack`,
   and runs `wasm-pack build --target web --release` inside `racing-physics/`.
3. That produces `racing-physics/pkg/racing_physics.js` and
   `racing-physics/pkg/racing_physics_bg.wasm`.
4. The Action commits that `pkg/` folder back into your repo automatically.
5. `index.html` imports `./racing-physics/pkg/racing_physics.js` directly —
   no local Rust install needed on your end at all.

## Checking it worked
- Go to the **Actions** tab on GitHub after pushing — you'll see the
  "Build Rust WASM Physics" run. Green check = it compiled.
- If it's red, open the run and read the `wasm-pack build` step's log —
  that's the real first compile check, since I couldn't compile this
  Rust code in my own sandbox (no network access there).
- Once green, open the page (GitHub Pages or locally via a static
  server — not `file://`, since module imports need `http(s)://`).
  Bottom-right badge should read **"Physics: Rust/WASM"**.
- If something's wrong with the WASM load, the badge reads
  **"Physics: JS fallback"** instead and the game keeps working using
  your original JavaScript physics — it just won't be using Rust.

## Editing the physics later
All the actual vehicle/collision logic lives in
`racing-physics/src/lib.rs`. Change constants or logic there, push,
and the Action rebuilds the `.wasm` automatically — you never need
Rust installed locally, even to edit it (GitHub's web editor or
Codespaces is enough).
