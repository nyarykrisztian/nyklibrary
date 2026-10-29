import {NextRequest,NextResponse} from 'next/server';
import {db,books,saveBook,jobs,dataDir} from '../../../lib/db';
import {fields,cleanBook} from '../../../lib/model';
import {recognize} from '../../../lib/recognition';
import {exportWorkbook,importRows} from '../../../lib/exchange';
import {randomUUID} from 'node:crypto';
import {readFile,writeFile,mkdir,mkdtemp,rm,cp} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
export const runtime='nodejs';export const dynamic='force-dynamic';
const exec=promisify(execFile);
const json=(v:unknown,status=200)=>NextResponse.json(v,{status});
function safe(req:NextRequest){
 const site=req.headers.get('sec-fetch-site');const origin=req.headers.get('origin');
 if(site==='cross-site'||(origin&&new URL(origin).host!==req.headers.get('host')))throw new Error('Idegen weboldalról érkező kérés elutasítva.');
}
async function upload(req:NextRequest,limit:number){const length=Number(req.headers.get('content-length')||0);if(length>limit)throw new Error('A fájl túl nagy.');const form=await req.formData();const f=form.get('file');if(!(f instanceof File)||!f.size||f.size>limit)throw new Error('Hiányzó vagy túl nagy fájl.');return f;}
async function handle(req:NextRequest,context:{params:Promise<{path:string[]}>}){
 try{
 const parts=(await context.params).path;const [area,id]=parts;const method=req.method;
 if(method!=='GET')safe(req);
 if(area==='books'){
  if(method==='GET')return json(books());
  if(method==='POST')return json(saveBook(await req.json()),201);
  if(method==='PUT'&&id)return json(saveBook(await req.json(),id));
  if(method==='DELETE'&&id){const r=db.prepare('DELETE FROM copies WHERE id=?').run(id);return r.changes?json({ok:true}):json({error:'Nem található.'},404);}
 }
 if(area==='jobs'){
  if(method==='GET')return json(jobs());
  if(method==='POST'){
   if(db.prepare("SELECT id FROM jobs WHERE status='processing' AND created_at > ?").get(new Date(Date.now()-600000).toISOString()))throw new Error('Már folyamatban van egy felismerés. Várd meg a befejezését.');
   const file=await upload(req,150*1024*1024);const ext=path.extname(file.name).toLowerCase();
   if(!['.mp4','.mov','.webm','.mkv','.jpg','.jpeg','.png','.webp'].includes(ext))throw new Error('MP4, MOV, WebM, MKV videó vagy JPG, PNG, WebP kép tölthető fel.');
   const jobId=randomUUID();const dir=path.join(dataDir,'uploads',jobId);await mkdir(dir);const source=path.join(dir,'source'+ext);await writeFile(source,Buffer.from(await file.arrayBuffer()));
   db.prepare("INSERT INTO jobs(id,name,status,created_at) VALUES(?,?,'processing',?)").run(jobId,file.name,new Date().toISOString());recognize(jobId,source);return json({id:jobId},202);
  }
 }
 if(area==='candidates'&&id&&method==='POST'){
  const input=await req.json();const candidate=db.prepare('SELECT * FROM candidates WHERE id=?').get(id);if(!candidate)return json({error:'Nem található.'},404);
  if(candidate.status!=='pending')throw new Error('Ezt a találatot már feldolgoztad.');
  if(input.dismiss){db.prepare("UPDATE candidates SET status='dismissed' WHERE id=?").run(id);return json({ok:true});}
  db.exec('BEGIN IMMEDIATE');try{const book=saveBook(input);db.prepare("UPDATE candidates SET status='approved' WHERE id=?").run(id);db.exec('COMMIT');return json(book,201);}catch(e){db.exec('ROLLBACK');throw e;}
 }
 if(area==='media'){
  if(method==='POST'){const file=await upload(req,12*1024*1024);const bytes=Buffer.from(await file.arrayBuffer());let ext='';if(bytes[0]===0xff&&bytes[1]===0xd8)ext='.jpg';else if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))ext='.png';else if(bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP')ext='.webp';if(!ext)throw new Error('JPG, PNG vagy WebP képet válassz.');const filename=randomUUID()+ext;await writeFile(path.join(dataDir,'uploads',filename),bytes);return json({url:'/api/media/'+filename});}
  const segments=parts.slice(1);if(!segments.length||segments.some(p=>!p||p==='.'||p==='..'||!/^[\w.-]+$/.test(p)))return json({error:'Érvénytelen útvonal.'},400);
  const filename=path.join(dataDir,'uploads',...segments);const ext=path.extname(filename);const types:Record<string,string>={'.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp'};if(!types[ext])return json({error:'Nem elérhető.'},404);
  try{return new NextResponse(await readFile(filename),{headers:{'Content-Type':types[ext],'Cache-Control':'private, max-age=3600'}});}catch{return json({error:'A kép nem található.'},404);}
 }
 if(area==='lookup'&&method==='GET'){
  const query=req.nextUrl.searchParams.get('q')?.trim();if(!query||query.length<3)throw new Error('Legalább három karaktert adj meg.');
  // Open Library search is deliberately bibliographic; exact edition data only comes from an edition/ISBN record.
  const isbn=query.replace(/[-\s]/g,'');let results;
  if(/^(\d{10}|\d{13}|\d{9}X)$/i.test(isbn)){
   const response=await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`,{signal:AbortSignal.timeout(15000)});if(!response.ok)throw new Error('Az Open Library jelenleg nem érhető el.');const data=await response.json();const item=data['ISBN:'+isbn];
   results=item?[{title:item.title||'',subtitle:item.subtitle||'',author:item.authors?.map((a:{name:string})=>a.name).join(', ')||'',publisher:item.publishers?.map((a:{name:string})=>a.name).join(', ')||'',year:item.publish_date?.match(/\b\d{4}\b/)?.[0]||'',place:item.publish_places?.map((a:{name:string})=>a.name).join(', ')||'',isbn,cover:item.cover?.large||'',source:item.url||`https://openlibrary.org/isbn/${isbn}`,description:'',kind:'ISBN alapján azonosított kiadás'}]:[];
  }else{
   const response=await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=8&fields=key,title,author_name`,{signal:AbortSignal.timeout(15000)});if(!response.ok)throw new Error('Az Open Library jelenleg nem érhető el.');const data=await response.json();results=(data.docs||[]).map((b:{title:string;author_name?:string[];key:string})=>({title:b.title||'',author:b.author_name?.join(', ')||'',source:'https://openlibrary.org'+b.key,kind:'Műszintű találat • kiadási adatok nélkül'}));
  }
  return json(results);
 }
 if(area==='export'&&method==='GET'){
  const wb=await exportWorkbook(books());const csv=req.nextUrl.searchParams.get('format')==='csv';const buffer=csv?await wb.csv.writeBuffer():await wb.xlsx.writeBuffer();return new NextResponse(csv?Buffer.concat([Buffer.from('\uFEFF'),Buffer.from(buffer)]):Buffer.from(buffer),{headers:{'Content-Type':csv?'text/csv; charset=utf-8':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','Content-Disposition':`attachment; filename="ex-libris.${csv?'csv':'xlsx'}"`}});
 }
 if(area==='import'&&method==='POST'){
  const file=await upload(req,20*1024*1024);const ext=path.extname(file.name).slice(1);if(!['xlsx','csv'].includes(ext))throw new Error('XLSX vagy CSV fájlt válassz.');const rows=await importRows(Buffer.from(await file.arrayBuffer()),ext);for(const row of rows)if(row.id&&!/^[a-f0-9-]{36}$/i.test(row.id))throw new Error('Érvénytelen példányazonosító az importfájlban.');
  db.exec('BEGIN IMMEDIATE');try{for(const row of rows){saveBook(row,row.id||undefined,true);}db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}return json({count:rows.length});
 }
 if(area==='backup'){
  const temp=await mkdtemp(path.join(os.tmpdir(),'ex-libris-'));try{
   const zip=path.join(temp,'backup.zip');
   if(method==='GET'){
    await writeFile(path.join(temp,'manifest.json'),JSON.stringify({version:1,books:books(),createdAt:new Date().toISOString()}));await cp(path.join(dataDir,'uploads'),path.join(temp,'uploads'),{recursive:true});
    await exec(process.env.PYTHON_BIN||'python3',['scripts/archive.py','pack',temp,zip],{timeout:120000});return new NextResponse(await readFile(zip),{headers:{'Content-Type':'application/zip','Content-Disposition':'attachment; filename="ex-libris-mentes.zip"'}});
   }
   if(method==='POST'){
    const file=await upload(req,200*1024*1024);await writeFile(zip,Buffer.from(await file.arrayBuffer()));const target=path.join(temp,'restore');await mkdir(target);await exec(process.env.PYTHON_BIN||'python3',['scripts/archive.py','unpack',target,zip],{timeout:120000});
    const manifest=JSON.parse(await readFile(path.join(target,'manifest.json'),'utf8'));if(manifest.version!==1||!Array.isArray(manifest.books)||manifest.books.length>10000)throw new Error('Érvénytelen biztonsági mentés.');
    const ids=new Set<string>();const validated=manifest.books.map((b:Record<string,unknown>)=>{if(typeof b.id!=='string'||!/^[a-f0-9-]{36}$/i.test(b.id)||ids.has(b.id))throw new Error('Érvénytelen vagy ismétlődő azonosító a mentésben.');ids.add(b.id);return {...cleanBook(b),id:b.id,createdAt:typeof b.createdAt==='string'&&!Number.isNaN(Date.parse(b.createdAt))?b.createdAt:new Date().toISOString()};});
    if(db.prepare("SELECT id FROM jobs WHERE status='processing'").get())throw new Error('Várd meg a folyamatban lévő felismerést.');
    // Preserve any existing files; restore cannot overwrite an unrelated upload.
    await cp(path.join(target,'uploads'),path.join(dataDir,'uploads'),{recursive:true,force:false,errorOnExist:false});
    db.exec('BEGIN IMMEDIATE');try{db.exec('DELETE FROM copies; DELETE FROM editions; DELETE FROM works; DELETE FROM candidates; DELETE FROM jobs;');for(const b of validated){saveBook(b,b.id,true);db.prepare('UPDATE copies SET created_at=? WHERE id=?').run(b.createdAt,b.id);}db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}return json({count:validated.length});
   }
  }finally{await rm(temp,{recursive:true,force:true});}
 }
 return json({error:'Nem található.'},404);
 }catch(e){console.error(e);return json({error:req.nextUrl.pathname.startsWith('/api/lookup')&&e instanceof Error&&e.message==='fetch failed'?'Az Open Library nem érhető el. Ellenőrizd az internetkapcsolatot és az openlibrary.org hálózati engedélyét.':e instanceof Error?e.message:'Váratlan hiba történt.'},400);}
}
export {handle as GET,handle as POST,handle as PUT,handle as DELETE};
