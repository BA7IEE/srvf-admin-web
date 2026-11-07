#!/usr/bin/env python3
"""Real opener/sessionStorage model; all API behavior below is synthetic."""
import copy
import json
from playwright.sync_api import sync_playwright, expect
from publish_review_render_pass import ReviewerFixture, BASE, DETAIL


def records(page):
    return page.evaluate('()=>Object.keys(sessionStorage).filter(k=>k.startsWith("srvf:publish-decision:")&&!k.includes(":receipt:")).map(k=>JSON.parse(sessionStorage.getItem(k)))')


def wait_held(page, f, count):
    for _ in range(150):
        if len(f.held)>=count: return
        page.wait_for_timeout(20)
    raise AssertionError('synthetic held request did not arrive')


def main():
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
        context=browser.new_context(service_workers='block')
        f=ReviewerFixture();f.mode='hold';context.route('**/api/**',f.route)
        a=context.new_page();a.set_default_timeout(10000)
        a.goto(BASE+'/#/login')
        a.get_by_placeholder('账号').fill('fixture');a.get_by_placeholder('密码').fill('L'*35+'7!')
        a.get_by_role('button',name='登录',exact=True).click();a.wait_for_url(lambda url:'/login' not in url)
        a.goto(BASE+'/#'+DETAIL)
        expect(a.get_by_role('heading',name='冻结的合成培训',exact=True)).to_be_visible()
        a.get_by_role('button',name='通过并发布',exact=True).click()
        a.get_by_role('dialog').get_by_role('textbox').fill('  原审批说明  ')
        a.get_by_role('dialog').locator('.el-checkbox').click()
        a.get_by_role('button',name='确认通过并发布',exact=True).click()
        wait_held(a,f,1);body=copy.deepcopy(f.posts[0][1])
        assert records(a)[0]['body']==body
        # Do not seed a fake recovery record: Chromium itself copies opener sessionStorage.
        with a.expect_popup() as event:
            a.evaluate('(url)=>window.open(url,"_blank")',BASE+'/?actual-opener#'+DETAIL)
        b=event.value;b.set_default_timeout(10000)
        expect(b.get_by_test_id('decision-pending')).to_be_visible()
        assert records(b)[0]['body']==body
        b.get_by_role('button',name='原样核对上次处理',exact=True).click()
        wait_held(b,f,2);assert f.posts[1][1]==body
        first=f.held.pop(0)
        first[0].fulfill(status=409,content_type='application/json',body=json.dumps({'code':20144,'message':'合成第一次拒绝','data':None}))
        expect(a.locator('.el-button.is-loading')).to_have_count(0)
        assert records(a)[0]['body']==body
        a.reload();expect(a.get_by_test_id('decision-pending')).to_be_visible()
        expect(a.get_by_role('button',name='通过并发布',exact=True)).to_be_disabled()
        expect(a.get_by_role('button',name='退回修改',exact=True)).to_be_disabled()
        # B was still in flight when A received a definite failure. It can subsequently succeed.
        second=f.held.pop(0);f.mode='ok';f.accept(*second)
        expect(b.locator('.el-button.is-loading')).to_have_count(0)
        assert len(f.commands)==1 and not records(b)
        a.get_by_role('button',name='刷新申请记录',exact=True).click()
        expect(a.get_by_text('审核已通过',exact=True)).to_be_visible()
        assert records(a)[0]['body']==body, 'GET approved is not our operation receipt'
        a.get_by_role('button',name='原样核对上次处理',exact=True).click()
        expect(a.locator('.el-button.is-loading')).to_have_count(0)
        assert not records(a) and len(f.commands)==1 and len(f.posts)==3
        assert all(post[1]==body for post in f.posts)
        assert not f.unexpected,f.unexpected
        print('PASS synthetic opener copy: A first 20144 retains through reload; B commits; GET cannot unlock A; exact replay yields one decision')
        browser.close()


if __name__=='__main__':main()
