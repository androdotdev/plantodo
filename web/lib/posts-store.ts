import { create } from "zustand";

export interface PostSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  isPrivate: boolean;
}

export interface PostDetail extends PostSummary {
  html: string;
  data: Record<string, unknown>;
}

interface PostsState {
  /** Lightweight list (from /api/posts) */
  list: PostSummary[];
  /** Full detail keyed by id (from /api/posts) */
  detail: Record<string, PostDetail>;
  listLoaded: boolean;

  setList: (posts: PostSummary[]) => void;
  upsertList: (post: PostSummary) => void;
  removeFromList: (id: string) => void;

  getDetail: (id: string) => PostDetail | undefined;
  setDetail: (post: PostDetail) => void;
  patchDetail: (id: string, patch: Partial<PostDetail>) => void;
  removeDetail: (id: string) => void;
}

export const usePostsStore = create<PostsState>((set, get) => ({
  list: [],
  detail: {},
  listLoaded: false,

  setList: (posts) => set({ list: posts, listLoaded: true }),
  upsertList: (post) =>
    set((s) => {
      const without = s.list.filter((p) => p.id !== post.id);
      return { list: [post, ...without], listLoaded: true };
    }),
  removeFromList: (id) =>
    set((s) => ({ list: s.list.filter((p) => p.id !== id) })),

  getDetail: (id) => get().detail[id],
  setDetail: (post) => set((s) => ({ detail: { ...s.detail, [post.id]: post } })),
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
