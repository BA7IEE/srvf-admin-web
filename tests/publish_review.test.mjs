import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { registerHooks } from 'node:module';
// Production uses the repository's extensionless TS imports; resolve this one dependency for native Node tests.
registerHooks({resolve(specifier, context, nextResolve) {
  return nextResolve(context.parentURL?.includes('/publish-review/') && ['./snapshot','./policy-rules','./policy-binding'].includes(specifier) ? specifier+'.ts' : specifier, context);
}});
const state = await import('../src/views/srvf/workbench/publish-review/state.ts');

function record() {
  const value = JSON.parse(readFileSync(new URL('./fixtures/publish-review.synthetic.json', import.meta.url)));
  value.snapshot.base = structuredClone(Object.fromEntries(Object.entries(value.snapshot).filter(([k]) =>
    !['schemaVersion','baseWorkflowRevision','baseSnapshotHash','snapshotHash','metricSelectionExplicit','base'].includes(k))));
  return value;
}
class Memory {
  values = new Map();
  getItem(k) { return this.values.get(k) ?? null; }
  setItem(k, v) { this.values.set(k, v); }
  removeItem(k) { this.values.delete(k); }
}
const permissions = ['activity-review.read.request', 'activity.publish.record', 'activity-review.return.request'];
const pending = () => ({version:1, reviewId:record().id, activityId:record().activityId, requestType:'initial', requestVersion:2,
  action:'return', body:{operationKey:'review-intent-0001', reviewNote:'  请修正活动时间  '}});
const store = (m = new Memory(), user='reviewer-a', id=record().id) => state.decisionJournal(m, 'https://synthetic.invalid', user, id);
const receipt = () => ({...record(), status:'returned', reviewedByUserId:'actual-reviewer', reviewedAt:'2099-01-02T00:00:00Z', reviewNote:'请修正活动时间'});

