import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
const source=readFileSync('scripts/setup.sh','utf8');
const block=source.slice(source.indexOf('# Prefer macOS shasum'),source.indexOf('npm ci'));
assert.ok(block.includes('checksum()'));
const root=mkdtempSync(path.join(os.tmpdir(),'exlibris-checksum-'));
try{
 const file=path.join(root,'model with spaces');writeFileSync(file,'verified model fixture');
 const hash=createHash('sha256').update(readFileSync(file)).digest('hex');
 for(const tool of ['shasum','sha256sum']){
  const binary=execFileSync('/bin/bash',['-c',`command -v ${tool}`],{encoding:'utf8'}).trim();
  const bin=path.join(root,tool);mkdirSync(bin);
  const required=tool==='shasum'?'[[ "$1" == -a && "$2" == 256 && "$3" == -c ]]':'[[ "$1" == -c ]]';
  writeFileSync(path.join(bin,tool),`#!/bin/bash\n${required} || exit 64\nexec '${binary}' "$@"\n`,{mode:0o755});
  const options={encoding:'utf8',env:{...process.env,PATH:bin},input:`${hash}  ${file}\n`};
  execFileSync('/bin/bash',['-c',block+'\nchecksum'],options);
  assert.throws(()=>execFileSync('/bin/bash',['-c',block+'\nchecksum'],{...options,input:`${'0'.repeat(64)}  ${file}\n`,stdio:['pipe','pipe','pipe']}));
  console.log(`PASS: ${tool}: rövid kapcsolóval jó modell elfogadva, hibás hash elutasítva.`);
 }
}finally{rmSync(root,{recursive:true,force:true});}
