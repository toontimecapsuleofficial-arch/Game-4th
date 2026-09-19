'use strict';

/* ===== CrazyGames SDK integration (vanilla, self-contained, fails gracefully) ===== */
const CG = {
  sdk: null, ready:false,
  async init(){
    try{
      if(window.CrazyGames && window.CrazyGames.SDK){
        await window.CrazyGames.SDK.init();
        this.sdk = window.CrazyGames.SDK;
        this.ready = true;
        try{ this.sdk.game.loadingStop(); }catch(e){}
        console.log('[CG] SDK ready');
      }
    }catch(e){ console.log('[CG] SDK init failed', e); }
    if(!this.ready){
      // still call loadingStop mock so game feels fast
      try{ if(window.CrazyGames && window.CrazyGames.SDK && window.CrazyGames.SDK.game.loadingStop) window.CrazyGames.SDK.game.loadingStop(); }catch(e){}
    }
  },
  gameplayStart(){ try{ this.ready && this.sdk.game.gameplayStart(); }catch(e){} },
  gameplayStop(){ try{ this.ready && this.sdk.game.gameplayStop(); }catch(e){} },
  happytime(){ try{ this.ready && this.sdk.game.happytime(); }catch(e){} },
  loadingStart(){ try{ this.ready && this.sdk.game.loadingStart(); }catch(e){} },
  requestAd(type){ try{ if(this.ready && this.sdk.ad) return this.sdk.ad.requestAd(type); }catch(e){} return Promise.resolve(); }
};
CG.init();
/* expose for other scripts */
window.CG = CG;

