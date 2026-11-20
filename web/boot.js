(async () => {
  const detail=document.querySelector('#detail');
  detail.innerHTML='<p class="empty" role="status">Cargando presets.json…</p>';
  document.querySelectorAll('button,input,select').forEach(el=>el.disabled=true);
  const loadScript=src=>new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=src;script.onload=resolve;script.onerror=()=>reject(Error('No se pudo cargar '+src));document.body.append(script);});
  try {
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15000);
    let response;
    try{response=await fetch('./presets.json',{cache:'no-store',signal:controller.signal});}finally{clearTimeout(timer);}
    if(!response.ok)throw Error('No se pudo leer presets.json (HTTP '+response.status+').');
    globalThis.toneAtlasCatalogV2=PresetCatalog.parse(await response.text());
    await loadScript('library.js');await loadScript('app-v2.js');
    document.querySelectorAll('button,input,select').forEach(el=>el.disabled=false);
  } catch(error) {
    detail.innerHTML='<div class="empty"><h2>No se pudo cargar el catálogo</h2><p id="catalogError" role="alert"></p><p>Corrige presets.json y recarga. Tu biblioteca guardada no se ha sobrescrito.</p><button id="retryCatalog">Reintentar</button> <a href="guia-presets.html">Ver instrucciones</a></div>';
    document.querySelector('#catalogError').textContent=error.name==='AbortError'?'La lectura del catálogo ha tardado demasiado.':error.message;
    document.querySelector('#retryCatalog').onclick=()=>location.reload();
  }
})();
