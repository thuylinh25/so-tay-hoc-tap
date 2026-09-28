'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, GraduationCap, RotateCcw, X } from 'lucide-react';
import { choicesFor, inScope, scopeLabel, shuffle, sourceHref, useQa, type QaItem } from '@/lib/qa';
import { recordAnswer, saveSession, useLearning } from '@/lib/store';
import { PageHeader, ProgressBar, timeAgo } from '../ui';
import { AnswerBody, Btn, Kbd, QaGate, QuestionText, ScopeSelect, Segmented, SourceLink } from './common';

interface Question {
  item: QaItem;
  choices: string[];
  picked: number | null;
}

const quizable = (i: QaItem) => i.short.length > 0;

export function Quiz() {
  const items = useQa();
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-8">
      <PageHeader eyebrow="Ôn tập" title="Quiz trắc nghiệm">
        Mỗi câu có 4 phương án. Phương án sai là đáp án của các câu khác cùng chủ đề trong tài liệu, không phải nội dung tự bịa. Câu trả lời sai sẽ vào Flashcards để ôn lại.
      </PageHeader>
      <QaGate items={items}>{(all) => <QuizRunner all={all} />}</QaGate>
    </div>
  );
}

function QuizRunner({ all }: { all: QaItem[] }) {
  const s = useLearning();
  const [scope, setScope] = useState('all');
  const [size, setSize] = useState(10);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [index, setIndex] = useState(0);
  const [showWhy, setShowWhy] = useState(false);

  const usable = useMemo(() => all.filter(quizable), [all]);
  const pool = useMemo(() => usable.filter((i) => inScope(i, scope)), [usable, scope]);

  function start() {
    setQuestions(shuffle(pool).slice(0, size).map((item) => ({ item, choices: choicesFor(item, usable), picked: null })));
    setIndex(0);
    setShowWhy(false);
  }

  const finished = questions !== null && index >= questions.length;
  const current = questions && !finished ? questions[index] : null;

  function pick(n: number) {
    if (!current || current.picked !== null || !questions) return;
    const correct = current.choices[n] === current.item.short;
    recordAnswer(current.item.id, correct);
    const next = questions.map((q, i) => (i === index ? { ...q, picked: n } : q));
    setQuestions(next);
    if (index === questions.length - 1) {
      saveSession({ kind: 'quiz', scope, total: next.length, right: next.filter((q) => q.choices[q.picked!] === q.item.short).length });
    }
  }

  function advance() {
    setIndex((i) => i + 1);
    setShowWhy(false);
  }

  useEffect(() => {
    if (!current) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('input,textarea,select')) return;
      if (current.picked === null && /^[1-4]$/.test(e.key)) pick(Number(e.key) - 1);
      else if (current.picked !== null && e.key === 'Enter') advance();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!questions) {
    const recent = s.sessions.filter((x) => x.kind === 'quiz').slice(-5).reverse();
    return (
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <ScopeSelect items={all} value={scope} onChange={setScope} filter={quizable} />
          <Segmented label="Số câu" value={size} onChange={setSize} options={[10, 20, 30].map((n) => ({ value: n, label: String(n) }))} />
        </div>
        <Btn tone="primary" onClick={start} disabled={pool.length < 4} className="self-start">
          <GraduationCap className="size-4" aria-hidden /> Làm {Math.min(size, pool.length)} câu
        </Btn>
        {recent.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="eyebrow">Lần làm gần đây</h2>
            <ul className="flex flex-col divide-y divide-line rounded-lg border border-line bg-surface text-sm">
              {recent.map((r) => (
                <li key={r.at} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="flex-1">{scopeLabel(r.scope)}</span>
                  <span className="tabular font-medium">
                    {r.right}/{r.total}
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

  if (finished) return <Result questions={questions} scope={scope} onRestart={start} onBack={() => setQuestions(null)} />;

  const q = current!;
  const answered = q.picked !== null;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 text-xs text-muted">
        <ProgressBar value={Math.round((index / questions.length) * 100)} className="flex-1" />
        <span className="tabular">
          Câu {index + 1}/{questions.length}
        </span>
        <button type="button" onClick={() => setQuestions(null)} className="underline-offset-2 hover:text-ink hover:underline">
          Dừng
        </button>
      </div>

      <article className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-5 shadow-(--shadow) sm:p-7">
        <span className="eyebrow">{q.item.group ?? scopeLabel(`doc:${q.item.doc}`)}</span>
        <QuestionText item={q.item} />
        <ol className="flex flex-col gap-2">
          {q.choices.map((c, n) => {
            const isRight = c === q.item.short;
            const tone = !answered
              ? 'border-line hover:border-accent hover:bg-accent-soft'
              : isRight
                ? 'border-success bg-success-soft'
                : n === q.picked
                  ? 'border-danger bg-danger-soft'
                  : 'border-line opacity-60';
            return (
              <li key={n}>
                <button
                  type="button"
                  disabled={answered}
                  onClick={() => pick(n)}
                  className={`flex w-full items-start gap-3 rounded-md border px-3 py-2.5 text-left text-sm ${tone}`}
                >
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-current/40 font-mono text-[0.7rem]">
                    {answered && isRight ? <Check className="size-3.5 text-success" /> : answered && n === q.picked ? <X className="size-3.5 text-danger" /> : n + 1}
                  </span>
                  <span className="flex-1">{c}</span>
                </button>
              </li>
            );
          })}
        </ol>

        {answered && (
          <div className="flex flex-col gap-3 border-t border-line pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={`text-sm font-medium ${q.choices[q.picked!] === q.item.short ? 'text-success' : 'text-danger'}`}>
                {q.choices[q.picked!] === q.item.short ? 'Chính xác!' : 'Chưa đúng. Câu này đã được thêm vào Flashcards.'}
              </span>
              <button type="button" onClick={() => setShowWhy((v) => !v)} className="inline-flex items-center gap-1 text-sm text-accent">
                Đáp án đầy đủ <ChevronDown className={`size-4 transition-transform ${showWhy ? 'rotate-180' : ''}`} aria-hidden />
              </button>
            </div>
            {showWhy && <AnswerBody item={q.item} />}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <SourceLink item={q.item} />
              <Btn tone="primary" onClick={advance}>
                {index === questions.length - 1 ? 'Xem kết quả' : 'Câu tiếp'} <Kbd>Enter</Kbd>
              </Btn>
            </div>
          </div>
        )}
      </article>
    </div>
  );
}

function Result({ questions, scope, onRestart, onBack }: { questions: Question[]; scope: string; onRestart: () => void; onBack: () => void }) {
  const isRight = (q: Question) => q.choices[q.picked!] === q.item.short;
  const right = questions.filter(isRight).length;
  const pct = Math.round((right / questions.length) * 100);
  const wrong = questions.filter((q) => !isRight(q));

  // Điểm theo nhóm (chủ đề trong tài liệu) để chỉ ra phần còn yếu.
  const groups = new Map<string, { right: number; total: number }>();
  for (const q of questions) {
    const g = q.item.group ?? scopeLabel(`doc:${q.item.doc}`);
    const v = groups.get(g) ?? { right: 0, total: 0 };
    v.total++;
    if (isRight(q)) v.right++;
    groups.set(g, v);
  }
  const ranked = [...groups.entries()].sort((a, b) => a[1].right / a[1].total - b[1].right / b[1].total);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col items-center gap-1 rounded-lg border border-line bg-surface px-6 py-8 text-center">
        <span className="eyebrow">{scopeLabel(scope)}</span>
        <span className={`font-display text-5xl font-bold tabular ${pct >= 80 ? 'text-success' : pct >= 50 ? 'text-warn' : 'text-danger'}`}>
          {right}/{questions.length}
        </span>
        <span className="text-sm text-muted">{pct >= 80 ? 'Rất tốt!' : pct >= 50 ? 'Khá ổn, ôn thêm phần yếu nhé.' : 'Cần ôn lại, bắt đầu từ các chủ đề bên dưới.'}</span>
        <div className="mt-4 flex gap-2">
          <Btn tone="primary" onClick={onRestart}>
            <RotateCcw className="size-4" aria-hidden /> Làm lượt mới
          </Btn>
          <Btn onClick={onBack}>Đổi phạm vi</Btn>
        </div>
      </section>

      {groups.size > 1 && (
        <section className="flex flex-col gap-2">
          <h2 className="eyebrow">Theo chủ đề (yếu nhất trước)</h2>
          <ul className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-4 text-sm">
            {ranked.map(([g, v]) => (
              <li key={g} className="grid grid-cols-[1fr_6rem_3rem] items-center gap-3">
                <span className="truncate">{g}</span>
                <ProgressBar value={Math.round((v.right / v.total) * 100)} />
                <span className="text-right tabular text-muted">
                  {v.right}/{v.total}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {wrong.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="eyebrow">Câu trả lời sai ({wrong.length}), đã thêm vào Flashcards</h2>
          <ul className="flex flex-col divide-y divide-line rounded-lg border border-line bg-surface text-sm">
            {wrong.map((q) => (
              <li key={q.item.id} className="flex flex-col gap-1 px-4 py-3">
                <Link href={sourceHref(q.item)} className="font-medium hover:text-accent">
                  {q.item.q}
                </Link>
                <span className="text-muted">
                  <span className="text-success">Đáp án:</span> {q.item.short}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
