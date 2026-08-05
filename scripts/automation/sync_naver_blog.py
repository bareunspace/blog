#!/usr/bin/env python3
import argparse
import html
import json
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime
from pathlib import Path
from urllib.error import HTTPError, URLError


def strip_html(value: str) -> str:
    text = re.sub(r"<[^>]+>", " ", value or "")
    text = html.unescape(text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def extract_image_url(value: str) -> str:
    matches = re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', value or "", flags=re.IGNORECASE)
    if not matches:
        return ""

    preferred = next((url for url in matches if "pstatic.net" in url.lower()), matches[0])
    return html.unescape(preferred).strip()


def yaml_quote(value: str) -> str:
    return json.dumps(value or "", ensure_ascii=False)


def extract_blog_id(blog_url: str) -> str:
    m = re.search(r"blog\.naver\.com/([^/?#]+)", blog_url)
    if not m:
        raise ValueError("blog_url must be like https://blog.naver.com/<blogId>")
    return m.group(1)


def read_existing_meta(output_path: Path) -> tuple[str, str]:
    default_name = "바른자리 네이버 블로그"
    default_url = "https://blog.naver.com/bareunjari114"
    if not output_path.exists():
        return default_name, default_url

    content = output_path.read_text(encoding="utf-8")
    name_match = re.search(r"^blog_name:\s*(.+)$", content, flags=re.MULTILINE)
    url_match = re.search(r"^blog_url:\s*(.+)$", content, flags=re.MULTILINE)

    blog_name = name_match.group(1).strip() if name_match else default_name
    blog_url = url_match.group(1).strip() if url_match else default_url
    return blog_name, blog_url


def fetch_rss(rss_url: str) -> bytes:
    headers = [
        {
            "User-Agent": "Mozilla/5.0 (compatible; BareunJariRSSSync/1.0)",
            "Accept": "application/rss+xml, application/xml;q=0.9, */*;q=0.8",
            "Referer": "https://blog.naver.com/",
            "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
        },
        {
            "User-Agent": "Mozilla/5.0",
            "Accept": "application/rss+xml, application/xml;q=0.9, */*;q=0.8",
            "Referer": "https://blog.naver.com/",
            "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
        },
        {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
            "Accept": "application/xml, text/xml;q=0.9, */*;q=0.8",
            "Referer": "https://blog.naver.com/",
            "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
        },
    ]

    last_error: Exception | None = None
    for header_set in headers:
        req = urllib.request.Request(rss_url, headers=header_set)
        try:
            with urllib.request.urlopen(req, timeout=25) as res:
                return res.read()
        except (HTTPError, URLError, TimeoutError) as exc:
            last_error = exc
            continue

    if last_error is not None:
        raise last_error
    raise RuntimeError("Failed to fetch RSS feed")


def parse_items(xml_bytes: bytes) -> list[dict[str, str]]:
    try:
        root = ET.fromstring(xml_bytes)
    except ET.ParseError:
        root = None

    if root is None:
        return []

    channel = root.find("channel")
    if channel is None:
        channel = root

    posts: list[dict[str, str]] = []
    items = [elem for elem in channel.iter() if elem.tag.endswith("item")]
    for item in items:
        title = (item.findtext("title") or item.findtext("{*}title") or "").strip()
        guid = (item.findtext("guid") or item.findtext("link") or item.findtext("{*}guid") or item.findtext("{*}link") or "").strip()
        category = (item.findtext("category") or item.findtext("{*}category") or "블로그").strip()
        pub_date = (item.findtext("pubDate") or item.findtext("{*}pubDate") or "").strip()
        desc = (item.findtext("description") or item.findtext("{*}description") or "").strip()

        if not title or not guid:
            continue

        try:
            date_value = parsedate_to_datetime(pub_date).date().isoformat()
        except Exception:
            date_value = ""

        summary_raw = strip_html(desc)
        summary = summary_raw[:180].rstrip()
        if len(summary_raw) > 180:
            summary += "..."
        image_url = extract_image_url(desc)

        posts.append(
            {
                "title": title,
                "url": guid,
                "date": date_value,
                "category": category or "블로그",
                "summary": summary or "네이버 블로그 글 원문을 확인해 주세요.",
                "image_url": image_url,
            }
        )

    return posts


def render_yaml(blog_name: str, blog_url: str, posts: list[dict[str, str]]) -> str:
    lines = [
        f"blog_name: {blog_name}",
        f"blog_url: {blog_url}",
        "posts:",
    ]

    if not posts:
        lines.extend(
            [
                "  - title: \"최근 글이 없습니다\"",
                f"    url: {blog_url}",
                "    date: \"\"",
                "    category: 블로그",
                "    summary: \"RSS에서 글을 찾지 못했습니다. 블로그 주소와 RSS 공개 설정을 확인해 주세요.\"",
            ]
        )
        return "\n".join(lines) + "\n"

    for post in posts:
        lines.extend(
            [
                f"  - title: {yaml_quote(post['title'])}",
                f"    url: {post['url']}",
                f"    date: {post['date']}",
                f"    category: {post['category']}",
                f"    summary: {yaml_quote(post['summary'])}",
                f"    image_url: {yaml_quote(post.get('image_url', ''))}",
            ]
        )

    return "\n".join(lines) + "\n"


def fetch_blog_html(blog_url: str) -> str:
    req = urllib.request.Request(
        blog_url,
        headers={
            "User-Agent": "Mozilla/5.0",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
    )
    with urllib.request.urlopen(req, timeout=20) as res:
        return res.read().decode("utf-8", errors="ignore")


def extract_posts_from_html(html_text: str) -> list[dict[str, str]]:
    posts: list[dict[str, str]] = []
    for match in re.finditer(r'https://blog\.naver\.com/[^\s"\'>]+/\d+', html_text):
        url = match.group(0)
        if url.endswith("/"):
            url = url[:-1]
        if not url.startswith("https://blog.naver.com/"):
            continue
        if any(existing["url"] == url for existing in posts):
            continue
        title = "네이버 블로그 글"
        posts.append({"title": title, "url": url, "date": "", "category": "블로그", "summary": "네이버 블로그에서 최신 글을 확인해 주세요.", "image_url": ""})
        if len(posts) >= 8:
            break
    return posts


def main() -> int:
    parser = argparse.ArgumentParser(description="Sync Naver Blog RSS into _data/naver_blog.yml")
    parser.add_argument("--output", default="_data/naver_blog.yml", help="Output YAML path")
    parser.add_argument("--blog-id", default="", help="Naver blog id, e.g. bareunjari114")
    parser.add_argument("--blog-url", default="", help="Naver blog URL, e.g. https://blog.naver.com/bareunjari114")
    parser.add_argument("--blog-name", default="", help="Display name for the blog")
    args = parser.parse_args()

    output_path = Path(args.output)
    existing_name, existing_url = read_existing_meta(output_path)

    blog_name = args.blog_name or existing_name
    blog_url = args.blog_url or existing_url
    blog_id = args.blog_id or extract_blog_id(blog_url)
    rss_url = f"https://rss.blog.naver.com/{blog_id}.xml"

    try:
        xml_bytes = fetch_rss(rss_url)
        posts = parse_items(xml_bytes)
    except Exception as exc:
        try:
            html_text = fetch_blog_html(blog_url)
            posts = extract_posts_from_html(html_text)
        except Exception as fallback_exc:
            print(f"[ERROR] Failed to sync RSS: {exc}", file=sys.stderr)
            print(f"[ERROR] Fallback HTML sync failed: {fallback_exc}", file=sys.stderr)
            return 1

    if not posts:
        posts = extract_posts_from_html(fetch_blog_html(blog_url))

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(render_yaml(blog_name, blog_url, posts), encoding="utf-8")

    print(f"[OK] Synced {len(posts)} posts from {rss_url} to {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
