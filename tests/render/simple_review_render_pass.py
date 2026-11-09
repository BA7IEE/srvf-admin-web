#!/usr/bin/env python3
"""Synthetic UI regression. ALL /api calls intercepted. Never a live backend test."""
import copy
import hashlib
import json
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright, expect
from simple_activity_render_pass import Fixture, snapshot, iso_shift, BASE, LIST, ID, ORG, TEMPLATE, field

SHOTS = Path('/tmp/srvf-simple-review-render')

class ReviewFixture(Fixture):
    def reset(self):
        self.user = 'organizer-fixture'
        self.draft = snapshot({
            'title': '合成单场次培训', 'organizationId': ORG, 'templateVersionId': TEMPLATE,
            'startAt': '2099-12-01T01:00:00.000Z', 'endAt': '2099-12-01T03:00:00.000Z',
            'location': '合成社区中心', 'defaultPlaceVisibilityCode': 'accepted'
        })
        # Backend-valid simple layout, unlike the older display-only fixture.
        self.draft['session'].update(checkInOpenAt=self.draft['startAt'], checkInCloseAt=iso_shift(self.draft['startAt'], 20),
            checkOutOpenAt=iso_shift(self.draft['endAt'], -20), checkOutCloseAt=self.draft['endAt'])
        self.draft['position']['attendanceRoleCode'] = 'volunteer'
        self.draft['places'] = self.draft['places'][:1]
        self.posts, self.reviews, self.submitted_bodies = [], {}, {}
        self.post_mode = 'ok'
        self.get_fail = False
        self.before_reply = None
        self.revision = 0
        self.bump()

    def bump(self):
        self.revision += 1
        self.draft['draftHash'] = hashlib.sha256(str(self.revision).encode()).hexdigest()

    def route(self, route):
        req = route.request
        if urlsplit(req.url).path != f'/api/admin/v1/activities/{ID}/publish-reviews':
            return super().route(route)
        assert req.method == 'POST'
        body = req.post_data_json
        # Candidate 93ed4091 permits legacy omission; new frontend must always send a hash.
        assert set(body) in ({'operationKey', 'confirmation'}, {'operationKey', 'confirmation', 'expectedDraftHash'})
        assert body['confirmation'] is True
        assert 8 <= len(body['operationKey']) <= 128
        self.posts.append(copy.deepcopy(body))
        def reject(code, message, status=409):
            route.fulfill(status=status, content_type='application/json', body=json.dumps({'code':code,'message':message,'data':None}))
        if self.post_mode == 'denied':
            return reject(40300, '当前身份不能提交此活动，请核对本人资格', 403)
        if self.post_mode == 'key-conflict':
            return reject(20143, '提审操作标识冲突')
        if self.post_mode == 'already-pending':
            self.draft.update(review={'id':'review-another-fixture','status':'pending','requestType':'initial'}, editable=False)
            self.bump()
            return reject(20032, '活动已有待处理的发布审核')
        if self.post_mode == 'lost-before':
            self.post_mode = 'ok'
            return route.abort('failed')
        if self.post_mode == 'old-backend':
            return reject(40000, 'property expectedDraftHash should not exist', 400)
        if self.post_mode == 'race':
            self.draft['title'] = '最后读取之后另一窗口保存的内容'; self.bump()
            self.post_mode = 'ok'
        key = body['operationKey']
        if key in self.reviews and self.submitted_bodies[key] != body:
            return reject(20143, '同键不同确认内容')
        if key not in self.reviews:
            if 'expectedDraftHash' in body:
                import re
                if not isinstance(body['expectedDraftHash'], str) or not re.fullmatch('[0-9a-f]{64}', body['expectedDraftHash']):
                    return reject(40000, '请求参数错误', 400)
                if self.post_mode == 'professional-rules':
                    return reject(20256, '活动包含简单界面未展示的专业配置')
                if body['expectedDraftHash'] != self.draft['draftHash']:
                    return reject(20255, '活动草稿已变化，请重新读取后再保存')
                if self.post_mode == 'professional':
                    return reject(20256, '活动包含简单界面未展示的专业配置')
            self.submitted_bodies[key] = copy.deepcopy(body)
            self.reviews[key] = {
                'id':f'review-fixture-{len(self.reviews)+1:04d}','activityId':ID,'requestType':'initial','requestVersion':len(self.reviews)+1,
                'baseRevision':0,'status':'pending','snapshot':{'testFixtureOnly':True},'directPublish':False,
                'submittedByUserId':self.user,'submittedAt':'2099-01-01T00:00:00.000Z',
                'reviewedByUserId':None,'reviewedAt':None,'reviewNote':None,
                'createdAt':'2099-01-01T00:00:00.000Z','updatedAt':'2099-01-01T00:00:00.000Z',
                'activityTitle':self.draft['title'],'organizationId':ORG,'initiatorMemberId':'member-fixture-0001'
            }
            self.draft.update(review={'id':self.reviews[key]['id'],'status':'pending','requestType':'initial'}, editable=False)
            self.bump()
        if self.post_mode == 'lost-after':
            self.post_mode = 'ok'
            return route.abort('failed')
        if self.post_mode == 'read-fails':
            self.get_fail = True
        if self.before_reply:
            self.before_reply()
        route.fulfill(status=200, content_type='application/json', body=json.dumps({'code':0,'message':'ok','data':self.reviews[key]}))