/* ================= utils ================= */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const el=(t,c)=>{const e=document.createElement(t);if(c)e.className=c;return e};
const icon=(n,c='')=>`<svg class="ic ${c}"><use href="#i-${n}"/></svg>`;
const fmt=n=>Math.round(n).toLocaleString('en-US');
const pad=n=>String(n).padStart(2,'0');
const hexCache={};
const hexA=(h,a)=>{const c=hexCache[h]||(hexCache[h]=[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]);return `rgba(${c[0]},${c[1]},${c[2]},${a})`};
const hslChip=h=>`hsl(${h} 70% 88%)`;
function mulberry32(seed){let a=seed>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const hash=n=>{n=(typeof n==='string'?[...n].reduce((a,c)=>a*31+c.charCodeAt(0),7):n)>>>0;return (n*2654435761^0x9E3779B9)>>>0};
function bump(e){e.classList.remove('bump');void e.offsetWidth;e.classList.add('bump')}
const NAVY='#263259';
const COL={green:'#3FB84E',amber:'#EBA61C',red:'#E8465A',sun:'#FFCE2E',sky:'#45B5E5'};
const STARP='M12 3.4 14.6 8.5 20.2 9.3 16.1 13.3 17.1 18.9 12 16.2 6.9 18.9 7.9 13.3 3.8 9.3 9.4 8.5Z';
const starRow=k=>{let s='';for(let i=0;i<3;i++)s+=`<svg class="ns ${i<k?'f':''}" viewBox="0 0 24 24"><path d="${STARP}"/></svg>`;return s};
function rr(c,x,y,w,h,r){r=Math.min(r,w/2,h/2);c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}

/* ================= save ================= */
const LS='beatcraft_v1';
function defaultSave(){return{tut:0,stars:new Array(1001).fill(0),levelBest:new Array(1001).fill(0),coins:150,gems:2,skins:['classic'],skin:'classic',trails:['classic'],trail:'classic',instr:[],instrEq:null,
 power:{heart:0,slow:0,auto:0,shield:0,revive:0,combo:0,magnet:0},
 booster:{left:0},scoreBoost:{left:0},
 settings:{music:true,sfx:true,motion:matchMedia('(prefers-reduced-motion: reduce)').matches,shapes:true,assist:0,haptics:true},
 streak:{last:'',count:0,best:0,days:[],freeze:0},challenge:{date:'',today:0,coinDay:''},chalAT:{best:0,date:''},
 xp:0,rank:1,firstWin:{date:''},lastVisit:'',
 wheel:{date:'',streak:0},missions:{date:'',list:[]},
 loot:{clears:0,pending:0,opened:0},
 weekly:{weekStart:'',cleared:0,claimed:false},
 perfectStreak:0,bestPerfectStreak:0,
 modes:{gauntletBest:0,endlessBestScore:0,endlessBestBpm:0,hardcoreBest:0},
 stats:{totalScore:0,notes:0,perfects:0,bestCombo:0,plays:0,coinsEarned:0,challenges:0,flawless:0,playDays:0,missionsDone:0,spins:0,lootOpened:0},badges:{}}}
let S=defaultSave();
try{const raw=localStorage.getItem(LS);if(raw){S=(function deep(base,d){for(const k in d){if(d[k]&&typeof d[k]==='object'&&!Array.isArray(d[k])&&base[k]&&typeof base[k]==='object')base[k]=deep(base[k],d[k]);else base[k]=d[k]}return base})(defaultSave(),JSON.parse(raw))}}catch(e){}
function saveSave(){try{localStorage.setItem(LS,JSON.stringify(S))}catch(e){}}
const clearedCount=()=>{let c=0;for(let i=1;i<=1000;i++)if(S.stars[i])c++;return c};
const totalStars=()=>{let c=0;for(let i=1;i<=1000;i++)c+=S.stars[i];return c};
const currentLevel=()=>{for(let i=1;i<=1000;i++)if(!S.stars[i])return i;return 1000};
const dstr=d=>d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
const todayStr=()=>dstr(new Date());
function mondayOf(d){const x=new Date(d);const wd=(x.getDay()+6)%7;x.setDate(x.getDate()-wd);x.setHours(0,0,0,0);return x}

/* ================= haptics ================= */
function haptic(pat){
 if(!S.settings.haptics||!navigator.vibrate)return;
 const P={tap:8,hit:12,great:[9,14],perfect:[10,20,14],combo:[16,30,16],miss:24,buy:[8,40,8],
  hold:[8,10,18],flow:[12,18,12,18],
  reward:[12,30,12,30,20],levelup:[16,40,16,40,30],fail:[30,60,30],select:6};
 try{navigator.vibrate(P[pat]||10)}catch(e){}
}

/* ================= rank / xp ================= */
const RANK_STEP=250;
const xpForRank=r=>Math.round(RANK_STEP*(1+ (r-1)*0.32));
function gainXp(n){
 if(n<=0)return;
 S.xp+=n;let leveled=false;
 while(S.xp>=xpForRank(S.rank)){S.xp-=xpForRank(S.rank);S.rank++;leveled=true}
 if(leveled)rankUpModal();
 saveSave();
}
function rankUpModal(){
 haptic('levelup');A.fanfare();
 toast('Rank up! You\'re now Rank '+S.rank,'crown','amber');
 confettiBurst();
}

/* ================= confetti / screen shake (DOM) ================= */
function confettiBurst(n){
 if(S.settings.motion)return;
 n=n||26;
 const cols=['#45B5E5','#FFCE2E','#FF6B81','#4EC467','#8A5BFF'];
 const host=$('#app');
 for(let i=0;i<n;i++){
  const p=el('span','confetti-bit');
  const c=cols[i%cols.length];
  const startX=40+Math.random()*20;
  p.style.left=startX+'%';
  p.style.background=c;
  p.style.setProperty('--rot',(Math.random()*360)+'deg');
  p.style.setProperty('--drift',((Math.random()*2-1)*120)+'px');
  p.style.animationDelay=(Math.random()*160)+'ms';
  p.style.animationDuration=(900+Math.random()*500)+'ms';
  host.appendChild(p);
  setTimeout(()=>p.remove(),1700);
 }
}
function shakeEl(sel){
 if(S.settings.motion)return;
 const e=$(sel);if(!e)return;
 e.classList.remove('shakeit');void e.offsetWidth;e.classList.add('shakeit');
 setTimeout(()=>e.classList.remove('shakeit'),420);
}

/* ================= combo milestones (called from Engine) ================= */
function triggerScreenFlash(kind){
 const el=document.getElementById('screenFlash');
 if(!el || S.settings.motion) return;
 el.className='';
 void el.offsetWidth;
 el.classList.add(kind==='miss'?'missFlash': kind==='good'?'goodFlash':'flash');
 el.classList.add('flash');
 setTimeout(()=>el.classList.remove('flash','missFlash','goodFlash'), 180);
}
function showComboMilestone(n){
 const el=document.getElementById('comboMilestone');
 if(!el || S.settings.motion) return;
 const msgs={10:'COMBO ×10!',25:'INCREDIBLE ×25!',50:'UNSTOPPABLE ×50!',100:'LEGENDARY ×100!',200:'GODLIKE ×200!'};
 let txt=msgs[n];
 if(!txt && n%100===0) txt='MEGA ×'+n+'!';
 if(!txt) return;
 el.innerHTML='<svg class="ic"><use href="#i-star"/></svg>'+txt;
 el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
 setTimeout(()=>el.classList.remove('show'), 900);
}
function laneMissFlash(lane){
 if(S.settings.motion) return;
 const stage=document.getElementById('stage');
 if(!stage) return;
 const d=document.createElement('div');
 d.className='laneMiss';
 d.style.left=(lane*25 + 1.5)+'%';
 d.style.width='22%';
 stage.appendChild(d);
 setTimeout(()=>d.remove(), 400);
}
function comboMilestone(n){
 if(n===10){haptic('combo'); triggerScreenFlash('good'); showComboMilestone(10)}
 else if(n===25){haptic('combo'); triggerScreenFlash('good'); showComboMilestone(25)}
 else if(n===50){haptic('combo'); triggerScreenFlash('good'); showComboMilestone(50); confettiBurst(18)}
 else if(n===100){haptic('combo'); triggerScreenFlash('good'); showComboMilestone(100); confettiBurst(26)}
 else if(n>0&&n%100===0){haptic('combo'); triggerScreenFlash('good'); showComboMilestone(n); confettiBurst(22)}
 else if(n===15 || n===30 || n===75){ showComboMilestone(n) }
}
/* ================= perfect-streak "flow" feedback (subtle, never pauses play) ================= */
function streakMilestone(n){
 if(n===3||n===5||n===10||(n>=20&&n%10===0)){A.streakAccent(n);haptic(n>=10?'flow':'great')}
}

/* ================= audio ================= */
const A={ctx:null,
 init(){if(this.ctx)return;
  try{
   const AC=window.AudioContext||window.webkitAudioContext;const c=this.ctx=new AC();
   const comp=c.createDynamicsCompressor();comp.threshold.value=-16;comp.ratio.value=5;comp.connect(c.destination);
   this.master=c.createGain();this.master.gain.value=.9;this.master.connect(comp);
   this.mus=c.createGain();this.mus.connect(this.master);
   this.fx=c.createGain();this.fx.connect(this.master);
   const n=c.createBuffer(1,c.sampleRate*.3,c.sampleRate),d=n.getChannelData(0);
   for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;this.noise=n;
   this.holdNodes={};this.padTier=0;
   this.vol();
  }catch(e){this.ctx=null}},
 resume(){if(this.ctx&&this.ctx.state==='suspended')this.ctx.resume().catch(()=>{})},
 now(){return this.ctx?this.ctx.currentTime:performance.now()/1000},
 vol(){if(!this.ctx)return;this.mus.gain.value=S.settings.music?.5:0;this.fx.gain.value=S.settings.sfx?.8:0},
 tone(t,f,o={}){const c=this.ctx;if(!c)return;
  const {type='sine',g=1,d=.3,a=.004,glide=null,gt=.06,bus='fx',lp=0,lpEnd=0}=o;
  const osc=c.createOscillator();osc.type=type;osc.frequency.setValueAtTime(Math.max(24,f),t);
  if(glide)osc.frequency.exponentialRampToValueAtTime(Math.max(24,glide),t+gt);
  const G=c.createGain();G.gain.setValueAtTime(.0001,t);G.gain.linearRampToValueAtTime(g,t+a);G.gain.exponentialRampToValueAtTime(.0008,t+a+d);
  let out=G;
  if(lp){const F=c.createBiquadFilter();F.type='lowpass';F.frequency.setValueAtTime(lp,t);if(lpEnd)F.frequency.exponentialRampToValueAtTime(lpEnd,t+d);G.connect(F);out=F}
  out.connect(bus==='mus'?this.mus:this.fx);osc.connect(G);osc.start(t);osc.stop(t+a+d+.1)},
 note(midi,inst,v=1,sus=1){
  if(!this.ctx||!S.settings.sfx)return;const t=this.ctx.currentTime;
  const f=440*Math.pow(2,(midi-69)/12);v=clamp(v,.05,1);
  switch(inst){
   case 'musicbox':this.tone(t,f*2,{g:.55*v,d:1.1*sus});this.tone(t,f*4.1,{g:.08*v,d:.3});break;
   case 'synth':this.tone(t,f,{type:'sawtooth',g:.38*v,d:.34*sus,lp:1500*v+500,lpEnd:300});break;
   case 'strings':this.tone(t,f*1.005,{type:'sawtooth',g:.2*v,d:.55*sus,a:.03,lp:2200});this.tone(t,f*.996,{type:'sawtooth',g:.2*v,d:.55*sus,a:.03,lp:2200});break;
   case 'choir':this.choir(t,f,v,sus);break;
   case 'bell':this.tone(t,f,{g:.5*v,d:1.2*sus});this.tone(t,f*2.42,{g:.2*v,d:.75});this.tone(t,f*4.6,{g:.07*v,d:.35});break;
   case 'perc':this.tone(t,f,{type:'triangle',g:.75*v,d:.22*sus,glide:f*2.3,gt:.05});break;
   case 'chip':this.tone(t,f,{type:'square',g:.22*v,d:.16*sus});break;
   case 'organ':this.tone(t,f,{g:.4*v,d:.6*sus,a:.01});this.tone(t,f*2,{g:.16*v,d:.6*sus,a:.01});this.tone(t,f*3,{g:.08*v,d:.6*sus,a:.01});break;
   case 'pluck':this.tone(t,f,{type:'triangle',g:.7*v,d:.26*sus});this.tone(t,f*2,{g:.1*v,d:.09});break;
   case 'steel':this.tone(t,f,{type:'triangle',g:.6*v,d:.4*sus});this.tone(t,f*1.5,{g:.2*v,d:.2});this.tone(t,f*2.76,{g:.07*v,d:.14});break;
   case 'harp':this.tone(t,f,{type:'triangle',g:.5*v,d:.8*sus});this.tone(t,f*2,{g:.1*v,d:.3});this.tone(t,f*3,{g:.05*v,d:.15});break;
   case 'kalimba':this.tone(t,f*2,{g:.45*v,d:.3});this.tone(t,f,{g:.28*v,d:.5*sus});break;
   case 'vibes':this.tone(t,f,{g:.5*v,d:1.1*sus});this.tone(t,f*3.01,{g:.07*v,d:.5});break;
   case 'flute':this.tone(t,f,{g:.45*v,d:.55*sus,a:.02});this.tone(t,f*2,{g:.05*v,d:.4});break;
   default:this.tone(t,f,{g:.8*v,d:.5*sus});this.tone(t,f*3.9,{g:.15*v,d:.12});
  }},
 choir(t,f,v,sus){const c=this.ctx;const o=c.createOscillator();o.frequency.value=f;
  const l=c.createOscillator();l.frequency.value=5.2;const lg=c.createGain();lg.gain.value=6;
  l.connect(lg);lg.connect(o.frequency);
  const G=c.createGain();G.gain.setValueAtTime(.0001,t);G.gain.linearRampToValueAtTime(.4*v,t+.09);G.gain.exponentialRampToValueAtTime(.0008,t+.89*sus);
  o.connect(G);G.connect(this.fx);o.start(t);l.start(t);o.stop(t+1.2*sus);l.stop(t+1.2*sus);
  this.tone(t,f*2,{g:.1*v,d:.7*sus,a:.09})},
 /* ---- funky backing-beat generators: kick, hi-hat, and a percussive,
    syncopated bass + muted-guitar "chuck" — this is the funky music bed
    that plays behind gameplay and the menus. ---- */
 kick(t){this.tone(t,115,{glide:46,gt:.1,g:.42,d:.16,bus:'mus'})},
 /* funky, percussive bass note — ghost notes are short & muted, accents pop with
    a quick pitch-up "snap" the way a slapped bass string does */
 bass(t,midi,accent,ghost,soft){
  const c=this.ctx;if(!c)return;
  const mul=soft?.6:1;
  const f=440*Math.pow(2,(midi-69)/12);
  const o=c.createOscillator();o.type='sawtooth';
  if(accent){o.frequency.setValueAtTime(f*1.05,t);o.frequency.exponentialRampToValueAtTime(f,t+.05)}
  else o.frequency.setValueAtTime(f,t);
  const F=c.createBiquadFilter();F.type='lowpass';F.Q.value=accent?3:1;
  F.frequency.setValueAtTime(accent?1600:ghost?420:850,t);
  F.frequency.exponentialRampToValueAtTime(ghost?260:220,t+(ghost?.07:.24));
  const g=c.createGain();const peak=(ghost?.09:accent?.27:.17)*mul;
  g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(peak,t+.006);
  g.gain.exponentialRampToValueAtTime(.0008,t+(ghost?.09:accent?.26:.19));
  o.connect(F);F.connect(g);g.connect(this.mus);o.start(t);o.stop(t+(ghost?.11:.3));
 },
 /* muted funk-guitar/clav "chuck" — a short filtered noise pluck for the off-beat skank */
 chuck(t,accent,soft){
  const c=this.ctx;if(!c)return;
  const mul=soft?.6:1;
  const s=c.createBufferSource();s.buffer=this.noise;
  const F=c.createBiquadFilter();F.type='bandpass';F.frequency.value=accent?1500:1100;F.Q.value=5;
  const g=c.createGain();g.gain.setValueAtTime((accent?.09:.05)*mul,t);g.gain.exponentialRampToValueAtTime(.0008,t+.045);
  s.connect(F);F.connect(g);g.connect(this.mus);s.start(t);s.stop(t+.06);
 },
 hat(t){const c=this.ctx;if(!c)return;const s=c.createBufferSource();s.buffer=this.noise;
  const F=c.createBiquadFilter();F.type='highpass';F.frequency.value=6800;
  const G=c.createGain();G.gain.setValueAtTime(.06,t);G.gain.exponentialRampToValueAtTime(.0008,t+.05);
  s.connect(F);F.connect(G);G.connect(this.mus);s.start(t);s.stop(t+.08)},
 click(t){this.tone(t,880,{type:'triangle',g:.25,d:.06})},
 ui(){if(this.ctx)this.tone(this.ctx.currentTime,620,{type:'triangle',g:.15,d:.05})},
 tick(){if(this.ctx)this.tone(this.ctx.currentTime,520,{type:'triangle',g:.1,d:.04})},
 spark(){if(!this.ctx)return;const t=this.ctx.currentTime;this.tone(t,2093,{g:.07,d:.09});this.tone(t+.03,2637,{g:.05,d:.09})},
 swish(){if(!this.ctx||!S.settings.sfx)return;const t=this.ctx.currentTime;this.tone(t,320,{type:'triangle',glide:980,gt:.09,g:.14,d:.1})},
 missThud(){if(!this.ctx||!S.settings.sfx)return;const t=this.ctx.currentTime;this.tone(t,150,{glide:62,gt:.12,g:.4,d:.2});this.tone(t,95,{glide:50,gt:.12,g:.3,d:.22})},
 comboSting(){if(!this.ctx||!S.settings.sfx)return;const t=this.ctx.currentTime;this.tone(t,784,{g:.16,d:.1,type:'triangle'});this.tone(t+.08,1046,{g:.16,d:.16,type:'triangle'})},
 coin(){if(!this.ctx||!S.settings.sfx)return;const t=this.ctx.currentTime;this.tone(t,988,{g:.15,d:.08,type:'triangle'});this.tone(t+.07,1319,{g:.15,d:.18,type:'triangle'})},
 star(i){if(!this.ctx||!S.settings.sfx)return;this.tone(this.ctx.currentTime,740+i*180,{g:.2,d:.25,type:'triangle'})},
 fanfare(){if(!this.ctx||!S.settings.sfx)return;const t=this.ctx.currentTime;[523,659,784,1046].forEach((f,i)=>this.tone(t+i*.09,f,{g:.2,d:.3,type:'triangle'}))},
 failSnd(){if(!this.ctx||!S.settings.sfx)return;const t=this.ctx.currentTime;this.tone(t,330,{g:.2,d:.3,type:'triangle'});this.tone(t+.25,233,{g:.2,d:.5,type:'triangle'})},
 hear(id){if(!this.ctx)return;[60,64,67,72].forEach((m,i)=>setTimeout(()=>this.note(m,id,1),i*130))},
 /* short chime accents for consecutive-PERFECT "flow" milestones (3/5/10/20+) — never interrupts play */
 streakAccent(n){
  if(!this.ctx||!S.settings.sfx)return;const t=this.ctx.currentTime;
  const sets={3:[988,1319],5:[880,1109,1319],10:[784,988,1175,1568]}[n]||[659,830,988,1245,1568];
  sets.forEach((f,i)=>this.tone(t+i*.045,f,{type:'triangle',g:.11,d:.22}));
 },
 /* ---- sustained HOLD tone removed: holding a note no longer plays a
    continuous tension tone. The short resolve/release chime is kept. ---- */
 holdStart(lane,midi,inst){},
 holdUpdate(lane,progress){},
 holdStop(lane){},
 holdRelease(lane,resolved,q){
  if(!this.ctx||!S.settings.sfx)return;
  const t=this.ctx.currentTime;
  if(resolved){const v=q==='perfect'?.9:q==='great'?.7:.5;this.tone(t,660*1.5,{g:.12*v,d:.28,type:'triangle'});this.tone(t+.03,880*1.5,{g:.09*v,d:.32,type:'triangle'});}
 },
 holdStopAll(){},
 /* ── idle "background" funk groove — plays behind the menus, reusing the
    same bassline/chuck patterns as gameplay but softer, so browsing the app
    still feels like music instead of silence. Self-schedules with a small
    lookahead timer since there's no game clock running in the menus. ── */
 idleTimerId:null,idleStep:0,idleNextTime:0,idleBpm:92,idleRoot:57,idleScale:[0,2,4,7,9],
 startIdleGroove(){
  if(!this.ctx||this.idleTimerId)return;
  this.idleStep=0;this.idleNextTime=this.ctx.currentTime+0.15;
  this.idleTimerId=setInterval(()=>this._idleTick(),90);
 },
 stopIdleGroove(){if(this.idleTimerId){clearInterval(this.idleTimerId);this.idleTimerId=null}},
 _idleTick(){
  if(!this.ctx||!S.settings.music||(typeof E!=='undefined'&&E&&E.running&&(E.state==='play'||E.state==='count'))){this.stopIdleGroove();return}
  const stepDur=60/this.idleBpm/4,SL=this.idleScale.length;
  while(this.idleNextTime<this.ctx.currentTime+0.3){
   const st=this.idleNextTime,step=this.idleStep%16,bar=Math.floor(this.idleStep/16),cyc=bar%4;
   const chordDeg=cyc<2?0:(SL>3?3:1);
   const hit=FUNK_BASS.find(f=>f.s===step);
   if(hit){
    let deg=chordDeg+(hit.deg||0),semis=0;
    if(hit.chrom){semis=-1;deg=chordDeg}
    const scaleTone=this.idleScale[((deg%SL)+SL)%SL]+semis;
    const midi=this.idleRoot-12+scaleTone+12*(hit.oct||0);
    this.bass(st,midi,!!hit.acc,!!hit.ghost,true);
    if(!hit.ghost)this.chuck(st+stepDur*.5,!!hit.acc,true);
   }
   this.idleStep++;this.idleNextTime+=stepDur;
  }
 },
 /* combo "building a song" tiers — no longer routes to a pad, kept as a no-op
    hook since the funky backing beat doesn't layer by combo */
 padIntensity(tier){this.padTier=tier},
 comboLayerJoin(tier){},
 startPad(rootMidi,scale){},
 stopPad(){
  this.holdStopAll();this.padTier=0;
  if(!this.padNodes)return;
  const c=this.ctx,t=c?c.currentTime:0,{g,lfo,drift,oscs}=this.padNodes;
  try{
   g.gain.cancelScheduledValues(t);g.gain.setValueAtTime(g.gain.value,t);g.gain.linearRampToValueAtTime(0,t+1.1);
   oscs.forEach(o=>o.stop(t+1.3));lfo.stop(t+1.3);drift.stop(t+1.3);
  }catch(e){}
  this.padNodes=null;
 }
};

/* ================= data ================= */
const SKINS=[
 {id:'classic',name:'Classic',cost:0,cur:'coins',desc:'Sky, sun, coral & grass — the originals.',lanes:['#45B5E5','#FFCE2E','#FF6B81','#4EC467']},
 {id:'sunset',name:'Sunset',cost:400,cur:'coins',desc:'Warm evening tones.',lanes:['#FF8A3C','#FFCE2E','#FF5E7E','#2EC4B6']},
 {id:'ocean',name:'Ocean',cost:400,cur:'coins',desc:'Cool water shades with a coral pop.',lanes:['#0E8FA8','#45B5E5','#2EC4B6','#FF8A5C']},
 {id:'candy',name:'Candy',cost:600,cur:'coins',desc:'Sweet-shop pastels.',lanes:['#FF6FB0','#FFA15C','#6ED0A0','#6FB1FF']},
 {id:'neon',name:'Neon',cost:800,cur:'coins',desc:'Electric night-club lanes.',lanes:['#8A5BFF','#00E5FF','#FF3D9E','#7CFF5B']},
 {id:'forest',name:'Forest',cost:800,cur:'coins',desc:'Deep woodland greens.',lanes:['#1F7A4D','#5FBF77','#9CDB7A','#2EC4B6']},
 {id:'bubblegum',name:'Bubblegum',cost:1000,cur:'coins',desc:'Bubblegum pinks with mint.',lanes:['#FF7EB9','#FF9ED2','#7FE3D0','#FFB3C6']},
 {id:'festive',name:'Festive',cost:6,cur:'gems',desc:'Party confetti hues.',lanes:['#FF5E5E','#FFCE2E','#4EC467','#45B5E5']},
 {id:'prism',name:'Prism',cost:12,cur:'gems',desc:'High-contrast, colour-safe set.',lanes:['#0072B2','#E69F00','#009E73','#D55E00']},
 {id:'royal',name:'Royal',cost:9,cur:'gems',desc:'Purple velvet and gold.',lanes:['#6C4AB6','#9B72CF','#FFCE2E','#4A2C82']},
];
const skin=()=>SKINS.find(s=>s.id===S.skin)||SKINS[0];
const TRAILS=[
 {id:'classic',name:'Classic',cost:0,cur:'coins',desc:'Round bursts with mixed shapes.',ic:'note',c:'var(--navy)'},
 {id:'stars',name:'Star Pop',cost:300,cur:'coins',desc:'Every burst becomes chunky stars.',ic:'star',c:'var(--sun)'},
 {id:'hearts',name:'Heart Burst',cost:350,cur:'coins',desc:'Hits explode into little hearts.',ic:'heart',c:'var(--coral)'},
 {id:'confetti',name:'Confetti',cost:8,cur:'gems',desc:'Party shapes in all lane colors.',ic:'spark',c:'var(--grass)'},
 {id:'bubbles',name:'Bubbles',cost:4,cur:'gems',desc:'Soft floating bubble pops.',ic:'bubble',c:'var(--sky)'},
];
const trail=()=>TRAILS.find(t=>t.id===S.trail)||TRAILS[0];
const INSTRPACKS=[
 {id:'synth',name:'Synth Pack',cost:500,desc:'Buzzing saw leads on any level.'},
 {id:'musicbox',name:'Music Box Pack',cost:600,desc:'Twinkling music-box tones.'},
 {id:'steel',name:'Steel Drum Pack',cost:550,desc:'Sunny Caribbean steel tones.'},
 {id:'harp',name:'Harp Pack',cost:650,desc:'Gliding, glittering harp runs.'},
 {id:'strings',name:'String Pack',cost:700,desc:'Warm layered strings.'},
 {id:'kalimba',name:'Kalimba Pack',cost:700,desc:'Soft wooden thumb-piano plinks.'},
 {id:'vibes',name:'Vibraphone Pack',cost:750,desc:'Dreamy shimmering bells.'},
 {id:'choir',name:'Choir Pack',cost:800,desc:'Soft rounded vocal tones.'},
 {id:'flute',name:'Flute Pack',cost:850,desc:'Breathy, gentle flute lines.'},
 {id:'bell',name:'Bell Pack',cost:900,desc:'Bright sparkling chimes.'},
 {id:'organ',name:'Organ Pack',cost:950,desc:'Full, warm church-organ chords.'},
 {id:'chip',name:'Arcade Pack',cost:1000,desc:'Crunchy retro chip leads.'},
];
const POWERUPS=[
 {id:'heart',name:'Extra Heart',cost:150,icon:'heart',desc:'+1 life for one level.'},
 {id:'slow',name:'Slow Beat',cost:200,icon:'clock',desc:'Tempo −25% for one level.'},
 {id:'shield',name:'Combo Shield',cost:250,icon:'shield',desc:'Your first miss is forgiven.'},
 {id:'magnet',name:'Coin Magnet',cost:250,icon:'coin',desc:'+50% coins for one level.'},
 {id:'auto',name:'Auto-Perfect',cost:300,icon:'bolt',desc:'3 hits count as Perfect.'},
 {id:'combo',name:'Combo Kickstart',cost:300,icon:'flame',desc:'Begin the level at a ×10 combo.'},
 {id:'revive',name:'Second Chance',cost:400,icon:'spark',desc:'Refill all hearts once when you run out.'},
];
const BOOSTERS=[
 {id:'double',name:'Coin Doubler',cost:350,desc:'Level coins ×2 for the next 5 levels.'},
 {id:'scoredouble',name:'Score Doubler',cost:500,desc:'Level score ×2 for the next 5 levels.'},
];
const WHEEL_REWARDS=[
 {type:'coins',amt:30,w:30,label:'+30 coins',ic:'coin'},
 {type:'coins',amt:60,w:22,label:'+60 coins',ic:'coin'},
 {type:'coins',amt:120,w:12,label:'+120 coins',ic:'coin'},
 {type:'gems',amt:1,w:14,label:'+1 gem',ic:'gem'},
 {type:'gems',amt:3,w:4,label:'+3 gems!',ic:'gem'},
 {type:'freeze',amt:1,w:10,label:'+1 Streak Freeze',ic:'shield'},
 {type:'coins',amt:250,w:3,label:'JACKPOT +250 coins!',ic:'coin'},
];
const WHEEL_COLORS=['#45B5E5','#FFCE2E','#FF6B81','#4EC467','#8A5BFF','#FF8A3C','#2EC4B6'];
const WHEEL_SEGS=(()=>{
 const tot=WHEEL_REWARDS.reduce((a,r)=>a+r.w,0);let acc=0;const segs=[];
 WHEEL_REWARDS.forEach((r,i)=>{
  const span=r.w/tot*360;
  segs.push({r,start:acc,end:acc+span,mid:acc+span/2,col:WHEEL_COLORS[i%WHEEL_COLORS.length]});
  acc+=span;
 });
 return segs;
})();
function wheelPt(cx,cy,r,deg){const rad=deg*Math.PI/180;return [cx+r*Math.sin(rad),cy-r*Math.cos(rad)]}
function buildWheelMarkup(){
 const cx=60,cy=60,r=57,iconR=38;let out='';
 for(const seg of WHEEL_SEGS){
  const [x0,y0]=wheelPt(cx,cy,r,seg.start),[x1,y1]=wheelPt(cx,cy,r,seg.end);
  const large=(seg.end-seg.start)>180?1:0;
  out+=`<path d="M${cx},${cy} L${x0.toFixed(2)},${y0.toFixed(2)} A${r},${r} 0 ${large} 1 ${x1.toFixed(2)},${y1.toFixed(2)} Z" fill="${seg.col}" stroke="#263259" stroke-width="2.4"/>`;
 }
 for(const seg of WHEEL_SEGS){
  const [ix,iy]=wheelPt(cx,cy,iconR,seg.mid);
  out+=`<use href="#i-${seg.r.ic}" x="${(ix-10).toFixed(2)}" y="${(iy-10).toFixed(2)}" width="20" height="20" style="color:#263259"/>`;
 }
 return out;
}
let wheelRotation=0,wheelBuilt=false;
function ensureWheelBuilt(){
 if(wheelBuilt)return;
 $('#wheel-rotor').innerHTML=buildWheelMarkup();
 wheelBuilt=true;
}
function renderWheel(){
 ensureWheelBuilt();
 const t=todayStr(),spun=S.wheel.date===t;
 const btn=$('#wheel-btn');
 $('#wheel-sub').textContent=spun?'Come back tomorrow':'Free spin ready!';
 btn.textContent=spun?'SPUN':'SPIN';
 btn.disabled=spun;
 btn.classList.toggle('ghost',spun);
 $('#wheel-stage').classList.toggle('ready',!spun);
}
function spinWheel(){
 const t=todayStr();
 if(S.wheel.date===t){toast('Already spun today — come back tomorrow','clock','amber');return}
 ensureWheelBuilt();
 const btn=$('#wheel-btn'),stage=$('#wheel-stage');
 btn.disabled=true;A.ui();haptic('select');
 stage.classList.remove('ready');stage.classList.add('spinning');
 const tot=WHEEL_SEGS.reduce((a,s)=>a+s.r.w,0);
 let x=Math.random()*tot,seg=WHEEL_SEGS[WHEEL_SEGS.length-1];
 for(const s of WHEEL_SEGS){if((x-=s.r.w)<0){seg=s;break}}
 const spins=5+Math.floor(Math.random()*2);
 wheelRotation=Math.ceil(wheelRotation/360)*360+spins*360+(360-seg.mid)%360;
 $('#wheel-rotor').style.transform=`rotate(${wheelRotation}deg)`;
 setTimeout(()=>{
  stage.classList.remove('spinning');
  const r=seg.r;
  if(r.type==='coins'){S.coins+=r.amt;S.stats.coinsEarned+=r.amt}
  else if(r.type==='gems'){S.gems+=r.amt}
  else if(r.type==='freeze'){S.streak.freeze=(S.streak.freeze||0)+r.amt}
  S.wheel.date=t;S.stats.spins=(S.stats.spins||0)+1;
  gainXp(6);
  updateWallets();renderStreak();renderWheel();
  const big=r.w<=5;
  toast(r.label,r.ic,'green');
  haptic(big?'reward':'buy');
  if(big)confettiBurst(30);
  checkBadges();saveSave();
 },3200);
}
$('#wheel-btn').addEventListener('click',spinWheel);
const BASE=[['Wood','marimba'],['Music Box','musicbox'],['Synth','synth'],['Drum','perc'],['Strings','strings'],['Choir','choir'],['Chime','bell'],['Arcade','chip'],['Organ','organ'],['Pluck','pluck']];
const GEN=['Salsa','Reggae','Disco','Funk','Techno','Jazz','Waltz','Bossa','March','Swing','Tango','Polka','Soul','Rave','Lounge','Baroque','Folk','Motown','Ska','Trance','Gospel','Celtic','Bolero','Fusion','Samba','Opera','Chiptune','Flamenco','Mariachi','K-Pop'];
const WORLDS=[];
for(let i=0;i<40;i++){
 const g=i<10?BASE[i]:[GEN[i-10],BASE[i%10][1]];
 WORLDS.push({name:g[0]+' World',inst:g[1],hue:Math.round(i*9)%360});
}
const BADGES=[
 {id:'first',n:'First Clear',ic:'star',c:'var(--sun)',test:()=>clearedCount()>=1},
 {id:'c50',n:'Combo 50',ic:'flame',c:'var(--coral)',test:()=>S.stats.bestCombo>=50},
 {id:'c100',n:'Combo 100',ic:'bolt',c:'var(--sun)',test:()=>S.stats.bestCombo>=100},
 {id:'fc',n:'Flawless',ic:'trophy',c:'var(--grass)',test:()=>S.stats.flawless>=1},
 {id:'world',n:'World Tour',ic:'map',c:'var(--sky)',test:()=>WORLDS.some((w,i)=>{for(let k=1;k<=25;k++)if(!S.stars[i*25+k])return false;return true})},
 {id:'s7',n:'Week Streak',ic:'cal',c:'var(--coral)',test:()=>S.streak.best>=7},
 {id:'rich',n:'Coin Bank',ic:'coin',c:'var(--sun)',test:()=>S.stats.coinsEarned>=1000},
 {id:'st100',n:'Star Hunter',ic:'star',c:'var(--sky)',test:()=>totalStars()>=100},
 {id:'l100',n:'Century',ic:'trophy',c:'var(--grass)',test:()=>clearedCount()>=100},
 {id:'chal',n:'Challenger',ic:'note',c:'var(--coral)',test:()=>S.stats.challenges>=1},
 {id:'l500',n:'Halfway Hero',ic:'map',c:'var(--sky)',test:()=>clearedCount()>=500},
 {id:'l1000',n:'Beat Legend',ic:'trophy',c:'var(--sun)',test:()=>clearedCount()>=1000},
 {id:'rank10',n:'Rank 10',ic:'crown',c:'var(--amber)',test:()=>S.rank>=10},
];
const diffTier=n=>n<60?0:n<250?1:n<550?2:n<800?3:4;
const DIFF=['EASY','GROOVE','TRICKY','FIERCE','WILD'];

/* ================= level generation ================= */
function isBossLevel(n){return n%25===0}
function levelParams(n){
 const finale=n%50===0, breath=(n%10===0)&&!finale;
 const boss=isBossLevel(n);
 let bpm=(78+96*(1-Math.exp(-n/320)))*(breath?0.82:1)*(finale?1.1:1);
 bpm=clamp(bpm,70,182);
 return {n,bpm,
  lanes:4,
  good:clamp(0.21-0.115*(1-Math.exp(-n/380)),0.095,0.21),
  chord:n<300?0:clamp((n-300)/1400,0,0.22),
  synco:n<250?0:clamp((n-250)/1600,0,0.35),
  density:clamp(1.9-1.15*(1-Math.exp(-n/450)),0.75,1.9),
  dur:34+20*(1-Math.exp(-n/380)),
  approach:clamp(2.0-0.7*(n/1000),1.3,2.0),
  tchange:n>600&&!boss,finale,breath,boss,
  dist:n>=300?Math.min(8,Math.floor((n-280)/120)+3):0};
}
/* ALL note types are live from level 1: weights ramp gently with level number,
   and a guarantee pass makes sure every level contains all five types. */
function genEvents(P,rnd,scale,root){
 // === Level 1 beginner-friendly override: first 30s extremely easy ===
 if(P.n===1){
  const spb=60/P.bpm, totalBeats=Math.ceil((P.dur+6)/spb);
  const bt=b=>b*spb;
  const evts=[]; let e=4; const phrase=[0,1,2,3,2,1,0,2]; let mi=0;
  const lanesCycle=[0,1,2,3,1,2,0,3];
  // FIRST 30 SECONDS: only single taps, wide spacing, one at a time
  const introEndBeat = 30/spb; // ~30 sec
  while(e<introEndBeat){
   const lane = lanesCycle[mi % lanesCycle.length];
   evts.push({t:bt(e), lane, type:'tap', dur:0, midi:60 + (phrase[mi%8]%5)});
   mi++; e += 1.25 + rnd()*0.6; // very spaced, easy to read
  }
  // 30-45s: gently introduce hold
  while(e<introEndBeat+12){
   const isHold = (mi%5===0);
   const lane = Math.floor(rnd()*4);
   if(isHold) evts.push({t:bt(e), lane, type:'hold', dur:spb*1.2, midi:62});
   else evts.push({t:bt(e), lane, type:'tap', dur:0, midi:64});
   mi++; e += 1.1 + rnd()*0.5;
  }
  // 45s-end: introduce double & swipe sparingly
  while(e<totalBeats-3){
   const r=rnd();
   const lane=Math.floor(rnd()*4);
   if(r<0.75) evts.push({t:bt(e), lane, type:'tap', dur:0, midi:60+Math.floor(rnd()*5)});
   else if(r<0.85) evts.push({t:bt(e), lane, type:'double', dur:0, dt:spb*0.5, midi:64});
   else if(r<0.92) evts.push({t:bt(e), lane, type:'swipe', dir:rnd()<.5?-1:1, midi:65});
   else evts.push({t:bt(e), lane, type:'hold', dur:spb*1.1, midi:67});
   e += 0.95 + rnd()*0.6;
  }
  evts.sort((a,b)=>a.t-b.t);
  const last=evts[evts.length-1];
  return {evts,dur:last?last.t+(last.dur||0)+1.6:P.dur,spb};
 }

 const spb=60/P.bpm, SL=scale.length, n=P.n;
 const totalBeats=Math.ceil((P.dur+6)/spb);

 /* ── tempo-change map (unchanged from original) ── */
 const change=(P.tchange&&rnd()<0.5)?{at:totalBeats*0.55,f:rnd()<0.5?1.1:0.93}:null;

 /* ── boss levels: song is split into 3 escalating phases (same total   ──
    length as a normal level). Each phase compresses beat-spacing a bit
    more than the last, so the track itself audibly speeds up/tightens
    every third — a musical "boss gets harder" ramp. ── */
 const boss=!!P.boss, bossB1=totalBeats/3, bossB2=totalBeats*2/3, bossF1=1.12, bossF2=1.3;
 const bt=b=>{
  if(boss){
   if(b<=bossB1)return b*spb;
   if(b<=bossB2)return bossB1*spb+(b-bossB1)*spb/bossF1;
   return bossB1*spb+(bossB2-bossB1)*spb/bossF1+(b-bossB2)*spb/bossF2;
  }
  return change&&b>change.at?change.at*spb+(b-change.at)*spb/change.f:b*spb;
 };
 const bossPhaseOf=b=>!boss?0:(b<bossB1?0:b<bossB2?1:2);
 const BOSS_DENSE=[1,0.82,0.62];      /* smaller = notes packed tighter   */
 const BOSS_CHORD=[0,0.06,0.14];      /* extra simultaneous-note chance   */
 const BOSS_SYNCO=[0,0.08,0.18];      /* extra off-beat chance            */

 /* ── musical PHRASE (8 melodic degrees that repeat and evolve) ── */
 const phrase=[];let d=2+Math.floor(rnd()*4);
 for(let i=0;i<8;i++){phrase.push(d);const r=rnd();d=clamp(d+(r<.34?1:r<.68?-1:0),0,SL*2-1)}

 /* ── lane spacing ── */
 const lastT=[-99,-99,-99,-99];
 const minSame=clamp(spb*(1.45-n/1400),0.42,1.25);
 const pickLane=(now,avoid,prefer)=>{
  const ok=[];
  for(let l=0;l<4;l++){if(l===avoid)continue;if(now-lastT[l]>=minSame)ok.push(l)}
  if(!ok.length){let best=0,g=-1;for(let l=0;l<4;l++)if(now-lastT[l]>g){g=now-lastT[l];best=l}return best}
  if(prefer!==undefined&&ok.includes(prefer))return prefer;
  if(rnd()<0.25)return ok[Math.floor(rnd()*ok.length)];
  let best=ok[0],g=-1;for(const l of ok)if(now-lastT[l]>g){g=now-lastT[l];best=l}
  return best;
 };

 /* ── type weights (identical ramp to original so save/level balance unchanged) ── */
 const ramp=Math.min(1,(n-1)/220);
 const wT=8,wH=2.2+3.8*ramp,wD=1.8+3.2*ramp,wS=1.8+3.2*ramp,wR=1.6+2.6*ramp,tot=wT+wH+wD+wS+wR;
 const pickType=(bias)=>{
  /* bias: 0=normal, 1=simple(tap-heavy), 2=dense, 3=break(hold+release) */
  let r=rnd()*tot;
  if(bias===1){r=rnd()*(wT*2+wH*.4+wD*.3+wS*.3+wR*.3)}
  if(bias===3){r=rnd()*(wT*.3+wH*2.2+wD*.1+wS*.3+wR*2.2)}
  if((r-=bias===1?wT*2:wT)<0)return 'tap';
  if((r-=bias===1?wH*.4:bias===3?wH*2.2:wH)<0)return 'hold';
  if((r-=bias===1?wD*.3:wD)<0)return 'double';
  if((r-=bias===1?wS*.3:wS)<0)return 'swipe';
  return 'release';
 };

 /* ── MUSICAL SECTIONS ─────────────────────────────────────────────
    Each level is divided into five sections proportional to its length.
    The section shapes density, type bias, and gap so the player feels a
    musical arc rather than a flat stream.  Motifs and call-and-response
    are threaded in without changing any timing constants so old scores
    remain valid.
    ─────────────────────────────────────────────────────────────────── */
 const TB=totalBeats;
 /* section boundaries (beat indices) */
 const SEC={
  intro:{start:0,       end:TB*0.14},  /* simple, establishes rhythm     */
  build:{start:TB*0.14, end:TB*0.38},  /* density climbs, motifs emerge  */
  main: {start:TB*0.38, end:TB*0.68},  /* peak density + call-and-response*/
  brk:  {start:TB*0.68, end:TB*0.78},  /* breath — sparse, hold-heavy     */
  finale:{start:TB*0.78,end:TB-3  },   /* energetic finish, accent notes  */
 };
 const sectionOf=b=>{
  if(b<SEC.intro.end)return 'intro';
  if(b<SEC.build.end)return 'build';
  if(b<SEC.main.end)return 'main';
  if(b<SEC.brk.end)return 'brk';
  return 'finale';
 };

 /* ── RHYTHMIC MOTIFS ──────────────────────────────────────────────
    A small library of beat-offset patterns.  The generator picks one
    motif per phrase-cycle and stamps it into the stream.  Each motif is
    a list of {beatOffset, laneOffset} (lane is relative, so +1 means one
    lane to the right of the motif's anchor lane).
    ─────────────────────────────────────────────────────────────────── */
 const MOTIFS=[
  /* repeated beat */       [{b:0,l:0},{b:1,l:0},{b:2,l:0}],
  /* alternating LR */      [{b:0,l:0},{b:1,l:2},{b:2,l:0},{b:3,l:2}],
  /* burst (fast pair) */   [{b:0,l:0},{b:.5,l:1}],
  /* pause→hit */           [{b:0,l:0},{b:2,l:1}],
  /* rising run */          [{b:0,l:0},{b:1,l:1},{b:2,l:2},{b:3,l:3}],
  /* descending run */      [{b:0,l:3},{b:1,l:2},{b:2,l:1},{b:3,l:0}],
  /* call (tap-tap) */      [{b:0,l:0},{b:1,l:1}],
  /* answer (hold) */       [{b:0,l:2,forceHold:true}],
 ];
 /* pick a stable-per-level motif sequence using rnd (deterministic) */
 const motifSeq=[Math.floor(rnd()*6),Math.floor(rnd()*6),Math.floor(rnd()*6)];
 let motifPhase=0,motifBeat=-99,motifAnchorLane=0;
 const tryPlantMotif=(e,lane)=>{
  /* only plant a new motif every ~4 phrase steps in build/main/finale */
  if(motifPhase>=motifSeq.length)return false;
  if(e<motifBeat+4)return false;
  motifBeat=e;motifAnchorLane=lane;motifPhase++;
  return true;
 };

 /* ── CALL-AND-RESPONSE tracker ── */
 let lastCallType=null,callCount=0;

 /* ── main event loop ── */
 const evts=[];let e=4+rnd()*2,mi=0;
 const minGap=n>450?0.5:0.75;

 while(e<totalBeats-3){
  const sec=sectionOf(e);
  const bp=bossPhaseOf(e);

  /* density multiplier per section, tightened further each boss phase */
  const densityMult=(sec==='intro'?.72:sec==='build'?0.88:sec==='main'?1:sec==='brk'?.55:1.08)*BOSS_DENSE[bp];
  const typeBias=boss&&bp>0?0:(sec==='intro'?1:sec==='brk'?3:0);

  const syncoChance=boss?Math.min(0.6,P.synco+BOSS_SYNCO[bp]):P.synco;
  const chordChance=boss?Math.min(0.5,P.chord+BOSS_CHORD[bp]):P.chord;
  const sync=rnd()<syncoChance?0.5:0;
  const type=pickType(typeBias);
  const t=bt(e+sync);
  const lane=pickLane(t);

  let deg=phrase[mi%8];const rep=Math.floor(mi/8);
  if(rep>0&&rnd()<.22)deg=clamp(deg+(rnd()<.5?1:-1),0,SL*2-1);
  const midi=root+scale[deg%SL]+12*Math.floor(deg/SL);
  let span=0;

  /* mark accent note: first beat of FINALE or motif anchor */
  const isAccent=(sec==='finale'&&mi===0)||motifBeat===e;

  if(type==='hold'||type==='release'){
   const hb=rnd()<.3?2:1;
   span=bt(e+sync+hb)-t;
   evts.push({t,lane,type,dur:span,midi,accent:!!isAccent});
  }else if(type==='double'){
   span=clamp(spb*0.5,0.22,0.4);
   evts.push({t,lane,type,dur:0,dt:span,midi,accent:!!isAccent});
  }else if(type==='swipe'){
   /* call-and-response: if last was call, make answer go opposite dir */
   const dir=lastCallType==='call'&&callCount===1?(rnd()<.5?-1:1):rnd()<.5?-1:1;
   evts.push({t,lane,type,dir,midi,accent:!!isAccent});
   lastCallType=null;callCount=0;
  }else{
   evts.push({t,lane,type,dur:0,midi,accent:!!isAccent});
   /* chord (unchanged logic) */
   if(rnd()<chordChance){
    const l2=pickLane(t,lane);
    const d2=clamp(deg+2,0,SL*2-1);
    evts.push({t,lane:l2,type:'tap',dur:0,midi:root+scale[d2%SL]+12*Math.floor(d2/SL)});
    lastT[l2]=t;
   }
   /* call-and-response (only in main section, sparingly) */
   if(sec==='main'&&rnd()<0.10){
    if(!lastCallType){lastCallType='call';callCount=1;}
    else{lastCallType=null;callCount=0;}
   }
  }

  lastT[lane]=t+span;
  mi++;

  /* gap: section shapes how quickly the next note arrives */
  const baseGap=Math.max(minGap,P.density*densityMult*(0.65+rnd()*0.7));
  e+=baseGap+span+(type==='double'?0.45:0);
 }

 evts.sort((a,b)=>a.t-b.t);

 /* ── guarantee all five types appear in every level (unchanged) ── */
 const have={};for(const x of evts)have[x.type]=1;
 const need=['hold','double','swipe','release'].filter(k=>!have[k]);
 for(const ty of need){
  let conv=0;
  for(let i=Math.floor(evts.length*0.2);i<evts.length-2&&conv<2;i++){
   const x=evts[i];
   if(x.type!=='tap')continue;
   const nxt=evts.find(o=>o!==x&&o.lane===x.lane&&o.t>x.t);
   if(nxt&&nxt.t<x.t+spb*1.3)continue;
   x.type=ty;
   if(ty==='hold'||ty==='release')x.dur=spb;
   if(ty==='double')x.dt=clamp(spb*0.5,0.22,0.4);
   if(ty==='swipe')x.dir=rnd()<.5?-1:1;
   conv++;
  }
 }

 /* ── mark the final 3 notes as accents for the ending sequence ── */
 for(let i=Math.max(0,evts.length-3);i<evts.length;i++)evts[i].accent=true;

 const last=evts[evts.length-1];
 return {evts,dur:last?last.t+(last.dur||0)+1.6:P.dur,spb};
}
function buildLevel(n,opts={}){
 const P=levelParams(n);
 if(opts.slow)P.bpm=clamp(P.bpm*0.75,60,182);
 const rnd=mulberry32(hash(n));
 const w=WORLDS[Math.floor((n-1)/25)];
 const scale=n<150?[0,2,4,7,9]:n<400?[0,3,5,7,10]:n<700?[0,2,3,5,7,9,10]:[0,2,3,5,7,8,11];
 const root=57+((n-1)%12);
 const {evts,dur,spb}=genEvents(P,rnd,scale,root);
 return {n,bpm:Math.round(P.bpm),spb,dur,evts,approach:P.approach,good:P.good,world:w,inst:w.inst,
  finale:P.finale,boss:P.boss,dist:P.dist,lanesCount:P.lanes,root,scale};
}
function buildChallenge(){
 const seed=hash(todayStr()),rnd=mulberry32(seed);
 const insts=['marimba','synth','strings','chip','musicbox','pluck'];
 const P={n:9999,bpm:106,lanes:4,good:.165,chord:.16,synco:.22,density:1.15,dur:42,approach:1.75,tchange:false,dist:5};
 const {evts,dur,spb}=genEvents(P,rnd,[0,2,4,7,9],60);
 return {n:0,challenge:true,bpm:106,spb,dur,evts,approach:1.75,good:.165,world:{name:'Daily Challenge',hue:210},
  inst:insts[seed%insts.length],finale:false,dist:5,lanesCount:4,root:60,scale:[0,2,4,7,9]};
}
function buildDemo(k){
 const rnd=mulberry32(hash(k));
 const P={n:200,bpm:104,lanes:4,good:.2,chord:.14,synco:.25,density:1.55,dur:26,approach:1.8,tchange:false,dist:0};
 const {evts,dur,spb}=genEvents(P,rnd,[0,3,5,7,10],59);
 const insts=['marimba','synth','pluck','chip'];
 return {n:180,bpm:104,spb,dur,evts,approach:1.8,good:.2,world:{name:'Demo',hue:200},inst:insts[k%4],finale:false,dist:0,lanesCount:4};
}
function buildZen(seed){
 const rnd=mulberry32(hash('zen'+seed));
 const P={n:0,bpm:78,lanes:4,good:.24,chord:.05,synco:.08,density:1.75,dur:120,approach:2.0,tchange:false,dist:6};
 const {evts,dur,spb}=genEvents(P,rnd,[0,2,4,7,9,11],60);
 return {n:0,zen:true,bpm:78,spb,dur,evts,approach:2.0,good:.24,world:{name:'Zen Garden',hue:150},
  inst:'marimba',finale:false,dist:6,lanesCount:4,root:60,scale:[0,2,4,7,9,11]};
}
/* Endless: an infinite chain of ~24-beat segments generated on the fly.
   Each segment's BPM is a bit higher than the last, so the whole run feels
   like one continuously-accelerating track until the player fails. */
function buildEndlessSegment(seed,idx){
 const rnd=mulberry32(hash('endless'+seed+'_'+idx));
 const bpm=clamp(96+idx*5,96,220);
 const P={n:0,bpm,lanes:4,good:clamp(.19-idx*.004,.09,.19),chord:clamp(.05+idx*.01,0,.3),
  synco:clamp(.08+idx*.012,0,.4),density:clamp(1.5-idx*.03,.7,1.5),dur:16,approach:clamp(1.9-idx*.02,1.25,1.9),
  tchange:false,dist:Math.min(8,3+Math.floor(idx/3))};
 const {evts,dur,spb}=genEvents(P,rnd,[0,2,4,7,9],57+idx%12);
 return {n:0,endless:true,segIdx:idx,bpm:Math.round(bpm),spb,dur,evts,approach:P.approach,good:P.good,
  world:{name:'Endless Groove',hue:20},inst:['synth','chip','pluck','marimba'][idx%4],finale:false,dist:P.dist,lanesCount:4,root:57,scale:[0,2,4,7,9]};
}
function buildTutorial(){
 const bpm=88;
 return {n:0,tutorial:true,bpm,spb:60/bpm,dur:3600,evts:[],approach:1.9,good:.215,
  world:{name:'Tutorial',hue:210},inst:'marimba',finale:false,dist:0,lanesCount:4};
}

/* ================= game engine ================= */
const CW=540,CH=760,LANES=4,LANE_W=CW/LANES,HIT_Y=632,NOTE_R=36,HOLD_W=46;
function shapePath(c,sh,s){
 c.beginPath();
 if(sh===0)c.arc(0,0,s/2,0,Math.PI*2);
 else if(sh===1){c.moveTo(0,-s*.62);c.lineTo(s*.55,s*.4);c.lineTo(-s*.55,s*.4);c.closePath()}
 else if(sh===2)rr(c,-s/2,-s/2,s,s,s*.25);
 else if(sh===4){const k=s/2;c.moveTo(0,k*.85);c.bezierCurveTo(-k*1.15,k*.25,-k*.85,-k*.85,0,-k*.3);c.bezierCurveTo(k*.85,-k*.85,k*1.15,k*.25,0,k*.85);c.closePath()}
 else{for(let i=0;i<10;i++){const r=i%2?s*.24:s*.6,a=i*Math.PI/5-Math.PI/2;c[i?'lineTo':'moveTo'](Math.cos(a)*r,Math.sin(a)*r)}c.closePath()}
}
function drawGlyph(c,lane,s){
 c.fillStyle=NAVY;c.strokeStyle=NAVY;
 if(lane===0){c.lineWidth=Math.max(3,s*.45);c.beginPath();c.arc(0,0,s*.9,0,Math.PI*2);c.stroke()}
 else if(lane===1){c.beginPath();c.moveTo(-s,-s*.7);c.lineTo(s,-s*.7);c.lineTo(0,s);c.closePath();c.fill()}
 else if(lane===2){c.beginPath();c.moveTo(0,-s);c.lineTo(s,0);c.lineTo(0,s);c.lineTo(-s,0);c.closePath();c.fill()}
 else c.fillRect(-s*.75,-s*.75,s*1.5,s*1.5);
}
function drawNoteBall(c,col,r,lane){
 c.fillStyle=col;c.strokeStyle=NAVY;c.lineWidth=6;
 c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.fill();c.stroke();
 c.fillStyle='rgba(255,255,255,.9)';
 c.beginPath();c.arc(-r*.34,-r*.36,r*.24,0,Math.PI*2);c.fill();
 if(S.settings.shapes)drawGlyph(c,lane,r*.42);
}
function judgeIcon(c,ic,col){
 c.save();c.lineCap='round';c.lineJoin='round';
 if(ic==='star'){c.translate(0,26);shapePath(c,3,22);c.fillStyle=col;c.fill();c.strokeStyle=NAVY;c.lineWidth=3.5;c.stroke();c.restore();return}
 if(ic==='shield'){c.translate(0,24);c.beginPath();c.moveTo(0,-11);c.lineTo(9,-7.5);c.lineTo(9,1);c.quadraticCurveTo(9,8,0,11);c.quadraticCurveTo(-9,8,-9,1);c.lineTo(-9,-7.5);c.closePath();c.fillStyle=col;c.fill();c.strokeStyle=NAVY;c.lineWidth=3;c.stroke();c.restore();return}
 const draw=(w,col2)=>{c.strokeStyle=col2;c.lineWidth=w;c.beginPath();
  if(ic==='check'){c.moveTo(-11,1);c.lineTo(-3,9);c.lineTo(12,-8)}
  else if(ic==='cross'){c.moveTo(-9,-9);c.lineTo(9,9);c.moveTo(9,-9);c.lineTo(-9,9)}
  else{c.moveTo(-12,0);c.quadraticCurveTo(-6,-9,0,0);c.quadraticCurveTo(6,9,12,0)}
  c.stroke()};
 c.translate(0,26);draw(8,NAVY);draw(4.5,col);c.restore();
}
/* particle look for the equipped trail style */
function trailLook(col){
 const tr=S.trail||'classic';
 if(tr==='stars')return {shapes:[3],cols:[col,COL.sun,'#FFFFFF',col]};
 if(tr==='hearts')return {shapes:[4],cols:[col,'#FF6B81','#FFFFFF',COL.sun]};
 if(tr==='confetti')return {shapes:[2,1],cols:skin().lanes.concat(['#FFFFFF'])};
 if(tr==='bubbles')return {shapes:[0],cols:['#FFFFFF',col,'#DFF3FF']};
 return {shapes:[0,1,2],cols:[col,col,'#FFFFFF',COL.sun]};
}
/* 16-step (one bar) funky bass groove: a classic syncopated "boom-chick" pattern —
   accented root on the downbeat, muted ghost notes filling the off-beats, and a
   chromatic passing tone sliding back into the next bar's root. */
const FUNK_BASS=[
 {s:0, deg:0,oct:0,acc:1,always:1},
 {s:3, deg:0,oct:0,ghost:1},
 {s:4, deg:2,oct:0,ghost:1},
 {s:6, deg:0,oct:0,acc:1},
 {s:7, deg:0,oct:1,ghost:1},
 {s:10,deg:4,oct:0,ghost:1},
 {s:12,deg:0,oct:0,acc:1,always:1},
 {s:14,deg:0,oct:0,ghost:1,chrom:1},
];
class Engine{
 constructor(cv,o={}){
  this.cv=cv;this.c=cv.getContext('2d');this.demo=!!o.demo;this.onFinish=o.onFinish||null;this.hud=o.hud||null;
  const dpr=Math.min(2,window.devicePixelRatio||1);
  cv.width=CW*dpr;cv.height=CH*dpr;this.c.scale(dpr,dpr);
  this.running=false;this.paused=false;this.state='idle';
  this.parts=[];this.pops=[];this.rings=[];this.amb=[];this.deco=[];
  this.padFlash=[0,0,0,0];this.strayT={};this.tutTarget=null;
  this.bindInput();this.loop=this.loop.bind(this);
 }
 clock(){return this.demo?performance.now()/1000:A.now()}
 laneX(l){return l*LANE_W+LANE_W/2}
 mult(){return 1+Math.min(2,Math.floor(this.combo/10)*.5)}
 grade(ad){return ad<=this.perfW?'perfect':ad<=this.greatW?'great':'good'}
 gradeCol(q){return q==='perfect'?COL.sun:q==='great'?COL.green:COL.amber}
 gradeLabel(q){return q==='perfect'?'PERFECT':q==='great'?'GREAT':'GOOD'}
 /* consecutive-PERFECT "flow" tracking — pure feedback, never touches gameplay pacing */
 trackStreak(q){
  if(q==='perfect'){
   this.perfectStreak++;
   if(this.perfectStreak===3||this.perfectStreak===5||this.perfectStreak===10||(this.perfectStreak>=20&&this.perfectStreak%10===0)){
    this.rings.push({x:CW/2,y:HIT_Y-90,r:30,vr:this.perfectStreak>=10?260:190,a:this.perfectStreak>=10?.5:.35});
    if(!this.demo)streakMilestone(this.perfectStreak);
   }
  }else this.perfectStreak=0;
 }
 /* combo "building a song" tiers — musical layers only, no score/rule changes */
 updateComboTier(){
  const t=this.combo>=30?4:this.combo>=20?3:this.combo>=10?2:this.combo>=5?1:0;
  if(t!==this.comboTier){
   this.comboTier=t;
   if(!this.demo&&t>0){A.padIntensity(t);A.comboLayerJoin(t)}
   else if(!this.demo)A.padIntensity(0);
  }
 }
 resetFlow(){
  this.perfectStreak=0;this.comboTier=0;
  if(!this.demo)A.padIntensity(0);
 }
 /* fires once per musical beat — drives the small DOM pulses on the HUD so they
    track the actual song tempo instead of a generic animation loop */
 onBeat(){
  if(this.demo||!this.hud||S.settings.motion)return;
  const h=this.hud;
  if(h.comboBox){h.comboBox.classList.remove('beatp');void h.comboBox.offsetWidth;h.comboBox.classList.add('beatp')}
  if(h.fillWrap){h.fillWrap.classList.remove('beatp');void h.fillWrap.offsetWidth;h.fillWrap.classList.add('beatp')}
 }
 start(level,mods={}){
  this.level=level;this.mods=mods;this.challenge=!!level.challenge;
  this.curPhase=0;
  const as=1+S.settings.assist*0.2;
  const hcTight=mods.hardcore?0.62:1;
  this.goodW=level.good*as*hcTight;this.perfW=this.goodW*.34;this.greatW=this.goodW*.66;this.nearW=this.goodW*1.8;
  this.speed=(HIT_Y+90)/level.approach;
  this.notes=level.evts.map(e=>({t:e.t,lane:e.lane,type:e.type,dur:e.dur,dt:e.dt||0,dir:e.dir||0,midi:e.midi,accent:!!e.accent,state:0,q:null,mt:0}));
  this.holds={};this.pointers={};
  if(mods.carry){
   this.score=mods.carry.score||0;this.maxCombo=mods.carry.maxCombo||0;this.combo=0;
   this.lives=mods.carry.lives;
   this.counts={...mods.carry.counts};
  }else{
   this.score=0;this.combo=mods.combo?10:0;this.maxCombo=this.combo;
   this.lives=mods.zen?99:mods.heart?4:3;
   this.counts={perfect:0,great:0,good:0,miss:0,partial:0,hold:0,forgiven:0};
  }
  this.perfectStreak=0;this.comboTier=0;this.lastBeatIndex=-1;this.flowGlow=0;
  this.mBeat=-4;this.mStep=-16;this.ended=false;this.shake=0;this.trailT=0;this.strayT={};this.tutTarget=null;
  this.parts.length=0;this.pops.length=0;this.rings.length=0;this.amb.length=0;this.deco.length=0;
  this.inst=mods.instr||level.inst;
  // fast, musical: reduced count-in for instant feel, but keep musicality
  this.countIn = this.mods.tut ? Math.max(2*level.spb, level.approach*.6) : Math.max(2.2*level.spb, level.approach*.75);
  // Level 1 beginner: even shorter count-in
  if(level.n===1) this.countIn = Math.max(1.6*level.spb, 1.1);
  this.songStart=this.clock()+this.countIn+.12;
  this.sn=-this.countIn;this.state='count';this.paused=false;this.running=true;this.lastTs=performance.now();
  if(level.dist&&!S.settings.motion)for(let i=0;i<level.dist;i++)
   this.amb.push({x:Math.random()*CW,y:Math.random()*CH,v:18+Math.random()*30,r:Math.random()*6.3,vr:(Math.random()-.5)*1.5,s:9+Math.random()*16,sh:i%3});
  if(!S.settings.motion&&level.world){
   const w=level.world,wIdx=Math.max(0,Math.floor((level.n-1)/25)),baseSh=wIdx%5;
   for(let i=0;i<7;i++)
    this.deco.push({x:Math.random()*CW,y:Math.random()*CH,v:5+Math.random()*8,s:15+Math.random()*22,
     sh:(baseSh+i)%5,sway:Math.random()*Math.PI*2,swaySpd:.25+Math.random()*.35,hue:w.hue});
  }
  if(!this.demo){
   this.setHud(true);
   if(mods.combo)setTimeout(()=>{if(this.running&&!this.paused)this.pop(CW/2,CH*.32,'COMBO KICKSTART!',COL.sun,'star',true)},(this.countIn+0.6)*1000);
   A.stopIdleGroove();
  }
  cancelAnimationFrame(this.raf);this.raf=requestAnimationFrame(this.loop);
 }
 spawnNote(spec){
  const t=this.sn+this.level.approach+0.4;
  const nt={t,lane:spec.lane,type:spec.type,dur:spec.dur||0,
   dt:spec.dt||clamp(this.level.spb*.5,.22,.4),
   dir:spec.dir!==undefined?spec.dir:(spec.type==='swipe'?(Math.random()<.5?-1:1):0),
   midi:spec.midi||60,state:0,q:null,mt:0};
  this.notes.push(nt);
  this.notes.sort((a,b)=>a.t-b.t);
  return nt;
 }
 bindInput(){
  const cv=this.cv;
  cv.addEventListener('pointerdown',e=>{
   e.preventDefault();if(this.demo)return;
   const r=cv.getBoundingClientRect();
   const lane=clamp(Math.floor((e.clientX-r.left)/r.width*LANES),0,LANES-1);
   if(this.pointers[e.pointerId])return;
   this.pointers[e.pointerId]={lane,sx:e.clientX,sy:e.clientY,flicked:false};
   try{cv.setPointerCapture(e.pointerId)}catch(_){}
   this.laneDown(lane);
  });
  cv.addEventListener('pointermove',e=>{
   const p=this.pointers[e.pointerId];
   if(!p||p.flicked||this.demo||this.paused)return;
   const r=cv.getBoundingClientRect(),k=CW/Math.max(1,r.width);
   const dx=(e.clientX-p.sx)*k,dy=(e.clientY-p.sy)*k;
   if(Math.abs(dx)>=34&&Math.abs(dx)>Math.abs(dy)*0.75){
    p.flicked=true;
    this.onFlick(p.lane,Math.sign(dx));
   }
  });
  const up=e=>{const p=this.pointers[e.pointerId];if(p){delete this.pointers[e.pointerId];this.laneUp(p.lane)}};
  window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);
  window.addEventListener('keydown',e=>{
   if(this.demo||this.paused)return;
   if(e.key==='ArrowLeft'||e.key==='ArrowRight'){
    if(e.repeat||this.state!=='play'||this.ended)return;
    e.preventDefault();
    this.keyFlick(e.key==='ArrowLeft'?-1:1);
    return;
   }
   const i='dfjk'.indexOf(e.key.toLowerCase());if(i<0||e.repeat)return;
   this.laneDown(i);
  });
  window.addEventListener('keyup',e=>{const i='dfjk'.indexOf(e.key.toLowerCase());if(i<0)return;this.laneUp(i)});
  cv.addEventListener('contextmenu',e=>e.preventDefault());
 }
 laneDown(lane){
  if(this.state!=='play'||this.paused||this.ended)return;
  const sn=this.sn;
  for(const nt of this.notes){
   if(nt.t>sn+this.nearW+2)break;
   if(nt.state===6&&nt.lane===lane&&Math.abs(sn-(nt.t+nt.dt))<=this.goodW*1.6){
    this.doubleSecond(nt,Math.abs(sn-(nt.t+nt.dt)));return;
   }
  }
  let best=null,bestAd=1e9,near=null;
  for(let i=0;i<this.notes.length;i++){
   const nt=this.notes[i];
   if(nt.t>sn+this.nearW+1)break;
   if(nt.state!==0||nt.lane!==lane)continue;
   const ad=Math.abs(sn-nt.t);
   if(nt.type==='swipe'){if(ad<=this.nearW&&!near)near=nt;continue}
   if(ad<=this.goodW&&ad<bestAd){best=nt;bestAd=ad}
   else if(!near&&ad<=this.nearW)near=nt;
  }
  if(best){
   if(best.type==='double')this.doubleFirst(best,bestAd);
   else this.judge(best,bestAd);
  }else if(near){
   this.pop(this.laneX(lane),HIT_Y-70,'NEAR',COL.amber,'wave',false);A.tick();
  }else{
   const t=performance.now();
   if(t-(this.strayT[lane]||0)>180){
    this.strayT[lane]=t;
    const sw=this.notes.find(n=>n.state===0&&n.type==='swipe'&&n.lane===lane&&Math.abs(sn-n.t)<=this.nearW+0.2);
    if(sw){this.pop(this.laneX(lane),HIT_Y-70,'FLICK '+(sw.dir<0?'LEFT':'RIGHT')+'!',COL.sun,null,false);A.tick();return}
    if(this.combo>1){this.combo=0;this.pop(this.laneX(lane),HIT_Y-70,'OOPS',COL.amber,'wave',false)}
    A.tick();this.setHud();
   }
  }
 }
 laneUp(lane){
  const nt=this.holds[lane];
  if(!nt||nt.state!==3)return;
  delete this.holds[lane];
  if(nt.type==='release'){
   const end=nt.t+nt.dur,off=Math.abs(this.sn-end);
   if(this.sn>=end-this.goodW){this.releaseComplete(nt,this.grade(off));return}
   this.releaseEarly(nt);return;
  }
  if(this.sn>=nt.t+nt.dur-0.18){this.holdComplete(nt);return}
  nt.state=5;nt.mt=this.sn;this.perfectStreak=0;
  this.score+=Math.round(50*this.mult());this.counts.partial++;
  const x=this.laneX(lane);
  this.pop(x,HIT_Y-70,'PARTIAL',COL.amber,'wave',false);
  this.burst(x,HIT_Y,skin().lanes[lane],'hit');
  if(!this.demo){A.holdRelease(lane,false);A.note(nt.midi,this.inst,.4,.4);this.setHud()}
 }
 onFlick(lane,dir){
  if(this.state!=='play'||this.paused||this.ended)return;
  const sn=this.sn;
  let ownMatch=null,ownOther=null,anyMatch=null,anyAd=1e9;
  for(const nt of this.notes){
   if(nt.t>sn+this.nearW+1)break;
   if(nt.state!==0||nt.type!=='swipe')continue;
   const ad=Math.abs(sn-nt.t);
   if(ad>this.goodW)continue;
   if(nt.lane===lane){
    if(nt.dir===dir)ownMatch=nt;
    else if(!ownOther)ownOther=nt;
   }else if(nt.dir===dir&&ad<anyAd){anyMatch=nt;anyAd=ad}
  }
  if(ownMatch)this.swipeHit(ownMatch,Math.abs(sn-ownMatch.t));
  else if(ownOther){
   if(this.mods.tut)this.tutRetry(ownOther,'FLICK THE OTHER WAY!');
   else this.doMiss(ownOther,'WRONG WAY!');
  }
  else if(anyMatch)this.swipeHit(anyMatch,anyAd);
 }
 keyFlick(dir){
  if(this.state!=='play'||this.ended||this.paused)return;
  const sn=this.sn;
  let match=null,mAd=1e9,other=null;
  for(const nt of this.notes){
   if(nt.t>sn+this.nearW+1)break;
   if(nt.state!==0||nt.type!=='swipe')continue;
   const ad=Math.abs(sn-nt.t);
   if(ad>this.goodW)continue;
   if(nt.dir===dir){if(ad<mAd){match=nt;mAd=ad}}
   else if(!other)other=nt;
  }
  if(match)this.swipeHit(match,mAd);
  else if(other){
   if(this.mods.tut)this.tutRetry(other,'FLICK THE OTHER WAY!');
   else this.doMiss(other,'WRONG WAY!');
  }
 }
 judge(nt,ad){
  let q=this.grade(ad);
  if(this.mods.auto>0&&q!=='perfect'){this.mods.auto--;q='perfect'}
  nt.state=1;nt.q=q;this.applyHit(nt,q);
  if(nt.type==='hold'||nt.type==='release'){nt.state=3;this.holds[nt.lane]=nt;if(!this.demo)A.holdStart(nt.lane,nt.midi,this.inst)}
  else if(nt.type==='tap'&&this.mods.tut)this.tutDone(nt);
 }
 applyHit(nt,q){
  const mult=this.mult();
  const base=q==='perfect'?300:q==='great'?190:100;
  this.score+=base*mult*(nt.accent?1.15:1);
  this.combo++;if(this.combo>this.maxCombo)this.maxCombo=this.combo;
  this.counts[q]++;
  this.trackStreak(q);this.updateComboTier();
  const x=this.laneX(nt.lane),col=skin().lanes[nt.lane];
  this.padFlash[nt.lane]=q==='perfect'?1:q==='great'?.72:.48;
  // enhanced visual feedback
  if(q==='perfect'){ triggerScreenFlash('perfect'); if(this.hud && this.hud.comboBox){ this.hud.comboBox.classList.remove('comboBounce'); void this.hud.comboBox.offsetWidth; this.hud.comboBox.classList.add('comboBounce'); setTimeout(()=>this.hud.comboBox.classList.remove('comboBounce'),320)} }
  else if(q==='great'){ triggerScreenFlash('good'); }
  this.burst(x,HIT_Y,col,nt.accent&&q!=='good'?'big':q);
  // extra impact ring for perfect
  if(q==='perfect'){ this.rings.push({x,y:HIT_Y,r:18,vr:420,a:.65}); }
  this.pop(x,HIT_Y-70,this.gradeLabel(q),this.gradeCol(q),'check',q==='perfect');
  // milestone checks: 10,25,50,100 etc
  if(this.combo===10||this.combo===25||this.combo===50||this.combo===100||this.combo%100===0){ comboMilestone(this.combo); }
  else if(this.combo%25===0){ this.pop(CW/2,CH*.32,'COMBO ×'+this.combo,COL.sun,'star',true); comboMilestone(this.combo); }
  if(!this.demo){
   A.note(nt.midi,this.inst,q==='perfect'?1:q==='great'?.85:.65);
   if(q==='perfect')A.spark();
   if(this.combo%25===0){A.comboSting()}
   haptic(q==='perfect'?'perfect':q==='great'?'great':'tap');
   this.setHud();
  }
 }
 doubleFirst(nt,ad){
  nt.state=6;nt.q1=this.grade(ad);
  this.score+=Math.round(50*this.mult());
  this.padFlash[nt.lane]=1;
  const x=this.laneX(nt.lane);
  this.pop(x,HIT_Y-70,'AGAIN!',COL.sun,null,false);
  this.burst(x,HIT_Y,skin().lanes[nt.lane],'hit');
  if(!this.demo){A.note(nt.midi,this.inst,.6,.3);this.setHud()}
 }
 doubleSecond(nt,ad){
  let q=this.grade(ad);
  if(this.mods.auto>0&&q!=='perfect'){this.mods.auto--;q='perfect'}
  nt.state=1;nt.q=q;
  this.score+=Math.round((q==='perfect'?250:q==='great'?170:100)*this.mult()*(nt.accent?1.15:1));
  this.combo++;if(this.combo>this.maxCombo)this.maxCombo=this.combo;
  this.counts[q]++;
  this.trackStreak(q);this.updateComboTier();
  const x=this.laneX(nt.lane),col=skin().lanes[nt.lane];
  this.padFlash[nt.lane]=q==='perfect'?1:.7;
  this.burst(x,HIT_Y,col,q);
  this.pop(x,HIT_Y-70,'DOUBLE!',this.gradeCol(q),'check',q==='perfect');
  if(!this.demo){A.note(nt.midi,this.inst,1);if(q==='perfect')A.spark();haptic(q==='perfect'?'perfect':'tap');this.setHud()}
  if(this.mods.tut)this.tutDone(nt);
 }
 doubleSlow(nt){
  if(this.mods.tut){this.tutRetry(nt,'TAP TWICE!');return}
  nt.state=7;nt.mt=this.sn;this.perfectStreak=0;
  this.score+=Math.round(50*this.mult());this.counts.partial++;
  this.pop(this.laneX(nt.lane),HIT_Y-70,'TOO SLOW',COL.amber,'wave',false);
  if(!this.demo){A.missThud();this.setHud()}
 }
 swipeHit(nt,ad){
  let q=this.grade(ad);
  if(this.mods.auto>0&&q!=='perfect'){this.mods.auto--;q='perfect'}
  nt.state=1;nt.q=q;
  this.score+=Math.round((q==='perfect'?300:q==='great'?190:100)*this.mult()*(nt.accent?1.15:1));
  this.combo++;if(this.combo>this.maxCombo)this.maxCombo=this.combo;
  this.counts[q]++;
  this.trackStreak(q);this.updateComboTier();
  const x=this.laneX(nt.lane),col=skin().lanes[nt.lane];
  this.padFlash[nt.lane]=q==='perfect'?1:q==='great'?.72:.48;
  this.burst(x,HIT_Y,col,nt.accent&&q!=='good'?'big':q,(nt.dir||1)*170);
  this.rings.push({x,y:HIT_Y,r:14,vr:300,a:q==='perfect'?.7:.45});
  this.pop(x,HIT_Y-70,'SWIPE!',this.gradeCol(q),'check',q==='perfect');
  if(!this.demo){A.note(nt.midi,this.inst,1);A.swish();if(q==='perfect')A.spark();haptic(q==='perfect'?'perfect':q==='great'?'great':'tap');this.setHud()}
  if(this.mods.tut)this.tutDone(nt);
 }
 releaseComplete(nt,q){
  nt.state=4;nt.q=q;
  this.score+=Math.round((q==='perfect'?250:q==='great'?170:120)*this.mult()*(nt.accent?1.15:1));
  this.combo++;if(this.combo>this.maxCombo)this.maxCombo=this.combo;
  this.counts[q]++;this.counts.hold++;
  this.trackStreak(q);this.updateComboTier();
  const x=this.laneX(nt.lane);
  this.padFlash[nt.lane]=q==='perfect'?1:.75;
  this.burst(x,HIT_Y,skin().lanes[nt.lane],q==='perfect'?'perfect':'great');
  this.rings.push({x,y:HIT_Y,r:20,vr:q==='perfect'?340:260,a:q==='perfect'?.85:.6});
  this.pop(x,HIT_Y-70,'RELEASED!',this.gradeCol(q),'check',q==='perfect');
  if(!this.demo){A.holdRelease(nt.lane,true,q);A.note(nt.midi+12,this.inst,.9,1.6);haptic('hold');this.setHud()}
  if(this.mods.tut)this.tutDone(nt);
 }
 releaseEarly(nt){
  if(this.mods.tut){this.tutRetry(nt,'HOLD TO THE RING!');return}
  nt.state=5;nt.mt=this.sn;this.perfectStreak=0;
  this.score+=Math.round(50*this.mult());this.counts.partial++;
  this.pop(this.laneX(nt.lane),HIT_Y-70,'EARLY',COL.amber,'wave',false);
  if(!this.demo){A.holdRelease(nt.lane,false);A.note(nt.midi,this.inst,.4,.4);this.setHud()}
 }
 releaseLate(nt){
  delete this.holds[nt.lane];
  if(this.mods.tut){this.tutRetry(nt,'LET GO ON THE RING!');return}
  nt.state=5;nt.mt=this.sn;this.perfectStreak=0;
  this.score+=Math.round(75*this.mult());this.counts.partial++;
  this.pop(this.laneX(nt.lane),HIT_Y-70,'LATE',COL.amber,'wave',false);
  if(!this.demo){A.holdRelease(nt.lane,false);A.missThud();this.setHud()}
 }
 holdComplete(nt){
  nt.state=4;
  this.score+=Math.round(150*this.mult()*(nt.accent?1.15:1));
  this.combo++;if(this.combo>this.maxCombo)this.maxCombo=this.combo;
  this.counts.hold++;
  this.updateComboTier();
  const x=this.laneX(nt.lane);
  this.burst(x,HIT_Y,skin().lanes[nt.lane],'perfect');
  this.rings.push({x,y:HIT_Y,r:20,vr:280,a:.8});
  this.pop(x,HIT_Y-70,'HELD!',COL.green,'check',true);
  if(!this.demo){A.holdRelease(nt.lane,true,'perfect');A.note(nt.midi+12,this.inst,.9,2.2);haptic('hold');this.setHud()}
  if(this.mods.tut)this.tutDone(nt);
 }
 doMiss(nt,msg){
  if(this.mods.tut){this.tutRetry(nt,msg||'TRY AGAIN!');return}
  nt.state=2;nt.mt=this.sn;
  const x=this.laneX(nt.lane);
  if(this.mods.shield&&!this.mods.shieldUsed){
   this.mods.shieldUsed=true;this.counts.forgiven++;
   this.pop(x,HIT_Y-70,'SAVED',COL.green,'shield',false);
   this.padFlash[nt.lane]=1;
   triggerScreenFlash('good');
   if(!this.demo){A.spark();this.setHud()}
   return;
  }
  this.combo=0;this.counts.miss++;if(!this.mods.zen)this.lives--;
  this.resetFlow();
  // enhanced miss feedback - clear but not confusing: red pop + lane flash + subtle shake
  this.pop(x,HIT_Y-70,msg||'MISS',COL.red,'cross',false);
  laneMissFlash(nt.lane);
  triggerScreenFlash('miss');
  if(!S.settings.motion&&!this.mods.zen){
   this.shake=6;
   const stage=document.getElementById('stage');
   if(stage){ stage.classList.remove('missShake'); void stage.offsetWidth; stage.classList.add('missShake'); setTimeout(()=>stage.classList.remove('missShake'),420); }
  }
  if(!this.demo){A.missThud();haptic('miss');this.setHud()}
  if(this.lives<=0&&!this.ended){
   if(this.mods.revive&&!this.mods.reviveUsed){
    this.mods.reviveUsed=true;this.lives=3;
    this.pop(CW/2,CH*.4,'SECOND CHANCE!',COL.green,'shield',true);
    this.burst(CW/2,HIT_Y,COL.sun,'big');
    triggerScreenFlash('good');
    if(!this.demo){A.fanfare();this.setHud()}
    return;
   }
   this.ended=true;this.state='over';
   CG.gameplayStop();
   setTimeout(()=>{if(this.running)this.endLevel(false)},320);
  }
 }
 tutDone(nt){const t=this.mods.tut;if(t&&t.onDone)t.onDone(nt)}
 tutRetry(nt,msg){
  delete this.holds[nt.lane];
  nt.state=0;nt.q=null;nt.mt=0;
  nt.t=this.sn+this.level.approach*0.8+0.35;
  this.notes.sort((a,b)=>a.t-b.t);
  this.pop(this.laneX(nt.lane),HIT_Y-120,msg,COL.amber,'wave',false);
 }
 pop(x,y,txt,col,ic,big){this.pops.push({x,y,txt,col,ic,big,t:0,ttl:big?1:.75})}
 burst(x,y,col,kind,bias=0){
  const mot=S.settings.motion;
  // enhanced particle bursts - more satisfying for perfect
  let n;
  if(mot) n=5;
  else if(kind==='perfect') n=26;
  else if(kind==='big') n=52;
  else if(kind==='great') n=16;
  else if(kind==='good') n=9;
  else n=14;
  const look=trailLook(col);
  const shapes=(kind==='perfect'||kind==='great')&&look.shapes.length<4?look.shapes.concat([3]):look.shapes;
  for(let i=0;i<n;i++){
   const a=Math.random()*Math.PI*2,sp=(kind==='big'?300: kind==='perfect'?260:200)*(.45+Math.random()*.95);
   this.parts.push({x,y,vx:Math.cos(a)*sp+bias,vy:Math.sin(a)*sp-160,rot:Math.random()*6.28,vr:(Math.random()-.5)*12,
    s:7+Math.random()*9,sh:shapes[Math.floor(Math.random()*shapes.length)],
    col:look.cols[Math.floor(Math.random()*look.cols.length)],ttl:.62+Math.random()*.42,t:0});
  }
  if(kind==='perfect'||kind==='big')this.rings.push({x,y,r:16,vr:kind==='big'?560:380,a:.82});
  else if(kind==='great')this.rings.push({x,y,r:14,vr:300,a:.6});
  else if(kind==='good')this.rings.push({x,y,r:10,vr:220,a:.45});
 }
 update(ts){
  const dt=clamp((ts-this.lastTs)/1000,0,.05);this.lastTs=ts;
  const sn=this.clock()-this.songStart;this.sn=sn;
  if(this.state==='count'&&sn>=0)this.state='play';
  if(!this.demo&&A.ctx){
   const now=A.ctx.currentTime,L=this.level;
   while(this.mBeat*L.spb<L.dur+2&&this.mBeat<4000){
    const t=this.songStart+this.mBeat*L.spb;
    if(t>now+0.35)break;
    if(t>now-0.05){
     if(this.mBeat<0)A.click(t);
     else{A.kick(t);if(L.n>120||this.challenge)A.hat(t+L.spb/2)}
    }
    this.mBeat++;
   }
   /* ── funky, multitonal bass groove — 16th-note resolution ──
      Ghost notes + accents + an occasional chromatic passing tone give the
      bassline a syncopated "funk" feel, while the chord root it walks
      through cycles every 2 bars so the harmony keeps moving. */
   if(L.root!=null&&L.scale){
    const SL=L.scale.length,stepDur=L.spb/4;
    while(this.mStep*stepDur<L.dur+2&&this.mStep<16000){
     const st=this.songStart+this.mStep*stepDur;
     if(st>now+0.35)break;
     if(st>now-0.05&&this.mStep>=0){
      const bar=Math.floor(this.mStep/16),step=this.mStep%16;
      const cyc=bar%4,chordDeg=cyc<2?0:(SL>3?3:1);
      const hit=FUNK_BASS.find(f=>f.s===step);
      if(hit&&(hit.always||L.n>30||this.challenge)){
       let deg=chordDeg+(hit.deg||0),semis=0;
       if(hit.chrom){semis=-1;deg=chordDeg}
       const scaleTone=L.scale[((deg%SL)+SL)%SL]+semis;
       const midi=L.root-12+scaleTone+12*(hit.oct||0);
       A.bass(st,midi,!!hit.acc,!!hit.ghost);
       if(!hit.ghost&&(L.n>90||this.challenge))A.chuck(st+stepDur*.5,!!hit.acc);
      }
     }
     this.mStep++;
    }
   }
  }
  const play=this.state==='play';
  for(let i=0;i<this.notes.length;i++){
   const nt=this.notes[i];
   if(nt.state===0&&play&&sn>nt.t+this.goodW+0.04)this.doMiss(nt);
   else if(nt.type==='hold'&&nt.state===3&&sn>=nt.t+nt.dur)this.holdComplete(nt);
   else if(nt.type==='release'&&nt.state===3&&sn>nt.t+nt.dur+this.goodW+0.12)this.releaseLate(nt);
   else if(nt.state===6&&sn>nt.t+nt.dt+this.goodW*1.5+0.2)this.doubleSlow(nt);
  }
  if(this.demo)for(const nt of this.notes){
   if(nt.state===0&&sn>=nt.t-0.01){
    if(nt.type==='swipe')this.swipeHit(nt,0.01);
    else if(nt.type==='double')this.doubleFirst(nt,0.01);
    else this.judge(nt,0.01);
   }else if(nt.state===6&&sn>=nt.t+nt.dt)this.doubleSecond(nt,0.01);
   else if(nt.type==='release'&&nt.state===3&&sn>=nt.t+nt.dur)this.releaseComplete(nt,'perfect');
  }
  if(play)for(const l in this.holds){
   const nt=this.holds[l];
   if(nt&&nt.state===3){
    if(!this.demo&&nt.dur>0)A.holdUpdate(nt.lane,clamp((sn-nt.t)/nt.dur,0,1));
    this.trailT+=dt;
    if(this.trailT>0.06){
     this.trailT=0;const x=this.laneX(nt.lane);
     const tr=S.trail||'classic';
     const hs=tr==='stars'?3:tr==='hearts'?4:0;
     this.parts.push({x:x+(Math.random()-.5)*30,y:HIT_Y-10,vx:(Math.random()-.5)*60,vy:-140-Math.random()*80,rot:0,vr:0,s:5+Math.random()*6,sh:hs,col:'#fff',ttl:.45,t:0});
     this.rings.push({x,y:HIT_Y,r:26,vr:150,a:.3});
    }
   }
  }
  if(play&&this.level.spb){
   const bi=Math.floor(sn/this.level.spb);
   if(bi!==this.lastBeatIndex){this.lastBeatIndex=bi;this.onBeat()}
  }
  const flowTarget=this.perfectStreak>=20?1:0;
  this.flowGlow+=(flowTarget-this.flowGlow)*clamp(dt*2.2,0,1);
  if(!this.ended&&play&&!this.mods.tut&&sn>this.level.dur+1.1){this.ended=true;this.endLevel(true)}
  for(let i=this.parts.length-1;i>=0;i--){const p=this.parts[i];p.t+=dt;
   if(p.t>=p.ttl){this.parts.splice(i,1);continue}
   p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=560*dt;p.rot+=p.vr*dt}
  for(let i=this.rings.length-1;i>=0;i--){const r=this.rings[i];r.r+=r.vr*dt;r.a-=dt*2.2;if(r.a<=0)this.rings.splice(i,1)}
  for(let i=this.pops.length-1;i>=0;i--){const p=this.pops[i];p.t+=dt;if(p.t>=p.ttl)this.pops.splice(i,1)}
  for(const a of this.amb){a.y+=a.v*dt;a.r+=a.vr*dt;if(a.y>CH+30){a.y=-30;a.x=Math.random()*CW}}
  for(const d of this.deco){d.y-=d.v*dt;d.sway+=d.swaySpd*dt;if(d.y< -30){d.y=CH+30;d.x=Math.random()*CW}}
  for(let l=0;l<4;l++)this.padFlash[l]=Math.max(0,this.padFlash[l]-dt*3);
  if(this.shake>0)this.shake=Math.max(0,this.shake-dt*26);
  if(!this.demo&&this.hud){
   const frac=clamp(sn/this.level.dur,0,1);
   this.hud.fill.style.width=(frac*100).toFixed(1)+'%';
   if(this.level.boss){
    const ph=frac<1/3?0:frac<2/3?1:2;
    if(this.curPhase!==ph){
     this.curPhase=ph;
     this.hud.fill.style.background=['var(--grass)','var(--sun)','var(--coral)'][ph];
     if(ph>0){this.pop(this.laneX(1.5),HIT_Y-140,'PHASE '+(ph+1),COL.red,'wave',true);haptic('tap')}
    }
   }
  }
 }
 setHud(reset){
  if(this.demo||!this.hud)return;
  const h=this.hud;
  const m=this.mods,zen=!!m.zen;
  const scoreWrap=h.score.parentElement;
  if(scoreWrap)scoreWrap.classList.toggle('hidden',zen);
  h.score.textContent=fmt(this.score);bump(h.score);
  h.comboN.textContent='×'+this.combo;
  h.comboBox.classList.toggle('hidden',zen);
  h.comboBox.classList.toggle('hot',this.combo>=10&&this.combo<50);
  h.comboBox.classList.toggle('hot2',this.combo>=50&&this.combo<100);
  h.comboBox.classList.toggle('hot3',this.combo>=100);
  let hp='';const max=m.heart?4:3;
  for(let i=0;i<max;i++)hp+=`<svg class="ic hrt ${i<this.lives?'on':''}"><use href="#i-heart"/></svg>`;
  h.hearts.innerHTML=hp;
  h.hearts.classList.toggle('hidden',zen);
  h.hearts.classList.toggle('low',this.lives===1);
  let p='';
  if(m.auto>0)p+=`<span class="pchip2">${icon('bolt')}×${m.auto}</span>`;
  if(m.shield&&!m.shieldUsed)p+=`<span class="pchip2">${icon('shield')}</span>`;
  if(m.magnet)p+=`<span class="pchip2">${icon('coin')}</span>`;
  if(m.combo)p+=`<span class="pchip2">${icon('flame')}</span>`;
  if(m.revive&&!m.reviveUsed)p+=`<span class="pchip2">${icon('spark')}</span>`;
  h.pow.innerHTML=p;
  let lbl=m.tut?'TUTORIAL':this.challenge?'DAILY':this.level.boss?'BOSS '+this.level.n:'LV '+this.level.n;
  if(m.gauntlet)lbl='GAUNTLET '+((m.queueIdx||0)+1)+'/'+m.queueMax;
  else if(m.endless)lbl='ENDLESS · '+this.level.bpm+' BPM';
  else if(m.zen)lbl='ZEN';
  else if(m.hardcore)lbl='HARDCORE';
  h.lvl.textContent=lbl;
  h.lvl.classList.toggle('boss',!m.tut&&!this.challenge&&!!this.level.boss);
  h.lvl.classList.toggle('mode',!!(m.gauntlet||m.endless||m.zen||m.hardcore));
  h.fillWrap.classList.toggle('boss',!!this.level.boss);
  if(reset){h.fill.style.width='0%';h.fill.style.background='var(--grass)'}
 }
 endLevel(cleared){
  if(!this.running)return;
  this.state='over';
  if(this.demo){setTimeout(()=>{if(this.running&&this.demo)this.start(buildDemo(++demoSeed))},700);return}
  A.stopPad();
  const m=this.mods;
  if(m.queueGen&&cleared&&this.lives>0&&(!m.queueMax||m.queueIdx+1<m.queueMax)){
   const nextIdx=m.queueIdx+1,nextLevel=m.queueGen(nextIdx);
   const carry={score:this.score,lives:this.lives,maxCombo:this.maxCombo,counts:{...this.counts}};
   setTimeout(()=>{if(!this.running)return;this.start(nextLevel,{...m,queueIdx:nextIdx,carry})},220);
   return;
  }
  if(this.onFinish)this.onFinish(this.collect(cleared));
 }
 collect(cleared){
  const total=this.notes.length;let v=0;
  const w=nt=>nt.q==='perfect'?1:nt.q==='great'?.85:.7;
  for(const nt of this.notes){
   const s=nt.state;
   if(nt.type==='tap')v+=s===1?w(nt):0;
   else if(nt.type==='hold')v+=((s>=1)?(nt.q==='perfect'?.5:nt.q==='great'?.43:.35):0)+((s===4)?.5:(s===5?.25:0));
   else if(nt.type==='double')v+=s===1?(nt.q==='perfect'?1:nt.q==='great'?.93:.85):(s===7?.45:0);
   else if(nt.type==='swipe')v+=s===1?(nt.q==='perfect'?1:nt.q==='great'?.88:.75):0;
   else if(nt.type==='release')v+=s===4?(nt.q==='perfect'?1:nt.q==='great'?.93:.85):(s===5?.5:0);
  }
  const acc=total?Math.round(v/total*100):0;
  const mode=this.mods.gauntlet?'gauntlet':this.mods.endless?'endless':this.mods.zen?'zen':this.mods.hardcore?'hardcore':null;
  return {cleared,acc,stars:cleared?(acc>=90?3:acc>=70?2:1):0,score:this.score,maxCombo:this.maxCombo,
   counts:{...this.counts},total,flawless:this.counts.miss===0&&this.counts.partial===0&&this.counts.forgiven===0,
   n:this.level.n,challenge:this.challenge,practice:!!this.mods.practice,assist:S.settings.assist,
   magnet:!!this.mods.magnet,mode,segments:(this.mods.queueIdx||0)+1,segBpm:this.level.bpm};
 }
 loop(ts){
  if(!this.running)return;
  this.raf=requestAnimationFrame(this.loop);
  if(!(this.demo&&route!=='hero')){
   if(!this.paused)this.update(ts||performance.now());
   this.render();
  }
 }
 render(){
  const c=this.c,L=this.level;if(!L)return;
  const sn=this.sn,lanes=skin().lanes;
  c.save();
  if(this.shake>0)c.translate((Math.random()-.5)*this.shake,(Math.random()-.5)*this.shake);
  const hue=L.world.hue;
  if(this.bgHue!==hue){this.bgHue=hue;this.g=c.createLinearGradient(0,0,0,CH);
   this.g.addColorStop(0,`hsl(${hue} 55% 92%)`);this.g.addColorStop(1,`hsl(${hue} 45% 85%)`)}
  c.fillStyle=this.g;c.fillRect(-10,-10,CW+20,CH+20);
  const beatEnv0=L.spb?Math.pow(Math.max(0,1-((sn/L.spb)%1)),2):0;
  if(!S.settings.motion&&beatEnv0>0.02){
   c.fillStyle=`rgba(255,255,255,${(0.02+0.045*beatEnv0+this.comboTier*.006).toFixed(3)})`;
   c.fillRect(-10,-10,CW+20,CH+20);
  }
  if(!S.settings.motion&&this.flowGlow>0.02){
   const gr=c.createRadialGradient(CW/2,HIT_Y-160,40,CW/2,HIT_Y-160,420);
   gr.addColorStop(0,`rgba(255,206,46,${(.14*this.flowGlow).toFixed(3)})`);
   gr.addColorStop(1,'rgba(255,206,46,0)');
   c.fillStyle=gr;c.fillRect(-10,-10,CW+20,CH+20);
  }
  if(this.deco.length){
   for(const d of this.deco){
    c.save();c.translate(d.x+Math.sin(d.sway)*18,d.y);
    c.fillStyle=`hsla(${d.hue},60%,38%,.09)`;
    shapePath(c,d.sh,d.s);c.fill();c.restore();
   }
  }
  if(L.finale&&sn>-1){
   c.save();c.translate(CW/2,-40);c.rotate(sn*.15);c.fillStyle='rgba(255,255,255,.06)';
   for(let i=0;i<12;i++){c.rotate(Math.PI/6);c.beginPath();c.moveTo(0,0);c.lineTo(-28,950);c.lineTo(28,950);c.closePath();c.fill()}
   c.restore();
  }
  if(this.amb.length){c.fillStyle='rgba(38,50,89,.10)';
   for(const a of this.amb){c.save();c.translate(a.x,a.y);c.rotate(a.r);shapePath(c,a.sh,a.s);c.fill();c.restore()}}
  for(let l=0;l<LANES;l++){
   c.fillStyle=hexA(lanes[l],.08);
   rr(c,l*LANE_W+5,64,LANE_W-10,HIT_Y-6,14);c.fill();
  }
  c.strokeStyle='rgba(38,50,89,.10)';c.lineWidth=3;
  for(let l=1;l<LANES;l++){c.beginPath();c.moveTo(l*LANE_W,72);c.lineTo(l*LANE_W,HIT_Y-54);c.stroke()}
  const env=L.spb?Math.pow(Math.max(0,1-((sn/L.spb)%1)),2):0;
  for(let l=0;l<LANES;l++){
   const w=LANE_W-16,h=86,f=this.padFlash[l];
   c.save();c.translate(this.laneX(l),HIT_Y);c.scale(1+0.05*env+f*.08,1+0.05*env+f*.08);
   c.fillStyle=hexA(lanes[l],.24+f*.55);
   c.strokeStyle=NAVY;c.lineWidth=4;
   rr(c,-w/2,-h/2,w,h,18);c.fill();c.stroke();
   c.strokeStyle=hexA(lanes[l],.95);c.lineWidth=5;
   c.beginPath();c.moveTo(-w/2+13,0);c.lineTo(w/2-13,0);c.stroke();
   if(S.settings.shapes){c.fillStyle='rgba(38,50,89,.7)';c.save();c.translate(0,-h/2+19);drawGlyph(c,l,8);c.restore()}
   c.restore();
  }
  if(L.n<=3&&this.state==='play'&&!this.ended&&!this.mods.tut){
   const nt=this.notes.find(n=>n.state===0);
   if(nt){
    const dt=nt.t-sn;
    if(dt<1.4&&dt>-0.2){
     c.save();c.translate(this.laneX(nt.lane),HIT_Y);
     c.strokeStyle=hexA(lanes[nt.lane],.85);c.lineWidth=6;
     c.beginPath();c.arc(0,0,54+Math.sin(sn*8)*5,0,Math.PI*2);c.stroke();c.restore();
    }
   }
   c.font='800 19px "Baloo 2","Nunito",sans-serif';c.textAlign='center';
   c.fillStyle='rgba(38,50,89,.55)';
   c.fillText('TAP WHEN THE NOTE MEETS THE LINE',CW/2,120);
  }
  for(const nt of this.notes){
   if(nt.state===1||nt.state===4)continue;
   if(nt.t-sn>L.approach+.4)continue;
   switch(nt.type){
    case 'tap':this.drawTap(nt,sn,lanes);break;
    case 'double':this.drawDouble(nt,sn,lanes);break;
    case 'swipe':this.drawSwipe(nt,sn,lanes);break;
    default:this.drawHold(nt,sn,lanes);
   }
  }
  for(const p of this.parts){
   c.save();c.translate(p.x,p.y);c.rotate(p.rot);c.globalAlpha=1-p.t/p.ttl;
   c.fillStyle=p.col;shapePath(c,p.sh,p.s);c.fill();c.restore();
  }
  for(const r of this.rings){
   c.save();c.globalAlpha=Math.max(0,r.a);c.strokeStyle='#fff';c.lineWidth=5;
   c.beginPath();c.arc(r.x,r.y,r.r,0,Math.PI*2);c.stroke();c.restore();
  }
  for(const p of this.pops){
   const k=p.t/p.ttl,pop=Math.min(1,p.t*9),sc=(p.big?1.25:1)*(.5+.5*pop);
   c.save();c.translate(p.x,p.y-46*k);c.scale(sc,sc);
   c.globalAlpha=k>.7?1-(k-.7)/.3:1;
   c.font=`800 ${p.big?34:26}px "Baloo 2","Nunito",sans-serif`;
   c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';
   c.lineWidth=7;c.strokeStyle=NAVY;c.strokeText(p.txt,0,0);
   c.fillStyle=p.col;c.fillText(p.txt,0,0);
   if(p.ic)judgeIcon(c,p.ic,p.col);
   c.restore();
  }
  if(this.mods.tut)this.drawTut(sn);
  c.textAlign='center';c.textBaseline='middle';
  if(this.state==='count'&&sn<0){
   const num=Math.ceil(-sn/L.spb);
   c.font='800 20px "Baloo 2"';c.fillStyle='rgba(38,50,89,.6)';
   c.fillText('GET READY',CW/2,220);
   c.font='800 96px "Baloo 2"';c.lineWidth=10;c.strokeStyle=NAVY;
   c.strokeText(num,CW/2,320);c.fillStyle='#fff';c.fillText(num,CW/2,320);
  }else if(sn>=0&&sn<0.45){
   c.font='800 84px "Baloo 2"';c.lineWidth=10;c.strokeStyle=NAVY;
   c.strokeText('GO!',CW/2,320);c.fillStyle=COL.sun;c.fillText('GO!',CW/2,320);
  }
  if(L.finale&&sn>0&&sn<1.4){
   c.font='800 60px "Baloo 2"';c.lineWidth=10;c.strokeStyle=NAVY;
   c.strokeText('FINALE!',CW/2,200);c.fillStyle=COL.sun;c.fillText('FINALE!',CW/2,200);
  }
  c.restore();
 }
 drawTut(sn){
  const c=this.c,card=this.mods.tut.card;
  if(card){
   const w=460,h=84,x=CW/2-w/2,y=84;
   c.save();
   c.fillStyle='rgba(38,50,89,.18)';rr(c,x+5,y+6,w,h,18);c.fill();
   c.fillStyle='rgba(255,255,255,.97)';c.strokeStyle=NAVY;c.lineWidth=4;
   rr(c,x,y,w,h,18);c.fill();c.stroke();
   c.textAlign='center';
   c.fillStyle=NAVY;c.font='800 21px "Baloo 2","Nunito",sans-serif';
   c.fillText(card.title,CW/2,y+32);
   c.fillStyle='rgba(38,50,89,.78)';c.font='700 14.5px "Nunito",sans-serif';
   c.fillText(card.text,CW/2,y+58);
   c.restore();
  }
  const nt=this.tutTarget;
  if(nt&&(nt.state===0||nt.state===6||nt.state===3)){
   const l=nt.lane,x=this.laneX(l),col=skin().lanes[l];
   c.save();
   c.strokeStyle=hexA(col,.9);c.lineWidth=6;
   c.beginPath();c.arc(x,HIT_Y,58+Math.sin(sn*7)*5,0,Math.PI*2);c.stroke();
   const by=HIT_Y-132+Math.sin(sn*6)*10;
   c.fillStyle=col;c.strokeStyle=NAVY;c.lineWidth=4;c.lineJoin='round';
   c.beginPath();c.moveTo(x-16,by-10);c.lineTo(x,by+10);c.lineTo(x+16,by-10);c.closePath();c.fill();c.stroke();
   c.restore();
  }
 }
 drawTap(nt,sn,lanes){
  const c=this.c;
  const y=HIT_Y-(nt.t-sn)*this.speed;
  if(y<-70)return;
  const x=this.laneX(nt.lane);
  c.save();c.translate(x,y);
  if(nt.state===2){
   const a=clamp(1-(sn-nt.mt)/.4,0,1);
   if(a<=0){c.restore();return}
   c.globalAlpha=a*.45;c.translate(0,(sn-nt.mt)*260);
   drawNoteBall(c,'#B9C4D6',NOTE_R,nt.lane);
  }else drawNoteBall(c,lanes[nt.lane],NOTE_R,nt.lane);
  c.restore();
 }
 drawDouble(nt,sn,lanes){
  const c=this.c;
  let y=HIT_Y-(nt.t-sn)*this.speed;
  if(nt.state===6)y=HIT_Y;
  if(y<-70)return;
  const x=this.laneX(nt.lane),col=lanes[nt.lane];
  c.save();c.translate(x,y);
  if(nt.state===7||nt.state===2){
   const a=clamp(1-(sn-nt.mt)/.4,0,1);
   if(a<=0){c.restore();return}
   c.globalAlpha=a*.4;c.translate(0,(sn-nt.mt)*220);
   drawNoteBall(c,'#B9C4D6',NOTE_R*.9,nt.lane);
  }else{
   if(nt.state===6){
    const pr=NOTE_R*.95+Math.sin(sn*10)*4;
    c.strokeStyle=hexA(col,.95);c.lineWidth=5;
    c.beginPath();c.arc(0,0,pr,0,Math.PI*2);c.stroke();
   }
   c.save();c.translate(-11,-11);c.globalAlpha=.8;
   drawNoteBall(c,col,NOTE_R*.6,nt.lane);
   c.restore();
   drawNoteBall(c,col,NOTE_R*.92,nt.lane);
   c.save();c.translate(NOTE_R*.6,-NOTE_R*.78);c.rotate(.14);
   c.fillStyle=NAVY;rr(c,-16,-11,32,22,8);c.fill();
   c.fillStyle='#fff';c.font='800 15px "Baloo 2","Nunito",sans-serif';
   c.textAlign='center';c.textBaseline='middle';c.fillText('×2',0,1);
   c.restore();
  }
  c.restore();
 }
 drawSwipe(nt,sn,lanes){
  const c=this.c;
  const y=HIT_Y-(nt.t-sn)*this.speed;
  if(y<-70)return;
  const x=this.laneX(nt.lane),col=lanes[nt.lane],dir=nt.dir||1;
  c.save();c.translate(x,y);
  if(nt.state===2){
   const a=clamp(1-(sn-nt.mt)/.4,0,1);
   if(a<=0){c.restore();return}
   c.globalAlpha=a*.45;c.translate(0,(sn-nt.mt)*260);
  }
  c.strokeStyle=hexA(col,.55);c.lineWidth=5;c.lineCap='round';
  const drift=(sn*160)%22;
  for(let i=0;i<3;i++){
   const oy=(i-1)*15,ox=-dir*(50+i*13+drift);
   c.beginPath();c.moveTo(ox,oy);c.lineTo(ox-dir*16,oy);c.stroke();
  }
  c.save();c.scale(dir,1);
  const s=33;
  c.beginPath();
  c.moveTo(-s*1.05,-s*.42);c.lineTo(s*.18,-s*.42);c.lineTo(s*.18,-s*.82);
  c.lineTo(s*1.08,0);c.lineTo(s*.18,s*.82);c.lineTo(s*.18,s*.42);c.lineTo(-s*1.05,s*.42);
  c.closePath();
  c.fillStyle=col;c.fill();
  c.lineJoin='round';c.strokeStyle=NAVY;c.lineWidth=6;c.stroke();
  c.fillStyle='rgba(255,255,255,.85)';
  c.beginPath();c.arc(-s*.45,-s*.08,5.5,0,Math.PI*2);c.fill();
  c.restore();
  c.restore();
 }
 drawHold(nt,sn,lanes){
  const c=this.c;
  const col=lanes[nt.lane],x=this.laneX(nt.lane);
  let headY=HIT_Y-(nt.t-sn)*this.speed;
  const tailY=HIT_Y-(nt.t+nt.dur-sn)*this.speed;
  if(nt.state===3)headY=HIT_Y;
  if(Math.min(tailY,headY)<-80&&Math.max(tailY,headY)<-80)return;
  c.save();
  if(nt.state===5||nt.state===2){
   const a=clamp(1-(sn-nt.mt)/.4,0,1);
   if(a<=0){c.restore();return}
   c.globalAlpha=a*.4;c.translate(0,(sn-nt.mt)*200);
  }
  const top=Math.min(tailY,headY),bot=Math.max(tailY,headY);
  if(bot-top>6){
   c.fillStyle=hexA(col,.92);c.strokeStyle=NAVY;c.lineWidth=5;
   rr(c,x-HOLD_W/2,top,HOLD_W,bot-top,HOLD_W/2);c.fill();c.stroke();
   c.fillStyle='rgba(255,255,255,.75)';
   for(let yy=bot-30;yy>top+18;yy-=34){c.beginPath();c.arc(x,yy,4,0,Math.PI*2);c.fill()}
  }
  if(nt.type==='release'){
   const nearEnd=nt.state===3&&Math.abs(nt.t+nt.dur-sn)<=this.goodW;
   const pulse=nt.state===3?1+Math.max(0,Math.sin(sn*9))*.25:1;
   c.save();c.translate(x,top);
   if(nearEnd){
    c.strokeStyle='#fff';c.lineWidth=7;
    c.beginPath();c.arc(0,0,26+Math.sin(sn*14)*4,0,Math.PI*2);c.stroke();
   }
   c.strokeStyle='#fff';c.lineWidth=6;
   c.beginPath();c.arc(0,0,15*pulse,0,Math.PI*2);c.stroke();
   c.strokeStyle=NAVY;c.lineWidth=4;
   c.beginPath();c.arc(0,0,21*pulse,0,Math.PI*2);c.stroke();
   c.fillStyle=col;c.beginPath();c.arc(0,0,6,0,Math.PI*2);c.fill();
   if(nearEnd){
    c.font='800 17px "Baloo 2","Nunito",sans-serif';c.textAlign='center';c.textBaseline='middle';
    c.lineJoin='round';c.lineWidth=5;c.strokeStyle=NAVY;
    c.strokeText('RELEASE!',0,-36);c.fillStyle='#fff';c.fillText('RELEASE!',0,-36);
   }
   c.restore();
  }
  c.translate(x,headY);
  if(nt.state===3){
   const prog=nt.dur>0?clamp((sn-nt.t)/nt.dur,0,1):0;
   const tense=1+Math.sin(sn*(8+prog*9))*(0.015+prog*0.045);
   c.strokeStyle='rgba(255,255,255,.4)';c.lineWidth=4;
   c.beginPath();c.arc(0,0,NOTE_R*.85*tense,0,Math.PI*2);c.stroke();
   c.strokeStyle='#fff';c.lineWidth=5;c.lineCap='round';
   c.beginPath();c.arc(0,0,NOTE_R*.85*tense,-Math.PI/2,-Math.PI/2+(1-prog)*Math.PI*2);c.stroke();
   c.lineCap='butt';
  }
  drawNoteBall(c,col,30,nt.lane);
  if(nt.type==='release'){
   c.save();c.strokeStyle=NAVY;c.lineWidth=4;c.lineCap='round';c.lineJoin='round';
   for(let i=0;i<2;i++){const oy=-i*9-8;
    c.beginPath();c.moveTo(-7,oy+4);c.lineTo(0,oy-4);c.lineTo(7,oy+4);c.stroke()}
   c.restore();
  }
  c.restore();
 }
 pause(){if(!this.running||this.paused)return;this.paused=true;if(A.ctx)A.ctx.suspend()}
 resume(){
  $('#ready').classList.add('on');
  setTimeout(()=>{$('#ready').classList.remove('on');if(A.ctx)A.ctx.resume();this.paused=false},850);
 }
}

