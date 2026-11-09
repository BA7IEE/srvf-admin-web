"""Organizer return/edit/resubmit regression. ALL API traffic is synthetic."""
import copy
import json
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright, expect
from simple_review_render_pass import ReviewFixture, BASE, LIST, ID, ORG

NOTE = '请补全参与准备。\n明确集合位置后再次提交。 <img src=x onerror="window.returnNoteExecuted=true">'

class ReturnFixture(ReviewFixture):
    def reset(self):
        super().reset()
        self.note = NOTE
        self.note_mode = 'ok'
        self.note_reads = []
        self.held_note = None
        self.saves = []
        self.save_mode = 'ok'

    def returned(self):
        self.draft.update(review={'id': 'returned-review-fixture', 'status': 'returned', 'requestType': 'initial'}, editable=True)
        self.bump()

    def summary(self):
        review = self.draft['review']
        return {
            'activity': {'id': ID, 'organizationId': ORG, 'statusCode': self.draft['statusCode']},
            'publishReview': {
                'latestRequestId': review['id'] if review else None,
                'requestType': review['requestType'] if review else None,
                'status': review['status'] if review else None,
                'reviewNote': self.note, 'canDirectPublish': False
            }
        }

    def route(self, route):
        req = route.request
        path = urlsplit(req.url).path
        if path == f'/api/app/v1/my/managed-activities/{ID}':
            assert req.method == 'GET' and not req.post_data and not urlsplit(req.url).query
            self.note_reads.append(path)
            if self.note_mode in ('403', '404'):
                status = int(self.note_mode)
                return route.fulfill(status=status, content_type='application/json', body=json.dumps({'code':30100 if status==403 else 20004,'message':'无权读取本人管理活动','data':None}))
            data = self.summary()
            if self.note_mode == 'wrong-activity': data['activity']['id'] = 'another-activity'
            if self.note_mode == 'wrong-org': data['activity']['organizationId'] = 'another-organization'
            if self.note_mode == 'wrong-review': data['publishReview']['latestRequestId'] = 'another-review'
            if self.note_mode == 'changed-status': data['publishReview']['status'] = 'approved'
            if self.note_mode == 'hold':
                self.held_note = (route, data)
                return
            return route.fulfill(status=200, content_type='application/json', body=json.dumps({'code':0,'message':'ok','data':data}))
        return super().route(route)

    def release_note(self):
        route, data = self.held_note
        self.held_note = None
        route.fulfill(status=200, content_type='application/json', body=json.dumps({'code':0,'message':'ok','data':data}))

