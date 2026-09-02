
const DB='MathHikeTinyEMU', STORE='disk', KEY='rootfs', ARCHKEY='arch', BLOCK=131072;
function openDB(){return new Promise((res,rej)=>{const q=indexedDB.open(DB,1);q.onupgradeneeded=()=>q.result.createObjectStore(STORE);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)})}
async function getValue(key){const db=await openDB();return new Promise((res,rej)=>{const tx=db.transaction(STORE,'readonly');const q=tx.objectStore(STORE).get(key);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)})}
async function getDisk(){return getValue(KEY)}
async function getArch(){return (await getValue(ARCHKEY))||'riscv64'}
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{
 const u=new URL(e.request.url);
 if(!u.pathname.includes('/__mathhike_disk__/'))return;
 e.respondWith((async()=>{
  const disk=await getDisk();
  if(!disk)return new Response('No MathHike disk selected',{status:404});
  if(u.pathname.endsWith('/blk.txt')){
    const n=Math.ceil(disk.size/BLOCK);
    return new Response(JSON.stringify({block_size:BLOCK/1024,n_block:n}),{headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
  }
  if(u.pathname.endsWith('/config.cfg')){
    const base=new URL('../',u).href,arch=await getArch(),is32=arch==='riscv32';
    const cfg={version:1,machine:is32?'riscv32':'riscv64',memory_size:is32?256:512,
      bios:base+(is32?'boot/bbl32.bin':'boot/bbl64.bin'),
      kernel:base+(is32?'boot/kernel-riscv32.bin':'boot/kernel-riscv64.bin'),
      cmdline:'root=/dev/vda rw console=hvc0 highres=off earlycon',
      drive0:{file:new URL('blk.txt',u).href}};
    return new Response(JSON.stringify(cfg),{headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
  }
  const m=u.pathname.match(/blk(\d{9})\.bin$/);
  if(m){
    const i=Number(m[1]),start=i*BLOCK,end=Math.min(disk.size,start+BLOCK);
    if(start>=disk.size)return new Response('',{status:416});
    const raw=new Uint8Array(await disk.slice(start,end).arrayBuffer());
    if(raw.length===BLOCK)return new Response(raw,{headers:{'Content-Type':'application/octet-stream','Cache-Control':'no-store'}});
    const padded=new Uint8Array(BLOCK);padded.set(raw);return new Response(padded,{headers:{'Content-Type':'application/octet-stream','Cache-Control':'no-store'}});
  }
  return new Response('Unknown virtual block request',{status:404});
 })());
});