/* ================= router / toasts ================= */
let route='hero';
/* keep a gentle funky idle groove playing while browsing menus — gameplay
   swaps it out for the level's own kick/bass/hat groove the moment a run starts */
function ensureIdleMusic(){
 if(!A.ctx||!S.settings.music||A.idleTimerId)return;
 if(E&&E.running&&(E.state==='play'||E.state==='count'))return;
 A.startIdleGroove();
}
function nav(id){
 if(route===id)return;
 $$('.screen').forEach(s=>s.classList.toggle('on',s.id==='scr-'+id));
 $('#app').classList.toggle('zoom',id==='game');
 route=id;const h=hooks[id];if(h)h();
 if(id==='game')requestAnimationFrame(fitStage);
 else ensureIdleMusic();
 // wipe kept for visual but not blocking navigation
 if(!S.settings.motion){
  const w=$('#wipe');
  if(w){ w.classList.add('act'); setTimeout(()=>{ w.classList.add('out'); setTimeout(()=>w.classList.remove('act','out'),180)}, 120); }
 }
 A.ui();
}
const hooks={hub:updateHub,map:onShowMap,shop:renderShop,settings:renderSettings,profile:renderProfile,chal:renderChallenge,modes:renderModes,game:fitStage};
function toast(msg,ic='check',kind='green'){
 const t=el('div','toast '+kind);
 t.innerHTML=`<svg class="ic"><use href="#i-${ic}"/></svg><span>${msg}</span>`;
 $('#toasts').appendChild(t);
 if($('#toasts').children.length>3)$('#toasts').children[0].remove();
 setTimeout(()=>t.classList.add('bye'),2400);
 setTimeout(()=>t.remove(),2850);
}
function updateWallets(){
 $$('.w-c').forEach(e=>e.textContent=fmt(S.coins));
 $$('.w-g').forEach(e=>e.textContent=fmt(S.gems));
}

