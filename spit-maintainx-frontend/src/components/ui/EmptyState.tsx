interface EmptyStateProps {
  colSpan?: number;
  message?: string;
}

export function EmptyState({ colSpan = 1, message = 'No data yet.' }: EmptyStateProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-12 text-center text-slate-400">
        {message}
      </td>
    </tr>
  );
}
