(() => {
  const names = ['FX/COMP','DS/OD','AMP','CAB','NS','EQ','MOD','DELAY','REVERB'];
  const text = value => typeof value === 'string' && value.length < 16000;
  const legacyValid = p => p && ['id','artist','song','mood','pickup','chain','settings','notes'].every(k=>text(p[k]));
  function valid(p) {
    return p && ['id','artist','song','mood','pickup','notes'].every(k=>text(p[k])) && p.artist.trim() && p.song.trim()
      && Array.isArray(p.blocks) && p.blocks.length > 0 && p.blocks.length <= 9
      && p.blocks.every(b=>b && names.includes(b.block) && text(b.model) && text(b.settings) && typeof b.base==='boolean' && typeof b.solo==='boolean')
      && new Set(p.blocks.map(b=>b.block)).size===p.blocks.length
      && ['AMP','CAB'].every(n=>p.blocks.some(b=>b.block===n && b.base && b.solo))
      && p.blocks.some(b=>b.base!==b.solo)
      && (!p.history || Array.isArray(p.history) && p.history.every(legacyValid));
  }
  const clone = p => JSON.parse(JSON.stringify(p));
  const identity = p => p.artist.trim().toLocaleLowerCase('es')+'|'+p.song.trim().toLocaleLowerCase('es');
  const catalog = globalThis.toneAtlasCatalogV2;
  const signature = p => JSON.stringify({id:p.id,artist:p.artist,song:p.song,pickup:p.pickup,notes:p.notes,blocks:p.blocks});
  function reconcile(result) {
    result.presets=result.presets.filter(p=>!(catalog.removedIds||[]).includes(p.id));
    result.pending=result.pending.filter(p=>!(catalog.removedIds||[]).includes(p.id));
    const previous=result.catalogSnapshots||{}, snapshots={};
    for(const p of catalog){
      const index=result.presets.findIndex(x=>x.id===p.id||identity(x)===identity(p));
      if(index<0)result.presets.push(clone(p));
      else {
        const saved=result.presets[index];
        if(typeof previous[p.id]==='string'&&signature(saved)===previous[p.id]){
          result.presets[index]={...clone(p),favorite:!!saved.favorite,...(saved.history?{history:saved.history}:{})};
        }
      }
      snapshots[p.id]=signature(p);
    }
    result.catalogSnapshots=snapshots;
    return result;
  }
  function target(p) {return catalog.find(c=>c.id===p.id || c.aliases.includes(p.id) || identity(c)===identity(p));}
  function migrate(data) {
    const presets = catalog.map(clone), pending = [];
    for(const p of data) {
      const c = target(p);
      if(c) {
        const dest=presets.find(x=>x.id===c.id);
        dest.favorite=!!(dest.favorite || p.favorite);
        (dest.history ||= []).push(clone(p));
      } else pending.push(clone(p));
    }
    return reconcile({version:2,presets,pending});
  }
  function parse(raw) {
    const data=typeof raw==='string'?JSON.parse(raw):raw;
    if(Array.isArray(data) && data.length<=1000 && data.every(legacyValid))return migrate(data);
    if(!data || data.version!==2 || !Array.isArray(data.presets) || data.presets.length>1000 || !data.presets.every(valid)
       || !Array.isArray(data.pending) || data.pending.length>1000 || !data.pending.every(legacyValid))throw Error('Formato inválido');
    if(new Set(data.presets.map(p=>p.id)).size!==data.presets.length || new Set(data.presets.map(identity)).size!==data.presets.length)throw Error('Canciones duplicadas');
    const result=clone(data);
    return reconcile(result);
  }
  function controls(p){return p.blocks.filter(b=>b.base!==b.solo).map(b=>b.block);}
  globalThis.ToneLibrary={names,valid,legacyValid,identity,migrate,parse,controls,clone,signature};
})();