/* ================= tap animation layer ================= */
function sparkle(x,y){
 if(S.settings.motion)return;
 const cols=['#45B5E5','#FFCE2E','#FF6B81','#4EC467'];
 for(let i=0;i<10;i++){
  const s=el('span','spark');
  const a=Math.random()*6.283,d=55+Math.random()*75;
  s.style.setProperty('--dx',Math.cos(a)*d+'px');
  s.style.setProperty('--dy',Math.sin(a)*d+'px');
  s.style.left=x+'px';s.style.top=y+'px';
  s.style.background=cols[i%4];
  document.body.appendChild(s);
  setTimeout(()=>s.remove(),680);
 }
}
document.addEventListener('pointerdown',e=>{
 const b=e.target.closest('.btn,.mini,.navb,.hud-pbtn,.xbtn,.tabs button,.seg button,.pchip,.trow,.node,.linkish,.hnb');
 if(b){
  b.classList.remove('pressed');void b.offsetWidth;b.classList.add('pressed');
  setTimeout(()=>b.classList.remove('pressed'),330);
  if(b.matches('.btn,.mini,.navb,.hud-pbtn,.xbtn,.tabs button,.seg button,.pchip,.trow')){
   const r=b.getBoundingClientRect();
   const d=Math.max(r.width,r.height)*2.1;
   const rip=el('span','ripple');
   rip.style.width=rip.style.height=d+'px';
   rip.style.left=(e.clientX-r.left-d/2)+'px';
   rip.style.top=(e.clientY-r.top-d/2)+'px';
   b.appendChild(rip);
   setTimeout(()=>rip.remove(),540);
  }
 }
 const hb=e.target.closest('.hub-nav button');
 if(hb){
  const ic=hb.querySelector('.hnb');
  if(ic){ic.classList.remove('jig');void ic.offsetWidth;ic.classList.add('jig');setTimeout(()=>ic.classList.remove('jig'),520)}
 }
 const big=e.target.closest('#hero-play,#hub-play,#map-play,#pre-start,#chal-start,#tut-go,#set-tut');
 if(big)sparkle(e.clientX,e.clientY);
},{passive:true});

