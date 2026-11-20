const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const net=require('node:net');
const vm=require('node:vm');
const {spawn,execFile}=require('node:child_process');
const {once}=require('node:events');
const {randomUUID}=require('node:crypto');
const root=path.join(__dirname,'..');
const work=path.resolve(root,'work');
const fixture=path.join(work,'live-reload-'+randomUUID());
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(check){
  const deadline=Date.now()+12000;let last;
  while(Date.now()<deadline){try{const value=await check();if(value)return value;}catch(error){last=error;}await sleep(100);}
  throw Error('Tiempo agotado: '+(last?.message||'no se recibió el cambio'));
}
async function freePort(){const s=net.createServer();s.listen(0,'127.0.0.1');await once(s,'listening');const port=s.address().port;await new Promise(resolve=>s.close(resolve));return port;}
async function stop(child){
  if(!child||child.exitCode!==null)return;
  if(process.platform==='win32')await new Promise(resolve=>execFile('taskkill.exe',['/PID',String(child.pid),'/T','/F'],{windowsHide:true},()=>resolve()));
  else {try{process.kill(-child.pid,'SIGTERM');}catch{child.kill();}}
  await until(()=>child.exitCode!==null||child.signalCode!==null);
}
(async()=>{
  let child;let output='';
  try{
    fs.mkdirSync(path.join(fixture,'web'),{recursive:true});
    fs.copyFileSync(path.join(root,'server.cjs'),path.join(fixture,'server.cjs'));
    fs.writeFileSync(path.join(fixture,'web/index.html'),'<!doctype html><body>Test</body>');
    fs.writeFileSync(path.join(fixture,'web/presets.json'),'{}');
    fs.writeFileSync(path.join(fixture,'web/style.css'),'body{}');
    const port=await freePort(),url=`http://127.0.0.1:${port}`;
    const env={...process.env,TONE_ATLAS_PORT:String(port),TONE_ATLAS_NO_OPEN:'1'};
    const args=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).scripts.dev.split(' ').slice(1);
    child=spawn(process.execPath,args,{cwd:fixture,env,windowsHide:true,detached:process.platform!=='win32'});
    child.stdout.on('data',chunk=>output+=chunk);child.stderr.on('data',chunk=>output+=chunk);
    const revision=()=>fetch(url+'/__dev/version',{signal:AbortSignal.timeout(1000)}).then(async r=>r.ok?r.text():null);
    let previous;
    const {response,html}=await until(async()=>{
      previous=await revision();if(!previous)return null;
      const response=await fetch(url,{signal:AbortSignal.timeout(1000)}),html=await response.text();
      return response.ok&&html.includes(previous)?{response,html}:null;
    });
    assert.ok(html.includes('location.reload()'));assert.ok(html.includes(previous));
    assert.equal(Number(response.headers.get('content-length')),Buffer.byteLength(html));
    const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
    let tick,reloads=0,next=previous;
    vm.runInNewContext(script,{setInterval:fn=>{tick=fn;return 1;},clearInterval(){},fetch:async()=>({ok:true,text:async()=>next}),AbortSignal,location:{reload(){reloads++;}}});
    await tick();assert.equal(reloads,0);next='changed';await tick();assert.equal(reloads,1);
    for(const [file,text] of [['web/presets.json','{"updated":true}'],['web/style.css','body{color:red}'],['server.cjs',fs.readFileSync(path.join(fixture,'server.cjs'),'utf8')+'\n// test restart\n']]){
      fs.writeFileSync(path.join(fixture,file),text);
      previous=await until(async()=>{const current=await revision();return current&&current!==previous?current:null;});
    }
    assert.deepEqual(await (await fetch(url+'/presets.json')).json(),{updated:true});
    await stop(child);child=null;
    child=spawn(process.execPath,['server.cjs'],{cwd:fixture,env,windowsHide:true,detached:process.platform!=='win32'});
    child.stdout.on('data',chunk=>output+=chunk);child.stderr.on('data',chunk=>output+=chunk);
    const normal=await until(async()=>{const r=await fetch(url,{signal:AbortSignal.timeout(1000)});return r.ok?r.text():null;});
    assert.ok(!normal.includes('location.reload()'));assert.equal((await fetch(url+'/__dev/version')).status,404);
    console.log('PASS: npm dev detecta JSON, CSS y servidor; revisión cambia tras reinicio; cliente recarga; npm start no inyecta recarga.');
  }catch(error){console.error(output);throw error;}
  finally{
    await stop(child);
    const resolved=path.resolve(fixture);
    if(resolved.startsWith(work+path.sep)&&path.basename(resolved).startsWith('live-reload-'))fs.rmSync(resolved,{recursive:true,force:true});
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
