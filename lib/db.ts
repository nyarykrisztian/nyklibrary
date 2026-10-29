import {DatabaseSync} from 'node:sqlite';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {type Book, cleanBook, normalized} from './model.ts';
export const dataDir=path.resolve(/* turbopackIgnore: true */ process.env.EX_LIBRIS_DATA_DIR || './data');
mkdirSync(path.join(dataDir,'uploads'),{recursive:true});
const globalDb=globalThis as typeof globalThis & {exLibrisDb?:DatabaseSync};
export const db=globalDb.exLibrisDb??=new DatabaseSync(path.join(dataDir,'library.sqlite'));
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
 CREATE TABLE IF NOT EXISTS works(id TEXT PRIMARY KEY, identity TEXT UNIQUE NOT NULL);
 CREATE TABLE IF NOT EXISTS editions(id TEXT PRIMARY KEY, work_id TEXT NOT NULL REFERENCES works(id), identity TEXT UNIQUE NOT NULL);
 CREATE TABLE IF NOT EXISTS copies(id TEXT PRIMARY KEY, edition_id TEXT NOT NULL REFERENCES editions(id), data TEXT NOT NULL, created_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS jobs(id TEXT PRIMARY KEY, name TEXT NOT NULL,status TEXT NOT NULL,error TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL,frames TEXT NOT NULL DEFAULT '[]');
 CREATE TABLE IF NOT EXISTS candidates(id TEXT PRIMARY KEY,job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,text TEXT NOT NULL,confidence REAL NOT NULL,frame TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending');`);
export function books():Book[]{return (db.prepare(`SELECT c.*,e.work_id FROM copies c JOIN editions e ON e.id=c.edition_id ORDER BY created_at DESC`).all() as {id:string;edition_id:string;work_id:string;data:string;created_at:string}[]).map(r=>({...JSON.parse(r.data),id:r.id,workId:r.work_id,editionId:r.edition_id,createdAt:r.created_at}));}
export function saveBook(input:Record<string,unknown>,id?:string,allowNewId=false):Book{
 const data=cleanBook(input);
 const existing=id?db.prepare('SELECT id FROM copies WHERE id=?').get(id):undefined;
 if(id&&!existing&&!allowNewId)throw new Error('A könyv nem található.');
 // Empty authors stay empty; identity grouping is only an organizational aid, never inferred metadata.
 const workKey=normalized(String(data.author))+'|'+normalized(String(data.title));
 const editionKey=workKey+'|'+String(data.isbn).replace(/[-\s]/g,'')+'|'+normalized(String(data.publisher))+'|'+data.year+'|'+normalized(String(data.place))+'|'+normalized(String(data.language))+'|'+normalized(String(data.volume));
 db.exec('SAVEPOINT book_save');
 try{
 db.prepare('INSERT OR IGNORE INTO works(id,identity) VALUES(?,?)').run(randomUUID(),workKey);
 const work=db.prepare('SELECT id FROM works WHERE identity=?').get(workKey) as {id:string};
 db.prepare('INSERT OR IGNORE INTO editions(id,work_id,identity) VALUES(?,?,?)').run(randomUUID(),work.id,editionKey);
 const edition=db.prepare('SELECT id FROM editions WHERE identity=?').get(editionKey) as {id:string};
 const copyId=id||randomUUID();
 if(existing)db.prepare('UPDATE copies SET edition_id=?,data=? WHERE id=?').run(edition.id,JSON.stringify(data),id!);
 else db.prepare('INSERT INTO copies(id,edition_id,data,created_at) VALUES(?,?,?,?)').run(copyId,edition.id,JSON.stringify(data),new Date().toISOString());
 db.exec('RELEASE book_save');return books().find(b=>b.id===copyId)!;
 }catch(e){db.exec('ROLLBACK TO book_save');db.exec('RELEASE book_save');throw e;}
}
export function jobs(){
 db.prepare("UPDATE jobs SET status='failed',error='A feldolgozás megszakadt. Kérjük, töltsd fel újra a felvételt.' WHERE status='processing' AND created_at < ?").run(new Date(Date.now()-600000).toISOString());
 return db.prepare('SELECT * FROM jobs ORDER BY created_at DESC').all().map(r=>({id:r.id,name:r.name,status:r.status,error:r.error,createdAt:r.created_at,frames:JSON.parse(r.frames as string),candidates:db.prepare('SELECT id,job_id AS jobId,text,confidence,frame,status FROM candidates WHERE job_id=?').all(r.id)}));
}