/* ================= hub ================= */
function updateHub(){
 const n=currentLevel(),w=WORLDS[Math.floor((n-1)/25)];
 const wc=$('#hub-world');wc.textContent=w.name;wc.style.background=hslChip(w.hue);
 $('#hub-lv').textContent='LEVEL '+n;
 $('#hub-meta').textContent=`${clearedCount()} / 1,000 cleared · ${totalStars()} stars`;
 $('#map-play').textContent='PLAY LEVEL '+n;
 renderStreak();updateWallets();renderRank();renderWheel();
}
function renderRank(){
 const need=xpForRank(S.rank);
 $('#hub-rank-n').textContent=S.rank;
 $('#hub-xp-fill').style.width=clamp(S.xp/need*100,0,100)+'%';
 $('#hub-xp-txt').textContent=fmt(S.xp)+'/'+fmt(need);
}
function renderStreak(){
 const st=S.streak,t=todayStr();
 $('#st-count').textContent=st.count+(st.count===1?' day':' days');
 const box=$('#st-days');box.innerHTML='';
 for(let i=6;i>=0;i--){
  const d=new Date();d.setDate(d.getDate()-i);
  const hit=st.days.includes(dstr(d));
  const s=el('span','sday'+(hit?' hit':'')+(i===0?' today':''));
  s.innerHTML=`<i></i><small>${['S','M','T','W','T','F','S'][d.getDay()]}</small>`;
  box.appendChild(s);
 }
 const y=new Date();y.setDate(y.getDate()-1);
 const msg=st.last===t?'Streak safe — come back tomorrow!':
  st.last===dstr(y)?'Play today to keep your streak alive!':
  st.count>0?'Missed a day — a fresh streak starts today.':'Play every day for bonus coins.';
 const m=$('#st-msg');m.textContent=msg;
 m.className='st-msg '+(st.last===t?'g':st.last===dstr(y)?'a':'n');
 const fz=$('#st-freeze');
 if(st.freeze>0){
  fz.style.display='block';fz.className='st-msg a';
  fz.innerHTML=icon('shield')+` ${st.freeze} Streak Freeze ${st.freeze===1?'charge':'charges'} — protects one missed day`;
 }else fz.style.display='none';
}
function daysBetween(a,b){
 const pa=a.split('-').map(Number),pb=b.split('-').map(Number);
 const da=new Date(pa[0],pa[1]-1,pa[2]),db=new Date(pb[0],pb[1]-1,pb[2]);
 return Math.round((db-da)/86400000);
}
function checkIn(){
 const t=todayStr(),st=S.streak;
 if(st.last===t)return;
 if(!st.last){st.count=1}
 else{
  const gap=daysBetween(st.last,t);
  if(gap===1)st.count++;
  else if(gap===2&&st.freeze>0){st.freeze--;st.count++;toast('Streak Freeze used — your streak lives on!','shield','amber')}
  else st.count=1;
 }
 st.last=t;st.days.push(t);if(st.days.length>14)st.days=st.days.slice(-14);
 st.best=Math.max(st.best,st.count);
 S.stats.playDays++;
 const bonus=Math.min(70,10+st.count*5);
 S.coins+=bonus;S.stats.coinsEarned+=bonus;
 gainXp(8+Math.min(20,st.count*2));
 toast(`Day ${st.count} streak — +${bonus} coins!`,'flame','green');
 saveSave();
}
function checkBadges(){
 for(const b of BADGES)if(!S.badges[b.id]&&b.test()){S.badges[b.id]=1;toast('Badge earned: '+b.n,'trophy','green')}
 saveSave();
}

