const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,'web',name),'utf8');
const copy=x=>JSON.parse(JSON.stringify(x));
const raw=JSON.parse(read('presets.json')), example=JSON.parse(read('presets.ejemplo.json'));
const ctx=vm.createContext({});vm.runInContext(read('catalog-reader.js'),ctx);
const parse=ctx.PresetCatalog.parse;
const presets=parse(raw),baseCount=presets.length;assert.ok(baseCount>=15);assert.equal(new Set(presets.map(p=>p.artist)).size,raw.bandas.length);
const old=vm.createContext({});vm.runInContext(read('catalog-v2.js'),old);assert.deepEqual(copy(presets.filter(p=>old.toneAtlasCatalogV2.some(x=>x.id===p.id))),copy(old.toneAtlasCatalogV2));
assert.equal(parse(example).length,1);assert.throws(()=>parse('{broken'),/JSON no válido/);
function invalid(change,message){const data=copy(raw);change(data);assert.throws(()=>parse(data),message);}
invalid(d=>d.bandas[0].canciones.push(d.bandas[0].canciones[0]),/duplicados/);
invalid(d=>d.bandas[0].canciones[0].bloques.push(d.bandas[0].canciones[0].bloques[0]),/repetido/);
invalid(d=>d.bandas[0].canciones[0].bloques.find(b=>b.bloque==='AMP').solo='OFF',/AMP y CAB/);
invalid(d=>d.bandas[0].canciones[0].bloques.forEach(b=>b.solo=b.base),/al menos un bloque/);
invalid(d=>d.bandas[0].canciones[0].bloques[0].base=true,/ON.*OFF/);
ctx.toneAtlasCatalogV2=presets;vm.runInContext(read('library.js'),ctx);const L=ctx.ToneLibrary;
const initial=L.migrate([]);initial.presets[0].favorite=true;presets[0].notes='Cambio publicado';
const updated=L.parse(JSON.stringify(initial));assert.equal(updated.presets[0].notes,'Cambio publicado');assert.equal(updated.presets[0].favorite,true);
updated.presets[0].notes='Ajuste personal';presets[0].notes='Otro cambio publicado';
const personalized=L.parse(JSON.stringify(updated));assert.equal(personalized.presets[0].notes,'Ajuste personal');
presets.push(...parse(example));assert.equal(L.parse(JSON.stringify(personalized)).presets.length,baseCount+1);

function browser({data=raw,ok=true,status=200,stored={}}={}){
  const nodes=new Map(),storage=new Map(Object.entries(stored)),calls=[];
  const element=()=>({value:'',innerHTML:'',textContent:'',style:{},disabled:false,append(){},prepend(){},setAttribute(){},querySelectorAll(){return []}});
  const node=selector=>{if(!nodes.has(selector))nodes.set(selector,element());return nodes.get(selector);};
  let context;
  const body={append(script){try{vm.runInContext(read(script.src),context);script.onload();}catch(e){script.onerror(e);}}};
  context=vm.createContext({document:{querySelector:node,querySelectorAll(){return []},body,createElement:element},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},fetch:async(url,options)=>{calls.push({url,options});return {ok,status,text:async()=>JSON.stringify(data)};},AbortController,setTimeout(){return 1},clearTimeout(){},confirm(){return true},location:{reload(){}},console});
  vm.runInContext(read('catalog-reader.js'),context);
  return {context,nodes,storage,calls,node,start:()=>vm.runInContext(read('boot.js'),context)};
}
(async()=>{
  const b=browser();await b.start();assert.equal(b.calls[0].url,'./presets.json');assert.equal(b.calls[0].options.cache,'no-store');assert.ok(b.storage.has('tone-atlas-v2'));assert.ok(b.node('#count').textContent.includes(String(baseCount)));
  vm.runInContext("library.presets[0].notes='No sobrescribir';save()",b.context);
  await b.node('#file').onchange({target:{files:[{size:1000,text:async()=>JSON.stringify(example)}],value:'file'}});
  let saved=JSON.parse(b.storage.get('tone-atlas-v2'));assert.equal(saved.presets.length,baseCount+1);assert.equal(saved.presets[0].notes,'No sobrescribir');
  for(const p of saved.presets){vm.runInContext(`selected=${JSON.stringify(p.id)};render()`,b.context);assert.ok(b.node('#detail').innerHTML.includes('ASIGNA A CTRL SOLO ESTOS BLOQUES'));}
  const broken=browser({data:{version:1,bandas:[{artista:'Error',canciones:[{}]}]},stored:{'tone-atlas-v2':'keep'}});await broken.start();assert.ok(broken.node('#catalogError').textContent.includes('id'));assert.equal(broken.storage.get('tone-atlas-v2'),'keep');
  const missing=browser({ok:false,status:404});await missing.start();assert.ok(missing.node('#catalogError').textContent.includes('404'));assert.equal(missing.storage.size,0);
  const html=read('index.html');assert.ok(html.includes('boot.js'));assert.ok(!html.includes('src="catalog-v2.js"'));
  console.log('PASS: catálogo JSON equivalente; ejemplo; errores de formato, duplicados y CTRL; actualización de catálogo; ajustes personales; arranque fetch sin caché; importación JSON sin alterar otras canciones; render; fallos HTTP/JSON conservan almacenamiento.');
})().catch(error=>{console.error(error);process.exitCode=1;});
