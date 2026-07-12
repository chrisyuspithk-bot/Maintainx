import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { callApi, CURRENT_USER } from '../../api/client';
import type { Part, Location } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  parts: Part[];
  locations: Location[];
  poId?: number;
  onCreated: () => void;
  onError: (msg: string) => void;
}

export function ReceiveGoods({ open, onClose, parts, locations, poId, onCreated, onError }: Props) {
  const [form, setForm] = useState({ part_id: 0, location_id: 0, quantity: 1, unit_cost: 0, po_id: poId, notes: '' });

  const submit = async () => {
    if (!form.part_id || !form.location_id || form.quantity <= 0) {
      onError('Part, Location and positive quantity required'); return;
    }
    try {
      await callApi('/api/inventory/receive', { method: 'POST', body: JSON.stringify({ ...form, created_by: CURRENT_USER }) });
      onCreated();
      onClose();
      setForm({ part_id: 0, location_id: 0, quantity: 1, unit_cost: 0, po_id: undefined, notes: '' });
    } catch (e: any) { onError(e.message); }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <h3 className="text-xl font-semibold mb-1">Receive Goods</h3>
      <p className="text-xs text-slate-500 mb-6">This will create an inventory transaction and update stock levels.</p>
      <div className="space-y-4 text-sm">
        <div>
          <label className="text-xs text-slate-500">PART</label>
          <select className="mt-1 w-full border rounded-2xl px-4 py-3" value={form.part_id} onChange={e => setForm({ ...form, part_id: parseInt(e.target.value) })}>
            <option value={0}>Select part...</option>
            {parts.map(p => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500">LOCATION / WAREHOUSE</label>
          <select className="mt-1 w-full border rounded-2xl px-4 py-3" value={form.location_id} onChange={e => setForm({ ...form, location_id: parseInt(e.target.value) })}>
            <option value={0}>Select location...</option>
            {locations.length > 0 ? locations.map(l => <option key={l.id} value={l.id}>{l.name} {l.code ? `(${l.code})` : ''}</option>) : <option disabled>No locations defined (add via API)</option>}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-500">QUANTITY</label>
            <input type="number" className="mt-1 w-full border rounded-2xl px-4 py-3" value={form.quantity} onChange={e => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })} />
          </div>
          <div>
            <label className="text-xs text-slate-500">UNIT COST (optional)</label>
            <input type="number" step="0.01" className="mt-1 w-full border rounded-2xl px-4 py-3" value={form.unit_cost} onChange={e => setForm({ ...form, unit_cost: parseFloat(e.target.value) || 0 })} />
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-500">LINK TO PO (optional)</label>
          <input type="number" className="mt-1 w-full border rounded-2xl px-4 py-3" placeholder="PO ID" value={form.po_id || ''} onChange={e => setForm({ ...form, po_id: e.target.value ? parseInt(e.target.value) : undefined })} />
        </div>
      </div>
      <div className="flex gap-3 mt-8">
        <button onClick={onClose} className="flex-1 py-3 text-sm border rounded-2xl">Cancel</button>
        <button onClick={submit} className="flex-1 py-3 text-sm bg-emerald-600 text-white rounded-2xl font-medium">Confirm Receipt</button>
      </div>
    </Modal>
  );
}