/* ================= level map ================= */
let mapBuilt=false,mapScrolled=false,mapIO=null;const nodeEls=[];
function buildMap(){
 const list=$('#map-list'),fr=document.createDocumentFragment();
 for(let w=0;w<40;w++){
  const sec=el('div','world');
  sec.innerHTML=`<div class="wh"><span class="wdot" style="background:hsl(${WORLDS[w].hue} 60% 45%)"></span><b>${w+1} · ${WORLDS[w].name}</b><span class="wprog"></span></div><div class="wgrid"></div>`;
  const grid=sec.querySelector('.wgrid');
  for(let i=1;i<=25;i++){
   const n=w*25+i,b=el('button','node');
   b.dataset.n=n;grid.appendChild(b);nodeEls[n]=b;
  }
  fr.appendChild(sec);
 }
 list.appendChild(fr);
 list.addEventListener('click',e=>{
  const b=e.target.closest('.node');if(!b)return;
  const n=+b.dataset.n;
  if(b.classList.contains('locked')){toast(`Clear level ${n-1} first to unlock this one`,'lock','amber');return}
  A.ui();openPre(n,'map');
 });
 mapBuilt=true;
}
function updateMapState(){
 if(!mapBuilt)return;
 for(let n=1;n<=1000;n++){
  const b=nodeEls[n];if(!b)continue;
  const st=S.stars[n],locked=n>1&&!S.stars[n-1],cur=n===currentLevel(),boss=isBossLevel(n);
  b.className='node'+(locked?' locked':st>0?' done':' open')+(cur?' cur':'')+(boss?' boss':'');
  const crown=boss?`<svg class="ic bcrown"><use href="#i-crown"/></svg>`:'';
  const flame=boss&&!locked?`<svg class="ic bflame"><use href="#i-flame"/></svg>`:'';
  b.innerHTML=locked?icon('lock'):`${flame}${crown}<span class="nn">${n}</span>${st>0?`<span class="nst">${starRow(st)}</span>`:''}`;
 }
 $$('#map-list .world').forEach((sec,w)=>{
  let c=0;for(let k=1;k<=25;k++)if(S.stars[w*25+k])c++;
  sec.querySelector('.wprog').textContent=c+'/25';
  sec.classList.toggle('locked',!(w===0||S.stars[w*25]>0));
 });
}
function onShowMap(){
 if(!mapBuilt)buildMap();
 updateMapState();
 if(!mapIO){
  if(S.settings.motion||!('IntersectionObserver' in window)){
   $$('#map-list .world').forEach(s=>s.classList.add('vis'));
  }else{
   mapIO=new IntersectionObserver(es=>{es.forEach(x=>{
    if(x.isIntersecting){x.target.classList.add('vis');mapIO.unobserve(x.target)}
   })},{root:$('#map-list'),rootMargin:'80px'});
   $$('#map-list .world').forEach(s=>mapIO.observe(s));
  }
 }
 if(!mapScrolled){mapScrolled=true;
  setTimeout(()=>{const n=nodeEls[currentLevel()];n&&n.scrollIntoView({block:'center'})},80)}
}

