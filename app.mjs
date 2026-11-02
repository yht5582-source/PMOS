import {assess,cases,questions,sources,maps} from './clinical.mjs?v=1.3';
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const form=$('#diagnostic-form'), output=$('#diagnostic-output'), blankOutput=output.innerHTML;
const icons={red:'!',compatible:'✓',early:'◷','at-risk':'◷',insufficient:'?'};
let shown=false;
function syncStage(){
  const teen=form.elements.stage.value==='teen';
  $('#years-wrap').classList.toggle('hidden',!teen);
  $('#primary-wrap').classList.toggle('hidden',!teen);
  $('#morphology-field').classList.toggle('hidden',teen);
}
function readForm(){
  const f=form.elements, num=name=>f[name].value===''?NaN:Number(f[name].value);
  return {stage:f.stage.value,years:num('years'),days:num('days'),cycles:num('cycles'),gap90:f.gap90.checked,primaryAmenorrhea:f.stage.value==='teen'&&f.primaryAmenorrhea.checked,hirsutism:f.hirsutism.checked,androgen:f.androgen.checked,us:f.us.checked,amh:f.amh.checked,virilization:f.virilization.checked};
}
function renderAssessment(){
  const v=readForm(), r=assess(v), status=x=>x===null?'未能判定':x?'符合':'未符合', cls=x=>x===null?'unknown':x?'yes':'no';
  const notes=[];
  if(r.reclassified)notes.push('初經後已 ≥8 年，已改用成人標準判讀。');
  if(r.irregular===null&&r.code!=='early'&&r.code!=='red')notes.push('週期條件未能判定，請補週期資料。');
  output.innerHTML=`<div class="output-icon ${r.code}" aria-hidden="true">${icons[r.code]}</div><span class="kicker">ASSESSMENT · ${r.stage==='adult'?'成人':'青少年'}</span><h3>${esc(r.title)}</h3><p>${esc(r.message)}</p><div class="criteria"><div><span>週期不規則</span><strong class="${cls(r.irregular)}">${status(r.irregular)}</strong></div><div><span>高雄激素</span><strong class="${cls(r.hyper)}">${status(r.hyper)}</strong></div>${r.stage==='adult'?`<div><span>卵巢形態／AMH</span><strong class="${cls(r.morphology)}">${status(r.morphology)}</strong></div><div><span>成人條件數</span><strong>${r.count} / 3</strong></div>`:''}</div><div class="output-note">${notes.map(n=>esc(n)+'<br>').join('')}診斷前仍須排除妊娠（如適用），並檢查 TSH、泌乳素、17-羥基黃體素、FSH，再依情境排除其他原因。</div>`;
}
syncStage();
form.addEventListener('input',()=>{form.elements.years.setCustomValidity('');syncStage();if(shown&&form.checkValidity())renderAssessment();});
form.addEventListener('submit',event=>{
  event.preventDefault();
  const v=readForm(), f=form.elements;
  if(v.stage==='teen'&&!v.primaryAmenorrhea&&!Number.isFinite(v.years)){f.years.setCustomValidity('請填入初經後年數');f.years.reportValidity();return;}
  shown=true;renderAssessment();
  output.scrollIntoView({behavior:'smooth',block:'nearest'});
});
form.addEventListener('reset',()=>setTimeout(()=>{shown=false;form.elements.years.setCustomValidity('');syncStage();output.innerHTML=blankOutput;}));

let filter='all';const caseAnswers={};
function renderCases(){
  $('#case-list').innerHTML=cases.filter(c=>filter==='all'||c.label.startsWith(filter)).map(c=>`<article class="case-card" id="case-${c.id}"><div class="case-meta"><span>CASE ${c.id}</span><span>${esc(c.label)}</span></div><h3>${esc(c.title)}</h3><p>${esc(c.stem)}</p><div class="case-question"><strong>${esc(c.prompt)}</strong><div class="case-options">${c.choices.map((a,i)=>`<button type="button" data-case="${c.id}" data-choice="${i}"><span>${String.fromCharCode(65+i)}</span>${esc(a)}</button>`).join('')}</div></div><div class="case-reveal" hidden></div></article>`).join('');
  for(const [id,i] of Object.entries(caseAnswers)){const card=document.getElementById(`case-${id}`);if(card)revealCase(card,cases.find(x=>x.id===id),i);}
}
renderCases();
$('#case-filters').addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(!b)return;filter=b.dataset.filter;document.querySelectorAll('.filter').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',x===b);});renderCases();});
function revealCase(card,c,i){card.querySelectorAll('[data-choice]').forEach(x=>{x.disabled=true;x.classList.toggle('correct',Number(x.dataset.choice)===c.answer);x.classList.toggle('incorrect',Number(x.dataset.choice)===i&&i!==c.answer);});const out=card.querySelector('.case-reveal');out.hidden=false;out.innerHTML=`<div class="answer-label">${i===c.answer?'判斷正確':'再看一次關鍵線索'} · 正解 ${String.fromCharCode(65+c.answer)}</div><p>${esc(c.explain)}</p><div class="next"><strong>下一步</strong><p>${esc(c.next)}</p></div>`;}
$('#case-list').addEventListener('click',e=>{const b=e.target.closest('[data-case]');if(!b)return;const c=cases.find(x=>x.id===b.dataset.case),i=Number(b.dataset.choice);caseAnswers[c.id]=i;revealCase(b.closest('.case-card'),c,i);});

