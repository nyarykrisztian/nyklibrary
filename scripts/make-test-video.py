"""Artificial OCR fixture for acceptance tests, never user catalog data."""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import subprocess, tempfile, sys
folder=Path(sys.argv[1])
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',48)
image=Image.new('RGB',(1200,750),'#faf8ee');draw=ImageDraw.Draw(image)
for y,text in [(150,'ISAAC ASIMOV'),(230,'FOUNDATION'),(430,'GEORGE ORWELL'),(510,'NINETEEN EIGHTY FOUR')]: draw.text((120,y),text,font=font,fill='black')
image.save(folder/'exlibris-ocr.png')
subprocess.run(['ffmpeg','-nostdin','-hide_banner','-loglevel','error','-loop','1','-i',str(folder/'exlibris-ocr.png'),'-t','2','-c:v','libx264','-pix_fmt','yuv420p','-y',str(folder/'exlibris-ocr.mp4')],check=True)
