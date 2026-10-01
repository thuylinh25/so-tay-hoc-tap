import type { Metadata } from 'next';
import { AdminLogin } from '@/components/pages/admin-login';

export const metadata: Metadata = { title: 'Admin' };

export default function AdminPage() {
  return <AdminLogin />;
}
