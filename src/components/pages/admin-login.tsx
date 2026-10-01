'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LogIn, LogOut } from 'lucide-react';
import { refreshDynamic, useDynamicState } from '@/lib/dynamic';
import { PageHeader } from '../ui';

export function AdminLogin() {
  const router = useRouter();
  const { admin, loaded } = useDynamicState();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError('Sai mật khẩu.');
        return;
      }
      await refreshDynamic();
      router.push('/new');
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' });
    await refreshDynamic();
    setPassword('');
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-10 sm:px-8">
      <PageHeader eyebrow="Admin" title="Đăng nhập quản trị">
        Chỉ admin mới tạo/sửa/xóa bài. Phiên được giữ bằng cookie; API được bảo vệ ở server.
      </PageHeader>

      {loaded && admin ? (
        <div className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-5">
          <p className="text-sm text-success">Đang đăng nhập với quyền admin.</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => router.push('/new')} className="inline-flex items-center gap-2 rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-ink hover:opacity-90">
              Tạo bài viết
            </button>
            <button type="button" onClick={logout} className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm hover:border-accent">
              <LogOut className="size-4" /> Đăng xuất
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-5">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Mật khẩu admin</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="h-10 rounded-md border border-line bg-surface px-3 outline-none focus:border-accent"
              required
            />
          </label>
          {error && <p className="text-sm text-danger">{error}</p>}
          <button type="submit" disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-ink hover:opacity-90 disabled:opacity-60">
            <LogIn className="size-4" /> {busy ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </button>
        </form>
      )}
    </div>
  );
}
