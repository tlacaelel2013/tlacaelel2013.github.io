const el=id=>document.getElementById(id);
let pipe, busy=false, events=[];
function report(s){el('whisperStatus').textContent=s;events.push(new Date().toISOString()+' '+s)}
function lock(v){busy=v;el('loadModel').disabled=v||!!pipe;el('modelSource').disabled=v||!!pipe;el('transcribe').disabled=v||!pipe;}
el('loadModel').onclick=async()=>{if(busy||pipe)return;lock(true);try{
 report('Loading Transformers.js and Whisper Tiny…');
 const {pipeline,env}=await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2');
 env.backends.onnx.wasm.numThreads=1;
 env.useBrowserCache=true;
 env.allowRemoteModels=el('modelSource').value==='remote';
 env.allowLocalModels=!env.allowRemoteModels;
 env.localModelPath=new URL('./models/',location.href).href;
 pipe=await pipeline('automatic-speech-recognition','onnx-community/whisper-tiny',{device:'wasm',dtype:'q8',progress_callback:p=>{if(p.status==='progress')el('whisperStatus').textContent=`Loading ${p.file||''}: ${Math.round(p.progress||0)}%`;else if(p.status==='done')report('Loaded '+p.file)}});
 report('Whisper READY — local WASM inference');
}catch(e){report('LOAD FAILED: '+e.message)}finally{lock(false)}};
async function samples(blob){if(blob.size>32*1024*1024)throw Error('Audio exceeds 32 MiB laboratory limit');const c=new AudioContext();let a;try{a=await c.decodeAudioData(await blob.arrayBuffer())}finally{await c.close()}if(a.duration>120)throw Error('Audio exceeds 120 seconds');const o=new OfflineAudioContext(1,Math.ceil(a.duration*16000),16000);const s=o.createBufferSource();s.buffer=a;s.connect(o.destination);s.start();return (await o.startRendering()).getChannelData(0)}
el('transcribe').onclick=async()=>{if(busy||!pipe)return;lock(true);try{const blob=el('audioFile').files[0]||wav;if(!blob)throw Error('Record or select audio first');const a=await samples(blob);const t=performance.now();report(`Transcribing ${(a.length/16000).toFixed(2)} seconds locally…`);const opts={task:'transcribe',chunk_length_s:30,stride_length_s:5};if(el('language').value)opts.language=el('language').value;const result=await pipe(a,opts);el('transcript').value=result.text;report(`PASS — transcription completed in ${((performance.now()-t)/1000).toFixed(2)} seconds`)}catch(e){report('TRANSCRIPTION FAILED: '+e.message)}finally{lock(false)}};
el('exportText').onclick=()=>download(new Blob([el('transcript').value],{type:'text/plain'}),'U6B-transcript.txt');el('whisperReport').onclick=()=>download(new Blob(['R161O10U6B\n'+events.join('\n')],{type:'text/plain'}),'U6B-REPORT.txt');
