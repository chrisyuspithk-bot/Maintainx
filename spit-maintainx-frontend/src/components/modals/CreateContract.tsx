import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { callApi, CURRENT_USER } from '../../api/client';
import type { MaintenanceContract } from '../../types';

interface Props {
  open: boolean; onClose: () => void; onCreated: () => void; onError: (msg: string) => void;
}

export function CreateContract({ open, onClose, onCreated, onError }: Props) {
  const [form, setForm] = useState<Partial<MaintenanceContract>>({ contract_number: '', type: 'paid', status: 'active' });

  const submit = async () => {
    if (!form.contract_number) { onError('Contract number required'); return; }
    try {
      await callApi('/api/maintenance-contracts', { method: 'POST', body: JSON.stringify({ ...form, created_by: CURRENT_USER }) });
      onCreated(); onClose();
      setForm({ contract_number: '', type: 'paid', status: 'active' });
    } catch (e: any) { onError(e.message); }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <h3 className="font-semibold text-xl mb-5">New Maintenance Contract</h3>
      <input className="w-full border rounded-2xl px-4 py-3 mb-3" placeholder="Contract Number *" value={form.contract_number} onChange={e => setForm({ ...form, contract_number: e.target.value })} />
      <div className="grid grid-cols-2 gap-3 mb-6">
        <select className="border rounded-2xl px-4 py-3" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
          <option value="paid">Paid</option><option value="free">Free / Warranty</option>
        </select>
        <select className="border rounded-2xl px-4 py-3" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
          <option value="active">Active</option><option value="expired">Expired</option>
        </select>
      </div>
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 py-3 border rounded-2xl">Cancel</button>
        <button onClick={submit} className="flex-1 py-3 bg-sky-600 text-white rounded-2xl">Create Contract</button>
      </div>
    </Modal>
  );
}
