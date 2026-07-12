import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { callApi, CURRENT_USER } from '../../api/client';
import type { WorkOrder } from '../../types';

interface Props {
  open: boolean; onClose: () => void; onCreated: () => void; onError: (msg: string) => void;
}

export function CreateWorkOrder({ open, onClose, onCreated, onError }: Props) {
  const [form, setForm] = useState<Partial<WorkOrder>>({ title: '', status: 'open' });

  const submit = async () => {
    if (!form.title) { onError('Title required'); return; }
    try {
      await callApi('/api/work-orders', { method: 'POST', body: JSON.stringify({ ...form, created_by: CURRENT_USER }) });
      onCreated(); onClose();
      setForm({ title: '', status: 'open' });
    } catch (e: any) { onError(e.message); }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <h3 className="font-semibold text-xl mb-5">Create Work Order</h3>
      <input className="w-full border rounded-2xl px-4 py-3 mb-3" placeholder="Work Order Title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
      <textarea className="w-full border rounded-2xl p-4 h-20 mb-4" placeholder="Description / scope of work" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
      <input className="w-full border rounded-2xl px-4 py-3 mb-6" placeholder="Assigned To (name or email)" value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })} />
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 py-3 border rounded-2xl">Cancel</button>
        <button onClick={submit} className="flex-1 py-3 bg-sky-600 text-white rounded-2xl">Create Work Order</button>
      </div>
    </Modal>
  );
}
