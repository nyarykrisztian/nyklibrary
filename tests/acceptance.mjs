import assert from 'node:assert/strict';
import {readFile,mkdtemp} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {chromium} from '@playwright/test';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3001';
const fixtureDir=await mkdtemp(path.join(os.tmpdir(),'exlibris-fixture-'));
execFileSync(existsSync('.venv/bin/python')?'.venv/bin/python':'python3',['scripts/make-test-video.py',fixtureDir]);
let count=0;function check(v,message){assert.ok(v,message);console.log('PASS',message);count++;}
async function api(endpoint,method='GET',body){const options={method};if(body instanceof FormData)options.body=body;else if(body!==undefined){options.body=JSON.stringify(body);options.headers={'Content-Type':'application/json'};}const r=await fetch(base+'/api/'+endpoint,options);assert.ok(r.ok,await r.clone().text());return r;}
const initial=await (await api('books')).json();assert.equal(initial.length,0,'Use only a fresh, isolated test database');
let book=await (await api('books','POST',{title:'A tesztkönyv',author:'Teszt Szerző',year:'2001',reading:'Olvasatlan',notes:'Saját emlék',dedicated:true,dedication:'Szeretettel, teszt',room:'Dolgozó',shelf:'A1'})).json();
check(book.id&&book.workId&&book.editionId,'CRUD: külön mű, kiadás és példány');
book=await(await api('books/'+book.id,'PUT',{...book,reading:'Elolvasva',favorite:true})).json();check(book.reading==='Elolvasva'&&book.favorite,'Szerkesztés tartós adatbázisba');
let form=new FormData();form.set('file',new File([await readFile(path.join(fixtureDir,'exlibris-ocr.png'))],'photo.png',{type:'image/png'}));const photo=await(await api('media','POST',form)).json();check((await fetch(base+photo.url)).headers.get('content-type')==='image/png','Feltöltött fénykép visszaolvasható');
book=await(await api('books/'+book.id,'PUT',{...book,dedicationPhoto:photo.url})).json();
const excel=Buffer.from(await(await api('export')).arrayBuffer());check(excel[0]===80&&excel[1]===75,'Valódi XLSX export');
const csv=await(await api('export?format=csv')).text();check(csv.includes('A tesztkönyv')&&csv.includes('Saját emlék'),'CSV az aktuális adatokat tartalmazza');
form=new FormData();form.set('file',new File([excel],'library.xlsx'));const imported=await(await api('import','POST',form)).json();check(imported.count===1&&(await(await api('books')).json()).length===1,'Excel visszaimportálás: nincs többszörözés azonos példány-ID-nél');
const backup=Buffer.from(await(await api('backup')).arrayBuffer());check(backup[0]===80&&backup.length>excel.length,'ZIP mentés feltöltött fényképpel');
await api('books/'+book.id,'DELETE');check((await(await api('books')).json()).length===0,'Példány törlése');
form=new FormData();form.set('file',new File([backup],'backup.zip'));const restored=await(await api('backup','POST',form)).json();check(restored.count===1,'Teljes biztonsági mentés visszaállítása');check((await(await api('books')).json())[0].id===book.id,'A mentés megőrzi a példányazonosítót');check((await fetch(base+photo.url)).ok,'Fénykép visszaállítás után is megvan');
form=new FormData();form.set('file',new File([await readFile(path.join(fixtureDir,'exlibris-ocr.mp4'))],'shelf.mp4',{type:'video/mp4'}));const job=await(await api('jobs','POST',form)).json();let finished;
for(let i=0;i<90;i++){const jobs=await(await api('jobs')).json();finished=jobs.find(j=>j.id===job.id);if(finished.status!=='processing')break;await new Promise(r=>setTimeout(r,1000));}
check(finished.status==='done','Valódi FFmpeg videófeldolgozás és Tesseract OCR befejeződött');check(finished.frames.length>0,'Képkockák kinyerése és élességalapú kiválasztása');check(finished.candidates.some(c=>/ASIMOV|ORWELL|FOUNDATION/i.test(c.text)),'Az OCR valóban olvasott az ismert tesztvideóból');check((await(await api('books')).json()).length===1,'A felismert szöveg nem kerül automatikusan a könyvtárba');
const candidate=finished.candidates[0];await api('candidates/'+candidate.id,'POST',{title:'Ellenőrzött tesztkönyv',notes:candidate.text});check((await(await api('books')).json()).length===2,'Találat kézi jóváhagyása könyvet hoz létre');const repeated=await fetch(base+'/api/candidates/'+candidate.id,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:'Dupla'})});check(!repeated.ok,'Ugyanaz a találat nem hagyható jóvá kétszer');
const forbidden=await fetch(base+'/api/books',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://foreign.example'},body:JSON.stringify({title:'Nem kívánt'})});check(!forbidden.ok,'Idegen origin írása elutasítva');
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:1440,height:1080}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(base);await page.getByRole('heading',{name:'A tesztkönyv',exact:true}).waitFor();await page.screenshot({path:'/tmp/exlibris-desktop.png',fullPage:true});
for(const label of ['Katalóguscédulák','Virtuális könyvespolc','Táblázat','Borítógaléria']){await page.getByRole('button',{name:label,exact:true}).click();check(await page.getByText('A tesztkönyv',{exact:true}).count()>0,'Böngészős katalógusnézet: '+label);}
await page.getByRole('button',{name:'Könyv hozzáadása',exact:true}).click();await page.getByText('Cím *',{exact:true}).locator('input').fill('Böngészőből felvitt könyv');await page.getByRole('button',{name:'Könyv mentése'}).click();await page.getByRole('heading',{name:'Böngészőből felvitt könyv'}).waitFor();check(true,'Kézi felvitel böngészős űrlappal');
await page.getByRole('textbox',{name:'Keresés a könyvtárban'}).fill('böngészőből');check(await page.locator('.book-card').count()===1,'Ékezetes keresés működik');
await page.setViewportSize({width:390,height:844});await page.getByRole('navigation',{name:'Mobil főmenü'}).waitFor();check(await page.locator('body').evaluate(e=>e.scrollHeight<=window.innerHeight),'Mobil appkeret: a teljes oldal nem görget');check(await page.locator('body').evaluate(e=>e.scrollWidth<=window.innerWidth),'Mobil felület vízszintes túlcsordulás nélkül');await page.waitForTimeout(350);await page.screenshot({path:'/tmp/exlibris-mobile.png',fullPage:true});
await page.getByRole('navigation',{name:'Mobil főmenü'}).getByRole('button',{name:'Felismerés'}).click();await page.getByRole('heading',{name:'Polcról a katalógusba.'}).waitFor();check(true,'Mobil alsó menü működik');
await page.getByRole('button',{name:'Videó felvétele',exact:true}).click();await page.getByRole('dialog',{name:'Könyvespolc videófelvétele'}).waitFor();check(true,'Mobil felvevő nyitása és engedélykérési/hibaállapot');await page.getByRole('button',{name:'Kamera bezárása'}).click();check(errors.length===0,'Nincs böngészős JavaScript-hiba: '+errors.join(', '));
await browser.close();console.log(`Összesen ${count} sikeres végpont- és böngészős ellenőrzés.`);
