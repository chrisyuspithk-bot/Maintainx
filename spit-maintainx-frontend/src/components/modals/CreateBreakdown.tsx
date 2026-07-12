import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { callApi } from '../../api/client';
import type { BreakdownLog } from '../../types';

interface Props {
  open: boolean; onClose: () => void; onCreated: () => void; onError: (msg: string) => void;
}

export function CreateBreakdown({ open, onClose, onCreated, onError }: Props) {
  const [form, setForm] = useState<Partial<BreakdownLog>>({ channel: 'email', priority: 'medium', status: 'open', description: '' });

  const submit = async () => {
    if (!form.description) { onError('Description required'); return; }
    try {
      await callApi('/api/breakdown-logs', { method: 'POST', body: JSON.stringify(form) });
      onCreated(); onClose();
      setForm({ channel: 'email', priority: 'medium', status: 'open', description: '' });
    } catch (e: any) { onError(e.message); }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <h3 className="font-semibold text-xl mb-5">Log Equipment Breakdown</h3>
      <textarea className="w-full border rounded-2xl p-4 h-28 mb-4" placeholder="Describe the issue..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
      <div className="grid grid-cols-2 gap-3 mb-6">
        <select className="border rounded-2xl px-4 py-3" value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value })}>
          <option value="phone">Phone</option><option value="whatsapp">WhatsApp</option><option value="email">Email</option><option value="others">Other</option>
        </select>
        <select className="border rounded-2xl px-4 py-3" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
          <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
        </select>
      </div>
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 py-3 border rounded-2xl">Cancel</button>
        <button onClick={submit} className="flex-1 py-3 bg-rose-600 text-white rounded-2xl">Log Breakdown</button>
      </div>
    </Modal>
  );
}
