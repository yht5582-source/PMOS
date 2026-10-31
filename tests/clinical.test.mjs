import test from 'node:test';
import assert from 'node:assert/strict';
import {assess,cycleIrregular,cases,questions} from '../dist/clinical.mjs';

test('adult combines irregular cycles and androgen excess without morphology',()=>{
  const r=assess({stage:'adult',days:50,cycles:7,gap90:false,hirsutism:true,androgen:false,us:false,amh:false});
  assert.equal(r.code,'compatible');assert.equal(r.count,2);
});
test('ultrasound and AMH represent one adult criterion',()=>{
  const r=assess({stage:'adult',days:28,cycles:12,gap90:false,hirsutism:false,androgen:false,us:true,amh:true});
  assert.equal(r.count,1);assert.equal(r.code,'insufficient');
});
test('adolescent morphology cannot establish diagnosis',()=>{
  const r=assess({stage:'teen',years:4,days:50,cycles:7,gap90:false,hirsutism:false,androgen:false,us:true,amh:true});
  assert.equal(r.code,'at-risk');assert.equal(r.morphology,false);
});
test('cycle definitions change with time after menarche',()=>{
  assert.equal(cycleIrregular({stage:'teen',years:.5,days:50,cycles:7,gap90:false}),null);
  assert.equal(cycleIrregular({stage:'teen',years:2,days:40,cycles:9,gap90:false}),false);
  assert.equal(cycleIrregular({stage:'teen',years:2,days:50,cycles:9,gap90:false}),true);
  assert.equal(cycleIrregular({stage:'teen',years:4,days:38,cycles:7,gap90:false}),true);
});
test('rapid virilization takes precedence',()=>{
  const r=assess({stage:'adult',days:50,cycles:7,gap90:false,hirsutism:true,androgen:true,us:true,amh:false,virilization:true});
  assert.equal(r.code,'red');
});
test('both quiz levels have ten answerable questions and cases have valid answers',()=>{
  for(const level of ['住院醫師','進階']){
    const pool=questions.filter(q=>q.level===level);assert.equal(pool.length,10);
    for(const q of pool)assert.ok(q.correct>=0&&q.correct<q.a.length);
  }
  for(const c of cases)assert.ok(c.answer>=0&&c.answer<c.choices.length);
});
