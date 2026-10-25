const cv=document.getElementById('c'),g=cv.getContext('2d'),W=800,H=450;cv.width=W;cv.height=H;g.imageSmoothingQuality='high';
const LY=[140,250,360],PXX=150,PTX=705,PTY=225;
const RC=['#ff6a6a','#ffaa5e','#f2d95c','#66ff99','#66eeff','#6699ff','#aa66ff','#ff77aa'];
const SRC={s:'images/starli-character.png',a:'images/soneium-logo.png',b:'images/rainbow-logo.png'},IMG={};
let st='menu',coins=0,items=[],parts=[],pops=[],lane=1,py=250,t=0,dist=0,lastSpawn=0,winT=0,dieT=0,shake=0,flash=0,flashC='255,255,255',lvl=0,GOAL=60;
// Difficulty levels: pace, obstacle density, when logos start swaying / blinking, and logos needed
const LV=[
 {name:'Easy',goal:60,base:3.4,k:.07,cap:8,gap:170,gk:1.3,gmin:95,gm:34,opB:.15,opK:.009,opM:.7,sway:20,blink:40,bonus:.3,desc:'Easy · collect 60 logos · relaxed pace'},
 {name:'Medium',goal:70,base:4.2,k:.085,cap:9.5,gap:160,gk:1.3,gmin:90,gm:30,opB:.25,opK:.011,opM:.78,sway:12,blink:30,bonus:.22,desc:'Medium · collect 70 logos · faster, more shards'},
 {name:'Hard',goal:80,base:5,k:.1,cap:11,gap:150,gk:1.3,gmin:85,gm:27,opB:.35,opK:.013,opM:.85,sway:6,blink:20,bonus:.15,desc:'Hard · collect 80 logos · very fast, swaying and blinking logos early'}];
const KS=['','_m','_h'],bests=[0,0,0],done=[false,false,false];
try{for(let i=0;i<3;i++){bests[i]=+localStorage.getItem('starliBest'+KS[i])||0;done[i]=localStorage.getItem('starliPortal'+KS[i])==='1'}lvl=Math.min(2,+localStorage.getItem('starliLvl')||0)}catch(e){}
GOAL=LV[lvl].goal;

// ---- Audio: procedural music + sound effects (Web Audio, no files needed)
let AC=null,master,musicBus,lp,muted=false,nextT=0,astep=0;
try{muted=localStorage.getItem('starliMute')==='1'}catch(e){}
const NOTE=n=>440*Math.pow(2,(n-69)/12),STEP=60/108/4;
const CH=[[57,60,64],[53,57,60],[48,52,55],[55,59,62]],BASS=[45,41,36,43],LEAD=[[81,79,76,79],[77,76,72,76],[79,76,72,76],[79,78,74,78]];
function tone(f,t0,dur,type,vol,dest,att,f2){const o=AC.createOscillator(),gn=AC.createGain();o.type=type;o.frequency.setValueAtTime(f,t0);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t0+dur);
 gn.gain.setValueAtTime(0,t0);gn.gain.linearRampToValueAtTime(vol,t0+(att||.01));gn.gain.exponentialRampToValueAtTime(.0001,t0+dur);o.connect(gn);gn.connect(dest||musicBus);o.start(t0);o.stop(t0+dur+.05)}
