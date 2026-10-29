import {existsSync} from 'node:fs';
import path from 'node:path';

export function pythonCommand():string {
 return process.env.PYTHON_BIN || (existsSync(path.join(process.cwd(),'.venv','bin','python')) ? path.resolve('.venv/bin/python') : 'python3');
}

// The same Homebrew Expat selection verified during Mac setup must reach OCR
// and ZIP workers too. It affects Python children, never the system libraries.
export function pythonEnvironment(platform:NodeJS.Platform=process.platform,environment:NodeJS.ProcessEnv=process.env):NodeJS.ProcessEnv {
 const env={...environment};
 if(platform!=='darwin')return env;
 const candidates=[env.EX_LIBRIS_EXPAT_LIB_DIR,'/opt/homebrew/opt/expat/lib','/usr/local/opt/expat/lib'];
 const dir=candidates.find((d):d is string=>!!d&&existsSync(path.join(d,'libexpat.1.dylib')));
 if(dir)env.DYLD_LIBRARY_PATH=[dir,env.DYLD_LIBRARY_PATH].filter(Boolean).join(':');
 return env;
}
