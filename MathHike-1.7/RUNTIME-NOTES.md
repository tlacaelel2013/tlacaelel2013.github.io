# MathHike GitHub 1.3 — Pinned Runtime Edition

## Included locally
- MathHike webR runtime from the native MathHike app:
  `runtimes/webr-mathhike/`
  Includes R.bin.js, R.bin.wasm, R.bin.data, BLAS/LAPACK binaries and MathHike's webR bridge.
- Existing TinyEMU source/integration tree.
- Local GGUF file picker added to Browser Tutor.

## Pyodide
The current Python Trail remains pinned to the tested Pyodide CDN release used by 1.2.
A *complete* self-hosted Pyodide scientific distribution is not included in this ZIP.
The official full Pyodide distribution is over 200 MB and includes the scientific wheels
needed for NumPy/SciPy/pandas/Matplotlib/SymPy. Do not label this build fully offline yet.

## Tutor
Students can now choose a `.gguf` file from their own device. The GGUF stays browser-local.
The Wllama WebAssembly runtime is still loaded from its pinned web package URL in this build.

## Testing
Serve over HTTP/HTTPS (GitHub Pages or `python3 -m http.server`), not file://.
