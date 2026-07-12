import { useState, useCallback } from 'react';
import { callApi } from '../api/client';
import type { Supplier, Part, Location, PurchaseOrder, ApprovalRequest, Project, MaintenanceContract, BreakdownLog, WorkOrder } from '../types';

export function useSuppliers() {
  const [data, setData] = useState<Supplier[]>([]);
  const fetch = useCallback(async () => {
    const d = await callApi<Supplier[]>('/api/suppliers');
    setData(d || []);
  }, []);
  return { suppliers: data, fetchSuppliers: fetch, setSuppliers: setData };
}

export function useParts() {
  const [data, setData] = useState<Part[]>([]);
  const fetch = useCallback(async () => {
    const d = await callApi<Part[]>('/api/parts');
    setData(d || []);
  }, []);
  return { parts: data, fetchParts: fetch, setParts: setData };
}

export function useLocations() {
  const [data, setData] = useState<Location[]>([]);
  const fetch = useCallback(async () => {
    const d = await callApi<Location[]>('/api/locations');
    setData(d || []);
  }, []);
  return { locations: data, fetchLocations: fetch };
}

export function usePurchaseOrders() {
  const [data, setData] = useState<PurchaseOrder[]>([]);
  const fetch = useCallback(async () => {
    const d = await callApi<PurchaseOrder[]>('/api/pos?limit=100');
    setData(d || []);
  }, []);
  return { pos: data, fetchPOs: fetch, setPOs: setData };
}

export function usePendingApprovals() {
  const [data, setData] = useState<ApprovalRequest[]>([]);
  const fetch = useCallback(async () => {
    const d = await callApi<ApprovalRequest[]>('/api/approvals/pending');
    setData(d || []);
  }, []);
  return { pendingApprovals: data, fetchPendingApprovals: fetch, setPendingApprovals: setData };
}

export function useProjects() {
  const [data, setData] = useState<Project[]>([]);
  const fetch = useCallback(async () => {
    const d = await callApi<Project[]>('/api/projects');
    setData(d || []);
  }, []);
  return { projects: data, fetchProjects: fetch };
}

export function useContracts() {
  const [data, setData] = useState<MaintenanceContract[]>([]);
  const fetch = useCallback(async () => {
    const d = await callApi<MaintenanceContract[]>('/api/maintenance-contracts');
    setData(d || []);
  }, []);
  return { contracts: data, fetchContracts: fetch };
}

export function useBreakdownLogs() {
  const [data, setData] = useState<BreakdownLog[]>([]);
  const fetch = useCallback(async () => {
    const d = await callApi<BreakdownLog[]>('/api/breakdown-logs');
    setData(d || []);
  }, []);
  return { breakdownLogs: data, fetchBreakdownLogs: fetch };
}

export function useWorkOrders() {
  const [data, setData] = useState<WorkOrder[]>([]);
  const fetch = useCallback(async () => {
    const d = await callApi<WorkOrder[]>('/api/work-orders');
    setData(d || []);
  }, []);
  return { workOrders: data, fetchWorkOrders: fetch };
}

export function useStockLevels() {
  const [data, setData] = useState<any[]>([]);
  const fetch = useCallback(async () => {
    const [levels, partsList, locationsList] = await Promise.all([
      callApi<any[]>('/api/inventory'),
      callApi<Part[]>('/api/parts'),
      callApi<Location[]>('/api/locations'),
    ]);
    const enriched = levels.map((level: any) => {
      const part = partsList.find((p: Part) => p.id === level.part_id);
      const location = locationsList.find((l: Location) => l.id === level.location_id);
      return { ...level, part, locationName: location?.name || `Location #${level.location_id}` };
    });
    setData(enriched);
  }, []);
  return { stockLevels: data, fetchStockLevels: fetch };
}

export function useToast() {
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: 'success' | 'error' }>>([]);
  const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);
  return { toasts, addToast };
}
