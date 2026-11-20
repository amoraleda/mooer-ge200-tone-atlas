(() => {
  const blocks=['FX/COMP','DS/OD','AMP','CAB','NS','EQ','MOD','DELAY','REVERB'];
  const required=(value,path)=>{if(typeof value!=='string'||!value.trim()||value.length>16000)throw Error(`${path}: escribe un texto no vacío de hasta 16000 caracteres.`);return value.trim();};
  function parse(data){
    if(typeof data==='string'){try{data=JSON.parse(data);}catch{throw Error('JSON no válido: revisa comillas dobles, comas y llaves.');}}
    if(!data||data.version!==1||!Array.isArray(data.bandas)||data.bandas.length>200)throw Error('Usa {"version": 1, "bandas": [...]} (máximo 200 bandas).');
    const removed=data.eliminadas??[];
    if(!Array.isArray(removed)||!removed.every(id=>typeof id==='string'&&/^[a-z0-9][a-z0-9-]*$/.test(id)))throw Error('eliminadas debe ser una lista de IDs de canciones.');
    const result=[],ids=new Set(),songs=new Set();
    data.bandas.forEach((band,bi)=>{
      const path=`bandas[${bi}]`,artist=required(band?.artista,path+'.artista');
      if(!Array.isArray(band.canciones)||band.canciones.length>1000)throw Error(path+'.canciones debe ser una lista (máximo 1000 canciones).');
      band.canciones.forEach((s,si)=>{
        const sp=`${path}.canciones[${si}]`,id=required(s?.id,sp+'.id'),song=required(s?.titulo,sp+'.titulo');
        if(!/^[a-z0-9][a-z0-9-]*$/.test(id))throw Error(sp+'.id: usa letras minúsculas sin acentos, números y guiones.');
        const identity=artist.toLocaleLowerCase('es')+'|'+song.toLocaleLowerCase('es');
        if(removed.includes(id))throw Error(sp+': el ID también aparece en eliminadas.');
        if(ids.has(id)||songs.has(identity))throw Error(sp+': ID o canción duplicados. Una ficha por canción.');
        ids.add(id);songs.add(identity);
        if(!Array.isArray(s.bloques)||s.bloques.length<1||s.bloques.length>9)throw Error(sp+'.bloques: incluye de 1 a 9 bloques.');
        const seen=new Set();
        const parsed=s.bloques.map((b,index)=>{
          const bp=`${sp}.bloques[${index}]`;
          if(!b||!blocks.includes(b.bloque)||seen.has(b.bloque))throw Error(bp+': bloque desconocido o repetido.');
          seen.add(b.bloque);
          if(!['ON','OFF'].includes(b.base)||!['ON','OFF'].includes(b.solo))throw Error(bp+': base y solo deben ser "ON" u "OFF".');
          return {block:b.bloque,model:required(b.modelo,bp+'.modelo'),settings:required(b.ajustes,bp+'.ajustes'),base:b.base==='ON',solo:b.solo==='ON'};
        });
        if(!['AMP','CAB'].every(n=>parsed.some(b=>b.block===n&&b.base&&b.solo)))throw Error(sp+': AMP y CAB deben estar ON en base y solo.');
        if(!parsed.some(b=>b.base!==b.solo))throw Error(sp+': cambia al menos un bloque entre base y solo para asignarlo a CTRL.');
        const aliases=s.idsAnteriores??[];
        if(!Array.isArray(aliases)||!aliases.every(a=>typeof a==='string'&&a.length<200))throw Error(sp+'.idsAnteriores debe ser una lista de textos.');
        if(s.notas!==undefined&&(typeof s.notas!=='string'||s.notas.length>16000))throw Error(sp+'.notas debe ser un texto de hasta 16000 caracteres.');
        result.push({id,artist,song,pickup:required(s.pastilla,sp+'.pastilla'),mood:'1 preset · base / solo · CTRL',notes:s.notas||'',blocks:parsed,aliases});
      });
    });
    if(result.length>1000)throw Error('El catálogo supera las 1000 canciones.');
    Object.defineProperty(result,'removedIds',{value:removed});
    return result;
  }
  globalThis.PresetCatalog={parse};
})();
