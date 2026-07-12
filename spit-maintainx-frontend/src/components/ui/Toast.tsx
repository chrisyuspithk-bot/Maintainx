interface ToastItem { id: number; message: string; type: 'success' | 'error' }

export function ToastContainer({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div className="fixed bottom-6 right-6 z-[80] space-y-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`px-5 py-3 rounded-2xl shadow-lg text-sm flex items-center gap-3 max-w-xs ${
            toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'
          }`}
        >
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