let level='住院醫師',index=0,chosen=[],submitted=false;
function setQuizLevel(newLevel){level=newLevel;index=0;chosen=[];submitted=false;document.querySelectorAll('[data-level]').forEach(b=>{b.classList.toggle('selected',b.dataset.level===level);b.setAttribute('aria-pressed',b.dataset.level===level);});renderQuiz();}
function renderQuiz(){
  const pool=questions.filter(q=>q.level===level),q=pool[index];
  $('#quiz-progress').textContent=submitted?'完成':`題目 ${index+1} / ${pool.length}`;
  $('#progress-fill').style.width=`${submitted?100:Math.round(index/pool.length*100)}%`;
  if(submitted){const score=pool.reduce((n,q,i)=>n+(chosen[i]===q.correct),0);$('#quiz-content').innerHTML=`<div class="quiz-result"><span class="kicker">RESULT · ${level}</span><div class="score">${score}<small> / ${pool.length}</small></div><h3>${score>=8?'觀念掌握得很穩固':'回顧解析，找出下一個學習重點'}</h3><p>以下可逐題檢視作答與解析。</p><button id="retry" type="button" class="button primary">重做這一組 ↻</button></div><div class="review">${pool.map((q,i)=>`<details><summary><span>第 ${i+1} 題 · ${chosen[i]===q.correct?'答對':'答錯'}</span>${esc(q.q)}</summary><p>你的答案：${esc(q.a[chosen[i]])}<br>正確答案：${esc(q.a[q.correct])}</p><p>${esc(q.why)}</p></details>`).join('')}</div>`;$('#retry').onclick=()=>setQuizLevel(level);return;}
  const selected=chosen[index];
  $('#quiz-content').innerHTML=`<div class="quiz-body"><span class="quiz-counter">${level.toUpperCase()} · QUESTION ${String(index+1).padStart(2,'0')}</span><h3>${esc(q.q)}</h3><div class="quiz-choices">${q.a.map((a,i)=>`<button type="button" data-answer="${i}" class="${selected===i?'picked':''} ${selected!==undefined&&i===q.correct?'right':''} ${selected===i&&i!==q.correct?'wrong':''}" ${selected!==undefined?'disabled':''}><span>${String.fromCharCode(65+i)}</span>${esc(a)}</button>`).join('')}</div>${selected!==undefined?`<div class="quiz-explanation"><strong>${selected===q.correct?'答對了':'正確答案：'+String.fromCharCode(65+q.correct)}</strong><p>${esc(q.why)}</p></div>`:''}<button id="quiz-next" class="button primary" type="button" ${selected===undefined?'disabled':''}>${index===pool.length-1?'查看成績':'下一題'} <span aria-hidden="true">→</span></button></div>`;
  document.querySelectorAll('[data-answer]').forEach(b=>b.addEventListener('click',()=>{chosen[index]=Number(b.dataset.answer);renderQuiz();}));
  $('#quiz-next').onclick=()=>{if(chosen[index]===undefined)return;if(index===pool.length-1)submitted=true;else index++;renderQuiz();$('#quiz').scrollIntoView({behavior:'smooth'});};
}
document.querySelectorAll('[data-level]').forEach(b=>b.addEventListener('click',()=>setQuizLevel(b.dataset.level)));
renderQuiz();
$('#source-list').innerHTML=sources.map((s,i)=>`<a class="source-item" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer"><span>0${i+1}</span><span><strong>${esc(s.name)}</strong><small>${esc(s.note)}</small></span><span aria-hidden="true">↗</span></a>`).join('');