test('initial V7 full frozen facts can be reviewed without claiming simple provenance', () => {
  const projection = state.projectReview(record());
  assert.deepEqual(projection.issues, []);
  const text = JSON.stringify(projection.sections);
  for (const value of ['冻结的合成培训','合成社区中心','带水','first_come']) assert(text.includes(value));
  assert(state.canDecide(record(), 'reviewer-a', permissions, 'approve'));
  assert(!state.canDecide(record(), record().submittedByUserId, permissions, 'approve'));
  assert(!state.canDecide(record(), record().submittedByUserId, permissions, 'return'));
});
test('V8 and V9 are not mistaken for a professional/simple provenance flag', () => {
  for (const version of [8,9]) {
    const r=record();r.snapshot.schemaVersion=version;r.snapshot.timePolicySelectionExplicit=false;
    if(version===9) r.snapshot.contributionPolicySelectionExplicit=false;
    r.snapshot.timePolicyPointers={selectionRevision:1};
    if(version===9)r.snapshot.contributionPolicyPointers={selectionRevision:1};
    const issues=state.projectReview(r).issues;
    assert(issues.length);
    assert(!issues.some(x=>x.includes('仅支持 V7')));
    assert(!state.canDecide(r,'reviewer-a',permissions,'approve'));
  }
});
test('source contract is exact evidence, separate from live or synthetic claims', () => {
  const bytes=readFileSync(new URL('./fixtures/publish-review-contract.txt',import.meta.url));
  assert.equal(bytes.length,25781);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),'8807a3453f676e97197f8b49ca6a0c43bc80e3ac4365564ab03e72e84f374e6a');
});
test('unknown, missing and nested professional facts disable approval instead of being omitted', () => {
  for (const mutate of [
    r=>r.snapshot.unseenPolicy={value:1},
    r=>r.snapshot.base.activity.hiddenDefault=true,
    r=>r.snapshot.sessions[0].positions[0].qualificationRuleSetId='rule-hidden',
    r=>r.snapshot.activity.content={privatePolicy:true},
    r=>r.snapshot.timePolicyPointers={selection:'unexpanded-policy'},
    r=>r.snapshot.qualificationRuleSets.ruleSets.push({rules:[]}),
    r=>delete r.snapshot.base,
    r=>delete r.snapshot.activity.requiresInsurance,
    r=>r.snapshot.schemaVersion=99
  ]) {
    const r=record(); mutate(r);
    assert(state.projectReview(r).issues.length);
    assert(!state.canDecide(r,'reviewer-a',permissions,'approve'));
    assert(state.canDecide(r,'reviewer-a',permissions,'return'));
  }
});
test('malformed audience/identity fields cannot be treated as unrestricted readable facts', () => {
  for(const mutate of [r=>delete r.audienceTagCodes,r=>r.audienceOrganizationIds={},r=>r.directPublish=null,
    r=>r.submittedByUserId='',r=>r.baseRevision=-1]) {
    const r=record();mutate(r);assert.throws(()=>state.reviewRecord(r,r.id));
  }
});
test('change reviews remain readable but cannot be approved by an initial-only projection', () => {
  const r=record();r.requestType='change';
  assert(state.projectReview(r).issues.length);
  assert(!state.canDecide(r,'reviewer-a',permissions,'approve'));
  assert(state.canDecide(r,'reviewer-a',permissions,'return'));
});
test('read, approve and return permissions are independent; role names grant nothing', () => {
  assert(!state.canDecide(record(),'reviewer-a',['SUPER_ADMIN'],'approve'));
  assert(!state.canDecide(record(),'reviewer-a',[permissions[0]],'approve'));
  assert(state.canDecide(record(),'reviewer-a',[permissions[0],permissions[2]],'return'));
  assert(!state.canDecide({...record(),status:'approved'},'reviewer-a',permissions,'return'));
});
test('decision DTOs contain only real contract fields and preserve original whitespace', () => {
  assert.deepEqual(state.decisionBody('approve','intent-approve-1',''), {operationKey:'intent-approve-1',requiresInsuranceConfirmed:true});
  const body=state.decisionBody('return','intent-return-1','  请修正  ');
  assert.deepEqual(body,{operationKey:'intent-return-1',reviewNote:'  请修正  '});
  assert(Object.isFrozen(body));
  for (const text of ['', '  ', '中'.repeat(501)]) assert.throws(()=>state.decisionBody('return','intent-return-1',text));
  assert.throws(()=>state.decisionBody('approve','short',''));
});
test('confirmation identity binds the frozen review rather than a current title or changeDiff', () => {
  const r=record(), token=state.reviewToken(r);
  r.activityTitle='现在活动已改名';r.changeDiff={activityFields:['title']};
  assert.equal(state.reviewToken(r),token);
  r.snapshot.activity.title='另一个冻结标题';assert.notEqual(state.reviewToken(r),token);
});
test('exact decision survives reload and cloned sessionStorage; GET status never completes it', () => {
  const m=new Memory(), original=pending();store(m).write(original);
  const copy=new Memory();copy.values=new Map(m.values);
  assert.deepEqual(store(copy).read(),original);
  const r=receipt();assert.equal(r.status,'returned');
  assert.deepEqual(store(m).read(),original);
  assert.equal(store(m,'another-account').read(),null);
  assert.equal(store(m,'reviewer-a','another-review').read(),null);
});
test('correlated POST success archives exact input, not server-trimmed note, before clearing', () => {
  const m=new Memory(), journal=store(m), original=pending();journal.write(original);
  journal.complete(original,state.decisionReceipt(receipt(),original));
  assert.equal(journal.read(),null);
  assert.deepEqual(journal.lastReceipt().body,original.body);
  assert.equal(journal.lastReceipt().receipt.reviewedByUserId,'actual-reviewer');
});
test('unrelated/malformed success cannot release a pending intent', () => {
  for(const mutate of [r=>r.id='other-review',r=>r.activityId='other-activity',r=>r.status='approved',r=>r.requestVersion=3,
    r=>r.reviewedByUserId=null,r=>r.reviewedAt=null]) {
    const r=receipt();mutate(r);assert.throws(()=>state.decisionReceipt(r,pending()));
  }
});
test('journal rejects corrupted records, extra fields, or substituted action bodies', () => {
  for(const mutate of [p=>p.body.expectedDraftHash='a'.repeat(64),p=>p.body.reviewNote=' ',p=>p.action='approve',p=>p.reviewId='other-review',p=>p.activityId='',p=>p.requestVersion=0]) {
    const p=pending(); mutate(p);assert.throws(()=>store().write(p));
  }
});
test('archive failure retains the original request for conservative recovery', () => {
  const m=new Memory(), journal=store(m), original=pending();journal.write(original);
  const write=m.setItem.bind(m);m.setItem=(k,v)=>{if(k.includes(':receipt:'))throw Error('quota');write(k,v);};
  assert.throws(()=>journal.complete(original,state.decisionReceipt(receipt(),original)));
  assert.deepEqual(journal.read().body,original.body);
});
test('a malformed stored success receipt cannot unlock a sent request', () => {
  const p=pending();p.receipt={id:p.reviewId,status:'returned'};
  assert.throws(()=>store().write(p));
  const m=new Memory(), journal=store(m);journal.write(pending());
  assert.throws(()=>journal.complete(pending(),{...state.decisionReceipt(receipt(),pending()),id:'other-review'}));
  assert.equal(journal.read().body.operationKey,pending().body.operationKey);
});
test('distinct server failures remain distinct and never imply cancellation', () => {
  for (const code of [20143,20144,20146,20033,30100,20004]) {
    const m=new Memory(), journal=store(m);journal.write(pending());
    assert.equal(state.decisionFailure({response:{status:409,data:{code,message:'合成失败'}}}).code,code);
    assert.deepEqual(journal.read(),pending());
  }
});
