import { writeFile } from 'node:fs/promises';

const BLOG_RSS_URL = process.env.BLOG_RSS_URL || 'https://rss.blog.naver.com/bareunjari114.xml';
const REVIEW_FEED_URL = process.env.REVIEW_FEED_URL || '';
const OUTPUT_PATH = process.env.OUTPUT_PATH || 'data/gallery.auto.json';
const BLOG_LIMIT = Number(process.env.BLOG_LIMIT || 24);
const REVIEW_LIMIT = Number(process.env.REVIEW_LIMIT || 24);

const fetchJson = async (url, timeoutMs = 15000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'bareunjari-gallery-updater/1.0' } });
    if (!response.ok) {
      throw new Error(`Request failed (${response.status}) for ${url}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
};

const fetchText = async (url, timeoutMs = 15000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'bareunjari-gallery-updater/1.0' } });
    if (!response.ok) {
      throw new Error(`Request failed (${response.status}) for ${url}`);
    }
    return await response.text();
  } finally {
    clearTimeout(timeoutId);
  }
};

const sanitizeUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return '';
  }

  try {
    const normalized = rawUrl.replaceAll('&amp;', '&').trim();
    const parsed = new URL(normalized);
    if (!/^https?:$/i.test(parsed.protocol)) {
      return '';
    }
    return parsed.href;
  } catch {
    return '';
  }
};

const toPreferredNaverImage = (rawUrl) => {
  const safeUrl = sanitizeUrl(rawUrl);
  if (!safeUrl) {
    return '';
  }

  try {
    const parsed = new URL(safeUrl);
    const host = parsed.hostname.toLowerCase();
    const isNaverPstatic = /(^|\.)pstatic\.net$/.test(host);
    const isNaverImageHost = /(^|\.)(blogthumb|blogfiles|postfiles)\.pstatic\.net$/.test(host);

    if (!isNaverPstatic || !isNaverImageHost) {
      return safeUrl;
    }

    parsed.hostname = 'postfiles.pstatic.net';
    parsed.search = '?type=w773';
    return parsed.href;
  } catch {
    return safeUrl;
  }
};

const decodeHtmlEntities = (text) => {
  return String(text || '')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'");
};

const stripCdata = (text) => {
  return String(text || '').replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim();
};

const getTagValue = (xmlChunk, tagName) => {
  const match = xmlChunk.match(new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
  return match?.[1] ? decodeHtmlEntities(stripCdata(match[1])) : '';
};

const extractImageFromDescription = (description) => {
  const html = decodeHtmlEntities(description || '');
  const candidates = [
    ...html.matchAll(/<(?:img|source)[^>]+(?:src|data-src|data-lazy-src|data-original)=["']([^"']+)["']/gi)
  ].map((match) => sanitizeUrl(match[1] || ''));

  const preferred = candidates.find((url) => {
    if (!url) {
      return false;
    }
    try {
      return /(^|\.)(blogthumb|blogfiles|postfiles)\.pstatic\.net$/i.test(new URL(url).hostname);
    } catch {
      return false;
    }
  });
  return preferred || candidates.find(Boolean) || '';
};

const parseRssItems = (xmlText) => {
  const itemChunks = [...String(xmlText || '').matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((m) => m[1]);

  return itemChunks.map((chunk) => {
    const title = getTagValue(chunk, 'title');
    const link = getTagValue(chunk, 'link');
    const description = getTagValue(chunk, 'description');
    const enclosureUrl = chunk.match(/<enclosure[^>]+url=["']([^"']+)["']/i)?.[1] || '';
    const mediaThumb = chunk.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i)?.[1] || '';
    const mediaContent = chunk.match(/<media:content[^>]+url=["']([^"']+)["']/i)?.[1] || '';

    return {
      title,
      link,
      imageUrl: extractImageFromDescription(description) || sanitizeUrl(enclosureUrl) || sanitizeUrl(mediaThumb) || sanitizeUrl(mediaContent)
    };
  });
};

const getBlogItems = async () => {
  const rssXml = await fetchText(BLOG_RSS_URL);
  const items = parseRssItems(rssXml);

  return items.slice(0, BLOG_LIMIT).map((item) => {
    const imageUrl = toPreferredNaverImage(item.imageUrl || '');
    return {
      imageUrl,
      title: (item?.title || '네이버 블로그 이미지').trim(),
      source: 'blog',
      link: sanitizeUrl(item?.link || '')
    };
  }).filter((item) => item.imageUrl);
};

const getReviewItems = async () => {
  if (!REVIEW_FEED_URL) {
    return [];
  }

  const payload = await fetchJson(REVIEW_FEED_URL);
  const list = Array.isArray(payload) ? payload : (Array.isArray(payload?.items) ? payload.items : []);

  return list.slice(0, REVIEW_LIMIT).map((item) => {
    const imageUrl = sanitizeUrl(
      item?.imageUrl || item?.image || item?.photoUrl || item?.photo || item?.thumbnail || ''
    );
    return {
      imageUrl,
      title: String(item?.title || item?.alt || '네이버 고객 후기 이미지').trim(),
      source: 'review',
      link: sanitizeUrl(item?.link || item?.url || '')
    };
  }).filter((item) => item.imageUrl);
};

const dedupeByImage = (items) => {
  const seen = new Set();
  const output = [];

  for (const item of items) {
    if (seen.has(item.imageUrl)) {
      continue;
    }
    seen.add(item.imageUrl);
    output.push(item);
  }

  return output;
};

const run = async () => {
  const [blogItems, reviewItems] = await Promise.all([
    getBlogItems().catch(() => []),
    getReviewItems().catch(() => [])
  ]);

  const items = dedupeByImage([...blogItems, ...reviewItems]);
  const payload = {
    updatedAt: new Date().toISOString(),
    counts: {
      total: items.length,
      blog: blogItems.length,
      review: reviewItems.length
    },
    items
  };

  await writeFile(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`Updated ${OUTPUT_PATH} with ${items.length} items.`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
