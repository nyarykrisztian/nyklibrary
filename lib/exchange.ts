import ExcelJS from 'exceljs';
import {parse} from 'csv-parse/sync';
import {Book,fields,cleanBook} from './model';
export const columns=['id','workId','editionId',...fields,'favorite','dedicated'];
export async function exportWorkbook(books:Book[]){const workbook=new ExcelJS.Workbook();const sheet=workbook.addWorksheet('Könyvtár');sheet.columns=columns.map(key=>({header:key,key,width:key==='title'?40:22}));for(const b of books) sheet.addRow(b);sheet.getRow(1).font={bold:true};sheet.views=[{state:'frozen',ySplit:1}];return workbook;}
export async function importRows(buffer:Buffer,extension:string){
 let rows:Record<string,unknown>[]=[];
 if(extension==='csv')rows=parse(buffer.toString('utf8').replace(/^\uFEFF/,''),{columns:true,skip_empty_lines:true,bom:true});
 else{const wb=new ExcelJS.Workbook();await wb.xlsx.load(buffer as never);const sheet=wb.worksheets[0];if(!sheet)throw new Error('Hiányzó munkalap.');const headers:string[]=[];sheet.getRow(1).eachCell((cell,n)=>headers[n]=String(cell.value??''));sheet.eachRow((row,n)=>{if(n===1)return;const item:Record<string,unknown>={};row.eachCell((cell,i)=>{const v=cell.value;item[headers[i]]=typeof v==='object'&&v!==null?'':v==null?'':String(v);});rows.push(item);});}
 if(rows.length>10000)throw new Error('Legfeljebb 10 000 sor importálható.');
 return rows.map(row=>{for(const key of ['favorite','dedicated']) row[key]=row[key]===true||row[key]==='true'||row[key]==='1';return {...cleanBook(row),id:typeof row.id==='string'?row.id:''};});
}
