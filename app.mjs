import {assess,cases,questions,sources} from './clinical.mjs';
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const form=$('#diagnostic-form');
form.addEventListener('change',()=>{
  const teen=form.elements.stage.value==='teen';
  $('#years-wrap').classList.toggle('hidden',!teen);
  $('#morphology-field').classList.toggle('hidden',teen);
});
form.addEventListener('submit',event=>{
  event.preventDefault();
  const f=form.elements, stage=f.stage.value;
  const num=(name)=>f[name].value===''?NaN:Number(f[name].value);
  if(stage==='teen' && !Number.isFinite(num('years'))){f.years.focus();f.years.setCustomValidity('請填入初經後年數');f.years.reportValidity();return;}
  f.years.setCustomValidity('');
  const v={stage,years:num('years'),days:num('days'),cycles:num('cycles'),gap90:f.gap90.checked,hirsutism:f.hirsutism.checked,androgen:f.androgen.checked,us:f.us.checked,amh:f.amh.checked,virilization:f.virilization.checked};
  const r=assess(v), status=x=>x===null?'未能判定':x?'符合':'未符合';
  $('#diagnostic-output').innerHTML=`<div class="output-icon ${r.code}">${r.code==='red'?'!':'✓'}</div><span class="kicker">ASSESSMENT · ${stage==='adult'?'成人':'青少年'}</span><h3>${esc(r.title)}</h3><p>${esc(r.message)}</p><div class="criteria"><div><span>週期不規則</span><strong>${status(r.irregular)}</strong></div><div><span>高雄激素</span><strong>${status(r.hyper)}</strong></div>${stage==='adult'?`<div><span>卵巢形態／AMH</span><strong>${status(r.morphology)}</strong></div>`:''}</div><div class="output-note">${Number.isNaN(v.days)&&Number.isNaN(v.cycles)&&!v.gap90?'尚未提供週期資料；此結果不能判定週期條件。<br>':''}診斷前仍須排除妊娠（如適用）、甲狀腺、泌乳素、非典型先天性腎上腺增生與其他依情境必要的原因。</div>`;
  $('#diagnostic-output').scrollIntoView({behavior:'smooth',block:'nearest'});
});

let filter='all';
function renderCases(){
  $('#case-list').innerHTML=cases.filter(c=>filter==='all'||c.label.startsWith(filter)).map(c=>`<article class="case-card" id="case-${c.id}"><div class="case-meta"><span>CASE ${c.id}</span><span>${esc(c.label)}</span></div><h3>${esc(c.title)}</h3><p>${esc(c.stem)}</p><div class="case-question"><strong>${esc(c.prompt)}</strong><div class="case-options">${c.choices.map((a,i)=>`<button type="button" data-case="${c.id}" data-choice="${i}"><span>${String.fromCharCode(65+i)}</span>${esc(a)}</button>`).join('')}</div></div><div class="case-reveal" hidden></div></article>`).join('');
}
renderCases();
$('#case-filters').addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(!b)return;filter=b.dataset.filter;document.querySelectorAll('.filter').forEach(x=>x.classList.toggle('active',x===b));renderCases();});
$('#case-list').addEventListener('click',e=>{const b=e.target.closest('[data-case]');if(!b)return;const c=cases.find(x=>x.id===b.dataset.case),i=Number(b.dataset.choice),card=b.closest('.case-card');card.querySelectorAll('[data-choice]').forEach(x=>{x.disabled=true;x.classList.toggle('correct',Number(x.dataset.choice)===c.answer);x.classList.toggle('incorrect',Number(x.dataset.choice)===i&&i!==c.answer);});const out=card.querySelector('.case-reveal');out.hidden=false;out.innerHTML=`<div class="answer-label">${i===c.answer?'判斷正確':'再看一次關鍵線索'} · 正解 ${String.fromCharCode(65+c.answer)}</div><p>${esc(c.explain)}</p><div class="next"><strong>下一步</strong><p>${esc(c.next)}</p></div>`;});

let level='住院醫師',index=0,chosen=[],submitted=false;
function setQuizLevel(newLevel){level=newLevel;index=0;chosen=[];submitted=false;document.querySelectorAll('[data-level]').forEach(b=>b.classList.toggle('selected',b.dataset.level===level));renderQuiz();}
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
