const statusMap: Record<string, string> = {
  pending_approval: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  received: 'bg-blue-100 text-blue-800',
  partially_received: 'bg-cyan-100 text-cyan-800',
  rejected: 'bg-red-100 text-red-800',
  open: 'bg-orange-100 text-orange-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
  closed: 'bg-gray-100 text-gray-800',
  active: 'bg-emerald-100 text-emerald-800',
  draft: 'bg-gray-100 text-gray-700',
};

export function StatusBadge({ status }: { status: string }) {
  const cls = statusMap[status] || 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
