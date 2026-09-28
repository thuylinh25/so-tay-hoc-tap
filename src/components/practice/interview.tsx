'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { MessagesSquare, RotateCcw, Timer } from 'lucide-react';
import { inScope, scopeLabel, shuffle, sourceHref, useQa, type QaItem } from '@/lib/qa';
import { recordAnswer, saveSession, useLearning } from '@/lib/store';
import { PageHeader, ProgressBar, timeAgo } from '../ui';
import { AnswerBody, Btn, QaGate, QuestionText, ScopeSelect, Segmented, SourceLink } from './common';

type Grade = 'good' | 'partial' | 'miss';
const GRADES: { g: Grade; label: string; ink: string; tone: string }[] = [
  { g: 'good', label: 'Trả lời tốt', ink: 'text-success', tone: 'border-success/40 text-success hover:bg-success-soft' },
  { g: 'partial', label: 'Tạm được', ink: 'text-warn', tone: 'border-warn/40 text-warn hover:bg-warn-soft' },
  { g: 'miss', label: 'Chưa được', ink: 'text-danger', tone: 'border-danger/40 text-danger hover:bg-danger-soft' },
];

interface Turn {
  item: QaItem;
  draft: string;
  grade: Grade | null;
}

export function Interview() {
  const items = useQa();
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-8">
      <PageHeader eyebrow="Ôn tập" title="Luyện phỏng vấn">
        Đọc câu hỏi, tự trả lời (nói to hoặc gõ ra), rồi so với đáp án mẫu trong tài liệu và tự chấm. Câu “Tạm được” và “Chưa được” sẽ vào Flashcards.
      </PageHeader>
      <QaGate items={items}>{(all) => <Session all={all} />}</QaGate>
    </div>
  );
}

