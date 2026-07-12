import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { callApi, CURRENT_USER } from '../../api/client';
import type { Project } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  onError: (msg: string) => void;
}

export function CreateProject({ open, onClose, onCreated, onError }: Props) {
  const [form, setForm] = useState<Partial<Project>>({ name: '', code: '', description: '' });

  const submit = async () => {
    if (!form.name) { onError('Project name required'); return; }
    try {
      await callApi('/api/projects', { method: 'POST', body: JSON.stringify({ ...form, created_by: CURRENT_USER }) });
      onCreated();
      onClose();
      setForm({ name: '', code: '', description: '' });
    } catch (e: any) { onError(e.message); }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <h3 className="text-xl font-semibold mb-6">New Project</h3>
      <input className="w-full border rounded-2xl px-4 py-3 mb-3" placeholder="Project Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
      <input className="w-full border rounded-2xl px-4 py-3 mb-3" placeholder="Code (optional)" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
      <textarea className="w-full border rounded-2xl p-4 h-20" placeholder="Description (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
      <div className="flex gap-3 mt-8">
        <button onClick={onClose} className="flex-1 py-3 text-sm border rounded-2xl">Cancel</button>
        <button onClick={submit} className="flex-1 py-3 text-sm bg-sky-600 text-white rounded-2xl font-medium">Create Project</button>
      </div>
    </Modal>
  );
}
