"""Candidate-contract synthetic regression; all API intercepted, never live."""
from playwright.sync_api import sync_playwright, expect
from simple_review_render_pass import ReviewFixture, BASE, LIST, ID
import copy
import json
from pathlib import Path
from urllib.parse import urlsplit

class VersionFixture(ReviewFixture):
    def reset(self):
        super().reset()
        self.hold_get = False
        self.held = None

    def route(self, route):
        if self.hold_get and route.request.method == 'GET' and urlsplit(route.request.url).path == f'/api/admin/v1/activities/{ID}/simple-draft':
            self.hold_get = False
            self.held = (route, copy.deepcopy(self.draft))
            return
        return super().route(route)

    def release(self):
        route, data = self.held
        self.held = None
        route.fulfill(status=200, content_type='application/json', body=json.dumps({'code':0,'message':'ok','data':data}))

def main():
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
        context = browser.new_context(service_workers='block')
        f = VersionFixture(); f.reset()
        context.route('**/api/**', f.route)
        page = context.new_page()
        page.set_default_timeout(10000)
        errors=[]; page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto(BASE+'/#/login')
        page.get_by_placeholder('账号').fill('fixture')
        page.get_by_placeholder('密码').fill('L'*35+'7!')
        page.get_by_role('button',name='登录',exact=True).click()
        page.wait_for_url(lambda url:'/login' not in url)
        page.goto(BASE+'/#'+LIST+'/'+ID+'/simple-draft')
        card = page.get_by_test_id('simple-review')
        def ready():
            expect(card.get_by_role('button',name='核对并提交审核',exact=True)).to_be_enabled()
        def start():
            card.get_by_role('button',name='核对并提交审核',exact=True).click()
            expect(card.locator('.el-checkbox')).to_be_enabled()
        def settle():
            expect(card.locator('.el-button.is-loading')).to_have_count(0)
        def confirm():
            card.locator('.el-checkbox').click()
            recovery=card.get_by_role('button',name='确认核对上次提审',exact=True)
            (recovery if recovery.count() else card.get_by_role('button',name='确认提交发布审核',exact=True)).click()
            settle()
        def records():
            return page.evaluate("Object.keys(sessionStorage).filter(k=>k.startsWith('srvf:simple-review:')).map(k=>JSON.parse(sessionStorage.getItem(k)))")
        def reset():
            f.reset(); page.evaluate('sessionStorage.clear()'); page.reload(); ready()
        ready(); start()
        confirmed_hash = f.draft['draftHash']
        f.post_mode = 'race'
        card.locator('.el-checkbox').click()
        card.get_by_role('button',name='确认提交发布审核',exact=True).click()
        expect(card.locator('.el-button.is-loading')).to_have_count(0)
        assert not f.reviews, 'BUG: confirmation-to-POST race created a review of unconfirmed facts'
        assert f.posts[0]['expectedDraftHash'] == confirmed_hash
        expect(card.get_by_text('最后读取之后另一窗口保存的内容',exact=True)).to_be_visible()
        expect(card.get_by_role('checkbox')).not_to_be_checked()
        print('PASS server version conflict rejects last-GET-to-POST race without creating review; full preview refreshed and unconfirmed')
        first=copy.deepcopy(f.posts[0])
        assert records()==[{'body':first}]
        confirm()
        assert not f.reviews and f.posts==[first,first]
        assert records()==[{'body':first}]
        page.reload()
        expect(card.get_by_role('button',name='核对并提交审核',exact=True)).to_have_count(0)
        card.get_by_role('button',name='刷新审核状态',exact=True).click(); settle()
        assert records()==[{'body':first}] and len(f.posts)==2
        print('PASS first 20255 retains its original confirmed body across polling/reload; no replacement intent even after definite rejection')

        reset(); before=f.draft['draftHash']
        page.get_by_role('button',name='配置本次场次',exact=True).click()
        page.locator('.el-form-item').filter(has=page.locator('label').filter(has_text='活动说明')).locator('textarea').fill('保存后服务端返回的说明')
        page.get_by_role('button',name='保存草稿',exact=True).click()
        expect(page.get_by_text('草稿已保存，请核对下方场次和下一步。',exact=True)).to_be_visible()
        saved=f.draft['draftHash']; assert saved!=before
        start(); expect(card.get_by_text('保存后服务端返回的说明',exact=True)).to_be_visible()
        confirm(); assert f.posts[0]['expectedDraftHash']==saved and saved!=f.draft['definitionHash']
        print('PASS save final facts are displayed before confirmation; POST binds draftHash, never definitionHash')

        reset(); f.post_mode='professional'; start(); original=copy.deepcopy(f.draft); confirm()
        expect(card.get_by_text('需要专业流程核对',exact=True)).to_be_visible()
        assert f.draft==original and not f.reviews and records()[0]['body']==f.posts[0]
        expect(card.get_by_role('button',name='确认核对上次提审',exact=True)).to_be_disabled()
        card.get_by_role('button',name='暂时关闭，稍后核对',exact=True).click()
        card.get_by_role('button',name='刷新审核状态',exact=True).click(); settle()
        expect(card.get_by_text('需要专业流程核对',exact=True)).to_be_visible()
        assert len(f.posts)==1 and records()[0]['body']==f.posts[0]
        print('PASS editable GET does not bypass 20256; all configuration remains intact and refresh does not auto-retry')

        reset(); f.post_mode='lost-before'; start(); confirm()
        original=copy.deepcopy(f.posts[0]); assert records()[0]['body']==original
        f.post_mode='professional-rules'
        page.reload(); card.get_by_role('button',name='继续核对上次提审',exact=True).click()
        expect(card.get_by_role('checkbox')).to_be_enabled(); confirm()
        expect(card.get_by_text('其他发送可能尚未结束',exact=False)).to_be_visible()
        assert len(f.posts)==2 and f.posts[1]==original and records()[0]['body']==original and not f.reviews
        card.get_by_role('button',name='暂时关闭，稍后核对',exact=True).click()
        card.get_by_role('button',name='刷新审核状态',exact=True).click(); settle()
        assert records()[0]['body']==original
        f.post_mode='ok'
        card.get_by_role('button',name='继续核对上次提审',exact=True).click()
        expect(card.get_by_role('checkbox')).to_be_enabled(); confirm()
        assert len(f.reviews)==1 and all(p==original for p in f.posts) and not records()
        print('PASS uncertain 20256 preserves the logical operation despite current rejection; later exact recovery can still commit after eligibility changes')

        reset(); start(); confirm(); first=copy.deepcopy(f.posts[0])
        for row in f.reviews.values(): row['status']='returned'
        f.draft['review']['status']='returned'; f.draft['editable']=True; f.bump()
        page.reload(); ready(); start(); new_hash=f.draft['draftHash']; confirm()
        assert len(f.reviews)==2 and f.posts[-1]['operationKey']!=first['operationKey']
        assert f.posts[-1]['expectedDraftHash']==new_hash and new_hash!=first['expectedDraftHash']
        print('PASS returned review needs a new explicitly confirmed intent; old successful key is not reused')

        reset()
        legacy={'body':{'operationKey':'legacy-unknown-fixture','confirmation':True}}
        page.evaluate("([id, record])=>sessionStorage.setItem('srvf:simple-review:v1:'+encodeURIComponent(location.origin)+':admin-v1:organizer-fixture:'+encodeURIComponent(id),JSON.stringify(record))",[ID,legacy])
        page.reload()
        expect(card.get_by_text('旧版提审结果尚未确认，仅支持读取核对',exact=True)).to_be_visible()
        expect(card.get_by_role('button',name='继续核对上次提审',exact=True)).to_have_count(0)
        card.get_by_role('button',name='刷新审核状态',exact=True).click(); settle()
        assert not f.posts and records()==[legacy]
        page.reload(); assert records()==[legacy] and not f.posts
        print('PASS legacy unknown body survives reload/poll intact; no hash injection, no legacy POST and no new intent')

        reset(); f.post_mode='old-backend'; start(); confirm()
        assert len(f.posts)==1 and not f.reviews and 'expectedDraftHash' in f.posts[0]
        expect(card.get_by_text('property expectedDraftHash should not exist',exact=False)).to_be_visible()
        confirm(); assert len(f.posts)==2 and f.posts[0]==f.posts[1] and records()[0]['body']==f.posts[0]
        assert all(set(p)=={'operationKey','confirmation','expectedDraftHash'} for p in f.posts)
        print('PASS old backend 400 never triggers a fallback without the version')

        reset(); start(); f.draft['activityId']='wrong-activity'; confirm()
        expect(card.get_by_text('未取得本活动有效的草稿版本',exact=False)).to_be_visible()
        assert not f.posts and not records()
        reset(); start(); f.draft['draftHash']='A'*64; confirm()
        expect(card.get_by_text('未取得本活动有效的草稿版本',exact=False)).to_be_visible()
        assert not f.posts
        print('PASS wrong-activity and malformed-version reads cannot become confirmation inputs')

        reset(); f.hold_get=True
        card.get_by_role('button',name='核对并提交审核',exact=True).click()
        expect(card.locator('.el-button.is-loading').first).to_be_visible()
        expect(page.get_by_role('button',name='配置本次场次',exact=True)).to_be_disabled()
        expect(card.get_by_role('button',name='取消，返回草稿',exact=True)).to_be_disabled()
        page.evaluate("location.hash='#'+"+json.dumps(LIST))
        page.wait_for_url(lambda url:ID+'/simple-draft' in url)
        assert f.held is not None; f.release(); settle()
        card.locator('.el-checkbox').click()
        card.get_by_role('button',name='取消，返回草稿',exact=True).click(); start()
        expect(card.get_by_role('checkbox')).not_to_be_checked()
        card.get_by_role('button',name='取消，返回草稿',exact=True).click()
        page.evaluate("location.hash='#'+"+json.dumps(LIST))
        page.wait_for_url(lambda url:url.endswith('#'+LIST))
        assert not f.posts
        print('PASS pending reads serialize save/cancel/navigation; cancellation discards confirmation and no request is sent on navigation')

        page.goto(BASE+'/#'+LIST+'/'+ID+'/simple-draft'); ready()
        page.set_viewport_size({'width':390,'height':844}); start()
        check=card.locator('.el-checkbox'); check.scroll_into_view_if_needed()
        box=check.locator('.el-checkbox__label').bounding_box()
        assert box and box['height']>=40 and box['x']>=0 and box['x']+box['width']<=390,box
        for name in ['取消，返回草稿','确认提交发布审核']:
            box=card.get_by_role('button',name=name,exact=True).bounding_box()
            assert box and box['x']>=0 and box['x']+box['width']<=390,box
        shot=Path('/tmp/srvf-review-version-render'); shot.mkdir(exist_ok=True)
        page.screenshot(path=str(shot/'version-confirmation-390.png'),full_page=True)
        assert not errors,errors
        assert not f.unexpected,f.unexpected
        print('PASS narrow confirmation wraps; no page errors or unhandled API. All tests synthetic; real integration NOT RUN')
        browser.close()

if __name__ == '__main__': main()
