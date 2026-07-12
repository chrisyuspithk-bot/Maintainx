import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { callApi, CURRENT_USER } from '../../api/client';
import type { Supplier } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  onError: (msg: string) => void;
}

export function CreateSupplier({ open, onClose, onCreated, onError }: Props) {
  const [form, setForm] = useState<Partial<Supplier>>({ name: '', code: '', contact_person: '', email: '', lead_time_days: 14 });

  const submit = async () => {
    if (!form.name) { onError('Name is required'); return; }
    try {
      await callApi('/api/suppliers', { method: 'POST', body: JSON.stringify({ ...form, created_by: CURRENT_USER }) });
      onCreated();
      onClose();
      setForm({ name: '', code: '', contact_person: '', email: '', lead_time_days: 14 });
    } catch (e: any) { onError(e.message); }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <h3 className="text-xl font-semibold mb-6">New Supplier</h3>
      <div className="space-y-4">
        <input className="w-full border rounded-2xl px-4 py-3 text-sm" placeholder="Company Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <div className="grid grid-cols-2 gap-4">
          <input className="border rounded-2xl px-4 py-3 text-sm" placeholder="Code (e.g. TPHK)" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
          <input className="border rounded-2xl px-4 py-3 text-sm" placeholder="Contact Person" value={form.contact_person} onChange={e => setForm({ ...form, contact_person: e.target.value })} />
        </div>
        <input className="w-full border rounded-2xl px-4 py-3 text-sm" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        <input className="border rounded-2xl px-4 py-3 text-sm" placeholder="Lead Time (days)" type="number" value={form.lead_time_days} onChange={e => setForm({ ...form, lead_time_days: parseInt(e.target.value) || 14 })} />
      </div>
      <div className="flex gap-3 mt-8">
        <button onClick={onClose} className="flex-1 py-3 text-sm border rounded-2xl">Cancel</button>
        <button onClick={submit} className="flex-1 py-3 text-sm bg-sky-600 text-white rounded-2xl font-medium">Create Supplier</button>
      </div>
    </Modal>
  );
}
