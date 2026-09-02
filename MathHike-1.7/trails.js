
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// Navigation
document.querySelectorAll('[data-room]').forEach(b=>b.addEventListener('click',()=>{
  const room=b.dataset.room;
  document.querySelectorAll('.room').forEach(x=>x.classList.toggle('active',x.id===room));
  document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x.dataset.room===room));
}));
document.querySelectorAll('[data-jump]').forEach(b=>b.addEventListener('click',()=>{
  const room=b.dataset.jump;
  document.querySelectorAll('.room').forEach(x=>x.classList.toggle('active',x.id===room));
  document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x.dataset.room===room));
}));

// ---------- Scientific Python ----------
let py=null;
async function ensurePy(){
  if(py)return py;
  $('pyStatus').textContent='Loading MathHike Python runtime…';
  if(typeof window.loadPyodide!=='function'){
    const sources=['./Python_for_MathHike/pyodide.js','https://cdn.jsdelivr.net/pyodide/v0.28.3/full/pyodide.js'];
    let loaded=false,lastError=null;
    for(const src of sources){try{await new Promise((resolve,reject)=>{const q=document.createElement('script');q.src=src;q.onload=resolve;q.onerror=()=>reject(new Error('Could not load '+src));document.head.appendChild(q)});if(typeof window.loadPyodide==='function'){loaded=true;break}}catch(e){lastError=e}}
    if(!loaded)throw lastError||new Error('Pyodide runtime unavailable. Add Python_for_MathHike/ beside index.html.');
  }
  let indexURL='./Python_for_MathHike/';
  try{const r=await fetch(indexURL+'pyodide-lock.json',{method:'HEAD'});if(!r.ok)throw 0}catch(_){indexURL='https://cdn.jsdelivr.net/pyodide/v0.28.3/full/'}
  py=await window.loadPyodide({indexURL});
  $('pyStatus').textContent='Loading NumPy • SciPy • pandas • Matplotlib • SymPy…';
  await py.loadPackage(['numpy','scipy','pandas','matplotlib','sympy','mpmath']);
  py.runPython(`import matplotlib\nmatplotlib.use("Agg")`);
  $('pyStatus').textContent='🟢 Scientific Python ready.';
  return py;
}
$('initPy')?.addEventListener('click',async()=>{try{await ensurePy()}catch(e){$('pyStatus').textContent='❌ '+e}});
async function capturePyPlot(){
  if(!py)return;
  try{
    const encoded=await py.runPythonAsync(`
import io, base64
import matplotlib
matplotlib.use("Agg", force=True)
import matplotlib.pyplot as plt
fig = plt.gcf()
if fig and fig.get_axes():
    fig.canvas.draw()
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=130, bbox_inches="tight")
    base64.b64encode(buf.getvalue()).decode("ascii")
else:
    ""
`);
    const text=String(encoded||'');
    try{ encoded?.destroy?.(); }catch(_){}
    if(text.length>100){
      $('pyGraphImg').src='data:image/png;base64,'+text;
      $('pyGraphEmpty').hidden=true;
      $('pyGraphImg').hidden=false;
      $('sharePyPlot').disabled=false;
      $('downloadPyPlot').disabled=false;
      window.MathHikeLastPlot=text;
    }else{
      $('pyGraphImg').hidden=true;
      $('pyGraphEmpty').hidden=false;
      $('pyGraphEmpty').textContent='No Matplotlib figure detected.';
    }
  }catch(e){
    $('pyGraphEmpty').hidden=false;
    $('pyGraphEmpty').textContent='Plot capture error: '+e;
  }
}

async function runPythonCode(code, echo=true){
  try{
    await ensurePy();
    if(echo) $('pyOut').textContent += `>>> ${code}\n`;
    py.globals.set('_mh_code', code);
    const raw = await py.runPythonAsync(`
import io, contextlib, traceback, json, base64
_buf=io.StringIO()
_plot=""
try:
    with contextlib.redirect_stdout(_buf), contextlib.redirect_stderr(_buf):
        try:
            _value=eval(_mh_code, globals(), globals())
            if _value is not None: print(repr(_value))
        except SyntaxError:
            exec(_mh_code, globals(), globals())
except Exception:
    traceback.print_exc(file=_buf)
try:
    import matplotlib.pyplot as plt
    _fig=plt.gcf()
    if _fig.get_axes():
        _fig.canvas.draw()
        _png=io.BytesIO()
        _fig.savefig(_png, format="png", dpi=130, bbox_inches="tight")
        _plot=base64.b64encode(_png.getvalue()).decode("ascii")
except Exception:
    traceback.print_exc(file=_buf)
json.dumps({"text":_buf.getvalue(),"plot":_plot})
`);
    const result=JSON.parse(String(raw||'{}'));
    try{raw?.destroy?.()}catch(_){}
    const text=String(result.text||'');
    if(echo) $('pyOut').textContent += (text || '(command completed)')+'\n';
    else $('pyOut').textContent=text || '(script completed)';
    $('pyOut').scrollTop=$('pyOut').scrollHeight;
    if(result.plot && result.plot.length>100){
      $('pyGraphImg').src='data:image/png;base64,'+result.plot;
      $('pyGraphEmpty').hidden=true;$('pyGraphImg').hidden=false;
      $('sharePyPlot').disabled=false;$('downloadPyPlot').disabled=false;
      window.MathHikeLastPlot=result.plot;
    }else{
      $('pyGraphImg').hidden=true;$('pyGraphEmpty').hidden=false;
      $('pyGraphEmpty').textContent='No Matplotlib figure detected.';
    }
  }catch(e){$('pyOut').textContent += 'Python error: '+e+'\n';}
}
$('runPy')?.addEventListener('click',()=>runPythonCode($('pyCode').value,false));
$('sendPy')?.addEventListener('click',async()=>{const el=$('pyCmd'),code=el.value.trim();if(!code)return;el.value='';await runPythonCode(code,true)});
$('pyCmd')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();$('sendPy').click()}});

