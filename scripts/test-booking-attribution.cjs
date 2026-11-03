const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=readFileSync(process.env.BOOKING_ATTRIBUTION_SCRIPT || require('node:path').join(__dirname, 'booking-attribution.js'),'utf8');
const origin='https://bareunjari.com';
function run(path,search,links,storage=new Map(),blocked=false,analytics=true){
 const events=[],timers=[];
 for(const l of links){l.attrs={...l};l.handlers={};l.getAttribute=k=>l.attrs[k]||null;l.setAttribute=(k,v)=>l.attrs[k]=v;l.removeAttribute=k=>delete l.attrs[k];l.addEventListener=(k,f)=>l.handlers[k]=f;Object.defineProperty(l,'href',{get(){return new URL(l.attrs.href,origin).href}});l.textContent='빈 시간 확인';}
 const window={location:{origin,pathname:path,search,href:origin+path+search},sessionStorage:{getItem:k=>{if(blocked)throw Error();return storage.get(k)},setItem:(k,v)=>{if(blocked)throw Error();storage.set(k,v)},removeItem:k=>storage.delete(k)},setTimeout:f=>timers.push(f),clarity:()=>{}};
 if(analytics)window.gtag=(type,name,payload)=>events.push({name,payload});
 const document={body:{getAttribute:()=>''},referrer:'',querySelector:()=>null,querySelectorAll:()=>links,addEventListener:(name,fn)=>fn()};
 vm.runInNewContext(source,{window,document,URL,URLSearchParams});
 return {links,events,window,storage,click(i=0,extra={}){let prevented=false;const type=extra.type||'click';links[i].handlers[type]({type,button:0,preventDefault(){prevented=true},...extra});timers.forEach(f=>f());return prevented}};
}
const path='/posts/online-exam-home-setup/';
let a=run(path,'',[{href:'/booking/?purpose=exam&source=online-exam-home-setup-image&utm_content=keep','data-cta':'online_exam_setup_image_booking'}]);
let u=new URL(a.links[0].href);assert.equal(u.searchParams.get('utm_content'),'keep');assert.equal(u.searchParams.get('source'),path);assert.equal(u.searchParams.get('entry_source'),'online-exam-home-setup-image');assert.equal(u.searchParams.get('purpose'),'exam');assert.equal(u.searchParams.get('cta'),'online_exam_setup_image_booking');assert.equal(u.searchParams.get('last'),path);assert.equal(a.click(),true);assert.equal(a.events[0].name,'booking_intent');assert.equal(a.events[0].payload.cta_position,'online_exam_setup_image_booking');assert.equal(new URL(a.window.location.href,origin).search,u.search);
let b=run('/booking/',u.search,[{href:'https://booking.naver.com/booking/10/bizes/1663159/items/7861240?lang=ko','data-cta':'booking_hourly'}],new Map());b.click();assert.equal(b.events[0].name,'naver_booking_click');assert.equal(b.events[0].payload.entry_cta_position,'online_exam_setup_image_booking');assert.equal(b.events[0].payload.first_touch_path,path);assert.equal(b.events[0].payload.purpose,'exam');assert.equal(b.events[0].payload.source_path,path);assert.equal(b.events[0].payload.entry_source,'online-exam-home-setup-image');assert.equal(b.window.location.href,'https://booking.naver.com/booking/10/bizes/1663159/items/7861240?lang=ko');
let c=run(path,'',[{href:'/booking/?purpose=exam&source=online-exam-home-setup','data-cta':'bottom'}]);assert.equal(c.click(0,{ctrlKey:true}),false);assert.equal(c.events.length,1);assert.equal(c.events[0].name,'booking_intent');assert.equal(c.events[0].payload.event_callback,undefined);assert.equal(c.window.location.href,origin+path);assert.ok(c.links[0].href.includes('cta=bottom'));
let d=run(path,'',[{href:'/booking/?purpose=exam&source=online-exam-home-setup','data-cta':'bottom'}],new Map(),true,false);d.click();assert.ok(d.window.location.href.startsWith('/booking/'));
const first='/posts/online-aptitude-test-space/';let e=run(first,'',[{href:'/booking/?purpose=exam','data-cta':'quick'}]);let f=run(path,'',[{href:'/booking/?purpose=exam','data-cta':'bottom'}],e.storage);f.click();assert.equal(f.events[0].payload.first_touch_path,first);assert.equal(f.events[0].payload.assist_path,path);assert.equal(f.events[0].payload.last_touch_path,path);
for(const file of ['_posts/2026-08-13-online-exam-home-setup.md','_posts/2026-10-08-online-aptitude-test-space.md']){const text=readFileSync(file,'utf8');const anchors=[...text.matchAll(/<a\b[^>]*href="\/booking\/[^\"]*"[^>]*>/g)];assert.equal(anchors.length,file.includes('aptitude')?4:3);for(const [tag] of anchors){assert.ok(tag.includes('purpose=exam'));assert.ok(tag.includes('source='));assert.ok(tag.includes('data-cta='));}assert.ok(!text.includes('https://m.place.naver.com/place/2041312316/ticket'));}
let g=run(path,'',[{href:'https://m.place.naver.com/place/2041312316/ticket','data-booking-purpose':'exam','data-cta':'legacy'}]);assert.equal(new URL(g.links[0].href).pathname,'/booking/');
let h=run('/admin/','',[{href:'/booking/'}]);assert.equal(h.links[0].handlers.click,undefined);
console.log('PASS: source/extra parameters, purpose, CTA, first/assist/last, new-tab, storage/analytics fallback, Naver Korean destination, 7 article CTAs, legacy links and admin exclusion');

