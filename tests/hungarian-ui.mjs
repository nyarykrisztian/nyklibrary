import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3005';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
try{
 const page=await browser.newPage();await page.goto(base);await page.getByRole('button',{name:'Könyv hozzáadása',exact:true}).click();await page.getByRole('button',{name:'Magyar és nemzetközi források',exact:false}).click();
 const moly=page.getByRole('link',{name:'Moly ↗'});assert.ok((await moly.getAttribute('href')).includes('site%3Amoly.hu'));console.log('PASS: Moly célzott keresési link, nem állítólagos találat.');
 await page.getByRole('textbox',{name:'Magyar könyvadatlap címe'}).fill('https://localhost/private');await page.getByRole('button',{name:'Adatok lekérése',exact:true}).click();await page.getByRole('alert').filter({hasText:'Csak HTTPS'}).waitFor();console.log('PASS: tiltott adatlapcím valódi API-val elutasítva.');
 // Synthetic API fixture tests only the editor transfer, never live Moly access.
 await page.route('**/api/catalog-page',route=>route.fulfill({json:[{title:'Strukturált tesztadat',author:'Teszt Szerző',source:'https://moly.hu/konyvek/teszt'}]}));
 await page.getByRole('textbox',{name:'Magyar könyvadatlap címe'}).fill('https://moly.hu/konyvek/teszt');await page.getByRole('button',{name:'Adatok lekérése',exact:true}).click();await page.getByRole('button',{name:'Átvétel',exact:true}).click();assert.equal(await page.getByText('Cím *',{exact:true}).locator('input').inputValue(),'Strukturált tesztadat');console.log('PASS: tesztadat átvétele a szerkesztőbe; mentés továbbra is kézi.');
}finally{await browser.close();}
