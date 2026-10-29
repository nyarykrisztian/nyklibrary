import {existsSync} from 'node:fs';
import {spawn} from 'node:child_process';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {db,dataDir} from './db';
export function recognize(id:string,source:string){
 const python=process.env.PYTHON_BIN||(existsSync(/* turbopackIgnore: true */ path.join(process.cwd(),'.venv','bin','python'))?path.resolve(/* turbopackIgnore: true */ '.venv/bin/python'):'python3');
 const tessdata=path.resolve('.runtime/tessdata');
 const child=spawn(/* turbopackIgnore: true */ python,[path.resolve('scripts/recognize.py'),source,path.join(dataDir,'uploads',id)],{env:{...process.env,OMP_THREAD_LIMIT:'2',...(existsSync(path.join(tessdata,'hun.traineddata'))?{TESSDATA_PREFIX:tessdata}:{})}});
 let output='',errors='';const timeout=setTimeout(()=>child.kill('SIGKILL'),480000);
 child.stdout.on('data',c=>{output+=c.toString();});child.stderr.on('data',c=>{errors=(errors+c.toString()).slice(-3000);});
 const fail=(message:string)=>db.prepare("UPDATE jobs SET status='failed',error=? WHERE id=?").run(message,id);
 child.on('error',()=>{clearTimeout(timeout);fail('Nem indult el a Python. Ellenőrizd a Python, Pillow, FFmpeg és Tesseract telepítését.');});
 child.on('close',code=>{clearTimeout(timeout);if(code!==0){console.error('OCR error:',errors);fail('A felismerés sikertelen vagy túllépte a 8 perces korlátot. Ellenőrizd a fájlt és a Python, Pillow, FFmpeg, Tesseract telepítését.');return;}
 try{const result=JSON.parse(output);db.exec('BEGIN IMMEDIATE');
 for(const c of result.candidates)db.prepare('INSERT INTO candidates(id,job_id,text,confidence,frame) VALUES(?,?,?,?,?)').run(randomUUID(),id,c.text,c.confidence,`/api/media/${id}/${c.frame}`);
 db.prepare("UPDATE jobs SET status='done',frames=? WHERE id=?").run(JSON.stringify(result.frames.map((f:string)=>`/api/media/${id}/${f}`)),id);db.exec('COMMIT');
 }catch{try{db.exec('ROLLBACK');}catch{}fail('A felismerés eredménye nem olvasható.');}});
}