// Storage-denied browsers must use all sanitized URL touch paths, even on legacy source labels.
const query = '?purpose=exam&source=legacy-label&first=%2Fposts%2Ffirst%2F&assist=%2Fposts%2Fassist%2F&last=%2Fposts%2Flast%2F';
const naver = 'https://m.place.naver.com/place/2041312316/ticket';
let blocked = run('/booking/', query, [{href:naver}], new Map(), true);
blocked.click();
assert.equal(blocked.events[0].payload.first_touch_path, '/posts/first/');
assert.equal(blocked.events[0].payload.assist_path, '/posts/assist/');
assert.equal(blocked.events[0].payload.last_touch_path, '/posts/last/');
for (const modified of [{ctrlKey:true}, {metaKey:true}, {shiftKey:true}, {altKey:true}, {type:'auxclick',button:1}]) {
 for (const outbound of [false,true]) {
  const x = outbound ? run('/booking/', query, [{href:naver}], new Map(), true)
    : run(path, '', [{href:'/booking/?purpose=exam&source=label','data-cta':'bottom'}]);
  const before = x.window.location.href;
  assert.equal(x.click(0,modified), false);
  assert.equal(x.events.length, 1);
  assert.equal(x.events[0].name, outbound ? 'naver_booking_click' : 'booking_intent');
  assert.equal(x.events[0].payload.event_callback, undefined);
  assert.equal(x.window.location.href, before);
 }
}
let right = run(path, '', [{href:'/booking/'}]);
assert.equal(right.click(0,{type:'auxclick',button:2}),false);
assert.equal(right.events.length,0);
let excluded = run('/booking/', '?source=%2Fposts%2Fvalid%2F&first=%2Fadmin%2F&assist=%2Fadmin%2F&last=%2Fadmin%2F', [{href:naver}], new Map(), true);
excluded.click();
assert.equal(excluded.events[0].payload.first_touch_path, '/posts/valid/');
assert.equal(excluded.events[0].payload.assist_path, '');
assert.equal(excluded.events[0].payload.last_touch_path, '/posts/valid/');
console.log('PASS: blocked-storage query fallback, Ctrl/Cmd/Shift/Alt/middle-click event delivery without redirects, right-click exclusion, and sanitized admin fallbacks');
