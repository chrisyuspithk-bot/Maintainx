import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { callApi, CURRENT_USER } from '../../api/client';
import type { Part } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  onError: (msg: string) => void;
}

export function CreatePart({ open, onClose, onCreated, onError }: Props) {
  const [form, setForm] = useState<Partial<Part>>({ sku: '', name: '', criticality: 'medium', min_stock: 0, reorder_point: 5, reorder_qty: 10 });

  const submit = async () => {
    if (!form.sku || !form.name) { onError('SKU and Name required'); return; }
    try {
      await callApi('/api/parts', { method: 'POST', body: JSON.stringify({ ...form, created_by: CURRENT_USER }) });
      onCreated();
      onClose();
      setForm({ sku: '', name: '', criticality: 'medium', min_stock: 0, reorder_point: 5, reorder_qty: 10 });
    } catch (e: any) { onError(e.message); }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <h3 className="text-xl font-semibold mb-6">New Part / SKU</h3>
      <div className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <input className="border rounded-2xl px-4 py-3" placeholder="SKU *" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} />
          <select className="border rounded-2xl px-4 py-3" value={form.criticality} onChange={e => setForm({ ...form, criticality: e.target.value as any })}>
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
          </select>
        </div>
        <input className="w-full border rounded-2xl px-4 py-3" placeholder="Part Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <input className="w-full border rounded-2xl px-4 py-3" placeholder="Category (optional)" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
        <div className="grid grid-cols-3 gap-4">
          <input type="number" className="border rounded-2xl px-4 py-3" placeholder="Min Stock" value={form.min_stock} onChange={e => setForm({ ...form, min_stock: parseInt(e.target.value) })} />
          <input type="number" className="border rounded-2xl px-4 py-3" placeholder="Reorder Point" value={form.reorder_point} onChange={e => setForm({ ...form, reorder_point: parseInt(e.target.value) })} />
          <input type="number" className="border rounded-2xl px-4 py-3" placeholder="Reorder Qty" value={form.reorder_qty} onChange={e => setForm({ ...form, reorder_qty: parseInt(e.target.value) })} />
        </div>
      </div>
      <div className="flex gap-3 mt-8">
        <button onClick={onClose} className="flex-1 py-3 text-sm border rounded-2xl">Cancel</button>
        <button onClick={submit} className="flex-1 py-3 text-sm bg-sky-600 text-white rounded-2xl font-medium">Create Part</button>
      </div>
    </Modal>
  );
}
