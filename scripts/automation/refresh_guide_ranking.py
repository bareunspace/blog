#!/usr/bin/env python3
"""Refresh Bareunjari guide rankings from recent performance data.

Weekly automation:
- category carousels: booking clicks -> booking rate -> 28d GSC/GA4 -> 7d trend
- global homepage block: existing GSC performance endpoint
- conservative category reordering prevents churn from weak short-term signals
"""
import json, re, sys, urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
CONFIG_PATH=ROOT/"_config.yml"
DATA_PATH=ROOT/"_data"/"blog_guide_priority.yml"
MARKER="# Full ranking by cumulative Google Search Console clicks"
GLOBAL_DAYS=90
CATEGORIES=["면접준비","시험·응시","연습·리허설","스터디룸","미팅·상담","프라이빗시간","시간·공간"]
EXAM_URLS={
"/posts/online-aptitude-test-space/","/posts/online-coding-test-place/",
"/posts/ai-competency-test-space/","/posts/toefl-home-edition-space/",
"/posts/duolingo-english-test-space/","/posts/online-exam-home-setup/"}

def config(key):
    s=CONFIG_PATH.read_text(encoding="utf-8")
    m=re.search(rf'^{re.escape(key)}:\s*"?([^"\n]+)"?\s*$',s,re.M)
    if not m: raise RuntimeError(f"{key} not found")
    return m.group(1).strip()

def get_json(url,key):
    req=urllib.request.Request(url,headers={"apikey":key,"Authorization":f"Bearer {key}"})
    with urllib.request.urlopen(req,timeout=30) as r:
        return json.loads(r.read().decode())

def fetch_snapshot(base,key):
    url=base+"/rest/v1/guide_post_performance_public?select=*"
    rows=get_json(url,key)
    return {r["url"]:r for r in rows}

def fetch_global(base,key):
    p=get_json(f"{base}/functions/v1/guide-post-performance?days={GLOBAL_DAYS}",key)
    if not p.get("ok"): raise RuntimeError(str(p))
    return p["rows"]

def post_groups():
    out={c:[] for c in CATEGORIES}
    for p in (ROOT/"_posts").glob("*.md"):
        s=p.read_text(encoding="utf-8",errors="ignore")
        parts=s.split("---",2)
        if len(parts)<3: continue
        h=parts[1]
        cm=re.search(r'^category:\s*["\']?([^"\'\n]+)',h,re.M)
        pm=re.search(r'^permalink:\s*(\S+)',h,re.M)
        slug=re.sub(r'^\d{4}-\d{2}-\d{2}-',"",p.stem)
        url=pm.group(1).strip() if pm else f"/posts/{slug}/"
        cat=cm.group(1).strip() if cm else ""
        if url in EXAM_URLS: out["시험·응시"].append(url)
        elif cat in out and cat!="시험·응시": out[cat].append(url)
    return out

def current_category(text,cat):
    m=re.search(rf'^"{re.escape(cat)}":\n((?:  - /posts/.*\n)*)',text,re.M)
    return re.findall(r'^  - (\S+)',m.group(1),re.M) if m else []

def metrics(snapshot,url):
    r=snapshot.get(url,{})
    sessions=max(int(r.get("ga4_sessions_28",0)),0)
    clicks=int(r.get("booking_clicks_28",0))
    return {
      "b":clicks,"br":clicks/sessions if sessions>=5 else 0,
      "g":int(r.get("gsc_clicks_28",0)),"s":sessions,
      "i":int(r.get("gsc_impressions_28",0)),
      "g7":int(r.get("gsc_clicks_7",0)),
      "b7":int(r.get("booking_clicks_7",0)),
      "s7":int(r.get("ga4_sessions_7",0)),
    }

