const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {execFile}=require('node:child_process');
const {randomUUID}=require('node:crypto');
const root=path.join(__dirname,'web');
const port=Number(process.env.TONE_ATLAS_PORT||5178);
const development=process.argv.includes('--dev');
const revision=randomUUID();
const liveReload=development?`<script>
(() => {
  const revision = ${JSON.stringify(revision)};
  let checking = false;
  const timer = setInterval(async () => {
    if (checking) return;
    checking = true;
    try {
      const response = await fetch('/__dev/version', {cache: 'no-store', signal: AbortSignal.timeout(2000)});
      if (response.ok && (await response.text()) !== revision) {
        clearInterval(timer);
        location.reload();
      }
    } catch {} finally { checking = false; }
  }, 700);
})();
</script>`:'';
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.txt':'text/plain; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon'};
const server=http.createServer(async(req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});return res.end();}
  if(development&&req.url==='/__dev/version'){
    res.writeHead(200,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'});
    return res.end(req.method==='HEAD'?undefined:revision);
  }
  let file;
  try{
    const requested=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    file=path.resolve(root,'.'+(requested==='/'?'/index.html':requested));
    const relative=path.relative(root,file);
    if(relative.startsWith('..')||path.isAbsolute(relative)){res.writeHead(403);return res.end('Acceso denegado');}
  }catch{res.writeHead(400);return res.end('URL no valida');}
  try{
    const stat=await fs.promises.stat(file);
    if(!stat.isFile()){res.writeHead(404);return res.end('No encontrado');}
    let content=await fs.promises.readFile(file);
    if(development&&path.extname(file)==='.html'){
      const html=content.toString('utf8');
      content=Buffer.from(html.includes('</body>')?html.replace('</body>',liveReload+'</body>'):html+liveReload);
    }
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','Content-Length':content.length});
    res.end(req.method==='HEAD'?undefined:content);
  }catch{res.writeHead(404);res.end('No encontrado');}
});
server.on('error',error=>{
  if(error.code==='EADDRINUSE')console.error(`El puerto ${port} ya esta ocupado. Si Tone Atlas esta abierto, visita http://127.0.0.1:${port}. Cierra el servidor anterior antes de iniciar otro.`);
  else console.error('No se pudo iniciar Tone Atlas:',error.message);
  process.exitCode=1;
});
server.listen(port,'127.0.0.1',()=>{
  const url=`http://127.0.0.1:${port}`;
  console.log(`\nTone Atlas esta listo: ${url}\n${development?'Modo desarrollo: recarga automatica al guardar archivos. Abre la direccion anterior en tu navegador.':'Edita web/presets.json y recarga la pagina.'}\nManten esta ventana abierta. Ctrl+C para detener.\n`);
  if(!development&&process.platform==='win32'&&process.env.TONE_ATLAS_NO_OPEN!=='1'){
    execFile('rundll32.exe',['url.dll,FileProtocolHandler',url],{windowsHide:true},error=>{if(error)console.log('Abre la direccion anterior en tu navegador.');});
  }
});
process.on('SIGINT',()=>server.close(()=>process.exit(0)));
