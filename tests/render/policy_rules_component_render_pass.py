#!/usr/bin/env python3
"""Isolated local display component test, not an API contract or backend integration."""
import copy
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from simple_activity_render_pass import Fixture

BASE=os.environ.get('RP_BASE','http://127.0.0.1:8848')
DATA=json.loads((Path(__file__).resolve().parent.parent/'fixtures/policy-definitions.synthetic.json').read_text())


def main():
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
        context=browser.new_context(service_workers='block');fixture=Fixture()
        context.route('**/api/**',fixture.route)
        page=context.new_page();page.set_default_timeout(10000)
        vue_urls=[]
        page.on('response',lambda r:vue_urls.append(r.url) if '/deps/vue.js' in r.url else None)
        errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto(BASE+'/#/login');expect(page.get_by_placeholder('账号')).to_be_visible()
        assert vue_urls, 'Use the actual observed Vite Vue import, never a guessed runtime URL'
        page.evaluate('''async vueUrl=>{
          const Vue=await import(vueUrl);
          const component=await import('/src/views/srvf/workbench/publish-review/policy-rules.vue');
          const root=document.querySelector('#app');const host=document.createElement('main');
          host.id='policy-component-test';document.body.append(host);root.style.display='none';
          const appContext=root.__vue_app__._context;
          window.__renderPolicy=async props=>{const node=Vue.h(component.default,props);node.appContext=appContext;Vue.render(node,host);await Vue.nextTick()};
        }''',vue_urls[0])
        def show(kind,definition):
            page.evaluate('props=>window.__renderPolicy(props)',{'kind':kind,'definition':definition})
        show('time',DATA['time'])
        panel=page.get_by_test_id('time-policy-rules')
        for text in ['默认时长分类','身份分类映射','准备时段','值勤时段','路途时段','按 60 秒向下取整',
                     '签到签退记录、服务时段、附件','需要人工认定','调整原因','调整证据']:
            expect(panel.get_by_text(text,exact=True)).to_be_visible()
        show('contribution',DATA['contribution']);panel=page.get_by_test_id('contribution-policy-rules')
        for text in ['默认结果','考勤身份 volunteer','考勤身份 support','不超过 3600 秒（含上限）',
                     '超过 3600 秒，且不超过 7200 秒（含上限）','超过 7200 秒，无上限','1.25','3.00','5.00','8.00',
                     'service_final_band','training_band','organization_band']:
            expect(panel.get_by_text(text,exact=True)).to_be_visible()
        page.set_viewport_size({'width':390,'height':844})
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
        bad=copy.deepcopy(DATA['time']);bad['unknownRule']={'multiplier':99}
        show('time',bad)
        expect(page.get_by_text('政策规则未完整展示，不能据此通过审核',exact=True)).to_be_visible()
        expect(page.get_by_text('默认时长分类',exact=True)).to_have_count(0)
        assert not errors,errors
        assert not fixture.unexpected,fixture.unexpected
        print('PASS synthetic component: complete time/contribution rules, exact boundaries/points, 390px and unknown-field refusal; no endpoint integration')
        browser.close()


if __name__=='__main__':main()