def should_pass(challenger,incumbent,snapshot):
    c,i=metrics(snapshot,challenger),metrics(snapshot,incumbent)
    if c["b"]!=i["b"]: return c["b"]>i["b"]
    if c["br"] and i["br"] and c["br"]>=i["br"]+0.05: return True
    if c["g"]>=i["g"]+2 and (i["g"]==0 or c["g"]>=i["g"]*1.25): return True
    if c["g"]>=i["g"] and c["g7"]>=i["g7"]+2 and c["b7"]>=i["b7"]: return True
    if c["g"]==i["g"] and c["s"]>=i["s"]+3 and (i["s"]==0 or c["s"]>=i["s"]*1.25): return True
    if c["g"]==i["g"] and c["s"]==i["s"] and c["i"]>=i["i"]+20 and c["i"]>=i["i"]*1.5: return True
    return False

def rank_category(current,universe,snapshot):
    ordered=[u for u in current if u in universe]
    ordered+=sorted(set(universe)-set(ordered))
    changed=True
    while changed:
        changed=False
        for n in range(1,len(ordered)):
            if should_pass(ordered[n],ordered[n-1],snapshot):
                ordered[n-1],ordered[n]=ordered[n],ordered[n-1]
                changed=True
    return ordered

def replace_category(text,cat,rows):
    pat=rf'^"{re.escape(cat)}":\n(?:  - /posts/.*\n)*'
    block=f'"{cat}":\n'+"".join(f"  - {u}\n" for u in rows)
    return re.sub(pat,block,text,flags=re.M)

def redirect_stubs():
    d={}
    for p in (ROOT/"posts").glob("*/index.html"):
        s=p.read_text(encoding="utf-8",errors="ignore")
        if 'http-equiv="refresh"' not in s: continue
        a=re.search(r'^permalink:\s*(\S+)\s*$',s,re.M)
        b=re.search(r'http-equiv="refresh"\s+content="0;\s*url=([^"]+)"',s)
        if a and b: d[a.group(1)]=b.group(1)
    return d

def merge_global(rows,stubs):
    totals={}
    for r in rows:
        u=stubs.get(r["url"],r["url"])
        e=totals.setdefault(u,{"url":u,"clicks":0,"impressions":0})
        e["clicks"]+=int(r["clicks"]); e["impressions"]+=int(r["impressions"])
    out=list(totals.values())
    out.sort(key=lambda r:(-r["clicks"],-r["impressions"],r["url"]))
    return out

def render_global(rows,from_date,generated_at):
    lines=[MARKER,"# (ties broken by impressions), across every post site-wide, sourced from",
    f"# Supabase public.gsc_page_daily over a rolling {GLOBAL_DAYS}-day window",
    f"# ({from_date} ~ present as of the last refresh). Used only by index.html's",
    "# single combined \"실전 가이드\" grid on the homepage.",
    "# Auto-generated weekly by scripts/automation/refresh_guide_ranking.py.",
    f"# Last refreshed: {generated_at}",'"_global_by_performance":']
    for r in rows:
        lines += [f"  - url: {r['url']}",f"    clicks: {r['clicks']}",f"    impressions: {r['impressions']}"]
    return "\n".join(lines)+"\n"

def main():
    base,key=config("supabase_url"),config("supabase_anon_key")
    snapshot=fetch_snapshot(base,key)
    if not snapshot:
        print("error: performance snapshot empty",file=sys.stderr); return 1
    text=DATA_PATH.read_text(encoding="utf-8")
    groups=post_groups()
    for cat in CATEGORIES:
        text=replace_category(text,cat,rank_category(current_category(text,cat),groups[cat],snapshot))
    rows=merge_global(fetch_global(base,key),redirect_stubs())
    if not rows:
        print("error: global performance empty",file=sys.stderr); return 1
    idx=text.find(MARKER)
    if idx<0:
        print("error: global marker missing",file=sys.stderr); return 1
    now=datetime.now(timezone.utc)
    block=render_global(rows,(now.date()-timedelta(days=GLOBAL_DAYS)).isoformat(),now.strftime("%Y-%m-%d"))
    new=text[:idx]+block
    if new==DATA_PATH.read_text(encoding="utf-8"):
        print("Guide ranking unchanged."); return 0
    DATA_PATH.write_text(new,encoding="utf-8")
    print("Updated category and global guide rankings.")
    return 0

if __name__=="__main__":
    raise SystemExit(main())
