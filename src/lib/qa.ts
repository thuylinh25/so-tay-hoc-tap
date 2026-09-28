'use client';

// Câu hỏi + đáp án chép nguyên văn từ tài liệu (qa/*.md → public/qa.json lúc build).
// File khá nặng nên chỉ tải khi mở trang ôn tập, rồi giữ trong bộ nhớ.
import { useEffect, useState } from 'react';
import { docs, getDoc, getDomain, getTopic } from './content';

export interface QaItem {
  id: string;
  doc: string;
  topic: string;
  domain: string;
  group: string | null;
  page: string | null;
  anchor: string | null;
  q: string;
  qHtml: string;
  aHtml: string;
  /** Đáp án rút gọn không có code; rỗng nếu không dùng làm phương án trắc nghiệm được. */
  short: string;
}

let cache: Promise<QaItem[]> | null = null;

export function useQa(): QaItem[] | null | 'error' {
  const [items, setItems] = useState<QaItem[] | null | 'error'>(null);
  useEffect(() => {
    cache ??= fetch('/qa.json').then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.json() as Promise<QaItem[]>;
    });
    let alive = true;
    cache.then(
      (v) => alive && setItems(v),
      () => {
        cache = null;
        if (alive) setItems('error');
      },
    );
    return () => {
      alive = false;
    };
  }, []);
  return items;
}

// ---------- phạm vi: all | domain:<id> | topic:<id> | doc:<slug> ----------

export function inScope(item: QaItem, scope: string) {
  if (scope === 'all') return true;
  const [kind, id] = scope.split(':');
  return kind === 'domain' ? item.domain === id : kind === 'topic' ? item.topic === id : item.doc === id;
}

export function scopeLabel(scope: string) {
  if (scope === 'all') return 'Tất cả';
  const [kind, id] = scope.split(':');
  if (kind === 'domain') return getDomain(id)?.title ?? id;
  if (kind === 'topic') return getTopic(id)?.title ?? id;
  return getDoc(id)?.title ?? id;
}

/** Các lựa chọn phạm vi, chỉ gồm những nơi có câu hỏi: lĩnh vực → chủ đề → tài liệu. */
export function scopeOptions(items: QaItem[]) {
  const count = (scope: string) => items.filter((i) => inScope(i, scope)).length;
  const withQa = new Set(items.map((i) => i.doc));
  const domainIds = [...new Set(items.map((i) => i.domain))];
  return domainIds.map((domain) => {
    const domainDocs = docs.filter((d) => d.domain === domain && withQa.has(d.slug));
    const topicIds = [...new Set(domainDocs.map((d) => d.topic))];
    return {
      label: getDomain(domain)?.title ?? domain,
      options: [
        ...(domainDocs.length > 1 ? [{ value: `domain:${domain}`, label: `Cả lĩnh vực`, n: count(`domain:${domain}`) }] : []),
        ...(topicIds.length > 1 ? topicIds.map((t) => ({ value: `topic:${t}`, label: `Chủ đề: ${getTopic(t)?.title ?? t}`, n: count(`topic:${t}`) })) : []),
        ...domainDocs.map((d) => ({ value: `doc:${d.slug}`, label: d.title, n: count(`doc:${d.slug}`) })),
      ],
    };
  });
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * 4 phương án cho một câu: đáp án đúng + 3 đáp án của câu khác, ưu tiên cùng nhóm/tài liệu
 * để phương án nhiễu cùng chủ đề (không tự bịa phương án).
 */
export function choicesFor(item: QaItem, pool: QaItem[]): string[] {
  const usable = pool.filter((p) => p.id !== item.id && p.short && p.short !== item.short);
  const tiers = [
    usable.filter((p) => p.doc === item.doc && p.group === item.group),
    usable.filter((p) => p.doc === item.doc && p.group !== item.group),
    usable.filter((p) => p.doc !== item.doc && p.topic === item.topic),
    usable.filter((p) => p.topic !== item.topic && p.domain === item.domain),
    usable.filter((p) => p.domain !== item.domain),
  ];
  const picked = new Set<string>();
  for (const tier of tiers) {
    for (const p of shuffle(tier)) {
      if (picked.size >= 3) break;
      picked.add(p.short);
    }
  }
  return shuffle([item.short, ...picked]);
}

export const sourceHref = (item: QaItem) => `/learn/${item.doc}${item.anchor ? `#${item.anchor}` : ''}`;

export function sourceLabel(item: QaItem) {
  const doc = getDoc(item.doc);
  return [doc?.title ?? item.doc, item.page ? `trang ${item.page}` : null].filter(Boolean).join(' · ');
}
