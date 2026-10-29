export const fields = ['author','title','subtitle','publisher','year','place','isbn','series','volume','language','genre','topic','cover','description','source','room','shelf','row','position','notes','tags','dedication','recipient','dedicationDate','dedicationPhoto','acquiredDate','acquiredVia','price','reading','borrower','loanDate'] as const;
export type Book = Record<typeof fields[number], string> & {id:string;workId:string;editionId:string;favorite:boolean;dedicated:boolean;createdAt:string};
export type Candidate = {id:string;jobId:string;text:string;confidence:number;frame:string;status:string};
export type Job = {id:string;name:string;status:string;error:string;createdAt:string;frames:string[];candidates:Candidate[]};
export function cleanBook(value:Record<string,unknown>): Record<string,string|boolean> {
 const out: Record<string,string|boolean> = {};
 for(const field of fields) out[field] = typeof value[field]==='string' ? (value[field] as string).trim().slice(0,20000) : '';
 if(!out.title) throw new Error('A cím megadása kötelező.');
 if(out.year && !/^\d{1,4}$/.test(String(out.year))) throw new Error('Az év legfeljebb négy számjegy lehet.');
 if(out.reading && !['Olvasatlan','Folyamatban','Elolvasva'].includes(String(out.reading))) throw new Error('Ismeretlen olvasottsági állapot.');
 for(const f of ['cover','dedicationPhoto']) if(out[f] && !/^https:\/\/|^\/api\/media\/[a-zA-Z0-9_.\/-]+$/.test(String(out[f]))) throw new Error('A kép címe HTTPS vagy helyi feltöltés lehet.');
 out.favorite=value.favorite===true;out.dedicated=value.dedicated===true; return out;
}
export function normalized(s:string){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('hu').replace(/[^\p{L}\p{N}]+/gu,' ').trim();}
