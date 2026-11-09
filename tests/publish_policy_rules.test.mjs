import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import * as rules from '../src/views/srvf/workbench/publish-review/policy-rules.ts';

function definitions(){return JSON.parse(readFileSync(new URL('./fixtures/policy-definitions.synthetic.json',import.meta.url)));}
const text=facts=>JSON.stringify(facts);
test('complete time rules show every rule group and each supplied role/source',()=>{
  const value=text(rules.timePolicyFacts(definitions().time));
  for(const expected of ['默认时长分类','志愿服务','身份分类映射','volunteer','trainee','培训','允许拆分',
    '准备时段','不计入','值勤时段','组织活动','路途时段','人工认定','60 秒','向下取整',
    '签到签退记录','服务时段','附件','需要人工认定','调整原因','调整证据'])assert(value.includes(expected),expected);
});
test('complete contribution rules preserve decimal strings and inclusive/open-ended boundaries',()=>{
  const value=text(rules.contributionPolicyFacts(definitions().contribution));
  for(const expected of ['默认结果','0.00','no_matching_rule','volunteer','support','3600 秒','7200 秒','含上限',
    '无上限','3.00','5.00','8.00','1.25','2.00','service_first_band','service_second_band','service_final_band',
    'training_band','organization_band'])assert(value.includes(expected),expected);
});
test('manual adjustment disabled and empty mappings are explicit facts, not missing content',()=>{
  const t=definitions().time;t.roleMappings=[];t.manualAdjustment={enabled:false};
  t.evidence.requireManualRecognition=false;t.specialIntervals.travel={mode:'exclude'};
  const value=text(rules.timePolicyFacts(t));assert(value.includes('不允许'));assert(value.includes('无单独映射'));
  const c=definitions().contribution;c.roleRules=[];assert(text(rules.contributionPolicyFacts(c)).includes('无单独身份规则'));
});
test('unknown or omitted rules cannot silently become a supported policy preview',()=>{
  for(const mutate of [t=>delete t.evidence,t=>t.hiddenMultiplier=2,t=>t.specialIntervals.travel.mode='automatic',
    t=>t.rounding.mode='nearest',t=>t.rounding.quantumSeconds=0,t=>t.evidence.requiredSources.push('new_source'),
    t=>delete t.manualAdjustment.reasonRequired,t=>t.roleMappings[0].extra=true]){
    const t=definitions().time;mutate(t);assert.throws(()=>rules.timePolicyFacts(t));
  }
  for(const mutate of [c=>delete c.defaultResult,c=>c.roleRules[0].categoryRules[0].durationBands[1].maxSecondsInclusive=3600,
    c=>c.roleRules[0].categoryRules[0].durationBands[2].maxSecondsInclusive=10000,c=>c.defaultResult.recognizedPoints=3,
    c=>c.defaultResult.recognizedPoints='1000.00',c=>c.defaultResult.newFormula='x',c=>c.roleRules[0].categoryRules[0].timeCategoryCode='unknown']){
    const c=definitions().contribution;mutate(c);assert.throws(()=>rules.contributionPolicyFacts(c));
  }
});
test('policy display never changes the immutable definitions or rounds contribution points',()=>{
  const source=definitions(),copy=structuredClone(source);
  rules.timePolicyFacts(source.time);rules.contributionPolicyFacts(source.contribution);
  assert.deepEqual(source,copy);
});
