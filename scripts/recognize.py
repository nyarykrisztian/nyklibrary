"""Local, auditable OCR; candidates are suggestions, never catalog entries."""
import sys, json, subprocess, pathlib, tempfile, csv, io, re, unicodedata, math
from PIL import ImageStat
from PIL import Image, ImageOps, ImageFilter
source, folder = map(pathlib.Path, sys.argv[1:3])
folder.mkdir(parents=True, exist_ok=True)
if source.suffix.lower() in ['.mp4','.mov','.webm','.mkv']:
    probe=subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','json',str(source)],capture_output=True,text=True,check=True,timeout=15)
    duration=min(180,float(json.loads(probe.stdout)['format']['duration']))
    if not math.isfinite(duration) or duration<=0: raise ValueError('Érvénytelen videóhossz.')
    # Sample four frames each second, then retain the sharpest in each temporal bucket.
    # The bounded 24-frame pass is transparent; it is not a guarantee of every spine being visible.
    subprocess.run(['ffmpeg','-nostdin','-hide_banner','-loglevel','error','-threads','2','-i',str(source),'-t','180','-vf','fps=4,scale=1600:1600:force_original_aspect_ratio=decrease','-frames:v','720',str(folder/'sample-%04d.jpg')],check=True,timeout=100)
    samples=sorted(folder.glob('sample-*.jpg')); winners={}
    for index, sample in enumerate(samples):
        bucket=min(23,int((index/4)/max(duration/24,0.25)))
        with Image.open(sample) as image:
            gray=ImageOps.grayscale(image); gray.thumbnail((640,640))
            score=ImageStat.Stat(gray.filter(ImageFilter.FIND_EDGES)).stddev[0]
        if bucket not in winners or score>winners[bucket][0]: winners[bucket]=(score,sample)
    for index, (_,sample) in enumerate(winners.values()): sample.rename(folder/f'frame-{index+1:03d}.jpg')
    for sample in folder.glob('sample-*.jpg'): sample.unlink()
else:
    with Image.open(source) as image:
        if image.width*image.height>40000000: raise ValueError('Legfeljebb 40 megapixeles kép tölthető fel.')
        image=ImageOps.exif_transpose(image).convert('RGB'); image.thumbnail((2000,2000)); image.save(folder/'frame-001.jpg')
frames=sorted(folder.glob('frame-*.jpg'))
if not frames: raise ValueError('Nem sikerült képkockát kinyerni.')
languages=subprocess.run(['tesseract','--list-langs'],capture_output=True,text=True,check=True).stdout
lang='hun+eng' if 'hun' in languages else 'eng'
results=[]; seen=set()
with tempfile.TemporaryDirectory() as temp:
 for frame in frames:
    with Image.open(frame) as im:
     for angle in [0,90,270]:
        image=ImageOps.autocontrast(ImageOps.grayscale(im.rotate(angle,expand=True)))
        p=pathlib.Path(temp)/'ocr.png'; image.save(p)
        run=subprocess.run(['tesseract',str(p),'stdout','-l',lang,'--psm','11','-c','tessedit_create_tsv=1'],capture_output=True,text=True,check=True,timeout=20)
        if not run.stdout.startswith('level\tpage_num\t'): raise ValueError('A Tesseract nem TSV formátumú eredményt adott.')
        lines={}
        for word in csv.DictReader(io.StringIO(run.stdout),delimiter='\t'):
            text=(word.get('text') or '').strip(); conf=float(word.get('conf') or -1)
            if text and conf>=35:
                key=(word['block_num'],word['par_num'],word['line_num'])
                lines.setdefault(key,[]).append((text,conf))
        for words in lines.values():
            text=' '.join(w[0] for w in words)
            key=re.sub(r'\W+','',unicodedata.normalize('NFKD',text).casefold())
            if len(key)<5 or not any(c.isalpha() for c in text) or key in seen: continue
            # Deduplicate overlapping frames conservatively; editions are never guessed.
            if any(len(key)>8 and (key in k or k in key) for k in seen): continue
            seen.add(key)
            results.append({'text':text,'confidence':round(sum(w[1] for w in words)/len(words),1),'frame':frame.name})
print(json.dumps({'frames':[f.name for f in frames],'candidates':results[:250],'language':lang},ensure_ascii=False))
