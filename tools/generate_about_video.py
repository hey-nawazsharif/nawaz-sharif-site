#!/usr/bin/env python3
"""Generate original, silent technology introduction film and poster for the About section."""
from PIL import Image, ImageDraw, ImageFont
import math, os, subprocess
import numpy as np
W,H,FPS,DUR=1280,720,24,20
os.makedirs("media",exist_ok=True)
inter="/usr/share/fonts/truetype/inter/"
if not os.path.isfile(inter+"InterDisplay-Bold.ttf"):
    inter="/usr/share/fonts/opentype/inter/"
def font(name,size):
    path=inter+name
    if not os.path.isfile(path):
        return ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",size)
    return ImageFont.truetype(path,size)
BIG=font("InterDisplay-Bold.otf",78)
TITLE=font("InterDisplay-SemiBold.otf",58)
MED=font("InterDisplay-Medium.otf",27)
SMALL=font("InterDisplay-Regular.otf",21)
MONO=ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",19)
TINY=ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",14)
TEAL=(89,191,160); WHITE=(234,241,235);MUTED=(156,181,175)
y,x=np.mgrid[0:H,0:W].astype(np.float32)
glow=np.exp(-(((x-1050)/570)**2+((y-250)/590)**2))
bg=np.zeros((H,W,3),dtype=np.uint8)
for c,(lo,hi) in enumerate(zip((8,24,31),(20,53,49))):
    bg[:,:,c]=np.clip(lo+(hi-lo)*glow,0,255)
BG=Image.fromarray(bg,"RGB")
def s(x):
    x=max(0,min(1,x));return x*x*(3-2*x)
def a(t,start,end):
    return s((t-start)/.55)*(1-s((t-end+.55)/.55))
def text(d,xy,string,ft,color,alpha=1,anchor=None):
    if alpha>.01:d.text((int(xy[0]),int(xy[1])),string,font=ft,fill=(*color,int(255*alpha)),anchor=anchor)
def box(d,xy,fill,alpha=1,r=0,outline=None):
    if r:d.rounded_rectangle(xy,radius=r,fill=(*fill,int(255*alpha)),outline=(*outline,int(255*alpha)) if outline else None,width=2)
    else:d.rectangle(xy,fill=(*fill,int(255*alpha)))
