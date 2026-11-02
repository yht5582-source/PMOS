import test from 'node:test';
import assert from 'node:assert/strict';
import {assess,cycleIrregular,cases,questions,maps,sources} from '../clinical.mjs';

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
test('missing cycle data is undetermined, not normal',()=>{
  assert.equal(cycleIrregular({stage:'adult',days:NaN,cycles:NaN,gap90:false}),null);
  assert.equal(cycleIrregular({stage:'teen',years:2,days:NaN,cycles:6,gap90:false}),null);
  const r=assess({stage:'adult',days:NaN,cycles:NaN,hirsutism:true});
  assert.equal(r.irregular,null);assert.equal(r.code,'insufficient');
});
test('adult cycles: either interval or frequency alone can be irregular',()=>{
  assert.equal(cycleIrregular({stage:'adult',days:NaN,cycles:6}),true);
  assert.equal(cycleIrregular({stage:'adult',days:30,cycles:NaN}),false);
  assert.equal(cycleIrregular({stage:'adult',days:18,cycles:12}),true);
  assert.equal(cycleIrregular({stage:'adult',days:30,cycles:12,gap90:true}),true);
});
test('teen 1-3 y uses 45-day limit and ignores frequency; >90-day gap counts',()=>{
  assert.equal(cycleIrregular({stage:'teen',years:1.5,days:44,cycles:6}),false);
  assert.equal(cycleIrregular({stage:'teen',years:1.5,days:30,cycles:12,gap90:true}),true);
  assert.equal(cycleIrregular({stage:'teen',years:0.5,days:30,cycles:12,gap90:true}),null);
});
test('primary amenorrhea counts as irregular without years since menarche',()=>{
  const r=assess({stage:'teen',years:NaN,days:NaN,cycles:NaN,primaryAmenorrhea:true,hirsutism:true});
  assert.equal(r.irregular,true);assert.equal(r.code,'compatible');
});
test('teen at-risk needs one feature; none is not labelled at-risk',()=>{
  assert.equal(assess({stage:'teen',years:4,days:30,cycles:12,hirsutism:true}).code,'at-risk');
  assert.equal(assess({stage:'teen',years:4,days:30,cycles:12}).code,'insufficient');
  assert.equal(assess({stage:'teen',years:4,days:NaN,cycles:NaN}).code,'insufficient');
});
test('8 or more years after menarche uses adult criteria including morphology',()=>{
  const r=assess({stage:'teen',years:9,days:50,cycles:7,us:true});
  assert.equal(r.reclassified,true);assert.equal(r.stage,'adult');assert.equal(r.code,'compatible');assert.equal(r.count,2);
});
test('teen first year stays early even with features',()=>{
  assert.equal(assess({stage:'teen',years:.5,days:50,hirsutism:true}).code,'early');
});
test('teen without years since menarche asks for it before labelling',()=>{
  const r=assess({stage:'teen',years:NaN,days:50,hirsutism:true});
  assert.equal(r.code,'insufficient');assert.match(r.title,/初經後年數/);
});
test('mind maps: diagnosis and treatment, every leaf cites a recommendation',()=>{
  assert.deepEqual(Object.keys(maps),['dx','tx']);
  for(const m of Object.values(maps)){
    assert.ok(m.branches.length>=6);
    for(const b of m.branches){
      assert.match(b.color,/^#[0-9a-f]{6}$/);
      assert.ok(b.k.length>=3,b.t);
      for(const l of b.k)assert.match(l.r,/^(Algorithm 1|第 5 章|\d+(\.\d+)+)( · (Algorithm 1|\d+(\.\d+)+))*$/,l.t);
    }
  }
});
test('mind map case links point at real cases and every case is linked',()=>{
  const ids=new Set(cases.map(c=>c.id)),linked=new Set();
  for(const m of Object.values(maps))for(const b of m.branches)for(const l of b.k)if(l.c){assert.ok(ids.has(l.c),l.t);linked.add(l.c);}
  assert.deepEqual([...linked].sort(),[...ids].sort());
});
test('mind map cycle thresholds agree with the assessment engine',()=>{
  const leaves=maps.dx.branches.find(b=>b.t==='週期不規則').k.map(l=>l.t).join('\n');
  assert.match(leaves,/1–<3 年：<21 或 >45 天/);assert.match(leaves,/<21 或 >35 天，或每年 <8 次/);
  assert.equal(cycleIrregular({stage:'teen',years:2,days:46}),true);assert.equal(cycleIrregular({stage:'teen',years:2,days:45}),false);
  assert.equal(cycleIrregular({stage:'adult',days:36}),true);assert.equal(cycleIrregular({stage:'adult',cycles:7}),true);assert.equal(cycleIrregular({stage:'adult',days:35,cycles:8}),false);
});
test('sources include the guideline text the map numbers come from',()=>{
  assert.ok(sources.some(s=>s.url.includes('PMC10505534')));
});
