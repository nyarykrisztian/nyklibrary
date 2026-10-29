// Exercise the real Bash installer in isolation; npm and Python are controlled test tools.
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,copyFileSync,readdirSync,rmSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
const temp=mkdtempSync(path.join(os.tmpdir(),'exlibris-setup-'));
try {
 for(const scenario of ['wrong-version','missing-pip']){
  const root=path.join(temp,scenario);const bin=path.join(root,'test-bin');
  for(const dir of ['scripts','data','.runtime/tessdata','.venv/bin','test-bin'])mkdirSync(path.join(root,dir),{recursive:true});
  copyFileSync('scripts/setup.sh',path.join(root,'scripts/setup.sh'));
  copyFileSync('scripts/python-env.sh',path.join(root,'scripts/python-env.sh'));
  copyFileSync('scripts/python-packages.py',path.join(root,'scripts/python-packages.py'));
  for(const lang of ['eng','hun'])copyFileSync(`.runtime/tessdata/${lang}.traineddata`,path.join(root,'.runtime/tessdata',`${lang}.traineddata`));
  writeFileSync(path.join(root,'data','keep.txt'),'USER DATA');writeFileSync(path.join(root,'.venv','keep.txt'),'OLD ENV');
  const executable=(file,content)=>writeFileSync(file,content,{mode:0o755});
  executable(path.join(root,'.venv/bin/python'),`#!/bin/bash\nif [[ "$*" == *"-c"* ]]; then echo '${scenario==='wrong-version'?'3.15':'3.12'}'; exit 0; fi\nexit 1\n`);
  executable(path.join(bin,'node'),'#!/bin/bash\nexit 0\n');
  executable(path.join(bin,'npm'),'#!/bin/bash\nexit 0\n');
  const goodPython='#!/bin/bash\nif [[ "$*" == *"-c"* ]]; then echo 3.12; fi\nexit 0\n';
  executable(path.join(bin,'setup-python'),`#!/bin/bash\nif [[ "$*" == *"-c"* ]]; then echo 3.12; exit 0; fi\nif [[ "$1" == -m && "$2" == venv ]]; then mkdir -p .venv/bin; cat > .venv/bin/python <<'PYTHON_STUB'\n${goodPython}PYTHON_STUB\nchmod +x .venv/bin/python; exit 0; fi\nexit 1\n`);
  const env={...process.env,PATH:bin+path.delimiter+process.env.PATH,EX_LIBRIS_SETUP_PYTHON:path.join(bin,'setup-python')};
  execFileSync('bash',['scripts/setup.sh'],{cwd:root,env,stdio:'pipe'});
  const backups=readdirSync(root).filter(n=>n.startsWith('.venv-incomplete-'));
  assert.equal(backups.length,1);assert.equal(readFileSync(path.join(root,backups[0],'keep.txt'),'utf8'),'OLD ENV');
  assert.equal(readFileSync(path.join(root,'data','keep.txt'),'utf8'),'USER DATA');
  execFileSync('bash',['scripts/setup.sh'],{cwd:root,env,stdio:'pipe'});
  assert.equal(readdirSync(root).filter(n=>n.startsWith('.venv-incomplete-')).length,1);
  console.log(`PASS: ${scenario}: környezet újraépült, régi környezet és könyvadatok megmaradtak, ismétléskor nincs felesleges újraépítés.`);
 }
} finally {rmSync(temp,{recursive:true,force:true});}
