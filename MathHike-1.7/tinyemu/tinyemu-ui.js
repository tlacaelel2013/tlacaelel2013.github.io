
const status=document.getElementById('status'),termEl=document.getElementById('term'),diskInput=document.getElementById('disk');
const boot=document.getElementById('boot'),cmd=document.getElementById('cmd');
let runtimeReady=false,queueChar=null,vmStart=null;
let ansiRaw="";
function ansiHTML(source){
 const esc=x=>String(x).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
 const colors={
   30:"#8a8a8a",31:"#ff6b6b",32:"#69ef91",33:"#ffd166",
   34:"#4da3ff",35:"#c084fc",36:"#4ddbd3",37:"#f4f4f4",
   90:"#9aa0a6",91:"#ff8a80",92:"#8cffab",93:"#ffe082",
   94:"#82b1ff",95:"#d1a3ff",96:"#80fff4",97:"#ffffff"
 };
 let out="", last=0, color="#69ef91", bold=false;
 // Handles ESC[, Unicode CSI, and TinyEMU output where ESC was stripped and only "[1;34m" remains.
 const re=/(?:\x1b\[|\u009b|\[)([0-9;]*)m/g;
 const open=()=>`<span style="color:${color};${bold?'font-weight:700;':''}">`;
 out+=open();
 let m;
 while((m=re.exec(source))){
   out+=esc(source.slice(last,m.index))+"</span>";
   const params=(m[1]||"0").split(";").map(x=>Number(x||0));
   for(const c of params){
     if(c===0){color="#69ef91";bold=false}
     else if(c===1)bold=true;
     else if(c===22)bold=false;
     else if(c===39)color="#69ef91";
     else if(colors[c])color=colors[c];
   }
   out+=open(); last=re.lastIndex;
 }
 return out+esc(source.slice(last))+"</span>";
}
window.term={write(x){ansiRaw+=String(x);termEl.innerHTML=ansiHTML(ansiRaw);termEl.scrollTop=termEl.scrollHeight},getSize(){return [100,32]}};
window.update_downloading=()=>{};
window.net_state=null; window.graphic_display=null;
function openDB(){return new Promise((res,rej)=>{const q=indexedDB.open('MathHikeTinyEMU',1);q.onupgradeneeded=()=>q.result.createObjectStore('disk');q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)})}
async function saveValue(key,value){const db=await openDB();await new Promise((res,rej)=>{const tx=db.transaction('disk','readwrite');tx.objectStore('disk').put(value,key);tx.oncomplete=res;tx.onerror=()=>rej(tx.error)})}
async function saveDisk(file){await saveValue('rootfs',file)}
async function registerSW(){
 if(!('serviceWorker'in navigator))throw Error('Service Workers are unavailable. Use HTTPS or localhost.');
 await navigator.serviceWorker.register('sw.js',{scope:'./'});
 await navigator.serviceWorker.ready;
}
function loadRuntime(arch){
 return new Promise((resolve,reject)=>{
   window.Module={onRuntimeInitialized(){try{queueChar=Module.cwrap('console_queue_char',null,['number']);vmStart=Module.cwrap('vm_start',null,['string','number','string','string','number','number','number']);runtimeReady=true;resolve()}catch(e){reject(e)}},printErr(x){term.write('[TinyEMU] '+x+'\n')}};
   const filename=arch==='riscv32'?'riscvemu32-wasm.js':'riscvemu64-wasm.js';
   const local=document.createElement('script');local.src='runtime/'+filename;
   local.onerror=()=>{status.textContent='Local TinyEMU WASM not built; trying browser bootstrap…';const remote=document.createElement('script');remote.src='https://lupyuen.github.io/nuttx-tinyemu/'+filename;remote.onerror=()=>reject(Error(`TinyEMU ${arch} WASM runtime unavailable. Build both runtimes with build-tinyemu-web.sh.`));document.body.appendChild(remote)};
   document.body.appendChild(local);
 });
}
(async()=>{
 try{await registerSW();status.textContent='TinyEMU block service ready. Select a root image.'}
 catch(e){status.textContent='❌ '+e.message}
})();
diskInput.onchange=async()=>{
 const f=diskInput.files[0];if(!f)return;
 status.textContent='Saving whole image in browser storage…';
 try{await saveDisk(f);document.getElementById('diskInfo').textContent=`${f.name} • ${(f.size/1024/1024).toFixed(1)} MB`;boot.disabled=false;status.textContent='Image ready. Boot will use this complete file.'}
 catch(e){status.textContent='❌ Disk import failed: '+e}
};
boot.onclick=async()=>{
 const arch=document.getElementById('arch').value;
 boot.disabled=true;diskInput.disabled=true;document.getElementById('arch').disabled=true;
 try{
   await saveValue('arch',arch);if(!runtimeReady)await loadRuntime(arch);
   status.textContent='Booting '+(arch==='riscv32'?'RISC-V 32':'RISC-V 64')+'…';
   const cfg=new URL('__mathhike_disk__/config.cfg',location.href).href;
   vmStart(cfg,arch==='riscv32'?256:512,'root=/dev/vda rw console=hvc0 highres=off earlycon','',0,0,0);termEl.focus();
 }catch(e){status.textContent='❌ '+e.message;boot.disabled=false;diskInput.disabled=false;document.getElementById('arch').disabled=false}
};
function sendText(s){if(!queueChar)return;for(const ch of s){queueChar(ch.charCodeAt(0)&255)}}
document.getElementById('send').onclick=()=>{sendText(cmd.value+'\n');cmd.value='';termEl.focus()};
cmd.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();document.getElementById('send').click()}};
termEl.onkeydown=e=>{
 if(!queueChar)return;
 if(e.key.length===1){queueChar(e.key.charCodeAt(0)&255);e.preventDefault()}
 else if(e.key==='Enter'){queueChar(10);e.preventDefault()}
 else if(e.key==='Backspace'){queueChar(127);e.preventDefault()}
};
document.getElementById('reset').onclick=()=>location.reload();
