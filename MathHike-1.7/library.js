
(() => {
  const BRAND = document.title.toLowerCase().includes("math") ? "MathHike" : "AI-mericans";
  let pdfFile = null, pdfURL = null, pdfDoc = null;

  const langs = {es:"Español",fr:"Français",de:"Deutsch",it:"Italiano",pt:"Português",
    vi:"Tiếng Việt",zh:"中文",ja:"日本語",ko:"한국어",ar:"العربية",hi:"हिन्दी",ru:"Русский"};

  const css = document.createElement("style");
  css.textContent = `
  #mhlib-open{position:fixed;right:18px;bottom:18px;z-index:9997;border:0;border-radius:999px;
    padding:12px 16px;font-weight:800;background:#1677ff;color:white;box-shadow:0 8px 28px #0003;cursor:pointer}
  #mhlib-modal{display:none;position:fixed;inset:0;z-index:9998;background:#0008;padding:3vh 3vw}
  #mhlib-card{height:94vh;background:#fff;color:#111;border-radius:18px;overflow:hidden;display:grid;
    grid-template-rows:auto 1fr auto;box-shadow:0 20px 70px #0007}
  #mhlib-bar,#mhlib-actions{display:flex;gap:9px;align-items:center;overflow-x:auto;padding:10px 12px;
    border-bottom:1px solid #ddd;white-space:nowrap}
  #mhlib-actions{border-top:1px solid #ddd;border-bottom:0}
  #mhlib-bar button,#mhlib-actions button,#mhlib-actions select,#mhlib-actions input{font:inherit;padding:8px 11px;border-radius:10px;border:1px solid #bbb}
  #mhlib-view{width:100%;height:100%;border:0;background:#eee}
  #mhlib-progress{font-size:12px;color:#666;min-width:150px}
  #mhlib-result{display:none;position:absolute;inset:8vh 7vw;background:white;z-index:10000;border-radius:16px;
    padding:18px;overflow:auto;box-shadow:0 18px 70px #0008}
  #mhlib-result .page{break-after:page;border-bottom:1px dashed #aaa;padding:12px 0;white-space:pre-wrap;line-height:1.5}
  @media(max-width:650px){#mhlib-modal{padding:0}#mhlib-card{height:100vh;border-radius:0}}
  `;
  document.head.appendChild(css);

  const open = document.createElement("button");
  open.id="mhlib-open"; open.textContent="📚 LIBRARY";
  document.body.appendChild(open);

  const modal=document.createElement("div");
  modal.id="mhlib-modal";
  modal.innerHTML=`
    <div id="mhlib-card">
      <div id="mhlib-bar">
        <b>📚 ${BRAND} Library</b>
        <input id="mhlib-file" type="file" accept="application/pdf">
        <span id="mhlib-name">No PDF selected</span>
        <button id="mhlib-close">Close</button>
      </div>
      <object id="mhlib-view" type="application/pdf"></object>
      <div id="mhlib-actions">
        <label>From <input id="mhlib-first" type="number" min="1" value="1" style="width:75px"></label>
        <label>To <input id="mhlib-last" type="number" min="1" value="1" style="width:75px"></label>
        <label><input id="mhlib-all" type="checkbox"> All pages</label>
        <select id="mhlib-lang">${Object.entries(langs).map(([c,n])=>`<option value="${c}">${n}</option>`).join("")}</select>
        <select id="mhlib-engine"><option value="online">Online Translator</option><option value="local">Local model (future/installed)</option></select>
        <button id="mhlib-translate">Translate Range</button>
        <span id="mhlib-progress">Open a PDF to begin.</span>
      </div>
    </div>
    <div id="mhlib-result"><button id="mhlib-result-close">Close</button> <button id="mhlib-print">Print / Save PDF</button>
      <h2>Translated PDF text</h2><div id="mhlib-pages"></div>
      <p><small>Browser edition: original PDF remains visible in the Library. Range translation produces a printable translated-text companion; native Apple editions additionally reconstruct translated text into the original page layout.</small></p>
    </div>`;
  document.body.appendChild(modal);

  const $=id=>document.getElementById(id);
  open.onclick=()=>modal.style.display="block";
  $("mhlib-close").onclick=()=>modal.style.display="none";
  $("mhlib-result-close").onclick=()=>$("mhlib-result").style.display="none";
  $("mhlib-print").onclick=()=>window.print();

  $("mhlib-file").onchange=async e=>{
    pdfFile=e.target.files[0]; if(!pdfFile)return;
    if(pdfURL) URL.revokeObjectURL(pdfURL);
    pdfURL=URL.createObjectURL(pdfFile);
    $("mhlib-view").data=pdfURL;
    $("mhlib-name").textContent=pdfFile.name;
    $("mhlib-progress").textContent="PDF ready. Loading page count…";
    try {
      await ensurePDFJS();
      pdfDoc=await pdfjsLib.getDocument({data:await pdfFile.arrayBuffer()}).promise;
      $("mhlib-last").value=pdfDoc.numPages;
      $("mhlib-progress").textContent=`${pdfDoc.numPages} pages ready.`;
    } catch(err) {
      $("mhlib-progress").textContent="PDF reader ready; translation engine needs network access.";
    }
  };

  $("mhlib-all").onchange=e=>{
    if(e.target.checked && pdfDoc){$("mhlib-first").value=1;$("mhlib-last").value=pdfDoc.numPages;}
  };

  async function ensurePDFJS(){
    if(window.pdfjsLib)return;
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");
  }
  function loadScript(src,module=false){
    return new Promise((resolve,reject)=>{
      const s=document.createElement("script"); s.src=src; if(module)s.type="module";
      s.onload=resolve;s.onerror=reject;document.head.appendChild(s);
    });
  }
  async function translate(text,target){
    const chunks=[]; for(let i=0;i<text.length;i+=420)chunks.push(text.slice(i,i+420));
    const out=[];
    for(const q of chunks){
      const u=`https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=en|${target}`;
      const r=await fetch(u); if(!r.ok)throw new Error("translation HTTP "+r.status);
      const j=await r.json(); out.push(j?.responseData?.translatedText||q);
    }
    return out.join("\n");
  }
  $("mhlib-translate").onclick=async()=>{
    if(!pdfFile){$("mhlib-progress").textContent="Choose a PDF first.";return}
    if($("mhlib-engine").value==="local"){
      $("mhlib-progress").textContent="Select Online Translator unless a tested browser-local model adapter is installed.";
      return;
    }
    try{
      if(!window.pdfjsLib) await ensurePDFJS();
      if(!pdfDoc) pdfDoc=await pdfjsLib.getDocument({data:await pdfFile.arrayBuffer()}).promise;
      let a=Math.max(1,parseInt($("mhlib-first").value||"1")), b=Math.min(pdfDoc.numPages,parseInt($("mhlib-last").value||a));
      if(a>b) throw new Error("invalid page range");
      const target=$("mhlib-lang").value, pages=$("mhlib-pages"); pages.innerHTML="";
      for(let n=a;n<=b;n++){
        $("mhlib-progress").textContent=`Translating page ${n} of ${b}…`;
        const page=await pdfDoc.getPage(n), content=await page.getTextContent();
        const text=content.items.map(x=>x.str).join(" ").trim();
        const translated=text ? await translate(text,target) : "[No selectable text on this page]";
        const d=document.createElement("section"); d.className="page";
        d.innerHTML=`<h3>Page ${n}</h3><div></div>`; d.querySelector("div").textContent=translated; pages.appendChild(d);
      }
      $("mhlib-progress").textContent=`Pages ${a}–${b} translated ✓`;
      $("mhlib-result").style.display="block";
    }catch(err){$("mhlib-progress").textContent="Translation error: "+err.message}
  };
})();
