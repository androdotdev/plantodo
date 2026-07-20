import { create } from "zustand";

export interface PlanSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  isPrivate: boolean;
}

export interface PlanDetail extends PlanSummary {
  html: string;
  data: Record<string, unknown>;
}

interface PlansState {
  /** Lightweight list (from /api/plans) */
  list: PlanSummary[];
  /** Full detail keyed by id (from /api/plans/:id) */
  detail: Record<string, PlanDetail>;
  listLoaded: boolean;

  setList: (plans: PlanSummary[]) => void;
  upsertList: (plan: PlanSummary) => void;
  removeFromList: (id: string) => void;

  getDetail: (id: string) => PlanDetail | undefined;
  setDetail: (plan: PlanDetail) => void;
  patchDetail: (id: string, patch: Partial<PlanDetail>) => void;
  removeDetail: (id: string) => void;
}

export const usePlansStore = create<PlansState>((set, get) => ({
  list: [],
  detail: {},
  listLoaded: false,

  setList: (plans) => set({ list: plans, listLoaded: true }),
  upsertList: (plan) =>
    set((s) => {
      const without = s.list.filter((p) => p.id !== plan.id);
      return { list: [plan, ...without], listLoaded: true };
    }),
  removeFromList: (id) =>
    set((s) => ({ list: s.list.filter((p) => p.id !== id) })),

  getDetail: (id) => get().detail[id],
  setDetail: (plan) => set((s) => ({ detail: { ...s.detail, [plan.id]: plan } })),
  patchDetail: (id, patch) =>
    set((s) => {
      const existing = s.detail[id];
      if (!existing) return s;
      return { detail: { ...s.detail, [id]: { ...existing, ...patch } } };
    }),
  removeDetail: (id) =>
    set((s) => {
      const next = { ...s.detail };
      delete next[id];
      return { detail: next };
    }),
}));
