import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {registerHooks} from 'node:module';
registerHooks({resolve(s,c,next){return next(c.parentURL?.includes('/publish-review/')&&['./snapshot','./policy-rules','./policy-binding'].includes(s)?s+'.ts':s,c);}});
const binding=await import('../src/views/srvf/workbench/publish-review/policy-binding.ts');
const state=await import('../src/views/srvf/workbench/publish-review/state.ts');
const data=()=>JSON.parse(readFileSync(new URL('./fixtures/publish-review-v5.synthetic.json',import.meta.url)));
test('source-shaped V5 non-null policies support approval without catalog permissions',()=>{
  const {review,policies}=data();const coverage=binding.bindReferencedPolicies(review,policies);
  assert.deepEqual(state.projectReview(review,coverage).issues,[]);
  assert(state.canDecide(review,'reviewer',['activity-review.read.request','activity.publish.record'],'approve',coverage));
  assert.equal(coverage.versions.length,2);
  assert(coverage.versions.every(v=>v.uses.some(s=>s.includes('目标'))&&v.uses.some(s=>s.includes('原基线'))));
});
test('binding rejects another review/activity/hash/schema and incomplete or unrelated versions',()=>{
  for(const mutate of [p=>p.reviewId='other-review',p=>p.activityId='other-activity',p=>p.snapshotHash='c'.repeat(64),p=>p.snapshotSchemaVersion=8,
    p=>p.timePolicies=[],p=>p.contributionPolicies=[],p=>p.timePolicies.push({...p.timePolicies[0],versionId:'unrelated'}),
    p=>p.timePolicies.push(p.timePolicies[0]),p=>p.timePolicies[0].definitionHash='d'.repeat(64),p=>p.contributionPolicies[0].evaluatorVersion=2,
    p=>p.timePolicies[0].effectiveUntil='2090-01-01T00:00:00.000Z',p=>delete p.contributionPolicies[0].definition.roleRules]){
    const {review,policies}=data();mutate(policies);assert.throws(()=>binding.bindReferencedPolicies(review,policies));
  }
});
test('every explicit and resolved base/target reference must have a definition, including overridden references',()=>{
  const {review,policies}=data();const item=Object.values(review.snapshot.base.timePolicyPointers.selection.items).find(x=>x.selection.mode==='explicit');
  item.selection.pointer={...item.selection.pointer,versionId:'overridden-version',definitionHash:'f'.repeat(64)};
  assert.throws(()=>binding.bindReferencedPolicies(review,policies));
});
test('default-only scope rejects overrides, multiple sessions and change after binding complete facts',()=>{
  for(const mutate of [r=>r.requestType='change',r=>r.snapshot.sessions.push(structuredClone(r.snapshot.sessions[0])),
    r=>r.snapshot.activity.allocationModeCode='lottery']){
    const {review,policies}=data();mutate(review);
    let coverage;try{coverage=binding.bindReferencedPolicies(review,policies);}catch(error){assert(error instanceof Error);continue;}
    assert(!state.canDecide(review,'reviewer',['activity-review.read.request','activity.publish.record'],'approve',coverage));
  }
});
test('V9 with missing mandatory policy envelopes is not a policy-free approval shortcut',()=>{
  const {review}=data();for(const target of [review.snapshot,review.snapshot.base]){target.timePolicyPointers=null;target.contributionPolicyPointers=null;}
  assert(!state.canDecide(review,'reviewer',['activity-review.read.request','activity.publish.record'],'approve'));
});
test('coverage cannot be forged or carried into a changed snapshot with the same claimed hash',()=>{
  const {review,policies}=data(),coverage=binding.bindReferencedPolicies(review,policies);
  assert(!state.canDecide(review,'reviewer',['activity-review.read.request','activity.publish.record'],'approve',JSON.parse(JSON.stringify(coverage))));
  review.snapshot.activity.title='not the displayed proposal';
  assert(!state.canDecide(review,'reviewer',['activity-review.read.request','activity.publish.record'],'approve',coverage));
});
test('definitions/versions remain immutable; changed display facts require another confirmation',()=>{
  const {review,policies}=data(),coverage=binding.bindReferencedPolicies(review,policies);
  assert(Object.isFrozen(coverage.versions[0].definition));
  const changed=structuredClone(policies);changed.contributionPolicies[0].definition.defaultResult.recognizedPoints='9.00';
  const later=binding.bindReferencedPolicies(review,changed);
  assert.notEqual(binding.policyToken(coverage),binding.policyToken(later));
});
test('exact referenced-policy contract source bytes are retained separately from mocks/live evidence',()=>{
  const bytes=readFileSync(new URL('./fixtures/referenced-policies-contract.txt',import.meta.url));
  assert.equal(bytes.length,8678);assert.equal(createHash('sha256').update(bytes).digest('hex'),'0bf652c3bcf64644b661edc5ce93315777c7b1a43c79b1699a0a64c452b85f64');
});
