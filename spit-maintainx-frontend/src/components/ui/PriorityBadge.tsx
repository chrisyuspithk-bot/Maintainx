const priorityMap: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs ${priorityMap[priority] || ''}`}>
      {priority}
    </span>
  );
}
