import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {pythonEnvironment,pythonCommand} from '../lib/python.ts';
const dir=mkdtempSync(path.join(os.tmpdir(),'exlibris-expat-'));
writeFileSync(path.join(dir,'libexpat.1.dylib'),'test fixture, never loaded');
after(()=>rmSync(dir,{recursive:true,force:true}));
test('Mac Python-workers receive the selected Expat directory without changing the parent environment',()=>{
 const parent={NODE_ENV:'test' as const,EX_LIBRIS_EXPAT_LIB_DIR:dir,DYLD_LIBRARY_PATH:'/previous',CUSTOM_SETTING:'keep'};
 const child=pythonEnvironment('darwin',parent);
 assert.equal(child.DYLD_LIBRARY_PATH,dir+':/previous');
 assert.equal(child.CUSTOM_SETTING,'keep');
 assert.equal(parent.DYLD_LIBRARY_PATH,'/previous');
});
test('Linux Python-workers do not receive a Mac loader override',()=>{
 const parent={NODE_ENV:'test' as const,EX_LIBRIS_EXPAT_LIB_DIR:dir};
 assert.equal(pythonEnvironment('linux',parent).DYLD_LIBRARY_PATH,undefined);
});
test('An explicitly selected Python executable is respected',()=>{
 const old=process.env.PYTHON_BIN;
 try{process.env.PYTHON_BIN='/chosen/python';assert.equal(pythonCommand(),'/chosen/python');}
 finally{if(old===undefined)delete process.env.PYTHON_BIN;else process.env.PYTHON_BIN=old;}
});
