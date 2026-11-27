'use strict';
(async()=>{
const log=document.getElementById('bootlog'),say=s=>{log.textContent+='\n'+s;};
window.addEventListener('error',e=>say('ERROR: '+(e.message||e.target?.src||'resource error')),true);
window.addEventListener('unhandledrejection',e=>say('ERROR: '+e.reason));
try{
const p=new URLSearchParams(location.search), compressed=true;
const old=new URL('../../jsLinux22/term3/riscv64/',location.href), own=new URL('../boot-resources/riscv64/',location.href);
async function asset(key,name){if(p.get(key))return omegaURL(p.get(key));try{const r=await fetch(new URL(name,own),{method:'HEAD'});if(r.ok)return r.url||new URL(name,own).href;}catch(e){}say('Using heritage '+name+' (read only)');return new URL(name,old).href;}
const bios=await asset('bios','bbl64.bin'),kernel=await asset('kernel','kernel-riscv64.bin');
const disk=compressed?new URL('virtual/blk.txt',location.href).href:omegaURL(p.get('disk')||'');
const root=new URL('.',disk).href;
const depot='https://raw.githubusercontent.com/tlacaelel2013/Nano-Linux-Depot/3a441bb1f6359fc17e195e9fcb6e9eb7f88a6e36/';
async function get(url){const r=await fetch(url);if(!r.ok)throw Error('HTTP '+r.status+' '+url);return r;}
const sha=async b=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b)),x=>x.toString(16).padStart(2,'0')).join('');
let m;if(compressed){m=await (await get(depot+'COMPRESSED-MANIFEST.json')).json();if(m.format!=='omega-gzip-blocks-v1'||m.block_bytes!==16777216||m.n_block!==32||m.source_bytes!==536870912||m.blocks.length!==32)throw Error('Manifest geometry');for(let i=0;i<32;i++){const b=m.blocks[i];if(b.index!==i||b.raw_bytes!==m.block_bytes||!/^[a-f0-9]{64}$/.test(b.sha256)||!(b.file===null?b.stored_bytes===0:b.file===`blk${String(i).padStart(9,'0')}.bin.gz`&&/^[a-f0-9]{64}$/.test(b.stored_sha256)&&b.stored_bytes>0))throw Error('Invalid block '+i);}say('Manifest verified structurally; 32 virtual blocks');}else{const d=await omegaInspect(disk);if(d.kind!=='disk')throw Error('Expected block descriptor');say('Disk capacity '+d.capacity+' bytes');}
for(const url of [bios,kernel]){await (await get(url)).body?.cancel();say('PASS '+url);}
const cfg=JSON.stringify({version:1,machine:'riscv64',memory_size:256,bios,kernel,cmdline:p.get('cmdline')||'console=hvc0 root=/dev/vda rw',drive0:{file:disk}});
const cfgURL=new URL('mission-generated.cfg',location.href).href;
const open=XMLHttpRequest.prototype.open,send=XMLHttpRequest.prototype.send;const pending=new WeakMap();let queue=Promise.resolve();
async function block(i){const b=m.blocks[i];if(!b)throw Error('Block out of range');let raw;if(b.file===null)raw=new ArrayBuffer(m.block_bytes);else{const bytes=await (await get(depot+b.file)).arrayBuffer();if(bytes.byteLength!==b.stored_bytes||await sha(bytes)!==b.stored_sha256)throw Error('Compressed hash '+i);raw=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();}if(raw.byteLength!==b.raw_bytes||await sha(raw)!==b.sha256)throw Error('Raw hash '+i);say('Verified block '+i+(b.file?'':' (zero)'));return raw;}
XMLHttpRequest.prototype.open=function(method,url,...args){const u=new URL(url,location.href).href;pending.delete(this);if(u===cfgURL)return open.call(this,method,'data:application/json,'+encodeURIComponent(cfg),...args);if(compressed&&u.startsWith(root)){if(u===disk)return open.call(this,method,'data:application/json,'+encodeURIComponent(JSON.stringify({block_size:16384,n_block:32})),...args);const match=/^blk(\d{9})\.bin$/.exec(u.slice(root.length));if(match){pending.set(this,Number(match[1]));return open.call(this,method,'data:application/octet-stream,',...args);}}this.addEventListener('loadend',()=>say('HTTP '+this.status+' '+u));return open.call(this,method,url,...args);};
// Supply verified buffers via a native XHR to a temporary Blob URL. Keep at most one decompression active.
XMLHttpRequest.prototype.send=function(body){if(!pending.has(this))return send.call(this,body);const x=this,i=pending.get(x);pending.delete(x);queue=queue.then(async()=>{let url;try{const raw=await block(i);url=URL.createObjectURL(new Blob([raw]));const type=x.responseType;const handlers={load:x.onload,error:x.onerror,abort:x.onabort,progress:x.onprogress,loadend:x.onloadend};open.call(x,'GET',url,true);x.responseType=type;for(const [k,v] of Object.entries(handlers))x['on'+k]=v;await new Promise((resolve,reject)=>{x.addEventListener('loadend',resolve,{once:true});try{send.call(x);}catch(e){reject(e);}});}catch(e){say('BLOCK FAIL '+e.message);if(typeof x.onerror==='function')x.onerror(new Event('error'));}finally{if(url)URL.revokeObjectURL(url);}});};
p.set('url',cfgURL);history.replaceState(null,'',location.pathname+'?'+p.toString());const script=document.createElement('script');script.src='jslinux.js';document.body.appendChild(script);say('Starting independent TinyEMU');
}catch(e){say('FAIL: '+e.message);}
})();