def main():
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
        context = browser.new_context(service_workers='block')
        f = ReturnFixture(); f.reset(); f.returned()
        context.route('**/api/**', f.route)
        page = context.new_page(); page.set_default_timeout(10000)
        errors=[]; page.on('pageerror',lambda e: errors.append(str(e)))
        page.goto(BASE+'/#/login')
        page.get_by_placeholder('账号').fill('fixture')
        page.get_by_placeholder('密码').fill('L'*35+'7!')
        page.get_by_role('button',name='登录',exact=True).click()
        page.wait_for_url(lambda url:'/login' not in url)
        url = BASE+'/#'+LIST+'/'+ID+'/simple-draft'
        page.goto(url)
        note = page.get_by_test_id('returned-review')
        card = page.get_by_test_id('simple-review')
        def records():
            return page.evaluate("Object.keys(sessionStorage).filter(k=>k.startsWith('srvf:simple-review:')).map(k=>JSON.parse(sessionStorage.getItem(k)))")
        def ready():
            expect(card.get_by_role('button',name='核对并提交审核',exact=True)).to_be_enabled()
        def reset(returned=True):
            f.reset()
            if returned: f.returned()
            page.evaluate('sessionStorage.clear()'); page.goto(url); page.reload()
            ready()
        def confirm():
            card.locator('.el-checkbox').click()
            button=card.get_by_role('button',name='确认核对上次提审',exact=True)
            (button if button.count() else card.get_by_role('button',name='确认提交发布审核',exact=True)).evaluate('(el) => { el.click(); el.click(); }')
            expect(card.locator('.el-button.is-loading')).to_have_count(0)
        def start():
            card.get_by_role('button',name='核对并提交审核',exact=True).click()
            expect(card.get_by_role('checkbox')).to_be_enabled()
        def preparation():
            return page.locator('.el-form-item').filter(has=page.locator('label',has_text='参与准备')).locator('textarea')

        # Identical business assertion must fail on baseline and pass after implementation.
        expect(note).to_contain_text(NOTE)
        assert f.note_reads and not page.evaluate('window.returnNoteExecuted')
        assert note.locator('img').count()==0
        assert not any('activity-publish-reviews' in p for _,p in f.reads)
        print('PASS returned reason visible as exact plain text using scoped member detail, no reviewer permission/API')

        for mode in ('403','404','wrong-activity','wrong-org','wrong-review','changed-status'):
            reset(); f.note_mode=mode; page.reload()
            expect(note.get_by_role('alert')).to_be_visible()
            expect(note).not_to_contain_text(NOTE)
            assert not f.posts and not records()
            f.note_mode='ok'
            note.get_by_role('button',name='重新读取退回原因',exact=True).click()
            expect(note).to_contain_text(NOTE)
        print('PASS 403/404 and activity/organization/review/status mismatches hide reason; explicit retry recovers without new intent')

        reset(); f.note=None; page.reload()
        expect(note).to_contain_text('未提供可显示的退回原因')
        reset(); f.note_mode='hold'; page.reload()
        expect(note).to_contain_text('正在读取退回原因')
        f.user='another-user'
        f.release_note()
        expect(page.get_by_test_id('simple-draft')).to_contain_text('登录信息已改变')
        expect(page.get_by_test_id('simple-draft')).not_to_contain_text(NOTE)
        assert not f.posts
        print('PASS explicit missing reason and account change during late read do not invent or disclose a note')

        # Real interaction creates a receipt, is returned, edits saved facts, then sends a NEW intent.
        reset(False); start(); confirm()
        first=copy.deepcopy(f.posts[-1]); assert not records()
        old=f.reviews[first['operationKey']]
        old.update(status='returned',reviewNote=NOTE,reviewedByUserId='reviewer-fixture',reviewedAt='2099-01-01T00:01:00.000Z')
        f.draft.update(review={'id':old['id'],'status':'returned','requestType':'initial'},editable=True); f.bump()
        card.get_by_role('button',name='刷新审核状态',exact=True).click()
        expect(note).to_contain_text(NOTE)
        note.get_by_role('button',name='按意见修改草稿',exact=True).click()
        preparation().fill('请携带手套，集合位置为东门。')
        page.get_by_role('button',name='取消编辑并重新读取',exact=True).click()
        page.get_by_role('button',name='放弃本次编辑',exact=True).click()
        expect(note).to_contain_text(NOTE)
        note.get_by_role('button',name='按意见修改草稿',exact=True).click()
        preparation().fill('请携带手套，集合位置为东门。')
        page.get_by_role('button',name='保存草稿',exact=True).click()
        expect(page.get_by_role('button',name='保存草稿',exact=True)).to_have_count(0)
        assert f.saves[-1]['instance']['registrationNotes']=='请携带手套，集合位置为东门。'
        expect(note).to_contain_text(NOTE)
        start(); card.get_by_role('button',name='取消，返回草稿',exact=True).click()
        assert len(f.posts)==1
        start(); expected=f.draft['draftHash']; confirm()
        assert len(f.reviews)==2 and len(f.posts)==2
        assert f.posts[-1]['operationKey']!=first['operationKey'] and f.posts[-1]['expectedDraftHash']==expected
        expect(note).to_have_count(0)
        expect(card).to_contain_text('审核中')
        page.reload(); expect(note).to_have_count(0)
        assert not records()
        print('PASS received old operation -> return reason -> cancel/reopen edit -> save -> cancel/reopen confirmation -> new-key/version resubmit -> pending after reload')

        # Unknown first proposal can be returned elsewhere; a general GET still cannot unlock it.
        reset(False); f.post_mode='lost-after'; start(); confirm()
        first=copy.deepcopy(f.posts[-1]); assert records()[0]['body']==first
        f.reviews[first['operationKey']]['status']='returned'
        f.draft['review']['status']='returned'; f.draft['editable']=True; f.bump()
        page.reload(); expect(note).to_contain_text(NOTE)
        assert records()[0]['body']==first
        expect(page.get_by_role('button',name='配置本次场次',exact=True)).to_be_disabled()
        expect(note.get_by_role('button',name='按意见修改草稿',exact=True)).to_have_count(0)
        card.get_by_role('button',name='继续核对上次提审',exact=True).click()
        confirm()
        assert f.posts==[first,first] and not records() and len(f.reviews)==1
        expect(note.get_by_role('button',name='按意见修改草稿',exact=True)).to_be_enabled()
        start(); confirm()
        assert len(f.reviews)==2 and f.posts[-1]['operationKey']!=first['operationKey']
        print('PASS returned state does not unlock unknown old intent; exact successful replay archives it before any new key')

        reset(); f.draft['review']['status']='approved'; f.draft['editable']=False; f.draft['statusCode']='cancelled'; f.bump(); f.note_reads=[]; page.reload()
        expect(page.get_by_test_id('simple-next-step')).to_contain_text('已不在草稿阶段')
        expect(note).to_have_count(0)
        assert not f.posts and not f.note_reads
        readonly = browser.new_context(service_workers='block')
        rf = ReturnFixture(); rf.reset(); rf.returned(); rf.permissions=['activity.create.record']
        readonly.route('**/api/**',rf.route)
        rp = readonly.new_page(); rp.set_default_timeout(10000)
        rp.on('pageerror',lambda e:errors.append(str(e)))
        rp.goto(BASE+'/#/login')
        rp.get_by_placeholder('账号').fill('fixture')
        rp.get_by_placeholder('密码').fill('L'*35+'7!')
        rp.get_by_role('button',name='登录',exact=True).click()
        rp.wait_for_url(lambda u:'/login' not in u); rp.goto(url)
        expect(rp.get_by_test_id('returned-review')).to_contain_text(NOTE)
        expect(rp.get_by_role('button',name='配置本次场次',exact=True)).to_have_count(0)
        expect(rp.get_by_role('button',name='按意见修改草稿',exact=True)).to_have_count(0)
        assert not rf.saves and not rf.posts
        readonly.close()
        print('PASS member can read their return note without acquiring update/reviewer permissions; edit actions remain unavailable')
        reset(); page.set_viewport_size({'width':390,'height':844})
        expect(note).to_contain_text(NOTE)
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
        assert not errors, errors
        context.close(); browser.close()
        print('PASS approved history never becomes current publication; 390px returned-note flow has no page errors; ALL API synthetic, live integration NOT RUN')

if __name__=='__main__': main()