function Session({ all }: { all: QaItem[] }) {
  const s = useLearning();
  const [scope, setScope] = useState('all');
  const [size, setSize] = useState(10);
  const [limit, setLimit] = useState(0);
  const [turns, setTurns] = useState<Turn[] | null>(null);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [left, setLeft] = useState(0);

  const pool = useMemo(() => all.filter((i) => inScope(i, scope)), [all, scope]);

  function start() {
    setTurns(shuffle(pool).slice(0, size).map((item) => ({ item, draft: '', grade: null })));
    setIndex(0);
    setRevealed(false);
    setLeft(limit);
  }

  const finished = turns !== null && index >= turns.length;
  const turn = turns && !finished ? turns[index] : null;

  // Đếm ngược; hết giờ thì tự hiện đáp án.
  useEffect(() => {
    if (!turn || revealed || !limit) return;
    if (left <= 0) {
      setRevealed(true);
      return;
    }
    const t = setTimeout(() => setLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [turn, revealed, limit, left]);

  function setDraft(draft: string) {
    setTurns((ts) => ts && ts.map((t, i) => (i === index ? { ...t, draft } : t)));
  }

  function grade(g: Grade) {
    if (!turns || !turn) return;
    recordAnswer(turn.item.id, g === 'good');
    const next = turns.map((t, i) => (i === index ? { ...t, grade: g } : t));
    setTurns(next);
    if (index === turns.length - 1) saveSession({ kind: 'interview', scope, total: next.length, right: next.filter((t) => t.grade === 'good').length });
    setIndex(index + 1);
    setRevealed(false);
    setLeft(limit);
  }

  if (!turns) {
    const recent = s.sessions.filter((x) => x.kind === 'interview').slice(-5).reverse();
    return (
      <div className="flex flex-col gap-6">
        <ScopeSelect items={all} value={scope} onChange={setScope} />
        <div className="flex flex-wrap gap-6">
          <Segmented label="Số câu" value={size} onChange={setSize} options={[10, 20, 30].map((n) => ({ value: n, label: String(n) }))} />
          <Segmented
            label="Thời gian mỗi câu"
            value={limit}
            onChange={setLimit}
            options={[
              { value: 0, label: 'Không giới hạn' },
              { value: 60, label: '1 phút' },
              { value: 120, label: '2 phút' },
            ]}
          />
        </div>
        <Btn tone="primary" onClick={start} disabled={!pool.length} className="self-start">
          <MessagesSquare className="size-4" aria-hidden /> Bắt đầu {Math.min(size, pool.length)} câu
        </Btn>
        {recent.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="eyebrow">Buổi luyện gần đây</h2>
            <ul className="flex flex-col divide-y divide-line rounded-lg border border-line bg-surface text-sm">
              {recent.map((r) => (
                <li key={r.at} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="flex-1">{scopeLabel(r.scope)}</span>
                  <span className="tabular font-medium">
                    {r.right}/{r.total} tốt
                  </span>
                  <span className="w-28 text-right text-xs text-muted">{timeAgo(r.at)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    );
  }

  if (finished) {
    const count = (g: Grade) => turns.filter((t) => t.grade === g).length;
    const review = turns.filter((t) => t.grade !== 'good');
    return (
      <div className="flex flex-col gap-6">
        <section className="flex flex-col items-center gap-3 rounded-lg border border-line bg-surface px-6 py-8 text-center">
          <span className="eyebrow">{scopeLabel(scope)}</span>
          <div className="flex gap-6">
            {GRADES.map((x) => (
              <div key={x.g} className="flex flex-col">
                <span className={`font-display text-3xl font-bold tabular ${x.ink}`}>{count(x.g)}</span>
                <span className="text-xs text-muted">{x.label}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Btn tone="primary" onClick={start}>
              <RotateCcw className="size-4" aria-hidden /> Buổi mới
            </Btn>
            <Btn onClick={() => setTurns(null)}>Đổi phạm vi</Btn>
          </div>
        </section>
        {review.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="eyebrow">Cần luyện thêm ({review.length}), đã thêm vào Flashcards</h2>
            <ul className="flex flex-col divide-y divide-line rounded-lg border border-line bg-surface text-sm">
              {review.map((t) => (
                <li key={t.item.id} className="flex items-center gap-3 px-4 py-3">
                  <span className={`size-2 shrink-0 rounded-full ${t.grade === 'partial' ? 'bg-warn' : 'bg-danger'}`} aria-hidden />
                  <Link href={sourceHref(t.item)} className="flex-1 hover:text-accent">
                    {t.item.q}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    );
  }

  const t = turn!;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 text-xs text-muted">
        <ProgressBar value={Math.round((index / turns.length) * 100)} className="flex-1" />
        <span className="tabular">
          Câu {index + 1}/{turns.length}
        </span>
        <button type="button" onClick={() => setTurns(null)} className="underline-offset-2 hover:text-ink hover:underline">
          Dừng
        </button>
      </div>

      <article className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-5 shadow-(--shadow) sm:p-7">
        <div className="flex items-center justify-between gap-2">
          <span className="eyebrow">{t.item.group ?? scopeLabel(`doc:${t.item.doc}`)}</span>
          {limit > 0 && !revealed && (
            <span className={`inline-flex items-center gap-1 text-sm tabular ${left <= 10 ? 'text-danger' : 'text-muted'}`}>
              <Timer className="size-4" aria-hidden />
              {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}
            </span>
          )}
        </div>
        <QuestionText item={t.item} />
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted">Nháp câu trả lời (không bắt buộc)</span>
          <textarea
            value={t.draft}
            onChange={(e) => setDraft(e.target.value)}
            readOnly={revealed}
            rows={4}
            className="resize-y rounded-md border border-line bg-bg px-3 py-2 text-sm"
            placeholder="Gõ ý chính bạn sẽ trả lời…"
          />
        </label>
        {!revealed ? (
          <Btn onClick={() => setRevealed(true)} className="self-start">
            Xem đáp án mẫu
          </Btn>
        ) : (
          <div className="flex flex-col gap-3 border-t border-line pt-4">
            <span className="eyebrow">Đáp án mẫu</span>
            <AnswerBody item={t.item} />
            <SourceLink item={t.item} />
          </div>
        )}
      </article>

      {revealed && (
        <div className="grid grid-cols-3 gap-2">
          {GRADES.map((x) => (
            <button key={x.g} type="button" onClick={() => grade(x.g)} className={`rounded-md border bg-surface px-3 py-2.5 text-sm font-medium ${x.tone}`}>
              {x.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