def main():
    SHOTS.mkdir(exist_ok=True, parents=True)
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
        context = browser.new_context(timezone_id='America/Los_Angeles', service_workers='block')
        f = ReviewFixture(); f.reset()
        context.route('**/api/**', f.route)
        page = context.new_page()
        page.set_default_timeout(10000)
        errors=[]; page.on('pageerror',lambda e: errors.append(str(e)))
        page.goto(BASE+'/#/login')
        page.get_by_placeholder('账号').fill('fixture')
        page.get_by_placeholder('密码').fill('L'*35+'7!')
        page.get_by_role('button',name='登录',exact=True).click()
        page.wait_for_url(lambda u:'/login' not in u)
        page.goto(BASE+'/#'+LIST+'/'+ID+'/simple-draft')
        card=page.get_by_test_id('simple-review')
        def ready():
            expect(card.get_by_role('button',name='核对并提交审核',exact=True)).to_be_enabled()
        def start():
            card.get_by_role('button',name='核对并提交审核',exact=True).click()
            expect(card.get_by_text('合成单场次培训',exact=True)).to_be_visible()
        def confirm():
            card.locator('.el-checkbox').click()
            recovery = card.get_by_role('button',name='确认核对上次提审',exact=True)
            (recovery if recovery.count() else card.get_by_role('button',name='确认提交发布审核',exact=True)).click()
            expect(card.locator('.el-button.is-loading')).to_have_count(0)
        def reset():
            f.reset(); page.evaluate('sessionStorage.clear()'); page.reload(); ready()
        def pending_records():
            return page.evaluate("Object.keys(sessionStorage).filter(k=>k.startsWith('srvf:simple-review:')).map(k=>JSON.parse(sessionStorage.getItem(k)))")
        ready()
        # Ordinary USER has only create/update capabilities, never reviewer/publish permission.
        assert f.permissions == ['activity.create.record','activity.update.record']
        page.get_by_role('button',name='配置本次场次',exact=True).click()
        field(page,'活动标题').fill('未保存的标题')
        expect(card.get_by_role('button',name='核对并提交审核',exact=True)).to_be_disabled()
        expect(card.get_by_text('请先保存或取消本次编辑，再核对提审。',exact=True)).to_be_visible()
        page.get_by_role('button',name='取消编辑并重新读取',exact=True).click()
        page.get_by_role('button',name='放弃本次编辑',exact=True).click()
        ready(); assert not f.posts
        f.get_fail=True
        card.get_by_role('button',name='核对并提交审核',exact=True).click()
        expect(card.get_by_role('button',name='重新读取已保存草稿',exact=True)).to_be_enabled()
        assert not f.posts
        f.get_fail=False
        card.get_by_role('button',name='重新读取已保存草稿',exact=True).click()
        expect(card.locator('.el-checkbox')).to_be_visible()
        expect(card.get_by_role('button',name='确认提交发布审核',exact=True)).to_be_disabled()
        card.locator('.el-checkbox').click()
        card.get_by_role('button',name='取消，返回草稿',exact=True).click()
        start(); expect(card.get_by_role('checkbox')).not_to_be_checked(); assert not f.posts
        f.draft['title']='另一窗口已保存的标题'; f.bump()
        confirm()
        expect(card.get_by_text('已保存内容或审核状态发生变化，下面已更新。请重新核对并确认。',exact=True)).to_be_visible()
        expect(card.get_by_role('checkbox')).not_to_be_checked(); assert not f.posts
        page.screenshot(path=str(SHOTS/'01-reconfirm.png'),full_page=True)
        card.locator('.el-checkbox').click()
        card.get_by_role('button',name='确认提交发布审核',exact=True).evaluate('b=>{b.click();b.click()}')
        expect(card.get_by_text('已提交发布审核，请等待审核结果；本次提交不代表活动已发布。',exact=True)).to_be_visible()
        expect(card.locator('.el-button.is-loading')).to_have_count(0)
        expect(card.get_by_text('当前审核：审核中',exact=True)).to_be_visible()
        expect(page.get_by_role('button',name='配置本次场次',exact=True)).to_have_count(0)
        assert len(f.posts)==1 and len(f.reviews)==1 and f.draft['statusCode']=='draft'
        assert not pending_records()
        page.screenshot(path=str(SHOTS/'02-pending.png'),full_page=True)
        print('PASS saved-only preflight, no reviewer permission gate, GET failure, explicit confirmation, cancel/reopen, changed-hash reconfirmation, double-click and pending-not-published')

        reset(); f.draft['instance']['registrationDeadline']='2000-01-01T00:00:00.000Z'; f.bump()
        start(); expect(card.get_by_text('报名截止时间已过，请修改并保存草稿。',exact=True)).to_be_visible()
        expect(card.get_by_role('button',name='确认提交发布审核',exact=True)).to_be_disabled(); assert not f.posts
        reset(); f.post_mode='denied'; start(); confirm()
        expect(card.get_by_role('checkbox')).not_to_be_checked()
        expect(card.get_by_text('当前身份不能提交此活动，请核对本人资格',exact=False)).to_be_visible()
        assert pending_records()[0]['body']==f.posts[0] and not f.reviews
        print('PASS expired deadline blocks POST; first definite denial retains sent intent and retry requires same-body confirmation')

        reset(); f.post_mode='lost-after'; start(); confirm()
        expect(card.get_by_text('本标签页还有一笔提审需要核对',exact=True)).to_be_visible()
        assert len(f.posts)==1 and len(f.reviews)==1
        original=copy.deepcopy(f.posts[0])
        page.reload()
        card.get_by_role('button',name='继续核对上次提审',exact=True).click()
        expect(card.get_by_role('checkbox')).to_be_enabled()
        f.post_mode='denied'; confirm()
        expect(card.get_by_text('上次提审结果仍待确认',exact=False)).to_be_visible()
        assert pending_records()[0]['body']==original
        f.post_mode='ok'; confirm()
        expect(card.get_by_text('当前审核：审核中',exact=True)).to_be_visible()
        assert len(f.reviews)==1 and all(body==original for body in f.posts)
        assert not pending_records()
        print('PASS lost POST response survives refresh; denied recovery preserves original key; same-key replay creates no second review')

        reset(); f.post_mode='lost-before'; start(); confirm()
        expect(card.get_by_text('本标签页还有一笔提审需要核对',exact=True)).to_be_visible()
        original=copy.deepcopy(f.posts[0]); assert not f.reviews
        f.draft['title']='失败后重新保存的内容'; f.bump()
        page.reload(); card.get_by_role('button',name='继续核对上次提审',exact=True).click()
        expect(card.get_by_text('失败后重新保存的内容',exact=True)).to_be_visible()
        confirm(); expect(card.get_by_text('上次提审结果仍待确认',exact=False)).to_be_visible()
        assert f.posts==[original,original] and not f.reviews
        assert pending_records()[0]['body']==original
        print('PASS uncertain recovery never rebinds to changed facts; 20255 retains original body because other sends are not proven finished')

        reset(); f.post_mode='read-fails'; start(); confirm()
        expect(card.get_by_text('已收到第 1 次审核请求回执',exact=False)).to_be_visible()
        expect(card.get_by_role('button',name='刷新审核状态',exact=True)).to_be_visible()
        assert pending_records()[0].get('receipt') and len(f.posts)==1
        f.get_fail=False; page.reload()
        card.get_by_role('button',name='刷新审核状态',exact=True).click()
        expect(card.locator('.el-button.is-loading')).to_have_count(0)
        expect(card.get_by_text('当前审核：审核中',exact=True)).to_be_visible()
        assert len(f.posts)==1 and not pending_records()
        print('PASS acknowledged POST plus failed GET recovers after refresh with GET only')

        reset(); f.post_mode='lost-after'; start(); confirm()
        expect(card.get_by_text('本标签页还有一笔提审需要核对',exact=True)).to_be_visible()
        for row in f.reviews.values(): row['status']='returned'
        f.draft['review']['status']='returned'; f.draft['editable']=True; f.bump()
        page.reload(); card.get_by_role('button',name='继续核对上次提审',exact=True).click(); confirm()
        expect(card.get_by_text('当前审核：审核已退回',exact=True)).to_be_visible()
        ready(); assert len(f.reviews)==1 and len(f.posts)==2 and not pending_records()
        print('PASS replay of an already-returned request does not pretend a new pending review or publish')

        reset(); f.post_mode='already-pending'; start(); confirm()
        expect(card.get_by_text('当前审核：审核中',exact=False)).to_be_visible()
        assert len(f.posts)==1 and pending_records()[0]['body']==f.posts[0]
        reset(); f.post_mode='key-conflict'; start(); confirm()
        expect(card.get_by_text('本次提审记录发生冲突，已停止重新提交。请刷新状态并联系管理员核对。',exact=True)).to_be_visible()
        page.reload()
        expect(card.get_by_text('本次提审记录发生冲突，已停止重新提交。请刷新状态并联系管理员核对。',exact=True)).to_be_visible()
        expect(card.get_by_role('button',name='确认提交发布审核',exact=True)).to_have_count(0)
        card.get_by_role('button',name='刷新审核状态',exact=True).click()
        assert len(f.posts)==1
        print('PASS pending conflict reads actual state; operation-key conflict never silently creates a replacement key')

        reset(); start()
        page.evaluate("""()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k.startsWith('srvf:simple-review:'))throw new DOMException('fixture denied','QuotaExceededError');return original.call(this,k,v)}}""")
        confirm()
        expect(card.get_by_text('浏览器未能保存提审恢复记录，未发送提审请求。请检查存储设置后重新核对。',exact=True)).to_be_visible()
        assert not f.posts and not pending_records()
        reset(); start()
        f.before_reply=lambda: page.evaluate("window.dispatchEvent(new StorageEvent('storage',{key:'user-info',newValue:'changed'}))")
        confirm()
        expect(page.get_by_text('登录信息已改变，请重新加载草稿',exact=True)).to_be_visible()
        expect(page.get_by_role('heading',name='合成单场次培训',exact=True)).to_have_count(0)
        expect(card).to_have_count(0)
        assert not errors, errors
        assert not f.unexpected, f.unexpected
        print('PASS blocked storage sends nothing; account change hides late response and draft; no page errors')
        print('PASS all synthetic review scenarios; real submit/review integration: NOT RUN')
        browser.close()

if __name__ == '__main__': main()
