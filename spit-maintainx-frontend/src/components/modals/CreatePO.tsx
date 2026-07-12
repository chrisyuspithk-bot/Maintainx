import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { callApi, CURRENT_USER } from '../../api/client';
import type { Supplier, Part, Project } from '../../types';

interface POLineItem { part_id: number; quantity: number; unit_price: number }

interface Props {
  open: boolean;
  onClose: () => void;
  suppliers: Supplier[];
  parts: Part[];
  projects: Project[];
  onCreated: () => void;
  onError: (msg: string) => void;
}

export function CreatePO({ open, onClose, suppliers, parts, projects, onCreated, onError }: Props) {
  const [form, setForm] = useState<{ supplier_id: number; project_id?: number; notes?: string; items: POLineItem[] }>({
    supplier_id: 0,
    items: [],
  });

  const addLine = () => setForm(prev => ({ ...prev, items: [...prev.items, { part_id: parts[0]?.id || 0, quantity: 1, unit_price: 0 }] }));
  const updateLine = (i: number, field: string, value: any) => {
    setForm(prev => {
      const items = [...prev.items];
      items[i] = { ...items[i], [field]: value };
      return { ...prev, items };
    });
  };
  const removeLine = (i: number) => setForm(prev => ({ ...prev, items: prev.items.filter((_, idx) => idx !== i) }));

  const submit = async () => {
    if (!form.supplier_id || form.items.length === 0) { onError('Select supplier and add at least one item'); return; }
    try {
      await callApi('/api/pos', {
        method: 'POST',
        body: JSON.stringify({
          supplier_id: form.supplier_id,
          project_id: form.project_id || null,
          notes: form.notes || null,
          created_by: CURRENT_USER,
          items: form.items,
        }),
      });
      onCreated();
      onClose();
      setForm({ supplier_id: 0, items: [] });
    } catch (e: any) { onError(e.message); }
  };

  return (
    <Modal open={open} onClose={onClose} wide>
      <h3 className="text-2xl font-semibold tracking-tight mb-6">Create Purchase Order</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="text-xs text-slate-500 block mb-1.5">SUPPLIER</label>
          <select className="w-full border rounded-2xl px-4 py-3 text-sm" value={form.supplier_id} onChange={e => setForm({ ...form, supplier_id: parseInt(e.target.value) })}>
            <option value={0}>Select supplier...</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1.5">PROJECT (OPTIONAL)</label>
          <select className="w-full border rounded-2xl px-4 py-3 text-sm" value={form.project_id || ''} onChange={e => setForm({ ...form, project_id: e.target.value ? parseInt(e.target.value) : undefined })}>
            <option value="">No project</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs uppercase tracking-[1px] text-slate-500">LINE ITEMS</div>
        <button onClick={addLine} className="text-xs px-3 py-1 border rounded-xl hover:bg-slate-50">+ Add Item</button>
      </div>

      {form.items.length === 0 && <div className="text-center py-6 text-sm text-slate-400 border rounded-2xl mb-4">No items added yet</div>}

      {form.items.map((item, i) => (
        <div key={i} className="grid grid-cols-12 gap-3 mb-3 items-center bg-slate-50 p-3 rounded-2xl">
          <div className="col-span-5">
            <select className="w-full text-sm border rounded-xl px-3 py-2" value={item.part_id} onChange={e => updateLine(i, 'part_id', parseInt(e.target.value))}>
              {parts.map(p => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <input type="number" className="w-full text-sm border rounded-xl px-3 py-2" placeholder="Qty" value={item.quantity} onChange={e => updateLine(i, 'quantity', parseInt(e.target.value) || 1)} />
          </div>
          <div className="col-span-3">
            <input type="number" step="0.01" className="w-full text-sm border rounded-xl px-3 py-2" placeholder="Unit Price" value={item.unit_price} onChange={e => updateLine(i, 'unit_price', parseFloat(e.target.value) || 0)} />
          </div>
          <div className="col-span-2 flex justify-end">
            <button onClick={() => removeLine(i)} className="text-red-500 text-xs px-3">Remove</button>
          </div>
        </div>
      ))}

      <textarea className="w-full mt-2 border rounded-2xl p-4 text-sm h-20" placeholder="Notes / justification..." value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} />

      <div className="flex gap-3 mt-8">
        <button onClick={() => { onClose(); setForm({ supplier_id: 0, items: [] }); }} className="flex-1 py-3 border text-sm rounded-2xl">Cancel</button>
        <button onClick={submit} className="flex-1 py-3 bg-sky-600 text-white text-sm rounded-2xl font-medium disabled:opacity-50" disabled={!form.supplier_id || form.items.length === 0}>Create Purchase Order</button>
      </div>
    </Modal>
  );
}
