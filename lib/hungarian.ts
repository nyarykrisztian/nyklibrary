export const hungarianSources=[
 {name:'Líra',host:'lira.hu'},{name:'Libri',host:'libri.hu'},{name:'Bookline',host:'bookline.hu'},
 {name:'Moly',host:'moly.hu'},{name:'FSZEK',host:'fszek.hu'},{name:'OSZK',host:'oszk.hu'}
];
export function allowedCatalogUrl(value:string){const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||(u.port&&u.port!=='443')||!hungarianSources.some(s=>u.hostname===s.host||u.hostname.endsWith('.'+s.host)))throw new Error('Csak HTTPS Líra, Libri, Bookline, Moly, FSZEK vagy OSZK könyvadatlap adható meg.');return u;}
function text(v:unknown):string{return typeof v==='string'?v.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim():'';}
function names(v:unknown):string{if(Array.isArray(v))return v.map(names).filter(Boolean).join(', ');if(v&&typeof v==='object')return text((v as Record<string,unknown>).name);return text(v);}
export function validIsbn(value:string){const s=value.replace(/[-\s]/g,'').toUpperCase();if(/^97[89]\d{10}$/.test(s))return [...s].reduce((a,c,i)=>a+Number(c)*(i%2?3:1),0)%10===0?s:'';if(/^\d{9}[\dX]$/.test(s))return [...s].reduce((a,c,i)=>a+(c==='X'?10:Number(c))*(10-i),0)%11===0?s:'';return '';}
export function parseCatalogPage(html:string,source:string){
 allowedCatalogUrl(source);const nodes:Record<string,unknown>[]=[];
 const visit=(v:unknown)=>{if(Array.isArray(v)){v.forEach(visit);return;}if(!v||typeof v!=='object')return;const o=v as Record<string,unknown>;const types=Array.isArray(o['@type'])?o['@type']:[o['@type']];if(types.some(t=>t==='Book'||t==='Product'||t==='https://schema.org/Book'))nodes.push(o);if(o['@graph'])visit(o['@graph']);if(o.mainEntity)visit(o.mainEntity);};
 for(const match of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script\s*>/gi)){try{visit(JSON.parse(match[1]));}catch{/* A malformed block must not create guessed fields. */}}
 return nodes.filter(n=>text(n.name)).map(n=>{
 const types=Array.isArray(n['@type'])?n['@type']:[n['@type']];const book=types.includes('Book')||types.includes('https://schema.org/Book');
 const isbn=validIsbn(text(n.isbn)||text(n.gtin13)||text(n.gtin));
 const image=Array.isArray(n.image)?n.image[0]:n.image;const cover=typeof image==='object'&&image!==null?text((image as Record<string,unknown>).url):text(image);
 return {title:text(n.name),author:names(n.author),publisher:book?names(n.publisher):'',year:book?text(n.datePublished).match(/^(\d{4})(?:$|-)/)?.[1]||'':'',isbn,description:text(n.description),language:book?names(n.inLanguage):'',cover:cover.startsWith('https://')?cover:'',source,kind:'Magyar forrás strukturált adatai • a saját kiadással összevetendő'};
 });
}
export async function fetchCatalogPage(value:string){
 let url=allowedCatalogUrl(value);
 for(let hop=0;hop<4;hop++){
  const r=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(12000),headers:{Accept:'text/html','User-Agent':'ExLibris-PersonalLibrary/1.0'}});
  if(r.status>=300&&r.status<400){const location=r.headers.get('location');if(!location)throw new Error('Hibás átirányítás.');await r.body?.cancel();url=allowedCatalogUrl(new URL(location,url).href);continue;}
  if(!r.ok)throw new Error(`A forrás nem engedte az adatlekérést (HTTP ${r.status}). CAPTCHA vagy belépés nem kerülhető meg. Az adatokat kézzel is rögzítheted.`);
  const reader=r.body?.getReader();if(!reader)throw new Error('Üres válasz.');let size=0;const chunks:Uint8Array[]=[];
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>2*1024*1024)throw new Error('Az adatlap túl nagy.');chunks.push(value);}}finally{await reader.cancel();}
  const results=parseCatalogPage(Buffer.concat(chunks).toString('utf8'),url.href);
  if(!results.length)throw new Error('Az oldalon nincs biztonságosan átvehető, strukturált könyvadat. A látható cédula adatait kézzel másold be; a program nem következtet kiadási évre vagy ISBN-re.');return results;
 }
 throw new Error('Túl sok átirányítás.');
}