function noise(t0,dur,vol,hp,dest){const n=Math.floor(AC.sampleRate*dur),b=AC.createBuffer(1,n,AC.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;
 const s=AC.createBufferSource();s.buffer=b;const f=AC.createBiquadFilter();f.type='highpass';f.frequency.value=hp;const gn=AC.createGain();gn.gain.setValueAtTime(vol,t0);gn.gain.exponentialRampToValueAtTime(.0001,t0+dur);s.connect(f);f.connect(gn);gn.connect(dest||musicBus);s.start(t0)}
function audioInit(){
 if(AC){if(AC.state==='suspended')AC.resume();return}
 const C=window.AudioContext||window.webkitAudioContext;if(!C)return;AC=new C();
 master=AC.createGain();master.gain.value=muted?0:.55;master.connect(AC.destination);
 lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=18000;lp.connect(master);
 const dl=AC.createDelay(1),fb=AC.createGain(),wet=AC.createGain();dl.delayTime.value=.33;fb.gain.value=.35;wet.gain.value=.35;
 musicBus=AC.createGain();musicBus.gain.value=.65;musicBus.connect(lp);musicBus.connect(dl);dl.connect(fb);fb.connect(dl);dl.connect(wet);wet.connect(lp);
 nextT=AC.currentTime+.1;astep=0;setInterval(()=>{while(nextT<AC.currentTime+.15){playStep(astep,nextT);nextT+=STEP;astep++}},25)}
function playStep(s,t0){
 const bar=Math.floor(s/16)%4,k=s%16,ch=CH[bar],hot=st==='play'&&coins>=10;
 if(k===0){ch.forEach(n=>tone(NOTE(n+12),t0,STEP*15.5,'triangle',.05,musicBus,.7));tone(NOTE(BASS[bar]),t0,STEP*6,'sine',.3,musicBus,.02)}
 if(k===8)tone(NOTE(BASS[bar]),t0,STEP*4,'sine',.24,musicBus,.02);
 if(k%2===0){const i=k/2;tone(NOTE(ch[i%3]+12+(i%4===3?12:0)),t0,STEP*3,'triangle',.075,musicBus,.005)}
 if(hot&&k%4===2)tone(NOTE(LEAD[bar][k>>2]),t0,STEP*3.5,'sine',.1,musicBus,.01);
 if(st==='play'&&k%4===0&&coins>=5)tone(150,t0,.14,'sine',.45,musicBus,.002,45);
 if(st==='play'&&k%4===2&&coins>=5)noise(t0,.05,.07,7000)}
function mus(m){if(!AC)return;const n=AC.currentTime;lp.frequency.cancelScheduledValues(n);lp.frequency.setTargetAtTime(m==='dead'?450:18000,n,.12);musicBus.gain.setTargetAtTime(m==='play'?1:.65,n,.3)}
function sfxCoin(){if(!AC||muted)return;const n=AC.currentTime,b=[81,84,86,88,91][coins%5];tone(NOTE(b),n,.18,'sine',.22,master,.005);tone(NOTE(b+7),n+.07,.22,'sine',.2,master,.005)}
function sfxHit(){if(!AC||muted)return;const n=AC.currentTime;noise(n,.5,.5,200,master);tone(220,n,.5,'sawtooth',.3,master,.005,40)}
function sfxWin(){if(!AC||muted)return;const n=AC.currentTime;[69,72,76,81,84,88,93].forEach((m,i)=>tone(NOTE(m),n+i*.09,.6,'triangle',.2,master,.01))}
const mu=document.getElementById('mu');
function muIcon(){mu.textContent=muted?'🔇':'🔊'}muIcon();
mu.onclick=()=>{muted=!muted;try{localStorage.setItem('starliMute',muted?'1':'0')}catch(e){}muIcon();if(!muted)audioInit();if(master)master.gain.setTargetAtTime(muted?0:.55,AC.currentTime,.05)};
document.addEventListener('visibilitychange',()=>{if(!AC)return;document.hidden?AC.suspend():AC.resume()});
const ov=document.getElementById('ov'),intro=document.getElementById('intro'),$=id=>document.getElementById(id);
function goMenu(){if(intro.style.display!=='flex')return;intro.style.display='none';ov.style.display='flex';audioInit();mus('calm')}
intro.onclick=goMenu;
const LVB=[...document.querySelectorAll('#lv button')];
function setLevel(i){lvl=i;GOAL=LV[i].goal;try{localStorage.setItem('starliLvl',i)}catch(e){}
 LVB.forEach((b,k)=>b.classList.toggle('sel',k===i));$('ld').textContent=LV[i].desc;
 $('s').textContent='Best: '+bests[i]+' / '+GOAL+(done[i]?' · Portal reached ✓':'')+'   ('+done.map((x,k)=>LV[k].name+(x?' ✓':'')).join(' · ')+')'}
LVB.forEach((b,k)=>b.onclick=()=>setLevel(k));
function show(h,a,b,btn){$('h').textContent=h;$('p1').textContent=a;$('p2').textContent=b;$('b').textContent=btn;
 setLevel(lvl);ov.style.display='flex'}
function menu(){show('Starli Run','Guide Starli to the “The Next Chapter” portal. Collect Soneium and Startale logos and dodge the red shards.','Tap the top or bottom half of the screen, or use the ↑ ↓ keys. The further you go, the harder it gets. Best played in landscape.','Start Game')}
function start(){safe=1;audioInit();mus('play');coins=0;items=[];parts=[];pops=[];lane=1;py=LY[1];t=0;dist=0;lastSpawn=0;winT=0;dieT=0;shake=0;flash=0;st='play';ov.style.display='none'}
function over(){st='over';if(coins>bests[lvl]){bests[lvl]=coins;try{localStorage.setItem('starliBest'+KS[lvl],coins)}catch(e){}}
 show('Shard Hit!','Logos collected: '+coins+' / '+GOAL,'You flew '+Math.round(dist/10)+' m. Try again and reach the portal this time.','Try Again')}
function win(){st='win';winT=0;sfxWin();mus('calm');bests[lvl]=GOAL;done[lvl]=true;try{localStorage.setItem('starliBest'+KS[lvl],GOAL);localStorage.setItem('starliPortal'+KS[lvl],'1')}catch(e){}}
$('b').onclick=start;
function steer(d){if(st==='play')lane=Math.max(0,Math.min(2,lane+d))}
cv.addEventListener('pointerdown',e=>{const r=cv.getBoundingClientRect();steer(e.clientY<r.top+r.height/2?-1:1)});
addEventListener('keydown',e=>{const k=e.key;if(intro.style.display==='flex'){if(k==='Enter'||k===' ')goMenu();return}if(k==='ArrowUp'||k==='w')steer(-1);else if(k==='ArrowDown'||k==='s')steer(1);else if(st==='menu'||st==='over'||(st==='win'&&winT>=125)){if(k==='1'||k==='2'||k==='3')setLevel(+k-1);else if(k==='Enter'||k===' ')start()}});
const spd=()=>{const L=LV[lvl];return Math.min(L.base+coins*L.k,L.cap)};
function burst(x,y,n,cols,sp){for(let i=0;i<n;i++)parts.push({x,y,vx:(Math.random()-.5)*sp,vy:(Math.random()-.5)*sp,l:28+Math.random()*24,m:52,c:cols[i%cols.length],r:1.5+Math.random()*2.6})}
let safe=1;
function spawn(){
 // The "safe" lane drifts by at most one lane per row, so there is always a reachable gap
 safe=Math.max(0,Math.min(2,safe+Math.floor(Math.random()*3)-1));
 const L=LV[lvl],op=Math.min(L.opM,L.opB+coins*L.opK),amp=coins>=L.sway?Math.min(40,(coins-L.sway+5)*1.2):0;
 for(let i=0;i<3;i++){
  const c=()=>items.push({k:'c',lane:i,x:W+40,y:LY[i],s:Math.random()<.5?0:1,ph:Math.random()*6,amp,bl:coins>=L.blink});
  if(i===safe){if(Math.random()<.92)c()}
  else if(Math.random()<op)items.push({k:'o',lane:i,x:W+40,y:LY[i],sd:Math.random()*99});
  else if(Math.random()<L.bonus)c();
 }}
function update(){
 t++;const v=st==='play'?spd():(st==='dying'?.4:1.4);
  shake*=.9;flash*=.93;
 for(const p of parts){p.x+=p.vx;p.y+=p.vy;p.vx*=.96;p.vy*=.96;p.l--}parts=parts.filter(p=>p.l>0);
 pops.forEach(p=>{p.y-=1;p.l--});pops=pops.filter(p=>p.l>0);
 if(st==='play'){
  dist+=v;py+=(LY[lane]-py)*.3;
  if(t%2===0){const f=t%4?[-28,61]:[-3,66];parts.push({x:PXX+f[0],y:py+f[1]+10,vx:-1.8-v*.3,vy:1.5+Math.random()*1.5,l:24,m:24,c:['#ffb84d','#52f0ff','#ffffff'][t%3],r:1.4+Math.random()*2})}
  if(dist-lastSpawn>Math.max(LV[lvl].gmin,LV[lvl].gap-coins*LV[lvl].gk,v*LV[lvl].gm)){lastSpawn=dist;spawn()}
  for(const it of items){it.x-=v;if(it.k==='c'&&it.amp)it.y=LY[it.lane]+Math.sin(t*.05+it.ph)*it.amp;
   const dx=Math.abs(it.x-PXX),dy=Math.abs(it.y-py);
   if(it.k==='c'){if(dx<36&&dy<42&&(!it.bl||Math.sin(t*.15+it.ph)>-.3)){it.dead=1;coins++;sfxCoin();pops.push({x:it.x,y:it.y,l:30});burst(it.x,it.y,14,it.s?RC:['#52f0ff','#e58cf0','#e6ec8a'],6)}}
   else if(dx<28&&dy<38){burst(PXX,py,46,['#ff4d6d','#ffb84d','#ffffff'],10);shake=16;flash=.8;flashC='255,60,90';st='dying';dieT=0;sfxHit();mus('dead');return}}
  items=items.filter(i=>!i.dead&&i.x>-50);
  if(coins>=GOAL)win();
 }else if(st==='dying'){dieT++;if(dieT>55)over()}
 else if(st==='win'){winT++;if(winT===95){flash=1;flashC='255,255,255';burst(PTX,PTY,70,RC,12)}
  if(winT===125)show('You reached the portal!','Every piece plays a part.','The next chapter starts here: The Next Chapter · 26 Oct','Play Again')}
}
function rr(x,y,w,h,r){g.beginPath();g.roundRect(x,y,w,h,r)}
function coin(it){g.save();let a=1;if(it.bl&&Math.sin(t*.15+it.ph)<-.3)a=.25;g.globalAlpha=a;g.translate(it.x,it.y);
 const hl=g.createRadialGradient(0,0,4,0,0,42);hl.addColorStop(0,'rgba(255,230,140,.5)');hl.addColorStop(1,'rgba(255,230,140,0)');g.fillStyle=hl;g.fillRect(-42,-42,84,84);
 g.scale(Math.max(.4,Math.abs(Math.cos(t*.045+it.ph))),1);g.shadowColor='#ffd25a';g.shadowBlur=16;g.drawImage(it.s?IMG.b:IMG.a,-25,-25,50,50);g.restore()}
function shard(it){g.save();g.translate(it.x,it.y);g.rotate(Math.sin(t*.03+it.sd)*.4+it.sd);
 const pts=[];for(let i=0;i<8;i++){const a=i*Math.PI/4,r=(i%2?15:27)+Math.sin(it.sd*3+i*2.1)*5;pts.push([Math.cos(a)*r,Math.sin(a)*r])}
 g.shadowColor='#ff4d6d';g.shadowBlur=18;
 const gr=g.createLinearGradient(-26,-26,26,26);gr.addColorStop(0,'#3b0f2c');gr.addColorStop(.5,'#12081f');gr.addColorStop(1,'#5a1236');
 g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();g.fillStyle=gr;g.fill();g.lineWidth=2.4;g.strokeStyle='#ff4d6d';g.stroke();
 g.shadowBlur=0;g.lineWidth=1;g.strokeStyle='rgba(255,120,150,.55)';g.beginPath();pts.forEach((p,i)=>{if(i%2===0){g.moveTo(0,0);g.lineTo(p[0],p[1])}});g.stroke();
 const cg=g.createRadialGradient(0,0,0,0,0,11);cg.addColorStop(0,'rgba(255,200,210,'+(.7+.3*Math.sin(t*.12+it.sd))+')');cg.addColorStop(1,'rgba(255,77,109,0)');g.fillStyle=cg;g.beginPath();g.arc(0,0,11,0,7);g.fill();
 g.restore()}
function flame(lx,fl){
 g.save();g.shadowColor='#ffb84d';g.shadowBlur=20;
 const o=g.createLinearGradient(0,64,0,64+fl);o.addColorStop(0,'#ffffff');o.addColorStop(.2,'#9ff6ff');o.addColorStop(.55,'#ff9a3c');o.addColorStop(1,'rgba(255,80,30,0)');
 g.fillStyle=o;g.beginPath();g.moveTo(lx-8,64);g.quadraticCurveTo(lx-9,64+fl*.6,lx,64+fl);g.quadraticCurveTo(lx+9,64+fl*.6,lx+8,64);g.closePath();g.fill();
 g.shadowBlur=0;const c=g.createLinearGradient(0,64,0,64+fl*.6);c.addColorStop(0,'#ffffff');c.addColorStop(1,'rgba(127,243,255,0)');
 g.fillStyle=c;g.beginPath();g.moveTo(lx-4,64);g.quadraticCurveTo(lx-4,64+fl*.35,lx,64+fl*.6);g.quadraticCurveTo(lx+4,64+fl*.35,lx+4,64);g.closePath();g.fill();g.restore()}
function hero(x,y,s,al,rot){
 g.save();g.globalAlpha=al;const hv=Math.sin(t*.1);
 g.translate(x,y+hv*4*s);g.rotate(.2+rot+hv*.02);g.scale(s,s);
 // foot thrusters (behind the boots)
 flame(-15,28+6*Math.sin(t*.7)+Math.random()*7);flame(10,28+6*Math.sin(t*.7+1.7)+Math.random()*7);
 // character, facing right
 g.shadowColor='rgba(82,240,255,.75)';g.shadowBlur=16+4*Math.sin(t*.08);
 const h=138,w=h*IMG.s.width/IMG.s.height;g.save();g.scale(-1,1);g.drawImage(IMG.s,-w/2,-h/2,w,h);g.restore();g.restore()}
function blob(x,y,r,ph){g.beginPath();for(let a=0;a<=6.3;a+=.08){const q=r+Math.sin(a*9+t*.08+ph)*r*.05;g.lineTo(x+Math.cos(a)*q,y+Math.sin(a)*q)}g.closePath()}
function portal(r,al){g.save();
 const gl=g.createRadialGradient(PTX,PTY,0,PTX,PTY,r*2);gl.addColorStop(0,'rgba(255,255,255,.9)');gl.addColorStop(.45,'rgba(150,200,255,.4)');gl.addColorStop(1,'rgba(0,0,0,0)');
 g.globalAlpha=al;g.fillStyle=gl;g.beginPath();g.arc(PTX,PTY,r*2,0,7);g.fill();
 if(g.createConicGradient)for(let k=0;k<3;k++){const cg=g.createConicGradient(t*(k%2?-.02:.03)+k,PTX,PTY);RC.forEach((c,i)=>cg.addColorStop(i/8,c));cg.addColorStop(1,RC[0]);
  g.strokeStyle=cg;g.globalAlpha=al*(.95-k*.28);g.lineWidth=8-k*2.5;blob(PTX,PTY,r*(1+k*.13),k);g.stroke()}
 g.globalAlpha=al;const ig=g.createRadialGradient(PTX,PTY,0,PTX,PTY,r);ig.addColorStop(0,'#ffffff');ig.addColorStop(1,'#cfe3ff');g.fillStyle=ig;blob(PTX,PTY,r*.97,0);g.fill();
 const ls=r*1.2*(1+.03*Math.sin(t*.08));g.drawImage(IMG.a,PTX-ls/2,PTY-ls/2,ls,ls);g.restore()}
function draw(){
 const p=Math.min(1,coins/GOAL),v=st==='play'?spd():1.4;
 g.save();if(shake>.5)g.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
 const bg=g.createLinearGradient(0,0,W,0);bg.addColorStop(0,'#04061a');bg.addColorStop(1,'#0b1236');g.fillStyle=bg;g.fillRect(-20,-20,W+40,H+40);
 
 g.fillStyle='rgba(120,140,255,.05)';LY.forEach(y=>g.fillRect(0,y-52,W,104));
 g.save();g.setLineDash([18,14]);g.lineDashOffset=dist%32;g.strokeStyle='rgba(82,240,255,.2)';g.lineWidth=1.5;[85,195,305,415].forEach(y=>{g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke()});g.restore();
 let pr=30+p*62;if(st==='win')pr=92+Math.min(winT,125)*.8;
 portal(pr,.55+p*.45);
 for(const q of parts){g.globalAlpha=Math.max(0,q.l/q.m);g.fillStyle=q.c;g.shadowColor=q.c;g.shadowBlur=8;g.beginPath();g.arc(q.x,q.y,q.r,0,7);g.fill()}g.globalAlpha=1;g.shadowBlur=0;
 items.forEach(i=>i.k==='c'?coin(i):shard(i));
 if(st==='win'){const k=Math.min(1,winT/90),e=k*k*(3-2*k);hero(PXX+(PTX-PXX)*e,py+(PTY-py)*e,1-.88*e,1-.5*e,e*.6)}
 else if(st!=='dying'||dieT%6<4)hero(PXX,py,1,1,(LY[lane]-py)*.004);
 g.textAlign='center';g.font='700 20px sans-serif';pops.forEach(q=>{g.fillStyle='rgba(255,210,90,'+q.l/30+')';g.fillText('+1',q.x,q.y)});
 if(st==='play'||st==='win'||st==='dying'){
  g.drawImage(IMG.a,18,14,28,28);g.textAlign='left';g.fillStyle='#f2f5ff';g.font='700 20px sans-serif';g.fillText(coins+' / '+GOAL,54,36);
  g.textAlign='right';g.font='600 14px sans-serif';g.fillStyle='rgba(242,245,255,.75)';g.fillText(LV[lvl].name,W-70,34);
  const bw=690;g.fillStyle='rgba(255,255,255,.12)';rr(40,H-26,bw,8,4);g.fill();
  const pg=g.createLinearGradient(40,0,730,0);RC.forEach((c,i)=>pg.addColorStop(i/7,c));g.fillStyle=pg;rr(40,H-26,Math.max(8,bw*p),8,4);g.fill();
  [GOAL/3,GOAL*2/3].forEach(m=>{g.fillStyle='rgba(255,255,255,.4)';g.fillRect(40+bw*m/GOAL-1,H-29,2,14)});
  g.drawImage(IMG.b,742,H-38,30,30)}
 g.restore();
 const vg=g.createRadialGradient(W/2,H/2,H*.45,W/2,H/2,W*.65);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.5)');g.fillStyle=vg;g.fillRect(0,0,W,H);
 if(flash>.02){g.fillStyle='rgba('+flashC+','+flash*.55+')';g.fillRect(0,0,W,H)}
}
let last=0,acc=0;
function loop(ts){acc+=Math.min(ts-last,50);last=ts;while(acc>=16.67){update();acc-=16.67}draw();requestAnimationFrame(loop)}
let loaded=0;for(const k in SRC){const i=new Image();i.onload=()=>{if(++loaded===3){menu();ov.style.display='none';intro.style.display='flex';requestAnimationFrame(loop)}};i.src=SRC[k];IMG[k]=i}
