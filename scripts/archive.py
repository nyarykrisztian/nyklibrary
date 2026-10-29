import sys, pathlib, zipfile, json
mode, directory, archive = sys.argv[1:4]
root=pathlib.Path(directory)
if mode=='pack':
 with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
  z.write(root/'manifest.json','manifest.json')
  for p in (root/'uploads').rglob('*'):
   if p.is_file() and not p.is_symlink(): z.write(p,p.relative_to(root))
else:
 with zipfile.ZipFile(archive) as z:
  infos=z.infolist()
  if len(infos)>10000 or sum(i.file_size for i in infos)>500*1024*1024: raise ValueError('Túl nagy biztonsági mentés.')
  for info in infos:
   p=pathlib.PurePosixPath(info.filename)
   if p.is_absolute() or '..' in p.parts or '\\' in info.filename or (info.filename!='manifest.json' and (not p.parts or p.parts[0]!='uploads')): raise ValueError('Érvénytelen archívumútvonal.')
   if info.external_attr>>16 & 0o170000 == 0o120000: raise ValueError('Szimbolikus link nem megengedett.')
  z.extractall(root)
