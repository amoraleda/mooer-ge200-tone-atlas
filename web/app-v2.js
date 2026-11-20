const $ = s => document.querySelector(s);
const L = globalThis.ToneLibrary, storageKey = 'tone-atlas-v2';
const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let library, storageProblem=false;
try {
  const current=localStorage.getItem(storageKey);
  library=L.parse(current || localStorage.getItem('tone-atlas-v1') || '[]');
} catch {
  library=L.migrate([]);storageProblem=true;
}
let selected=library.presets[0]?.id, favOnly=false, editing=null, adapting=null, previewState='base';
function toast(message){$('#toast').textContent=message;$('#toast').style.display='block';clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').style.display='none',3500);}
function save(){try{localStorage.setItem(storageKey,JSON.stringify(library));storageProblem=false;return true;}catch{toast('No se pudo guardar. Exporta la biblioteca para conservar tus cambios.');return false;}}
function download(data,name){const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function resetFilters(){favOnly=false;$('#search').value='';$('#artist').value='';$('#favorites').setAttribute('aria-pressed','false');$('#favorites').textContent='♡ Favoritos';}
function artists(){const previous=$('#artist').value;$('#artist').innerHTML='<option value="">Todos los artistas</option>'+[...new Set(library.presets.map(p=>p.artist))].sort().map(a=>`<option value="${esc(a)}">${esc(a)}</option>`).join('');$('#artist').value=previous;}
function historyView(p){if(!p.history?.length)return '';return `<details class="history"><summary>Ajustes anteriores conservados (${p.history.length})</summary><p class="muted">Referencia de la biblioteca anterior. No se aplica a los estados CTRL nuevos; puedes consultar y copiar tus ajustes personales.</p>${p.history.map(h=>`<section><h3>${esc(h.song)}</h3><pre>${esc(h.settings)}\n\n${esc(h.notes)}</pre></section>`).join('')}</details>`;}
function render(){
  const q=$('#search').value.toLocaleLowerCase('es');
  const visible=library.presets.filter(p=>(p.artist+' '+p.song).toLocaleLowerCase('es').includes(q)&&(!$('#artist').value||p.artist===$('#artist').value)&&(!favOnly||p.favorite));
  if(!visible.some(p=>p.id===selected))selected=visible[0]?.id;
  $('#count').textContent=`/ ${library.presets.length.toString().padStart(2,'0')} canciones`;
  $('#list').innerHTML=visible.map(p=>`<button class="song ${p.id===selected?'active':''}" data-id="${esc(p.id)}" aria-pressed="${p.id===selected}"><small>${esc(p.artist)}</small><strong>${esc(p.song)}</strong><span>Base / solo · CTRL</span><span class="arrow">${p.favorite?'♥':'↗'}</span></button>`).join('')||'<p class="empty">No hay coincidencias. Prueba otra búsqueda.</p>';
  $('#list').querySelectorAll('button').forEach(b=>b.onclick=()=>{selected=b.dataset.id;previewState='base';render();});
  $('#legacyCount').textContent=library.pending.length?` · ${library.pending.length} personales pendientes de adaptar`:'';
  $('#pending').innerHTML=library.pending.length?`<details class="history"><summary>Presets personales anteriores (${library.pending.length})</summary><p class="muted">Conservados completos. Adáptalos al formato base/solo antes de incorporarlos a la colección.</p>${library.pending.map((p,index)=>`<button data-pending="${index}">${esc(p.artist)} · ${esc(p.song)} — adaptar</button>`).join('')}</details>`:'';
  $('#pending').querySelectorAll('button').forEach(b=>b.onclick=()=>openEditor(null,Number(b.dataset.pending)));
  const p=library.presets.find(p=>p.id===selected);
  if(!p){$('#detail').innerHTML='<div class="empty">Elige una canción o crea un preset.</div>';return;}
  const assigned=L.controls(p), rows=L.names.map(name=>p.blocks.find(b=>b.block===name)||{block:name,model:'Sin usar',base:false,solo:false,settings:'Apagado en ambos estados'});
  const catalogPreset=globalThis.toneAtlasCatalogV2.find(x=>x.id===p.id||L.identity(x)===L.identity(p));
  $('#detail').innerHTML=`<div class="detailhead"><div class="eyebrow">${esc(p.artist)}</div><h2>${esc(p.song)}</h2><span class="tag">1 PRESET · 2 SONIDOS · CTRL</span><p>Base y solo con el mismo ampli y pantalla</p><div class="actions"><button id="fav">${p.favorite?'♥ Guardado':'♡ Favorito'}</button><button id="edit">Editar ajustes</button><button id="print">Imprimir</button></div></div>
    <div class="detailbody"><div class="subhead">01 / PREPARA TU GUITARRA</div><p>${esc(p.pickup)} <span class="muted"> · Misma pastilla en los dos estados · Auriculares</span></p>
    <div class="subhead">02 / ORDENA LA CADENA</div><div class="chain">${p.blocks.map(b=>esc(b.model)).join(' → ')}</div>
    <div class="ctrl-callout"><div class="eyebrow">ASIGNA A CTRL SOLO ESTOS BLOQUES</div><strong>${assigned.map(esc).join(' + ')}</strong><p>AMP y CAB siempre encendidos. Los demás bloques mantienen el estado indicado.</p></div>
    <div class="subhead">03 / BASE Y SOLO</div><div class="state-switch" role="group" aria-label="Consultar estado"><button id="baseState" aria-pressed="${previewState==='base'}">A · Base</button><span>← CTRL →</span><button id="soloState" aria-pressed="${previewState==='solo'}">B · Solo / fuerte</button></div><p class="muted">Vista de consulta, sin audio: los botones resaltan el estado elegido; no controlan la pedalera.</p>
    <div class="table-scroll"><table class="states"><thead><tr><th scope="col">Bloque / modelo</th><th scope="col" class="${previewState==='base'?'chosen':''}">Base</th><th scope="col" class="${previewState==='solo'?'chosen':''}">Solo</th><th scope="col">Asignar CTRL</th></tr></thead><tbody>${rows.map(b=>`<tr><th scope="row">${esc(b.block)}<small>${esc(b.model)}</small></th><td class="${previewState==='base'?'chosen':''}"><span class="status ${b.base?'on':'off'}">${b.base?'ON':'OFF'}</span></td><td class="${previewState==='solo'?'chosen':''}"><span class="status ${b.solo?'on':'off'}">${b.solo?'ON':'OFF'}</span></td><td>${b.base!==b.solo?'<b class="assign">✓ Sí</b>':'—'}</td></tr>`).join('')}</tbody></table></div>
    <div class="subhead">04 / AJUSTES FIJOS DEL PRESET</div><p class="muted">Configura cada bloque una sola vez, aunque empiece apagado. CTRL cambia ON/OFF, nunca el modelo ni sus valores.</p>${p.blocks.map(b=>`<div class="block"><b>${esc(b.block)} · ${esc(b.model)}</b><span>${esc(b.settings)}</span></div>`).join('')}
    <div class="subhead">05 / PROGRAMA CTRL EN LA GE200</div><ol class="instructions"><li>En CHAIN, deja los bloques como indica la columna <strong>Base</strong>, incluidos los asignados que empiezan encendidos.</li><li>Pulsa el botón de panel <strong>CTRL/TAP</strong>, selecciona <strong>CTRL</strong> y marca únicamente <strong>${assigned.map(esc).join(' + ')}</strong>. Desmarca las otras asignaciones.</li><li>Usa el footswitch en modo CTRL (luz fija). Si está en TAP (parpadea), mantenlo pulsado aproximadamente un segundo para cambiar de modo.</li><li>Pulsa una vez: los bloques asignados invierten su estado y obtienes <strong>Solo</strong>. Pulsa otra vez para volver a <strong>Base</strong>.</li><li>Vuelve a Base, pulsa <strong>SAVE</strong>, elige ubicación y nombre y confirma con <strong>SAVE</strong>. Comprueba el estado al volver a cargarlo.</li></ol>
    <p class="muted">Si utilizas FS MODE 2, CTRL también confirma cambios de preset; vuelve a PLAY con el preset ya cargado para alternar efectos. Estas dos combinaciones no son escenas independientes.</p>
    <div class="subhead">06 / ESCUCHA Y AJUSTA</div><div class="note">${esc(p.notes)}</div><p class="muted">Ajustes orientativos, sin validación con audio. Valores 0–100 salvo unidades indicadas. Empieza con MASTER bajo. Ajusta el nivel del pedal de solo para equilibrar los dos sonidos; cambiar MST del AMP afectará a ambos.</p>${historyView(p)}</div>`;
  if(catalogPreset){
    const reset=document.createElement('button');reset.textContent='Usar ajustes del JSON';reset.onclick=()=>{
      if(!confirm('Se sustituirán los ajustes de esta canción por los de presets.json. Se conservarán favorito e historial. ¿Continuar?'))return;
      const index=library.presets.findIndex(x=>x.id===p.id);
      library.presets[index]={...L.clone(catalogPreset),favorite:!!p.favorite,...(p.history?{history:p.history}:{})};
      selected=catalogPreset.id;previewState='base';save();render();toast('Ajustes del JSON aplicados');
    };$('#detail .actions').append(reset);
    const info=document.createElement('p');info.className='muted';info.textContent=L.signature(p)===L.signature(catalogPreset)?'Fuente: presets.json. Los cambios publicados se cargarán al recargar.':'Tienes ajustes locales para esta canción. Para aplicar el archivo publicado, pulsa «Usar ajustes del JSON».';
    $('#detail .detailbody').prepend(info);
  }
  $('#fav').onclick=()=>{p.favorite=!p.favorite;save();render();};$('#edit').onclick=()=>openEditor(p);$('#print').onclick=()=>window.print();
  $('#baseState').onclick=()=>{previewState='base';render();};$('#soloState').onclick=()=>{previewState='solo';render();};
}
const fields=['artist','song','pickup','notes'];
const defaultBlocks=[{block:'DS/OD',model:'TUBE DR',settings:'Gain 20 · Level: ajustar de oído',base:false,solo:true},{block:'AMP',model:'65 US TW',settings:'Gain 18 · Bass 30 · Mid 55 · Treble 55 · Presence 30',base:true,solo:true},{block:'CAB',model:'US TWN 212',settings:'ON con auriculares',base:true,solo:true},{block:'REVERB',model:'ROOM',settings:'Mezcla 10 · Duración corta',base:true,solo:true}];
function openEditor(p,index=null){
  editing=p?.id||null;adapting=index;$('#form').reset();$('#formError').textContent='';$('#editTitle').textContent=editing?'Editar base / solo':index!==null?'Adaptar preset anterior':'Nueva canción';
  const previous=index!==null?library.pending[index]:null;
  fields.forEach(k=>$('#form').elements[k].value=p?.[k]||previous?.[k]||(k==='pickup'?'Mástil · humbucker':''));
  $('#form').elements.blocks.value=(p?.blocks||defaultBlocks).map(b=>`${b.block} | ${b.model} | ${b.base?'ON':'OFF'} | ${b.solo?'ON':'OFF'} | ${b.settings}`).join('\n');
  $('#previousSettings').textContent=previous?`Ajustes anteriores para adaptar manualmente (la plantilla de bloques es solo un inicio):\n${previous.chain}\n${previous.settings}`:'';
  $('#editor').showModal();
}
function parseBlocks(value){return value.split('\n').filter(line=>line.trim()).map(line=>{const parts=line.split('|').map(x=>x.trim());if(parts.length!==5 || !['ON','OFF'].includes(parts[2]) || !['ON','OFF'].includes(parts[3]))throw Error('Cada línea debe tener: BLOQUE | MODELO | ON/OFF base | ON/OFF solo | AJUSTES');return {block:parts[0],model:parts[1],base:parts[2]==='ON',solo:parts[3]==='ON',settings:parts[4]};});}
$('#add').onclick=()=>openEditor(null);$('#close').onclick=()=>$('#editor').close();
$('#form').onsubmit=e=>{
  e.preventDefault();try{
    const values=Object.fromEntries(new FormData(e.target));const p={id:editing||crypto.randomUUID(),mood:'1 preset · base / solo · CTRL',aliases:[],...Object.fromEntries(fields.map(k=>[k,values[k].trim()])),blocks:parseBlocks(values.blocks)};
    if(!L.valid(p))throw Error('Incluye AMP y CAB siempre ON, un máximo de un modelo por bloque y al menos un bloque que cambie entre base y solo. Usa los nombres de bloque indicados.');
    if(library.presets.some(x=>x.id!==editing && L.identity(x)===L.identity(p)))throw Error('Esta canción ya existe. Edita su ficha para conservar un solo preset por canción.');
    if(editing){const index=library.presets.findIndex(x=>x.id===editing);library.presets[index]={...library.presets[index],...p};}
    else {if(adapting!==null){p.history=[library.pending[adapting]];p.favorite=!!library.pending[adapting].favorite;library.pending.splice(adapting,1);}library.presets.push(p);}
    selected=p.id;previewState='base';resetFilters();artists();render();const persisted=save();$('#editor').close();if(persisted)toast('Canción guardada con base y solo');
  }catch(error){$('#formError').textContent=error.message;}
};
$('#search').oninput=render;$('#artist').onchange=()=>{previewState='base';render();};
$('#favorites').onclick=()=>{favOnly=!favOnly;$('#favorites').setAttribute('aria-pressed',String(favOnly));$('#favorites').textContent=favOnly?'♥ Favoritos':'♡ Favoritos';render();};
$('#export').onclick=()=>download(library,'tone-atlas-ge200-ctrl.json');
$('#backup').onclick=()=>{const data=[...library.presets.flatMap(p=>p.history||[]),...library.pending];download(data,'tone-atlas-ajustes-anteriores.json');toast(data.length?'Historial exportado':'Todavía no hay ajustes anteriores');};
$('#import').onclick=()=>$('#file').click();
$('#file').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{
  if(file.size>2000000)throw Error('El archivo supera 2 MB.');
  const raw=JSON.parse(await file.text());
  const simple=raw?.version===1&&Array.isArray(raw.bandas);
  const incoming=simple?{presets:PresetCatalog.parse(raw),pending:[]}:L.parse(raw);
  if(!confirm('Se actualizarán las canciones coincidentes con el archivo importado. Exporta antes si quieres conservar la versión actual. ¿Importar?'))return;
  for(const p of incoming.presets){const index=library.presets.findIndex(x=>x.id===p.id||L.identity(x)===L.identity(p));if(index>=0)library.presets[index]=p;else library.presets.push(p);}
  const pendingIds=new Set(library.pending.map(p=>p.id));for(const p of incoming.pending)if(!pendingIds.has(p.id)){library.pending.push(p);pendingIds.add(p.id);}
  resetFilters();artists();render();if(save())toast('Biblioteca importada');
}catch(error){toast('No se pudo importar: '+error.message);}finally{e.target.value='';}};
artists();render();
if(storageProblem)toast('No se pudo leer la biblioteca guardada. Se muestra el catálogo; no se ha sobrescrito el almacenamiento.');
else save();