def frame(t):
    img=BG.copy().convert("RGBA");d=ImageDraw.Draw(img,"RGBA")
    d.line((90,85,1187,85),fill=(*MUTED,65),width=1)
    text(d,(92,35),"NS.",TITLE,WHITE,.9)
    text(d,(1185,54),"ABOUT / INTRODUCTION",TINY,MUTED,.8,"ra")
    for i in range(10):
        for j in range(6):
            px=730+i*52;py=130+j*79
            d.ellipse((px,py,px+2,py+2),fill=(*TEAL,30))
    p=a(t,0,4.8)
    if p>.01:
        text(d,(92,156),"NAWAZ SHARIF / TECHNOLOGY NOTES",MONO,TEAL,p)
        text(d,(92,240),"Practical technology.",TITLE,WHITE,p)
        text(d,(92,325),"Thoughtful systems.",TITLE,TEAL,p)
        d.line((93,433,640,433),fill=(*MUTED,int(p*110)),width=1)
        text(d,(93,474),"Linux  /  IT infrastructure  /  Technical writing",SMALL,MUTED,p)
        cx,cy=1010,347
        for k in range(4):
            r=75+46*k
            d.ellipse((cx-r,cy-r,cx+r,cy+r),outline=(*TEAL,int(p*85)),width=2)
        for angle in (0,120,240):
            theta=math.radians(angle+t*12)
            px=cx+150*math.cos(theta);py=cy+150*math.sin(theta)
            d.line((cx,cy,px,py),fill=(*TEAL,int(p*140)),width=2)
            d.ellipse((px-6,py-6,px+6,py+6),fill=(*TEAL,int(p*245)))
        d.ellipse((cx-15,cy-15,cx+15,cy+15),fill=(*TEAL,int(p*255)))
    p=a(t,4.45,9.75)
    if p>.01:
        text(d,(92,129),"01 / SYSTEMS",MONO,TEAL,p)
        text(d,(92,193),"Start with the fundamentals.",TITLE,WHITE,p)
        text(d,(93,279),"A clear view of infrastructure, tooling and reliability.",SMALL,MUTED,p)
        box(d,(94,359,1182,613),(22,43,47),p,14,(65,91,89))
        box(d,(96,360,1180,400),(35,57,60),p,11)
        for j,c in enumerate(((235,107,102),(235,184,97),(107,200,155))):
            d.ellipse((120+j*25,372,131+j*25,383),fill=(*c,int(255*p)))
        text(d,(645,370),"terminal / local workspace",TINY,MUTED,p,"mt")
        for j,cmd in enumerate(("$ pwd","$ ls -la","$ uname -a","$ python3 --version")):
            text(d,(139,432+j*44),cmd,MONO,TEAL,p*s((t-5.0-j*.55)/.5))
    p=a(t,9.4,15.1)
    if p>.01:
        text(d,(92,128),"02 / TECHNICAL WRITING",MONO,TEAL,p)
        text(d,(92,192),"Ideas made clear.",TITLE,WHITE,p)
        text(d,(94,283),"Readable explanations. Practical examples.",MED,MUTED,p)
        for j,(num,title,sub) in enumerate((("01","What is Linux?","Systems & foundations"),("02","AI vs Machine Learning","Concepts & comparisons"),("03","Python for IT Support","Practical scripts"))):
            r=s((t-10-j*.4)/.5);yy=373+j*83+(1-r)*30
            box(d,(94,int(yy),1180,int(yy+70)),(21,44,47),p*r,9,(49,84,80))
            text(d,(113,yy+22),num,MONO,TEAL,p*r)
            text(d,(195,yy+17),title,MED,WHITE,p*r)
            text(d,(1120,yy+25),sub,SMALL,MUTED,p*r,"ra")
    p=a(t,14.85,20.55)
    if p>.01:
        text(d,(92,139),"03 / STRATEGIC PARTNERSHIPS",MONO,TEAL,p)
        text(d,(92,224),"Let's build",BIG,WHITE,p)
        text(d,(92,331),"what's next.",BIG,TEAL,p)
        text(d,(95,473),"Technology discussions. Practical ideas. Thoughtful collaboration.",SMALL,MUTED,p)
        box(d,(94,548,391,610),TEAL,p,8)
        text(d,(115,565),"NAWAZSHARIF.IN",MONO,(9,24,31),p)
    d.line((91,661,1185,661),fill=(*MUTED,65),width=1)
    d.rectangle((92,659,int(92+1093*s(t/DUR)),663),fill=(*TEAL,215))
    text(d,(92,682),"nawazsharif.in",TINY,MUTED,.75)
    text(d,(1185,682),"TECHNOLOGY / SYSTEMS / LEARNING",TINY,MUTED,.75,"ra")
    return img.convert("RGB")
frame(2.2).save("media/about-poster.jpg",quality=88,optimize=True)
cmd=["ffmpeg","-hide_banner","-loglevel","error","-y","-f","rawvideo","-pix_fmt","rgb24","-s",f"{W}x{H}","-r",str(FPS),"-i","-","-an","-c:v","libx264","-pix_fmt","yuv420p","-preset","veryfast","-crf","25","-movflags","+faststart","media/about-intro.mp4"]
p=subprocess.Popen(cmd,stdin=subprocess.PIPE)
for i in range(DUR*FPS):p.stdin.write(frame(i/FPS).tobytes())
p.stdin.close()
if p.wait()!=0:raise RuntimeError("Video render failed")
print("Generated video",os.stat("media/about-intro.mp4").st_size)
