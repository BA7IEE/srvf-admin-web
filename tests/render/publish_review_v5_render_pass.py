#!/usr/bin/env python3
"""V5 default policy task regression. Every API synthetic; no real integration claim."""
import copy
import json
import os
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright, expect
from publish_review_render_pass import ReviewerFixture, BASE, DETAIL, LIST

DATA=json.loads((Path(__file__).resolve().parent.parent/'fixtures/publish-review-v5.synthetic.json').read_text())


class V5Fixture(ReviewerFixture):
    def __init__(self):
        super().__init__();self.review=copy.deepcopy(DATA['review']);self.policies=copy.deepcopy(DATA['policies'])
        self.policy_mode='ok';self.policy_reads=0
        self.mutate_policy_read=None
        self.policy_held=[]

    def route(self,route):
        req=route.request;path=urlsplit(req.url).path
        if path==f'/api/admin/v1/activity-publish-reviews/{self.review["id"]}/referenced-policies':
            assert req.method=='GET' and not urlsplit(req.url).query and not req.post_data
            self.policy_reads+=1
            if self.mutate_policy_read:
                change=self.mutate_policy_read;self.mutate_policy_read=None;change(self.policies)
            if self.policy_mode=='hold':self.policy_held.append(route);return
            if self.policy_mode.startswith('error:'):
                _,status,code=self.policy_mode.split(':')
                return route.fulfill(status=int(status),content_type='application/json',body=json.dumps({'code':int(code),'message':'合成引用版本拒绝','data':None}))
            return route.fulfill(status=200,content_type='application/json',body=json.dumps({'code':0,'message':'ok','data':copy.deepcopy(self.policies)}))
        return super().route(route)