// 心智圖：連線依實際版面量測；單欄斷點時由 CSS 隱藏
let mapKey='dx';const mapClosed=new Set();
const mapBody=$('#map-body');
function mapBranch(b,i){
  const open=!mapClosed.has(mapKey+i),id=`mm-${mapKey}-${i}`;
  return `<div class="mm-branch" data-branch="${i}" style="--c:${b.color}"><button type="button" class="mm-node" id="${id}" data-toggle="${i}" aria-expanded="${open}"><span class="mm-num">${i+1}</span><span>${esc(b.t)}</span><span class="mm-caret" aria-hidden="true">${open?'−':'+'}</span></button>${open?`<ul class="mm-leaves">${b.k.map(l=>`<li class="mm-leaf"><span>${esc(l.t)}</span><span class="mm-meta"><span class="mm-rec">${esc(l.r)}</span>${l.c?`<a class="mm-case" href="#case-${l.c}" data-goto="${l.c}">病例 ${l.c}</a>`:''}</span></li>`).join('')}</ul>`:''}</div>`;
}
function renderMap(){
  const m=maps[mapKey],half=Math.ceil(m.branches.length/2),side=(from,to)=>m.branches.slice(from,to).map((b,i)=>mapBranch(b,i+from)).join('');
  document.querySelectorAll('[data-map]').forEach(b=>{b.classList.toggle('selected',b.dataset.map===mapKey);b.setAttribute('aria-pressed',b.dataset.map===mapKey);});
  mapBody.innerHTML=`<svg class="mm-lines" aria-hidden="true"></svg><div class="mm-side right">${side(0,half)}</div><div class="mm-center"><strong>${esc(m.center[0])}</strong><span>${esc(m.center[1])}</span></div><div class="mm-side left">${side(half)}</div>`;
  drawMap();
}
function drawMap(){
  const svg=mapBody.querySelector('.mm-lines');if(!svg)return;
  const o=mapBody.getBoundingClientRect();svg.setAttribute('width',o.width);svg.setAttribute('height',o.height);
  const box=e=>{const a=e.getBoundingClientRect();return {l:a.left-o.left,r:a.right-o.left,y:a.top-o.top+a.height/2};};
  const curve=(x1,y1,x2,y2,c,w)=>{const mx=(x1+x2)/2;return `<path d="M${x1} ${y1}C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;};
  const ctr=box(mapBody.querySelector('.mm-center'));let out='';
  mapBody.querySelectorAll('.mm-branch').forEach(b=>{
    const c=maps[mapKey].branches[Number(b.dataset.branch)].color,n=box(b.querySelector('.mm-node')),left=b.parentElement.classList.contains('left');
    out+=left?curve(ctr.l,ctr.y,n.r,n.y,c,2.5):curve(ctr.r,ctr.y,n.l,n.y,c,2.5);
    b.querySelectorAll('.mm-leaf').forEach(x=>{const f=box(x);out+=left?curve(n.l,n.y,f.r,f.y,c,1.25):curve(n.r,n.y,f.l,f.y,c,1.25);});
  });
  svg.innerHTML=out;
}
$('#map-controls').addEventListener('click',e=>{
  const k=e.target.closest('[data-map]');if(k){mapKey=k.dataset.map;renderMap();return;}
  const a=e.target.closest('[data-all]');if(a){maps[mapKey].branches.forEach((_,i)=>a.dataset.all==='close'?mapClosed.add(mapKey+i):mapClosed.delete(mapKey+i));renderMap();}
});
mapBody.addEventListener('click',e=>{
  const t=e.target.closest('[data-toggle]');
  if(t){const id=mapKey+t.dataset.toggle,focus=t.id;mapClosed.has(id)?mapClosed.delete(id):mapClosed.add(id);renderMap();document.getElementById(focus).focus();return;}
  const g=e.target.closest('[data-goto]');
  if(g){e.preventDefault();if(filter!=='all')$('#case-filters [data-filter="all"]').click();document.getElementById(`case-${g.dataset.goto}`).scrollIntoView({behavior:'smooth',block:'start'});}
});
renderMap();
new ResizeObserver(drawMap).observe(mapBody);

// 導覽列：捲動陰影與目前段落標示
const topbar=$('.topbar'), navLinks=[...document.querySelectorAll('.topbar nav a')];
addEventListener('scroll',()=>topbar.classList.toggle('scrolled',scrollY>8),{passive:true});
const spy=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting)navLinks.forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+e.target.id));},{rootMargin:'-45% 0px -50% 0px'});
navLinks.forEach(a=>{const t=document.querySelector(a.getAttribute('href'));if(t)spy.observe(t);});

// 內容由程式產生後段落位置才固定，帶 #段落 開啟時要重新定位
if(location.hash)document.getElementById(location.hash.slice(1))?.scrollIntoView();
