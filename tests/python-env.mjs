import {mkdtempSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
const root=mkdtempSync(path.join(os.tmpdir(),'exlibris-shell-expat-'));
try{
 const lib=path.join(root,'expat lib');mkdirSync(lib);
 writeFileSync(path.join(lib,'libexpat.1.dylib'),'test fixture, never loaded on Linux');
 const bin=path.join(root,'bin');mkdirSync(bin);
 for(const platform of ['Darwin','Linux']){
  writeFileSync(path.join(bin,'uname'),`#!/bin/bash\necho ${platform}\n`,{mode:0o755});
  const output=execFileSync('bash',['-c',`source scripts/python-env.sh; exlibris_python python3 -c 'import os; print(os.environ.get("DYLD_LIBRARY_PATH", ""))'; printf '%s\\n' "$DYLD_LIBRARY_PATH"`],{encoding:'utf8',env:{...process.env,PATH:bin+':'+process.env.PATH,EX_LIBRIS_EXPAT_LIB_DIR:lib,DYLD_LIBRARY_PATH:'/previous'}});
  assert.deepEqual(output.trim().split('\n'),[platform==='Darwin'?lib+':/previous':'/previous','/previous']);
  console.log('PASS:',platform,'Python subprocess gets the intended environment; parent shell is unchanged.');
 }
}finally{rmSync(root,{recursive:true,force:true});}
