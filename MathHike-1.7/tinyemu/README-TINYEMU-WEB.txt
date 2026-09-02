MathHike Browser TinyEMU

WHAT THIS IS
============
This is TinyEMU's own Emscripten / JavaScript-WebAssembly architecture, not the
older MathHike iframe that pointed at jslinux machines.

The Apple project's NeuraTinyEMU/Makefile.js explicitly defines:
  js/riscvemu64-wasm.js
  js/riscvemu64-wasm.wasm
and exports vm_start / console_queue_char.

WHOLE ROOT IMAGE
================
Stock TinyEMU's browser block backend asks for a descriptor plus fixed-size HTTP
blocks. MathHike hides that implementation detail with sw.js:

  user chooses ONE root-riscv64.img / .bin
       ↓
  browser stores the Blob in IndexedDB
       ↓
  sw.js synthesizes blk.txt + blk#########.bin requests
       ↓
  TinyEMU sees its standard HTTP block device

The user never has to split or upload the root image pieces.

LOCAL TINYEMU BUILD
===================
The exact NeuraTinyEMU source from the current Apple project is included in
tinyemu/source/.

Run:
  ./tinyemu/build-tinyemu-web.sh

with a current Emscripten SDK installed. The script removes obsolete flags from
the historical Makefile.js but otherwise asks TinyEMU to build its RISC-V 64
WASM target.

Until a local runtime is built, tinyemu-ui.js uses a browser TinyEMU WASM
bootstrap hosted by the NuttX TinyEMU demonstration. This lets you exercise the
whole-image adapter immediately, but the goal for deployment is to build and
commit your own runtime/riscvemu64-wasm.js + .wasm.

RESET
=====
The Linux lab is isolated in its own iframe. "Reset Lab" reloads that iframe,
which tears down the JavaScript/WASM VM before a second boot.