/* ================= shop ================= */
let shopTab='skins';
function renderShop(){
 $$('#shop-tabs button').forEach(b=>b.classList.toggle('on',b.dataset.tab===shopTab));
 const L=$('#shop-list');L.innerHTML='';
 let i=0;
 const row=h=>{const d=el('div','sitem card pop');d.style.animationDelay=(Math.min(i,12)*45)+'ms';i++;d.innerHTML=h;L.appendChild(d)};
 if(shopTab==='skins'){
  for(const s of SKINS){
   const owned=S.skins.includes(s.id),eq=S.skin===s.id;
   const dots=s.lanes.map(cl=>`<i style="background:${cl}"></i>`).join('');
   const btn=owned?(eq?`<button class="btn sm green" disabled>ON</button>`:`<button class="btn sm ghost" data-act="eq-skin" data-id="${s.id}">EQUIP</button>`)
    :`<button class="btn sm green" data-act="buy" data-id="skin:${s.id}">${icon(s.cur==='gems'?'gem':'coin')}${s.cost}</button>`;
   row(`<span class="swatch">${dots}</span><div class="sinfo"><b>${s.name}</b><small>${s.desc}</small></div><div class="sact">${btn}</div>`);
  }
 }else if(shopTab==='trails'){
  for(const t of TRAILS){
   const owned=(S.trails||[]).includes(t.id),eq=(S.trail||'classic')===t.id;
   const btn=owned?(eq?`<button class="btn sm green" disabled>ON</button>`:`<button class="btn sm ghost" data-act="eq-trail" data-id="${t.id}">EQUIP</button>`)
    :`<button class="btn sm green" data-act="buy" data-id="trail:${t.id}">${icon(t.cur==='gems'?'gem':'coin')}${t.cost}</button>`;
   row(`<span class="stile" style="color:${t.c}">${icon(t.ic)}</span><div class="sinfo"><b>${t.name}</b><small>${t.desc}</small></div><div class="sact">${btn}</div>`);
  }
 }else if(shopTab==='inst'){
  const items=[{id:'',name:'World Mix',desc:'Every world keeps its own instrument.'},...INSTRPACKS];
  for(const p of items){
   const owned=!p.id||S.instr.includes(p.id);
   const eq=p.id?S.instrEq===p.id:!S.instrEq;
   const btn=owned?(eq?`<button class="btn sm green" disabled>ON</button>`:`<button class="btn sm ghost" data-act="eq-inst" data-id="${p.id}">EQUIP</button>`)
    :`<button class="btn sm green" data-act="buy" data-id="inst:${p.id}">${icon('coin')}${p.cost}</button>`;
   const hear=p.id?`<button class="mini" data-act="hear" data-id="${p.id}" aria-label="Preview">${icon('play')}</button>`:'';
   row(`<span class="stile" style="background:hsl(${(hash(p.id)%360)} 65% 87%)">${icon('note')}</span><div class="sinfo"><b>${p.name}</b><small>${p.desc}${owned&&p.id?' <em class="own">owned</em>':''}</small></div><div class="sact">${hear}${btn}</div>`);
  }
 }else if(shopTab==='pow'){
  for(const p of POWERUPS){
   const n=S.power[p.id]||0;
   row(`<span class="stile" style="background:var(--grass-t)">${icon(p.icon)}</span><div class="sinfo"><b>${p.name}<em class="own">×${n} owned</em></b><small>${p.desc}</small></div><div class="sact"><button class="btn sm green" data-act="buy" data-id="pow:${p.id}">${icon('coin')}${p.cost}</button></div>`);
  }
 }else{
  for(const b of BOOSTERS){
   const left=b.id==='double'?S.booster.left:(S.scoreBoost?S.scoreBoost.left:0);
   const act=left>0?`<em class="own amber">Active · ${left} levels left</em>`:'';
   row(`<span class="stile" style="background:var(--sun-t)">${icon('coin')}</span><div class="sinfo"><b>${b.name}${act}</b><small>${b.desc}</small></div><div class="sact"><button class="btn sm green" data-act="buy" data-id="boost:${b.id}">${icon('coin')}${b.cost}</button></div>`);
  }
 }
}
function tryBuy(cost,cur){
 if(cur==='gems'){if(S.gems<cost){toast('Not enough gems','gem','red');return false}S.gems-=cost}
 else{if(S.coins<cost){toast('Not enough coins','coin','red');return false}S.coins-=cost}
 A.coin();updateWallets();return true;
}
 $('#shop-tabs').addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 shopTab=b.dataset.tab;A.ui();renderShop();
});
 $('#shop-list').addEventListener('click',e=>{
 const b=e.target.closest('[data-act]');if(!b)return;
 const act=b.dataset.act,id=b.dataset.id;
 if(act==='hear'){A.hear(id);return}
 if(act==='buy'){
  const [type,key]=id.split(':');
  if(type==='skin'){const s=SKINS.find(x=>x.id===key);
   if(tryBuy(s.cost,s.cur)){S.skins.push(key);S.skin=key;toast('Skin unlocked: '+s.name,'check','green')}}
  else if(type==='trail'){const t=TRAILS.find(x=>x.id===key);
   if(tryBuy(t.cost,t.cur)){S.trails.push(key);S.trail=key;toast('Trail unlocked: '+t.name,'check','green')}}
  else if(type==='pow'){const p=POWERUPS.find(x=>x.id===key);
   if((S.power[key]||0)>=9){toast('Already at maximum (×9)','x','amber');return}
   if(tryBuy(p.cost,'coins')){S.power[key]=(S.power[key]||0)+1;toast(p.name+' added — pick it before a level','check','green')}}
  else if(type==='inst'){const p=INSTRPACKS.find(x=>x.id===key);
   if(tryBuy(p.cost,'coins')){S.instr.push(key);S.instrEq=key;toast('Instrument pack unlocked','note','green')}}
  else if(type==='boost'){
   if(key==='double'){if(tryBuy(350,'coins')){S.booster.left+=5;toast('Coin Doubler: next 5 levels','coin','green')}}
   else{if(tryBuy(500,'coins')){S.scoreBoost.left+=5;toast('Score Doubler: next 5 levels','star','green')}}}
 }else if(act==='eq-skin'){S.skin=id;A.ui()}
 else if(act==='eq-trail'){S.trail=id;A.ui()}
 else if(act==='eq-inst'){S.instrEq=id||null;A.ui()}
 saveSave();renderShop();
});

/* ================= settings & profile ================= */
function renderSettings(){
 $$('#scr-settings .trow').forEach(r=>r.classList.toggle('on',!!S.settings[r.dataset.set]));
 $$('#assist-seg button').forEach(b=>b.classList.toggle('on',+b.dataset.a===S.settings.assist));
}
let resetArm=false;
 $('#scr-settings').addEventListener('click',e=>{
 const row=e.target.closest('.trow');
 if(row){const k=row.dataset.set;S.settings[k]=!S.settings[k];
  if(k==='music'||k==='sfx')A.vol();
  if(k==='music'){if(S.settings.music)ensureIdleMusic();else{A.stopPad();A.stopIdleGroove()}}
  saveSave();renderSettings();A.ui();return}
 const ab=e.target.closest('#assist-seg button');
 if(ab){S.settings.assist=+ab.dataset.a;saveSave();renderSettings();A.ui();return}
 const tb=e.target.closest('#set-tut');
 if(tb){A.ui(); runTutorial(()=>nav('settings')); return}
 const rb=e.target.closest('#set-reset');
 if(rb){
  if(!resetArm){resetArm=true;rb.textContent='TAP AGAIN';rb.classList.add('green');
   setTimeout(()=>{resetArm=false;rb.textContent='RESET';rb.classList.remove('green')},2500)}
  else{localStorage.removeItem(LS);location.reload()}
 }
});
function renderProfile(){
 const st=S.stats;
 $('#p-stats').innerHTML=[
  ['Rank','#'+S.rank],['Total Score',fmt(st.totalScore)],['Levels Cleared',clearedCount()+' / 1000'],['Stars Earned',totalStars()],
  ['Best Combo','×'+st.bestCombo],['Notes Hit',fmt(st.notes)],['Days Played',st.playDays]
 ].map(([l,v])=>`<div class="pstat"><b>${v}</b><small>${l.toUpperCase()}</small></div>`).join('');
 $('#p-badges').innerHTML=BADGES.map(b=>{
  const got=S.badges[b.id];
  return `<div class="bdg ${got?'':'locked'}"><svg class="ic" style="color:${b.c}"><use href="#i-${b.ic}"/></svg><b>${b.n}</b>${got?'':`<svg class="lk"><use href="#i-lock"/></svg>`}</div>`;
 }).join('');
 $$('#p-stats .pstat').forEach((n,i)=>{n.classList.add('pop');n.style.animationDelay=(i*55)+'ms'});
 $$('#p-badges .bdg').forEach((n,i)=>{if(i<14){n.classList.add('pop');n.style.animationDelay=(140+i*40)+'ms'}});
}

/* ================= challenge ================= */
function renderChallenge(){
 const t=todayStr();
 $('#chal-today').textContent=S.challenge.date===t&&S.challenge.today?fmt(S.challenge.today):'—';
 $('#chal-at').textContent=S.chalAT.best?fmt(S.chalAT.best):'—';
}
setInterval(()=>{
 if(route!=='chal')return;
 const now=new Date(),mid=new Date(now);mid.setHours(24,0,0,0);
 let s=Math.max(0,Math.floor((mid-now)/1000));
 const h=Math.floor(s/3600),m=Math.floor(s%3600/60);s%=60;
 $('#chal-cd').innerHTML=`${icon('clock')}Resets in ${pad(h)}:${pad(m)}:${pad(s)}`;
},1000);
 $('#chal-start').addEventListener('click',()=>{
 checkIn();
 if(!S.tut){runTutorial(()=>startRun(buildChallenge(),{}));return}
 startRun(buildChallenge(),{});
});

/* ================= game modes ================= */
function renderModes(){
 $('#mode-gauntlet-best').textContent=S.modes.gauntletBest?fmt(S.modes.gauntletBest):'—';
 $('#mode-endless-best').textContent=S.modes.endlessBestScore?fmt(S.modes.endlessBestScore):'—';
 $('#mode-endless-bpm').textContent=S.modes.endlessBestBpm?S.modes.endlessBestBpm+' BPM':'—';
 $('#mode-hardcore-best').textContent=S.modes.hardcoreBest?fmt(S.modes.hardcoreBest):'—';
}
function pickGauntletLevels(){
 const maxN=Math.max(5,currentLevel());
 const pool=[];for(let i=1;i<=maxN;i++)pool.push(i);
 for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=pool[i];pool[i]=pool[j];pool[j]=t}
 return pool.slice(0,5);
}
function startGauntlet(){
 const levels=pickGauntletLevels();
 const queueGen=idx=>buildLevel(levels[idx]);
 startRun(queueGen(0),{gauntlet:true,queueGen,queueIdx:0,queueMax:5});
}
function startEndless(){
 const seed=Math.floor(Math.random()*1e9);
 const queueGen=idx=>buildEndlessSegment(seed,idx);
 startRun(queueGen(0),{endless:true,queueGen,queueIdx:0,queueMax:0});
}
function startZen(){
 startRun(buildZen(Math.floor(Math.random()*1e9)),{zen:true});
}
function startHardcore(){
 startRun(buildLevel(currentLevel()),{hardcore:true});
}
 $('#mode-gauntlet-start').addEventListener('click',()=>{A.ui();startGauntlet()});
 $('#mode-endless-start').addEventListener('click',()=>{A.ui();startEndless()});
 $('#mode-zen-start').addEventListener('click',()=>{A.ui();startZen()});
 $('#mode-hardcore-start').addEventListener('click',()=>{A.ui();startHardcore()});

/* ================= game flow ================= */
const E=new Engine($('#gcv'),{hud:{
 scoreBox:$('#hud-score'),score:$('#hud-score'),comboN:$('#hud-combo-n'),comboBox:$('#hud-combo'),
 hearts:$('#hud-hearts'),pow:$('#hud-pow'),fill:$('#hud-fill'),fillWrap:$('#hud-progwrap'),lvl:$('#hud-lv')
},onFinish:onRunFinish});
function fitStage(){
 const app=$('#app');
 const k=Math.min((app.clientWidth-12)/548,(app.clientHeight-12)/884,1.32);
 $('#stage').style.transform=`scale(${k})`;
}
window.addEventListener('resize',fitStage);
window.addEventListener('orientationchange',()=>setTimeout(fitStage,150));
document.addEventListener('fullscreenchange',()=>setTimeout(fitStage,80));
const hideAllOvls=()=>$$('.ovl').forEach(o=>o.classList.remove('on'));
function startRun(lvl,mods){
 A.init();A.resume();
 CG.gameplayStart();
 document.body.classList.add('ingame');
 // CrazyGames mobile: avoid fullscreen trap, but try immersive if available
 try{const de=document.documentElement;if(de.requestFullscreen && window.innerWidth<720) de.requestFullscreen({navigationUI:'hide'}).catch(()=>{})}catch(e){}
 hideAllOvls();
 if(route!=='game')nav('game');
 fitStage();
 E.start(lvl,mods);
}
function leaveRun(to){
 document.body.classList.remove('ingame');
 $('#tut-skip').classList.add('hidden');
 $('#comboMilestone').classList.remove('show');
 document.getElementById('screenFlash')?.classList.remove('flash','missFlash','goodFlash');
 CG.gameplayStop();
 if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});
 E.running=false;E.state='idle';cancelAnimationFrame(E.raf);
 A.stopPad();
 hideAllOvls();nav(to);
}
let pendingLevel=1,pendingFrom='hub',preSel={};
function openPre(n,from='hub'){
 pendingLevel=n;pendingFrom=from;
 const w=WORLDS[Math.floor((n-1)/25)],P=levelParams(n);
 const wc=$('#pre-world');wc.textContent=w.name;wc.style.background=hslChip(w.hue);
 $('#pre-title').innerHTML=P.boss?`${icon('crown')} BOSS LEVEL ${n}`:'LEVEL '+n;
 $('#pre-title').classList.toggle('boss',!!P.boss);
 if(n===1){
   $('#pre-meta').innerHTML=`<b style="color:var(--grass)">BEGINNER FRIENDLY</b> · ${Math.round(P.bpm)} BPM · Single taps first — easy intro! · <b class="d-${diffTier(n)}">${DIFF[diffTier(n)]}</b>`;
 } else {
   $('#pre-meta').innerHTML=`${Math.round(P.bpm)} BPM · 4 lanes · Taps · Holds · Doubles · Swipes · Releases · <b class="d-${diffTier(n)}">${DIFF[diffTier(n)]}</b>`+(P.boss?' · <b class="boss-note">3-phase boss track — gets harder every third</b>':'');
 }
 const best=S.stars[n];
 $('#pre-best').innerHTML=best?'BEST &nbsp;'+starRow(best):'NOT CLEARED YET';
 $('#pre-tag').innerHTML='';
 if(S.instrEq){
  const p=INSTRPACKS.find(x=>x.id===S.instrEq);
  $('#pre-tag').innerHTML=best
   ?`<span class="ptag">Sound: ${p?p.name:S.instrEq}</span>`
   :`<span class="ptag">PRACTICE RUN — rewards off until you clear it with the world sound</span>`;
 }
 const box=$('#pre-pow');box.innerHTML='';preSel={};
 const owned=POWERUPS.filter(p=>(S.power[p.id]||0)>0);
 if(!owned.length){
  box.innerHTML='<p class="pre-empty">No power-ups yet — grab some from the Shop to boost this run.</p>';
 }else{
  for(const p of owned){
   const cnt=S.power[p.id]||0;
   const b=el('button','pchip');
   b.dataset.p=p.id;
   b.innerHTML=`${icon(p.icon)}<span>${p.name}</span><b>×${cnt}</b>`;
   box.appendChild(b);
  }
 }
 box.onclick=e=>{
  const b=e.target.closest('.pchip');if(!b)return;
  const id=b.dataset.p;preSel[id]=!preSel[id];
  b.classList.toggle('sel',preSel[id]);A.ui();
 };
 nav('game');
 $('#ovl-pre').classList.add('on');
}
 $('#pre-start').addEventListener('click',()=>{
 const mods={};
 if(preSel.heart&&S.power.heart>0){S.power.heart--;mods.heart=true}
 if(preSel.slow&&S.power.slow>0){S.power.slow--;mods.slow=true}
 if(preSel.auto&&S.power.auto>0){S.power.auto--;mods.auto=3}
 if(preSel.shield&&S.power.shield>0){S.power.shield--;mods.shield=true}
 if(preSel.revive&&S.power.revive>0){S.power.revive--;mods.revive=true}
 if(preSel.combo&&S.power.combo>0){S.power.combo--;mods.combo=true}
 if(preSel.magnet&&S.power.magnet>0){S.power.magnet--;mods.magnet=true}
 mods.instr=S.instrEq;
 mods.practice=!!S.instrEq&&!S.stars[pendingLevel];
 const lvl=buildLevel(pendingLevel,{slow:!!mods.slow});
 saveSave();updateWallets();
 $('#ovl-pre').classList.remove('on');
 checkIn();
 if(!S.tut){
   showTutIntro(()=>startRun(lvl,mods));
 } else startRun(lvl,mods);
});
 $('#pre-close').addEventListener('click',()=>{$('#ovl-pre').classList.remove('on');leaveRun(pendingFrom||'hub')});
 $('#pre-shop').addEventListener('click',()=>{
 A.ui();$('#ovl-pre').classList.remove('on');
 shopTab='pow';leaveRun('shop');
});
 $('#hud-pause').addEventListener('click',()=>{
 if(!E.running||E.paused||E.state!=='play'&&E.state!=='count')return;
 E.pause();
 $('#pz-score').textContent=fmt(E.score)+' pts';
 $('#pz-combo').textContent='×'+E.combo+' combo';
 $('#ovl-pause').classList.add('on');
});
 $('#pz-resume').addEventListener('click',()=>{$('#ovl-pause').classList.remove('on');E.resume()});
 $('#pz-restart').addEventListener('click',()=>{
 $('#ovl-pause').classList.remove('on');
 startRun(E.level,{...E.mods});
});
 $('#pz-quit').addEventListener('click',()=>{$('#ovl-pause').classList.remove('on');leaveRun('map')});
window.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&route==='game'&&E.running&&!E.ended){
  if(E.paused){$('#ovl-pause').classList.remove('on');E.resume()}
  else if(E.state==='play'||E.state==='count'){$('#ovl-pause').classList.add('on');E.pause()}
 }
});
document.addEventListener('visibilitychange',()=>{
 if(document.hidden&&route==='game'&&E.running&&!E.paused&&(E.state==='play'||E.state==='count')){
  $('#ovl-pause').classList.add('on');E.pause();
 }
});

