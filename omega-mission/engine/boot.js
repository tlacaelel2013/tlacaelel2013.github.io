'use strict';
(async()=>{
const log=document.getElementById('bootlog');const say=s=>{log.textContent+='\n'+s;};
window.addEventListener('error',e=>say('ERROR: '+(e.message||e.target?.src||'resource error')),true);
window.addEventListener('unhandledrejection',e=>say('ERROR: '+e.reason));
try {
const p=new URLSearchParams(location.search);const disk=new URL(p.get('disk')||'',location.href);
if(disk.origin!==location.origin||!disk.pathname.endsWith('/blk.txt'))throw Error('Select a same-origin blk.txt');
const root=new URL('../../jsLinux22/term3/riscv64/',location.href);
const bios=new URL('bbl64.bin',root).href,kernel=new URL('kernel-riscv64.bin',root).href;
const r=await fetch(disk);if(!r.ok)throw Error('Disk HTTP '+r.status);const meta=await r.text();if(!/block_size\s*[:"]/.test(meta)||!/n_block\s*[:"]/.test(meta))throw Error('Not a TinyEMU block descriptor');say('PASS: '+disk.href+'\n'+meta);
for(const url of [bios,kernel]){const r=await fetch(url,{method:'HEAD'});if(!r.ok)throw Error('Boot asset HTTP '+r.status+' '+url);say('PASS: '+url);}
const cfg=JSON.stringify({version:1,machine:'riscv64',memory_size:256,bios,kernel,cmdline:'console=hvc0 root=/dev/vda rw',drive0:{file:disk.href}});
// Serve a synthetic HTTP configuration through the emulator's own XHR transport.
const cfgURL=new URL('mission-generated.cfg',location.href).href;
const open=XMLHttpRequest.prototype.open,send=XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.open=function(method,url,...args){if(new URL(url,location.href).href===cfgURL){say('Serving generated VM configuration');return open.call(this,method,'data:application/json;charset=utf-8,'+encodeURIComponent(cfg),...args);}say('XHR '+url);this.addEventListener('loadend',()=>say('HTTP '+this.status+' '+url));return open.call(this,method,url,...args);};
p.set('url',cfgURL);p.delete('disk');history.replaceState(null,'',location.pathname+'?'+p.toString());
const script=document.createElement('script');script.src='jslinux.js';document.body.appendChild(script);say('Starting independent TinyEMU');
}catch(e){say('FAIL: '+e.message);}
})();