$('demoPyPlot')?.addEventListener('click',()=>{
  $('pyCode').value=`import numpy as np\nimport matplotlib.pyplot as plt\nx=np.linspace(0,2*np.pi,300)\nplt.plot(x,np.sin(x))\nplt.title("MathHike Scientific Python — sin(x)")\nplt.xlabel("x"); plt.ylabel("sin(x)")`;
  $('runPy').click();
});
function downloadDataURL(dataURL,name){
  const a=document.createElement('a');a.href=dataURL;a.download=name;a.click();
}
$('downloadPyPlot')?.addEventListener('click',()=>window.MathHikeLastPlot&&downloadDataURL('data:image/png;base64,'+window.MathHikeLastPlot,'MathHike-Python-Plot.png'));
$('sharePyPlot')?.addEventListener('click',async()=>{
  if(!window.MathHikeLastPlot)return;
  const blob=await (await fetch('data:image/png;base64,'+window.MathHikeLastPlot)).blob();
  const file=new File([blob],'MathHike-Python-Plot.png',{type:'image/png'});
  if(navigator.share&&navigator.canShare?.({files:[file]}))await navigator.share({files:[file],title:'MathHike Python Plot'});
  else downloadDataURL(URL.createObjectURL(blob),file.name);
});

// ---------- Algebra / SymPy ----------
let lastAlg={expr:'',plain:'',latex:'',mathml:''};
async function runAlgebra(){
  try{
    await ensurePy();
    const expr=$('algCode').value.trim(); if(!expr)return;
    py.globals.set('_mh_expr',expr);
    const raw=py.runPython(`
from sympy import *
from sympy.printing.mathml import mathml
import json
x,y,z=symbols("x y z")
src=_mh_expr
try: value=eval(src.replace("^","**"),globals(),locals())
except Exception: value=sympify(src.replace("^","**"))
json.dumps({"plain":pretty(value),"latex":latex(value),"mathml":mathml(value,printer="presentation")})
`);
    const result=JSON.parse(String(raw));
    lastAlg={expr,plain:result.plain,latex:result.latex,mathml:result.mathml};
    $('algOut').textContent=result.plain;
    $('algLatex').textContent=result.latex;
    $('algMath').innerHTML=`<math display="block" xmlns="http://www.w3.org/1998/Math/MathML">${result.mathml}</math>`;
    $('algStatus').textContent='🟢 Symbolic + LaTeX + typeset MathML ready.';
  }catch(e){$('algStatus').textContent='❌ '+e}
}
$('runAlg')?.addEventListener('click',runAlgebra);
document.querySelectorAll('[data-alg]').forEach(b=>b.addEventListener('click',()=>{$('algCode').value=b.dataset.alg;runAlgebra()}));
function report(format){
  if(!lastAlg.expr)return;
  let body='',type='text/plain',ext=format;
  if(format==='txt') body=`MathHike Algebra Trail\n\nExpression:\n${lastAlg.expr}\n\nResult:\n${lastAlg.plain}\n\nLaTeX:\n${lastAlg.latex}\n`;
  if(format==='tex') body=`\\\\documentclass{article}\\n\\\\usepackage{amsmath}\\n\\\\begin{document}\\nExpression: \\\\verb|${lastAlg.expr}|\\n\\\\[${lastAlg.latex}\\\\]\\n\\\\end{document}`; 
  if(format==='html'){type='text/html';body=`<!doctype html><meta charset="utf-8"><title>MathHike Algebra Report</title><h1>MathHike Algebra Trail</h1><pre>${esc(lastAlg.expr)}</pre><math display="block" xmlns="http://www.w3.org/1998/Math/MathML">${lastAlg.mathml}</math><pre>${esc(lastAlg.plain)}</pre>`}
  const blob=new Blob([body],{type});const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download='MathHike-Algebra-Report.'+ext;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);
  $('algSave').textContent=`Report downloaded by your browser as MathHike-Algebra-Report.${ext}. Check Downloads / Files, then use the browser or system Share command.`;
}
document.querySelectorAll('[data-report]').forEach(b=>b.addEventListener('click',()=>report(b.dataset.report)));
$('printAlg')?.addEventListener('click',()=>{
  if(!lastAlg.expr)return;
  const w=open('','_blank');w.document.write(`<title>MathHike Algebra PDF</title><style>body{font-family:system-ui;margin:40px}math{font-size:30px}</style><h1>MathHike Algebra Trail</h1><pre>${esc(lastAlg.expr)}</pre><math display="block" xmlns="http://www.w3.org/1998/Math/MathML">${lastAlg.mathml}</math><pre>${esc(lastAlg.plain)}</pre><p>Use Print → Save as PDF.</p>`);w.document.close();w.print();
});
$('tutorAlg')?.addEventListener('click',()=>{
  const prompt=`Explain this Algebra Trail computation step by step.\nExpression: ${lastAlg.expr}\nResult: ${lastAlg.plain}\nLaTeX: ${lastAlg.latex}`;
  const target=$('prompt'); if(target)target.value=prompt;
  document.querySelector('[data-room="chatRoom"]')?.click();
});

