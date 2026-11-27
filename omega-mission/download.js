'use strict';
const base='https://raw.githubusercontent.com/tlacaelel2013/Omega-Linux-Depot/fa893dcc88919021da835cf52766c6b4a633b218/';
const expected='5efdefedd8ca2d5c5b5181296e8ad007dd5b56d1c325a3b698f75477e5f0e7ab';
const $=id=>document.getElementById(id), status=s=>{$('status').textContent=s;};
const sha=async b=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b)),x=>x.toString(16).padStart(2,'0')).join('');
let controller;
$('stop').onclick=()=>controller?.abort();
$('start').onclick=async()=>{
 if(!window.showSaveFilePicker||!window.DecompressionStream){status('Use current desktop Chrome or Edge, or the Mac reconstruction script.');return;}
 let writer; $('start').disabled=true; $('progress').value=0;
 try{
 const handle=await showSaveFilePicker({suggestedName:'OMEGA-root.img',types:[{description:'Raw disk image',accept:{'application/octet-stream':['.img']}}]});
 controller=new AbortController();$('stop').disabled=false;
 const get=async n=>{const r=await fetch(base+n,{signal:controller.signal});if(!r.ok)throw Error('HTTP '+r.status+' '+n);return r;};
 const m=await (await get('COMPRESSED-MANIFEST.json')).json();
 if(m.format!=='omega-gzip-blocks-v1'||m.source_sha256!==expected||m.source_bytes!==8589934592||m.block_bytes!==16777216||m.n_block!==512||m.blocks.length!==512)throw Error('Manifest mismatch');
 const hex=/^[a-f0-9]{64}$/;let count=0;
 for(const [i,b] of m.blocks.entries()){if(b.index!==i||b.raw_bytes!==m.block_bytes||!hex.test(b.sha256)||(b.file===null?b.stored_bytes!==0:b.file!==`blk${String(i).padStart(9,'0')}.bin.gz`||!hex.test(b.stored_sha256)||!Number.isSafeInteger(b.stored_bytes)||b.stored_bytes<=0||b.stored_bytes>17000000))throw Error('Invalid block '+i);if(b.file)count++;}
 if(count!==257)throw Error('Stored block count mismatch');
 writer=await handle.createWritable();const zero=new Uint8Array(m.block_bytes);const zeroHash=await sha(zero);
 for(const b of m.blocks){controller.signal.throwIfAborted();status(`Reconstructing block ${b.index+1}/512 · ${b.file||'local zeros'}`);let raw=zero;
 if(b.file){const bytes=await (await get(b.file)).arrayBuffer();if(bytes.byteLength!==b.stored_bytes||await sha(bytes)!==b.stored_sha256)throw Error('Compressed checksum mismatch '+b.index);raw=new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());}
 if(raw.byteLength!==b.raw_bytes||(b.file?await sha(raw):zeroHash)!==b.sha256)throw Error('Raw checksum mismatch '+b.index);
 controller.signal.throwIfAborted();await writer.write(raw);$('progress').value=b.index+1;}
 controller.signal.throwIfAborted();await writer.close();writer=null;status('PASS: all 512 blocks verified and written. Whole-image SHA-256 still requires shasum on your Mac.');
 }catch(e){if(writer)try{await writer.abort();}catch(_){}status('Stopped: '+e.message+'\nNo completed image certified. Restart to retry.');}finally{$('start').disabled=false;$('stop').disabled=true;controller=null;}
};
