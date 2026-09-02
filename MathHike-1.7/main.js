const $=id=>document.getElementById(id);
let llm=null,last='',memory=[];

async function ensureWllama(){
  let mod=null, wasm=null, err=null;

  // First choice: a MathHike-owned local Wllama folder.
  try{
    mod=await import('./Wllama_for_MathHike/esm/index.js');
    wasm='./Wllama_for_MathHike/esm/wasm/wllama.wasm';
  }catch(e){ err=e; }

  // Network fallbacks are retained only as recovery paths. 1.7 bundles Wllama.
  if(!mod){
    try{
      mod=await import('https://esm.sh/@wllama/wllama@3.4.0');
      wasm='https://cdn.jsdelivr.net/npm/@wllama/wllama@3.4.0/esm/wasm/wllama.wasm';
    }catch(e){ err=e; }
  }
  if(!mod){
    try{
      mod=await import('https://cdn.jsdelivr.net/npm/@wllama/wllama@3.4.0/esm/index.js');
      wasm='https://cdn.jsdelivr.net/npm/@wllama/wllama@3.4.0/esm/wasm/wllama.wasm';
    }catch(e){ err=e; }
  }

  if(!mod) throw err || new Error('Wllama runtime unavailable.');
  return {Wllama:mod.Wllama, wasm};
}

function add(role,text){
  const chat=$('chat'); if(!chat)return;
  const d=document.createElement('div');
  d.className='msg '+(role==='user'?'you':'ai');
  const b=document.createElement('div');
  b.className='bubble';
  b.textContent=(role==='user'?'You: ':'MathHike: ')+text;
  d.appendChild(b); chat.appendChild(d); chat.scrollTop=chat.scrollHeight;
}

$('localGGUF')?.addEventListener('change',()=>{
  const f=$('localGGUF').files?.[0];
  $('tutorStatus').textContent=f ? `Selected ${f.name}. Press LOAD LOCAL GGUF.` : 'No GGUF brain loaded.';
});

$('loadLocalGGUF')?.addEventListener('click',async()=>{
  const f=$('localGGUF')?.files?.[0];
  if(!f){$('tutorStatus').textContent='Choose a .gguf file first.';return}
  try{
    $('tutorStatus').textContent='Loading bundled Wllama, then '+f.name+' locally…';
    const {Wllama,wasm}=await ensureWllama();
    if(llm) try{ await llm.exit(); }catch(_){}
    llm=new Wllama({default:wasm});
    const isSafari=/^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if(isSafari && typeof llm.setCompat==='function')llm.setCompat('default');
    await llm.loadModel([f],{n_ctx:1536,n_threads:1,n_gpu_layers:0});
    $('tutorStatus').textContent='🟢 Local GGUF ready: '+f.name;
  }catch(e){
    $('tutorStatus').textContent='❌ '+(e?.message||e);
  }
});

$('ask')?.addEventListener('click',async()=>{
  const q=$('prompt')?.value.trim(); if(!q)return;
  if(!llm){add('assistant','Choose a local GGUF and press LOAD LOCAL GGUF first.');return}
  add('user',q); $('prompt').value='';
  try{
    const r=await llm.createChatCompletion({
      messages:[
        {role:'system',content:'You are MathHike, a patient mathematics and scientific-computing tutor.'},
        ...memory.slice(-6), {role:'user',content:q}
      ],
      max_tokens:360, temperature:.55
    });
    last=(r?.choices?.[0]?.message?.content||'').trim();
    add('assistant',last);
    memory.push({role:'user',content:q},{role:'assistant',content:last});
  }catch(e){add('assistant','Error: '+(e?.message||e))}
});

$('newchat')?.addEventListener('click',()=>{if($('chat'))$('chat').innerHTML='';memory=[]});
$('listen')?.addEventListener('click',()=>last&&speechSynthesis.speak(new SpeechSynthesisUtterance(last)));
