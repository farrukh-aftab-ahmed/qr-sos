import type { Metadata } from 'next';
import { UsersTable } from '@/components/admin/users-table';

export const metadata: Metadata = { title: 'Users – Admin' };
export const dynamic = 'force-dynamic';

export default function AdminUsersPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">User Management</h1>
        <p className="text-sm text-white/40 mt-1">View, search, and manage all registered users</p>
      </div>
      <UsersTable />
    </div>
  );
}
