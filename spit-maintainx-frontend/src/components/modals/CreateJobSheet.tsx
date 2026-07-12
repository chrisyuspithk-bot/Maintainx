import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { callApi, CURRENT_USER } from '../../api/client';
import type { WorkOrder, JobSheet } from '../../types';

interface Props {
  open: boolean; onClose: () => void;
  workOrders: WorkOrder[];
  onCreated: () => void; onError: (msg: string) => void;
}

export function CreateJobSheet({ open, onClose, workOrders, onCreated, onError }: Props) {
  const [form, setForm] = useState<Partial<JobSheet>>({ performed_by: CURRENT_USER, work_done: '', parts_used: '' });

  const submit = async () => {
    if (!form.work_order_id || !form.performed_by) { onError('Work Order and Performed By required'); return; }
    try {
      await callApi('/api/job-sheets', { method: 'POST', body: JSON.stringify(form) });
      onCreated(); onClose();
      setForm({ performed_by: CURRENT_USER, work_done: '', parts_used: '' });
    } catch (e: any) { onError(e.message); }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <h3 className="font-semibold text-xl mb-5">Complete Work with Job Sheet</h3>
      <select className="w-full border rounded-2xl px-4 py-3 mb-3" value={form.work_order_id || ''} onChange={e => setForm({ ...form, work_order_id: parseInt(e.target.value) })}>
        <option value="">Select Work Order...</option>
        {workOrders.filter(w => w.status !== 'completed').map(w => <option key={w.id} value={w.id}>{w.title}</option>)}
      </select>
      <input className="w-full border rounded-2xl px-4 py-3 mb-3" placeholder="Performed By *" value={form.performed_by} onChange={e => setForm({ ...form, performed_by: e.target.value })} />
      <textarea className="w-full border rounded-2xl p-4 h-20 mb-3" placeholder="Work done / findings" value={form.work_done} onChange={e => setForm({ ...form, work_done: e.target.value })} />
      <input className="w-full border rounded-2xl px-4 py-3 mb-6" placeholder="Parts used (comma separated)" value={form.parts_used} onChange={e => setForm({ ...form, parts_used: e.target.value })} />
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 py-3 border rounded-2xl">Cancel</button>
        <button onClick={submit} className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl">Submit & Complete</button>
      </div>
    </Modal>
  );
}
