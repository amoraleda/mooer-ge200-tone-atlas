const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
try {
  const context=vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'web/catalog-reader.js'),'utf8'),context);
  const file=process.argv[2]||path.join(__dirname,'web/presets.json');
  const presets=context.PresetCatalog.parse(fs.readFileSync(file,'utf8'));
  console.log(`OK: ${presets.length} canciones de ${new Set(presets.map(p=>p.artist)).size} bandas. Estados CTRL válidos.`);
}catch(error){console.error(error.message);process.exitCode=1;}
