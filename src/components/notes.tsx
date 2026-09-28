'use client';

import { useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Pencil, Trash2, X } from 'lucide-react';
import type { Heading } from '@/lib/content';
import { deleteNote, saveNote, type Note } from '@/lib/store';
import { timeAgo } from './ui';

export function NoteMarkdown({ body }: { body: string }) {
  return (
    <div className="article text-[0.92rem]">
      <Markdown remarkPlugins={[remarkGfm]}>{body}</Markdown>
    </div>
  );
}

interface EditorProps {
  docSlug: string;
  headings: Heading[];
  initial?: Note;
  defaultSection?: string | null;
  onDone: () => void;
}

export function NoteEditor({ docSlug, headings, initial, defaultSection = null, onDone }: EditorProps) {
  const [section, setSection] = useState<string>(initial?.sectionId ?? defaultSection ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const idBase = initial?.id ?? 'new';

  useEffect(() => {
    if (!initial) setSection(defaultSection ?? '');
  }, [defaultSection, initial]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    const h = headings.find((x) => x.id === section);
    saveNote({ id: initial?.id, docSlug, sectionId: h?.id ?? null, sectionTitle: h?.text ?? null, body: body.trim() });
    if (!initial) setBody('');
    onDone();
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-3">
      <label htmlFor={`note-section-${idBase}`} className="sr-only">
        Mục
      </label>
      <select
        id={`note-section-${idBase}`}
        value={section}
        onChange={(e) => setSection(e.target.value)}
        className="h-9 rounded-md border border-line bg-bg px-2 text-sm"
      >
        <option value="">Cả bài</option>
        {headings.map((h) => (
          <option key={h.id} value={h.id}>
            {h.depth > 2 ? '  · ' : ''}
            {h.text}
          </option>
        ))}
      </select>
      <div className="flex gap-1 text-xs" role="tablist">
        {(['write', 'preview'] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`rounded px-2 py-1 ${tab === t ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-sunk'}`}
          >
            {t === 'write' ? 'Viết' : 'Xem trước'}
          </button>
        ))}
        <span className="ml-auto self-center text-muted">Hỗ trợ Markdown</span>
      </div>
      {tab === 'write' ? (
        <textarea
          id={`note-body-${idBase}`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          placeholder="Ghi chú của bạn… (**đậm**, `code`, - danh sách)"
          className="min-h-32 resize-y rounded-md border border-line bg-bg px-3 py-2 font-mono text-sm"
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') submit(e);
          }}
        />
      ) : (
        <div className="min-h-32 rounded-md border border-line bg-bg px-3 py-2">{body.trim() ? <NoteMarkdown body={body} /> : <span className="text-sm text-muted">Chưa có nội dung.</span>}</div>
      )}
      <div className="flex justify-end gap-2">
        {initial && (
          <button type="button" onClick={onDone} className="rounded-md px-3 py-1.5 text-sm text-muted hover:bg-sunk">
            Huỷ
          </button>
        )}
        <button type="submit" disabled={!body.trim()} className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-ink disabled:opacity-40">
          {initial ? 'Lưu' : 'Thêm ghi chú'}
        </button>
      </div>
    </form>
  );
}

export function NoteCard({ note, headings, showDoc }: { note: Note; headings: Heading[]; showDoc?: React.ReactNode }) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  if (editing) return <NoteEditor docSlug={note.docSlug} headings={headings} initial={note} onDone={() => setEditing(false)} />;
  return (
    <article className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-3">
      <header className="flex items-start gap-2 text-xs text-muted">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          {showDoc}
          <span className="truncate">{note.sectionTitle ?? 'Cả bài'}</span>
        </div>
        <span className="shrink-0">{timeAgo(note.updatedAt)}</span>
      </header>
      <NoteMarkdown body={note.body} />
      <footer className="flex justify-end gap-1">
        {confirming ? (
          <>
            <span className="mr-auto self-center text-xs text-danger">Xoá ghi chú này?</span>
            <button type="button" onClick={() => setConfirming(false)} className="rounded px-2 py-1 text-xs text-muted hover:bg-sunk">
              Không
            </button>
            <button type="button" onClick={() => deleteNote(note.id)} className="rounded bg-danger-soft px-2 py-1 text-xs font-medium text-danger">
              Xoá
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => setEditing(true)} className="grid size-7 place-items-center rounded text-muted hover:bg-sunk" aria-label="Sửa ghi chú">
              <Pencil className="size-3.5" />
            </button>
            <button type="button" onClick={() => setConfirming(true)} className="grid size-7 place-items-center rounded text-muted hover:bg-sunk hover:text-danger" aria-label="Xoá ghi chú">
              <Trash2 className="size-3.5" />
            </button>
          </>
        )}
      </footer>
    </article>
  );
}

export function NotesPanel({
  open,
  onClose,
  docSlug,
  headings,
  notes,
  activeSection,
}: {
  open: boolean;
  onClose: () => void;
  docSlug: string;
  headings: Heading[];
  notes: Note[];
  activeSection: string | null;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-ink/20" onClick={onClose} />
      <aside
        role="dialog"
        aria-label="Ghi chú của bài"
        className="absolute inset-y-0 right-0 flex w-[min(28rem,100vw)] flex-col border-l border-line bg-bg pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] shadow-pop"
      >
        <div className="flex h-14 items-center justify-between border-b border-line px-4">
          <h2 className="font-display font-semibold">Ghi chú ({notes.length})</h2>
          <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-md text-muted hover:bg-sunk" aria-label="Đóng">
            <X className="size-5" />
          </button>
        </div>
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
          <NoteEditor docSlug={docSlug} headings={headings} defaultSection={activeSection} onDone={() => {}} />
          {notes.map((n) => (
            <NoteCard key={n.id} note={n} headings={headings} />
          ))}
        </div>
      </aside>
    </div>
  );
}
