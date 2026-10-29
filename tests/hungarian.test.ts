import {test} from 'node:test';
import assert from 'node:assert/strict';
import {allowedCatalogUrl,parseCatalogPage,validIsbn} from '../lib/hungarian.ts';
test('Only explicit Hungarian catalog domains and HTTPS are accepted',()=>{
 for(const u of ['http://libri.hu/a','https://libri.hu.evil.example/a','https://localhost/a','https://libri.hu:8080/a','https://user:pass@libri.hu/a'])assert.throws(()=>allowedCatalogUrl(u));
 assert.equal(allowedCatalogUrl('https://www.lira.hu/konyv').hostname,'www.lira.hu');
});
test('Book structured data keeps publisher, edition date and traceable source',()=>{
 const source='https://www.libri.hu/konyv/proba.html';const html='<script type="application/ld+json">'+JSON.stringify({'@graph':[{'@type':'Book',name:'Tesztkönyv',author:[{name:'Teszt Szerző'}],publisher:{name:'Teszt Kiadó'},datePublished:'2020-01-01',isbn:'9780140328721'}]})+'</script>';
 const [b]=parseCatalogPage(html,source);assert.equal(b.author,'Teszt Szerző');assert.equal(b.publisher,'Teszt Kiadó');assert.equal(b.year,'2020');assert.equal(b.isbn,'9780140328721');assert.equal(b.source,source);
});
test('Product seller and publication-like timestamps are not invented edition metadata',()=>{
 const [b]=parseCatalogPage('<script type="application/ld+json">{"@type":"Product","name":"Könyv","seller":{"name":"Bolt"},"datePublished":"2026-01-01","gtin13":"1234567890123"}</script>','https://bookline.hu/a');assert.equal(b.publisher,'');assert.equal(b.year,'');assert.equal(b.author,'');assert.equal(b.isbn,'');
});
test('Malformed or missing structured data produces no fabricated book',()=>{
 assert.deepEqual(parseCatalogPage('<h1>Egy ismert könyvcím</h1>','https://moly.hu/a'),[]);
 assert.equal(validIsbn('978-0-140-32872-1'),'9780140328721');
});