def main():
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
        context=browser.new_context(service_workers='block');f=V5Fixture();context.route('**/api/**',f.route)
        page=context.new_page();page.set_default_timeout(12000)
        page.goto(BASE+'/#/login');page.get_by_placeholder('账号').fill('fixture');page.get_by_placeholder('密码').fill('L'*35+'7!')
        page.get_by_role('button',name='登录',exact=True).click();page.wait_for_url(lambda u:'/login' not in u)
        page.goto(BASE+'/#'+LIST);page.get_by_role('tab',name='活动发布审核',exact=True).click()
        page.get_by_role('button',name='核对申请',exact=True).click()
        expect(page.get_by_role('heading',name='冻结的合成培训',exact=True)).to_be_visible()
        expect(page.get_by_role('button',name='通过并发布',exact=True)).to_be_enabled()
        panel=page.get_by_test_id('referenced-policy-versions')
        expect(panel.get_by_text('按 60 秒向下取整',exact=True)).to_be_visible()
        expect(panel.get_by_text('3.00',exact=True)).to_be_visible()
        expect(panel.get_by_text('超过 7200 秒，无上限',exact=True)).to_be_visible()
        assert f.policy_reads==1
        errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        case=0
        def records():
            return page.evaluate('()=>Object.keys(sessionStorage).filter(k=>k.startsWith("srvf:publish-decision:")&&!k.includes(":receipt:")).map(k=>JSON.parse(sessionStorage.getItem(k)))')
        def reset(change=None,wait=True):
            nonlocal case
            assert not f.unexpected,f.unexpected
            page.evaluate('sessionStorage.clear()');f.__init__();case+=1
            if change:change(f)
            page.goto(BASE+f'/?v5-case={case}#'+DETAIL)
            if wait:expect(page.get_by_role('heading',name='冻结的合成培训',exact=True)).to_be_visible()
        def start(action='approve'):
            page.get_by_role('button',name='通过并发布' if action=='approve' else '退回修改',exact=True).click()
            expect(page.get_by_role('dialog')).to_be_visible()
        def confirm(action='approve',note='合成V5审核',double=False):
            modal=page.get_by_role('dialog');modal.get_by_role('textbox').fill(note);modal.locator('.el-checkbox').click()
            button=modal.get_by_role('button',name='确认通过并发布' if action=='approve' else '确认退回修改',exact=True)
            if double:button.evaluate('(el)=>{el.click();el.click()}')
            else:button.click()
        def settled():expect(page.locator('.el-button.is-loading')).to_have_count(0)
        start();page.get_by_role('dialog').get_by_role('button',name='取消',exact=True).click();assert not f.posts and not records()
        start();confirm(double=True);settled()
        assert len(f.posts)==len(f.commands)==1 and f.policy_reads>=2 and not records()
        expect(page.get_by_text('审核已通过',exact=True)).to_be_visible()
        expect(page.get_by_text('活动已发布',exact=True)).to_have_count(0)
        print('PASS V5 non-null policy rules + cancellation + double click + one approve command; catalog permissions never requested')

        for mutate in [lambda p:p.update(snapshotHash='c'*64),lambda p:p.update(reviewId='another-review'),
                       lambda p:p.update(timePolicies=[]),lambda p:p['contributionPolicies'][0].update(definitionHash='d'*64),
                       lambda p:p['timePolicies'].append(copy.deepcopy(p['timePolicies'][0]))]:
            reset(lambda f:mutate(f.policies));settled()
            expect(page.get_by_role('button',name='通过并发布',exact=True)).to_be_disabled()
            expect(page.get_by_test_id('referenced-policy-versions')).to_have_count(0)
            assert not f.posts and not records()
        print('PASS mismatched hash/review, missing definitions, mismatched pointer and duplicate version fail closed')

        for mode in ['error:403:30100','error:409:20022','error:404:20004']:
            reset(lambda f:setattr(f,'policy_mode',mode));settled()
            expect(page.get_by_role('button',name='通过并发布',exact=True)).to_be_disabled()
            assert not f.posts and not records()
            f.policy_mode='ok';page.get_by_role('button',name='刷新申请记录',exact=True).click();settled()
            expect(page.get_by_role('button',name='通过并发布',exact=True)).to_be_enabled()
        print('PASS 403/409/old-backend-404 read failure and explicit retry without downgrade')

        reset();start();f.policy_mode='error:403:30100';confirm();settled()
        assert not f.posts and not records()
        print('PASS pre-send policy read failure does not manufacture an unknown sent intent')
        reset();start();f.mutate_policy_read=lambda p:p['timePolicies'][0]['definition']['rounding'].update(quantumSeconds=120)
        confirm();settled();assert not f.posts and not records()
        expect(page.get_by_role('dialog')).to_have_count(0)
        expect(panel.get_by_text('按 120 秒向下取整',exact=True)).to_be_visible()
        print('PASS changed policy display facts force reconfirmation before any POST')

        reset(lambda f:f.review.update(requestType='change'));settled()
        expect(page.get_by_role('button',name='通过并发布',exact=True)).to_have_count(0)
        expect(page.get_by_role('button',name='退回修改',exact=True)).to_be_enabled()
        start('return');confirm('return',note='  请按修改要求重新提审  ');settled()
        assert f.posts[0][0]=='return' and f.posts[0][1]['reviewNote']=='  请按修改要求重新提审  '
        print('PASS change review remains unapprovable; explicit return preserves original reason')
        def override(f):
            for part in [f.review['snapshot'],f.review['snapshot']['base']]:
                policy=part['contributionPolicyPointers']
                root=next(iter(policy['selection']['items'].values()))
                root['selection']={'mode':'explicit','pointer':copy.deepcopy(policy['resolved'][0]['pointer'])}
                for resolved in policy['resolved']:resolved['sourceLayerCode']='activity'
        reset(override);settled()
        expect(panel).to_be_visible()
        expect(page.get_by_role('button',name='通过并发布',exact=True)).to_be_disabled()
        print('PASS fully readable policy override remains outside the default-only approval scope')

        reset(lambda f:setattr(f,'mode','lost'));start();confirm();settled();body=copy.deepcopy(f.posts[0][1]);assert records()[0]['body']==body
        page.reload();expect(page.get_by_test_id('decision-pending')).to_be_visible()
        expect(page.get_by_text('审核已通过',exact=True)).to_be_visible();assert records()[0]['body']==body
        page.get_by_role('button',name='原样核对上次处理',exact=True).click();settled()
        assert len(f.posts)==2 and f.posts[1][1]==body and len(f.commands)==1 and not records()
        print('PASS policy reads + approved GET never replace a missing decision receipt; exact body replay only')

        reset(lambda f:setattr(f,'policy_mode','hold'),wait=False)
        for _ in range(150):
            if f.policy_held:break
            page.wait_for_timeout(20)
        assert f.policy_held
        expect(page.get_by_role('button',name='通过并发布',exact=True)).to_have_count(0)
        f.user='another-account'
        for route in f.policy_held:
            route.fulfill(status=200,content_type='application/json',body=json.dumps({'code':0,'message':'ok','data':f.policies}))
        settled();expect(panel).to_have_count(0)
        expect(page.get_by_role('heading',name='冻结的合成培训',exact=True)).to_have_count(0)
        print('PASS late policy response is hidden after identity changes')
        reset();page.set_viewport_size({'width':390,'height':844});settled()
        expect(panel.get_by_text('按 60 秒向下取整',exact=True)).to_be_visible()
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
        assert not errors,errors
        assert not f.unexpected,f.unexpected
        print('PASS 390px full policy definitions; every API synthetic, real V5 integration NOT RUN')
        browser.close()


if __name__=='__main__':main()