/* ================= first-time interactive tutorial ================= */
let tutAfter=null;
const TUT_MELODY=[60,64,67,69,72,67,69,72,74,76];
function showTutIntro(after){
 // clear START/SKIP intro overlay with explanation of tap mechanic
 tutAfter=after;
 const ovl=document.getElementById('ovl-tut-intro');
 if(ovl){ ovl.classList.add('on'); }
 // ensure we are on game screen but not yet playing
 if(route!=='game') nav('game');
 fitStage();
}
function runTutorial(after){
 tutAfter=after;
 // hide intro if present
 document.getElementById('ovl-tut-intro')?.classList.remove('on');
 const lvl=buildTutorial();
 const r4=()=>Math.floor(Math.random()*4);
 const dGap=clamp(lvl.spb*.5,.25,.4);
 let mi=0,busy=false,sIdx=0,qIdx=0;
 const STEPS=[
  {title:'STEP 1 / 6 · TAP',text:'Tap exactly when the note hits the line — listen for the beat!',q:[
   {type:'tap'},{type:'tap'},{type:'tap'}]},
  {title:'STEP 2 / 6 · HOLD',text:'Press and hold — keep holding until the bar ends, then release.',q:[
   {type:'hold',dur:lvl.spb*1.5},{type:'hold',dur:lvl.spb*2}]},
  {title:'STEP 3 / 6 · DOUBLE TAP',text:'Two quick taps on the same lane — hit, then hit again instantly!',q:[
   {type:'double',dt:dGap},{type:'double',dt:dGap}]},
  {title:'STEP 4 / 6 · SWIPE',text:'Flick in the arrow direction as it hits the line — swipe left or right.',q:[
   {type:'swipe',dir:-1},{type:'swipe',dir:1}]},
  {title:'STEP 5 / 6 · HOLD & RELEASE',text:'Hold to the end — let go exactly when the ring reaches the line.',q:[
   {type:'release',dur:lvl.spb*1.5},{type:'release',dur:lvl.spb*1.5}]},
  {title:'STEP 6 / 6 · ALL TOGETHER',text:'Now all notes together — just like a real level!',q:[
   {type:'swipe',dir:Math.random()<.5?-1:1},{type:'double',dt:dGap},{type:'tap'},{type:'release',dur:lvl.spb*1.5},{type:'hold',dur:lvl.spb},{type:'tap'}]}
 ];
 const onNoteDone=()=>{
  if(busy||!alive())return;
  busy=true;qIdx++;
  setTimeout(()=>{busy=false;spawnNext()},380);
 };
 const myTut={card:{title:'WELCOME TO BEATCRAFT',text:'Watch the highlighted pad — tap to the beat!'},onDone:onNoteDone};
 const alive=()=>E.running&&E.mods&&E.mods.tut===myTut;
 const setCard=st=>{if(alive())myTut.card={title:st.title,text:st.text}};
 const spawnNext=()=>{
  if(!alive())return;
  if(qIdx>=STEPS[sIdx].q.length){stepDone();return}
  const spec=STEPS[sIdx].q[qIdx];
  spec.lane=r4();
  spec.midi=TUT_MELODY[(mi++)%TUT_MELODY.length];
  E.tutTarget=E.spawnNote(spec);
 };
 const stepDone=()=>{
  if(!alive())return;
  if(sIdx>=STEPS.length-1){finishTutorial(false);return}
  sIdx++;qIdx=0;
  E.pop(CW/2,300,'GREAT!',COL.green,'check',true);
  triggerScreenFlash('good');
  A.comboSting(); haptic('combo');
  setCard(STEPS[sIdx]);
  setTimeout(spawnNext,560);
 };
 startRun(lvl,{tut:myTut});
 $('#tut-skip').classList.remove('hidden');
 setTimeout(()=>{setCard(STEPS[0]);spawnNext()},(E.countIn+0.22)*1000);
}
function finishTutorial(skipped){
 E.running=false;E.state='idle';cancelAnimationFrame(E.raf);
 $('#tut-skip').classList.add('hidden');
 document.body.classList.remove('ingame');
 if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});
 A.stopPad();
 S.tut=1; try{ localStorage.setItem('beatcraft_tut','1'); localStorage.setItem(LS, JSON.stringify(S)); }catch(e){}
 saveSave();
 // Never show again after completed - persist
 if(skipped){
  CG.happytime();
  if(tutAfter){const f=tutAfter;tutAfter=null;f();return}
  return;
 }
 $('#ovl-tut').classList.add('on');
}
 $('#tut-go').addEventListener('click',()=>{
 $('#ovl-tut').classList.remove('on');
 CG.happytime();
 const f=tutAfter;tutAfter=null;if(f)f();
 else startRun(buildLevel(1),{});
});
 $('#tut-skip').addEventListener('click',()=>{A.ui();finishTutorial(true)});
 // New intro START / SKIP handlers - clear START and SKIP buttons
 document.getElementById('tut-intro-start')?.addEventListener('click',()=>{ A.ui(); haptic('select'); const f=tutAfter; document.getElementById('ovl-tut-intro')?.classList.remove('on'); runTutorial(f); });
 document.getElementById('tut-intro-skip')?.addEventListener('click',()=>{ A.ui(); haptic('select'); document.getElementById('ovl-tut-intro')?.classList.remove('on'); finishTutorial(true); });
 document.getElementById('ovl-tut-intro')?.addEventListener('click', (e)=>{ if(e.target.id==='ovl-tut-intro') { A.ui(); document.getElementById('ovl-tut-intro')?.classList.remove('on'); finishTutorial(true); } });

/* ---------- results ---------- */
let resCtx=null;
function countUp(elm,to){
 const t0=performance.now(),dur=700;
 const step=t=>{const k=Math.min(1,(t-t0)/dur);
  elm.textContent=fmt(to*(k*k*(3-2*k)));if(k<1)requestAnimationFrame(step)};
 requestAnimationFrame(step);
}
function onRunFinish(r){
 document.body.classList.remove('ingame');
 if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});
 if(r.challenge){finishChallenge(r);return}
 if(r.mode){finishModeRun(r);return}
 const prev=S.stars[r.n]||0;
 const rw={coins:0,gems:0,tags:[]};
 if(r.cleared&&!r.practice){
  const first=prev===0;
  rw.coins=first?r.stars*12+Math.floor(r.score/600)+10:Math.ceil(r.stars*12/4)+2;
  if(r.magnet){rw.coins=Math.round(rw.coins*1.5);rw.tags.push('MAGNET +50%')}
  if(S.booster.left>0){rw.coins*=2;S.booster.left--;rw.tags.push('COIN ×2')}
  if(S.scoreBoost.left>0){r.score*=2;S.scoreBoost.left--;rw.tags.push('SCORE ×2')}
  if(r.flawless){rw.gems=1;rw.tags.push('FLAWLESS +1 GEM')}
  if(r.stars>prev)rw.tags.push('NEW BEST');
  S.coins+=rw.coins;S.gems+=rw.gems;S.stats.coinsEarned+=rw.coins;
  S.stars[r.n]=Math.max(prev,r.stars);
  if(r.flawless)S.stats.flawless++;
 }
 if(r.practice&&r.cleared)rw.tags.push('PRACTICE — NO REWARDS');
 if(r.assist>0)rw.tags.push('ASSIST +'+r.assist*20+'%');
 S.stats.plays++;S.stats.totalScore+=r.score;
 S.stats.notes+=r.counts.perfect+(r.counts.great||0)+r.counts.good+r.counts.hold;
 S.stats.perfects+=r.counts.perfect;
 S.stats.bestCombo=Math.max(S.stats.bestCombo,r.maxCombo);
 gainXp(r.cleared?(r.practice?5:12+r.stars*14+Math.floor(r.score/250)):4);
 saveSave();updateWallets();updateMapState();updateHub();checkBadges();
 showResults(r,rw);
}
function finishChallenge(r){
 const t=todayStr(),ch=S.challenge,rw={coins:0,gems:0,tags:[]};
 if(ch.date!==t){ch.date=t;ch.today=0}
 if(r.score>ch.today)ch.today=r.score;
 if(r.score>S.chalAT.best){S.chalAT={best:r.score,date:t};rw.tags.push('NEW ALL-TIME BEST')}
 if(ch.coinDay!==t){ch.coinDay=t;rw.coins=25;S.coins+=25;S.stats.coinsEarned+=25;rw.tags.push('DAILY BONUS +25')}
 if(r.assist>0)rw.tags.push('ASSIST +'+r.assist*20+'%');
 S.stats.challenges++;S.stats.plays++;S.stats.totalScore+=r.score;
 S.stats.bestCombo=Math.max(S.stats.bestCombo,r.maxCombo);
 if(r.flawless&&r.cleared){S.stats.flawless++;S.gems++;rw.gems=1;rw.tags.push('FLAWLESS +1 GEM')}
 gainXp(Math.min(60,10+Math.floor(r.score/300)));
 saveSave();updateWallets();renderChallenge();checkBadges();
 showResults(r,rw);
}
function finishModeRun(r){
 const rw={coins:0,gems:0,tags:[]};
 if(r.mode==='gauntlet'){
  const prev=S.modes.gauntletBest;
  rw.coins=Math.max(5,Math.floor(r.score/150));
  if(r.score>prev){S.modes.gauntletBest=r.score;rw.tags.push('NEW BEST')}
  if(r.cleared&&r.segments>=5)rw.tags.push('GAUNTLET CLEARED');
 }else if(r.mode==='endless'){
  const prevS=S.modes.endlessBestScore,prevB=S.modes.endlessBestBpm;
  rw.coins=Math.max(5,Math.floor(r.score/150));
  if(r.score>prevS){S.modes.endlessBestScore=r.score;rw.tags.push('NEW BEST SCORE')}
  if((r.segBpm||0)>prevB){S.modes.endlessBestBpm=r.segBpm||0;rw.tags.push('NEW TOP BPM')}
 }else if(r.mode==='hardcore'){
  const prev=S.modes.hardcoreBest;
  rw.coins=r.cleared?Math.max(8,Math.floor(r.score/120)):0;
  if(r.score>prev){S.modes.hardcoreBest=r.score;rw.tags.push('NEW BEST')}
 }
 if(r.mode!=='zen'){
  S.coins+=rw.coins;S.gems+=rw.gems;S.stats.coinsEarned+=rw.coins;
  S.stats.plays++;S.stats.totalScore+=r.score;
  S.stats.bestCombo=Math.max(S.stats.bestCombo,r.maxCombo);
  gainXp(Math.min(50,8+Math.floor(r.score/300)));
 }else{
  S.stats.plays++;gainXp(6);
 }
 saveSave();updateWallets();renderModes();
 showResults(r,rw);
}
function showResults(r,rw){
 resCtx={r,rw};
 ensureIdleMusic();
 CG.gameplayStop();
 if(r.cleared) CG.happytime();
 let title;
 if(r.mode==='gauntlet')title=r.cleared&&r.segments>=5?'GAUNTLET CLEARED!':`GAUNTLET OVER — ${r.segments}/5`;
 else if(r.mode==='endless')title=`RUN OVER — ${r.segments} SEGMENT${r.segments===1?'':'S'}`;
 else if(r.mode==='zen')title='ZEN SESSION COMPLETE';
 else if(r.mode==='hardcore')title=r.cleared?'HARDCORE CLEARED!':'HARDCORE FAILED';
 else title=r.challenge?(r.cleared?'CHALLENGE DONE!':'OUT OF HEARTS'):r.cleared?'LEVEL CLEARED!':'LEVEL FAILED';
 const good=r.mode==='zen'||(r.mode==='gauntlet'&&r.cleared&&r.segments>=5)||(r.mode==='hardcore'&&r.cleared)||(!r.mode&&r.cleared);
 $('#res-out').textContent=title;
 $('#res-out').className='res-out '+(good?'ok':'no');
 // grade
 const gradeEl=$('#res-grade');
 if(!r.mode && !r.challenge && r.cleared){
  let grade='B', cls='B';
  if(r.acc>=98 && r.maxCombo>=50) {grade='S · PERFECT'; cls='S';}
  else if(r.acc>=90) {grade='A · EXCELLENT'; cls='A';}
  else if(r.acc>=70) {grade='B · GREAT'; cls='B';}
  else grade='C · GOOD';
  gradeEl.textContent=grade; gradeEl.className='res-grade '+cls; gradeEl.style.display='inline-flex';
 } else { gradeEl.style.display='none'; }
 const stEl=$('#res-stars');
 if(r.challenge||r.mode)stEl.style.display='none';
 else{
  stEl.style.display='flex';stEl.innerHTML='';
  for(let i=0;i<3;i++){const s=el('span','rstar');s.innerHTML=`<svg viewBox="0 0 24 24"><path d="${STARP}"/></svg>`;stEl.appendChild(s)}
 }
 $('.res-score').classList.toggle('hidden',r.mode==='zen');
 $('#res-acc').classList.toggle('hidden',r.mode==='zen');
 countUp($('#res-score'),r.score);
 $('#res-acc').textContent='ACCURACY '+r.acc+'%'+(r.maxCombo?' · MAX COMBO ×'+r.maxCombo:'');
 // enhanced grid: Score, Accuracy, Max Combo, Performance
 const grid=$('#res-grid');
 if(r.mode==='zen'){
  grid.innerHTML=`<div class="res-cell"><b>${r.segments||1}</b><small>SEGMENTS</small></div><div class="res-cell"><b>${fmt(r.score)}</b><small>SCORE</small></div><div class="res-cell"><b>${r.maxCombo?'×'+r.maxCombo:'—'}</b><small>COMBO</small></div>`;
 } else {
  const perf = r.flawless ? 'FLAWLESS' : r.acc>=90 ? 'EXCELLENT' : r.acc>=70 ? 'GREAT' : r.acc>=50 ? 'GOOD' : 'KEEP PRACTICING';
  grid.innerHTML=`<div class="res-cell"><b>${fmt(r.score)}</b><small>SCORE</small></div><div class="res-cell"><b>${r.acc}%</b><small>ACCURACY</small></div><div class="res-cell"><b>×${r.maxCombo}</b><small>MAX COMBO</small></div>`;
  // performance row is shown via grade + stats
 }
 if(r.mode==='gauntlet')$('#res-stats').innerHTML=`<span class="g">LEVELS CLEARED ${r.segments}/5</span><span class="g">COMBO ×${r.maxCombo}</span><span class="r">MISSES ${r.counts.miss}</span>`;
 else if(r.mode==='endless')$('#res-stats').innerHTML=`<span class="g">SEGMENTS ${r.segments}</span><span class="g">TOP BPM ${r.segBpm||0}</span><span class="r">MISSES ${r.counts.miss}</span>`;
 else if(r.mode==='zen')$('#res-stats').innerHTML=`<span class="g">Hope that felt good.</span>`;
 else if(r.mode==='hardcore')$('#res-stats').innerHTML=`<span class="g">PERFECT ${r.counts.perfect}</span><span class="g">GREAT ${r.counts.great||0}</span><span class="a">PARTIAL ${r.counts.partial}</span><span class="r">MISS ${r.counts.miss}</span>`;
 else $('#res-stats').innerHTML=r.challenge
  ?`<span class="g">COMBO ×${r.maxCombo}</span><span class="r">MISSES ${r.counts.miss}</span>`
  :`<span class="g">PERFECT ${r.counts.perfect}</span><span class="g">GREAT ${r.counts.great||0}</span><span class="g">GOOD ${r.counts.good}</span><span class="g">HELD ${r.counts.hold}</span><span class="a">PARTIAL ${r.counts.partial}</span><span class="r">MISS ${r.counts.miss}</span>`;
 $('#res-coin').innerHTML=(rw.coins||rw.gems)
  ?`${icon('coin')}<span>+${fmt(rw.coins)}</span>${rw.gems?icon('gem','cg')+'<span>+'+rw.gems+'</span>':''}`:'';
 $('#res-tags').innerHTML=rw.tags.map(t=>`<span class="rtag">${t}</span>`).join('');
 const next=$('#res-next'),again=$('#res-again'),home=$('#res-home');
 // prominent NEXT LEVEL and HOME/EXPLORE
 if(r.mode){
  again.textContent='PLAY AGAIN'; next.textContent='DONE'; home.textContent='HOME'; home.innerHTML=icon('map')+'HOME';
  again.className='btn ghost'; next.className='btn'; home.className='btn ghost';
  home.style.display='inline-flex'; again.style.display='inline-flex';
 } else if(r.challenge){
  again.textContent='PLAY AGAIN'; next.textContent='HOME'; home.style.display='none';
  again.className='btn'; next.className='btn ghost';
 } else if(r.cleared){
  again.textContent='REPLAY'; next.textContent=r.n>=1000?'EXPLORE MAP':'NEXT LEVEL'; home.innerHTML=icon('map')+' HOME'; home.style.display='inline-flex';
  again.className='btn ghost'; next.className='btn green'; home.className='btn ghost';
  next.style.fontSize='16px'; next.style.padding='13px 16px';
 } else {
  again.textContent='RETRY'; next.textContent='LEVEL MAP'; home.textContent='HOME'; home.style.display='none';
  again.className='btn green'; next.className='btn ghost';
 }
 // special Level 1: ensure NEXT and HOME are prominent
 if(r.n===1 && r.cleared){
  next.textContent='NEXT LEVEL →'; next.className='btn green';
  home.innerHTML=icon('map')+' EXPLORE';
 }
 if(!r.mode){ /* keep logic above */ }
 if(r.challenge){ next.className='btn ghost'; again.className='btn'; }
 $('#ovl-res').classList.add('on');
 if(good){
  if(!S.settings.motion) confettiBurst(24);
  A.fanfare();
  if(!r.mode&&!r.challenge)for(let i=0;i<(r.stars||0);i++)setTimeout(()=>{
   const s=stEl.children&&stEl.children[i];
   if(s){s.classList.add('on');A.star(i)}
  },180+i*160);
 }else A.failSnd();
}
 $('#res-again').addEventListener('click',()=>{
 const{r}=resCtx;$('#ovl-res').classList.remove('on');
 CG.gameplayStart();
 if(r.mode==='gauntlet')startGauntlet();
 else if(r.mode==='endless')startEndless();
 else if(r.mode==='zen')startZen();
 else if(r.mode==='hardcore')startHardcore();
 else if(r.challenge)startRun(buildChallenge(),{});
 else openPre(r.n,'map');
});
 $('#res-home').addEventListener('click',()=>{
 const{r}=resCtx;$('#ovl-res').classList.remove('on');
 if(r.mode) leaveRun('hub');
 else if(r.challenge) leaveRun('hub');
 else if(r.cleared) leaveRun('map');
 else leaveRun('hub');
 if(r.n===1 && r.cleared) toast('World 1 awaits — keep exploring!','map','green');
});
 $('#res-next').addEventListener('click',()=>{
 const{r}=resCtx;$('#ovl-res').classList.remove('on');
 if(r.mode){leaveRun('hub');return}
 if(r.challenge){leaveRun('hub');return}
 if(!r.cleared){leaveRun('map');return}
 if(r.n>=1000){leaveRun('map');toast('You cleared all 1,000 levels — legend!','trophy','green');return}
 CG.gameplayStart();
 openPre(r.n+1,'map');
});

/* ================= init ================= */
let demoSeed=7;
const ED=new Engine($('#cv-demo'),{demo:true});
ED.start(buildDemo(demoSeed));
document.addEventListener('click',e=>{
 const g=e.target.closest('[data-go]');
 if(g){A.ui();nav(g.dataset.go)}
});
 $('#hero-play').addEventListener('click',()=>{A.init();A.resume(); CG.gameplayStart(); openPre(currentLevel(),'hero')});
 $('#hub-play').addEventListener('click',()=>{A.ui();openPre(currentLevel(),'hub')});
 $('#map-play').addEventListener('click',()=>{A.ui();openPre(currentLevel(),'map')});
 $('#map-jump').addEventListener('click',()=>{
 const n=nodeEls[currentLevel()];if(n)n.scrollIntoView({block:'center',behavior:S.settings.motion?'auto':'smooth'});
});
document.addEventListener('pointerdown',()=>{A.init();A.resume();ensureIdleMusic()},{once:true});
if(document.fonts&&document.fonts.load)document.fonts.load('800 40px "Baloo 2"');
// Preserve localStorage progression and prevent accidental resets - handle migration
try{
 const legacyTut = localStorage.getItem('beatcraft_tut');
 if(legacyTut==='1') S.tut=1;
 if(clearedCount()>0) S.tut=1;
}catch(e){}
fitStage();updateWallets();updateHub();
// === First launch: automatically open Campaign/World 1 and select Level 1 (no loading screen, tutorial does NOT auto-start gameplay) ===
// Polished flow: open World 1 → highlight Level 1 → open Level 1 pre-screen. Tutorial intro only appears AFTER user taps START, with clear START/SKIP.
(function autoFirstLaunch(){
 const isFirst = !S.tut && clearedCount()===0;
 if(isFirst){
   requestAnimationFrame(()=>{
     nav('map');
     setTimeout(()=>{
       if(!mapBuilt) buildMap();
       updateMapState();
       const n1=nodeEls[1];
       if(n1){ n1.scrollIntoView({block:'center'}); }
       // Automatically select Level 1 - shows pre-screen with BEGINNER FRIENDLY. Tutorial will be offered after tapping START.
       openPre(1,'map');
     }, 80);
   });
   document.getElementById('scr-hero')?.classList.remove('on');
 } else {
   if(clearedCount()>0 && route==='hero'){
     // keep hero but make PLAY instant - no artificial wait
   }
 }
})();
// Extra: ensure tutorial completion saved correctly
try{
 if(S.tut) localStorage.setItem('beatcraft_tut','1');
}catch(e){}
// Touch controls optimization for CrazyGames mobile
(function optimizeTouch(){
 const cv=document.getElementById('gcv');
 if(cv){
   cv.style.touchAction='none';
   // prevent double-tap zoom, enlarge effective hit area via CSS
 }
 document.addEventListener('touchmove', (e)=>{ if(route==='game' && E.running) e.preventDefault(); }, {passive:false});
})();