// ---------- webR 0.6.0 browser engine ----------
let webR=null, rShelter=null, rStarting=null, lastRCanvas=null;

async function ensureR(){
  if(webR && rShelter)return webR;
  if(rStarting)return rStarting;
  rStarting=(async()=>{
    $('rStatus').textContent='Loading webR 0.6.0…';
    const {WebR}=await import('https://webr.r-wasm.org/v0.6.0/webr.mjs');
    webR=new WebR();
    await webR.init();
    rShelter=await new webR.Shelter();
    $('rStatus').textContent='🟢 webR 0.6.0 ready.';
    return webR;
  })();
  try{return await rStarting}catch(e){rStarting=null;throw e}
}

function showRBitmap(bitmap){
  const dst=$('rCanvas');
  dst.width=bitmap.width; dst.height=bitmap.height;
  const ctx=dst.getContext('2d');
  ctx.clearRect(0,0,dst.width,dst.height);ctx.drawImage(bitmap,0,0);
  bitmap.close?.();
  dst.hidden=false;$('rGraphEmpty').hidden=true;
  $('shareRPlot').disabled=false;$('downloadRPlot').disabled=false;
  lastRCanvas=dst;
}

$('initR')?.addEventListener('click',async()=>{
  try{
    await ensureR();
  }catch(e){$('rStatus').textContent='❌ '+e}
});

async function runRCommand(code, replace=false){
  if(!code.trim())return;
  try{
    await ensureR();
    $('rStatus').textContent='Running R…';
    const result=await rShelter.captureR(code,{withAutoprint:true,captureStreams:true,captureConditions:false});
    const lines=[];
    for(const item of result.output||[]){
      if(item.type==='stdout'||item.type==='stderr')lines.push(String(item.data??''));
    }
    if(replace)$('rOut').textContent=lines.join('\n')||'(command completed)';
    else $('rOut').textContent+=`\n> ${code}\n`+(lines.join('\n')||'(command completed)')+'\n';
    for(const image of result.images||[])showRBitmap(image);
    $('rOut').scrollTop=$('rOut').scrollHeight;
    $('rStatus').textContent='🟢 webR 0.6.0 ready.';
  }catch(e){
    $('rOut').textContent += '\nR error: '+e+'\n';
  }
}

$('runR')?.addEventListener('click',()=>runRCommand($('rCode').value,true));
$('demoRPlot')?.addEventListener('click',()=>{
  $('rCode').value='x <- rnorm(222)\nhist(x, col="steelblue", main="MathHike webR Histogram")';
  runRCommand($('rCode').value,true);
});
$('sendR')?.addEventListener('click',async()=>{
  const el=$('rCmd'), code=el.value.trim();
  if(!code)return;
  el.value='';
  await runRCommand(code,false);
});
$('rCmd')?.addEventListener('keydown',async e=>{
  if(e.key==='Enter'){
    e.preventDefault();
    e.stopPropagation();
    $('sendR').click();
  }
});

$('downloadRPlot')?.addEventListener('click',()=>{
  if(!lastRCanvas)return;
  const a=document.createElement('a');
  a.href=lastRCanvas.toDataURL('image/png');
  a.download='MathHike-R-Plot.png'; a.click();
});
$('shareRPlot')?.addEventListener('click',()=>{
  if(!lastRCanvas)return;
  lastRCanvas.toBlob(async blob=>{
    if(!blob)return;
    const file=new File([blob],'MathHike-R-Plot.png',{type:'image/png'});
    if(navigator.share&&navigator.canShare?.({files:[file]})){
      try{await navigator.share({files:[file],title:'MathHike R Plot'})}catch(_){}
    }else{
      const u=URL.createObjectURL(blob),a=document.createElement('a');
      a.href=u;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);
    }
  },'image/png');
});
