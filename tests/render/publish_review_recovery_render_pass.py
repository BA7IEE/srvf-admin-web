#!/usr/bin/env python3
"""Receipt/identity safety regressions. All API responses are synthetic."""
import copy
import os
from playwright.sync_api import sync_playwright, expect
from publish_review_render_pass import ReviewerFixture, BASE, DETAIL
from publish_review_clone_render_pass import records, wait_held


def login(page):
    page.goto(BASE+'/?reviewer-relogin#/login')
    page.get_by_placeholder('账号').fill('fixture');page.get_by_placeholder('密码').fill('L'*35+'7!')
    page.get_by_role('button',name='登录',exact=True).click();page.wait_for_url(lambda url:'/login' not in url)
    page.goto(BASE+'/#'+DETAIL)
    expect(page.get_by_role('heading',name='冻结的合成培训',exact=True)).to_be_visible()


def start(page,note='待核对的原说明'):
    page.get_by_role('button',name='通过并发布',exact=True).click()
    page.get_by_role('dialog').get_by_role('textbox').fill(note)
    page.get_by_role('dialog').locator('.el-checkbox').click()
    page.get_by_role('button',name='确认通过并发布',exact=True).click()


def main():
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
        context=browser.new_context(service_workers='block');f=ReviewerFixture();f.mode='hold'
        context.route('**/api/**',f.route);page=context.new_page();page.set_default_timeout(10000)
        login(page);start(page,'旧账号私人审核说明');wait_held(page,f,1)
        body=copy.deepcopy(f.posts[0][1]);old_user=f.user
        f.user='another-account-synthetic';f.mode='ok';f.accept(*f.held.pop())
        expect(page.locator('.el-button.is-loading')).to_have_count(0)
        expect(page.get_by_role('heading',name='冻结的合成培训',exact=True)).to_have_count(0)
        expect(page.get_by_test_id('decision-pending')).to_have_count(0)
        expect(page.get_by_text('已取得本次处理的成功回执',exact=True)).to_have_count(0)
        assert records(page)[0]['body']==body, 'original account journal remains untouched'
        print('PASS account changed before response: hide old content and retain original account journal')
        if os.environ.get('RP_IDENTITY_RED_ONLY'):return
        f.user=old_user;page.goto(BASE+'/?original-account-restored#'+DETAIL)
        expect(page.get_by_test_id('decision-pending')).to_be_visible()
        page.get_by_role('button',name='原样核对上次处理',exact=True).click()
        expect(page.locator('.el-button.is-loading')).to_have_count(0)
        assert not records(page) and len(f.commands)==1

        def reset(mode='ok'):
            assert not f.unexpected,f.unexpected
            page.evaluate('sessionStorage.clear()');f.__init__();f.mode=mode
            page.goto(BASE+'/?recovery-reset='+mode+'#'+DETAIL)
            expect(page.get_by_role('heading',name='冻结的合成培训',exact=True)).to_be_visible()

        reset('wrong-receipt');start(page)
        expect(page.locator('.el-button.is-loading')).to_have_count(0)
        body=copy.deepcopy(f.posts[0][1]);assert records(page)[0]['body']==body
        page.reload();expect(page.get_by_test_id('decision-pending')).to_be_visible()
        f.mode='ok';page.get_by_role('button',name='原样核对上次处理',exact=True).click()
        expect(page.locator('.el-button.is-loading')).to_have_count(0)
        assert not records(page) and len(f.commands)==1
        print('PASS unrelated 200 response cannot unlock; exact replay can recover')

        reset();page.evaluate('''()=>{const orig=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k.startsWith('srvf:publish-decision:receipt:'))throw new DOMException('synthetic quota','QuotaExceededError');return orig.call(this,k,v)}}''')
        start(page);expect(page.locator('.el-button.is-loading')).to_have_count(0)
        assert records(page)[0].get('receipt') and len(f.posts)==1
        page.reload();expect(page.get_by_role('button',name='保存处理回执',exact=True)).to_be_visible()
        page.get_by_role('button',name='保存处理回执',exact=True).click()
        expect(page.locator('.el-button.is-loading')).to_have_count(0)
        assert not records(page) and len(f.posts)==1
        print('PASS archive failure recovers by local receipt save without repeating POST')

        reset('error:401:40100');start(page)
        # Existing auth refresh/logout may navigate away; it is not server cancellation.
        page.wait_for_timeout(500)
        body=copy.deepcopy(f.posts[0][1]);assert records(page)[0]['body']==body
        f.mode='ok';login(page)
        expect(page.get_by_test_id('decision-pending')).to_be_visible()
        assert records(page)[0]['body']==body
        page.get_by_role('button',name='原样核对上次处理',exact=True).click()
        expect(page.locator('.el-button.is-loading')).to_have_count(0)
        assert not records(page) and f.posts[-1][1]==body
        print('PASS 401 + existing logout/relogin preserves exact original intent')
        assert not f.unexpected,f.unexpected
        browser.close()


if __name__=='__main__':main()
