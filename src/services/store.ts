import { create } from 'zustand';
import { Track, User } from '../types';
import { api } from './api';

interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  queue: Track[];
  volume: number;
  prevVolume: number;
  toggleMute: () => void;
  currentTime: number;
  duration: number;
  frequencyData: number[];
  pendingSeek: number | null;
  reset: () => void;
  setTrack: (track: Track) => void;
  setPlaying: (playing: boolean) => void;
  setQueue: (tracks: Track[]) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (trackId: string) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  setVolume: (volume: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setFrequencyData: (data: number[]) => void;
  seekTo: (time: number) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  reset: () => set({
    currentTrack: null, isPlaying: false, queue: [],
    currentTime: 0, duration: 0, frequencyData: [], pendingSeek: null,
  }),
  currentTrack: null,
  isPlaying: false,
  queue: [],
  volume: 1,
  prevVolume: 1,
  toggleMute: () => set((state) => {
    if (state.volume > 0) {
      return { prevVolume: state.volume, volume: 0 };
    }
    return { volume: state.prevVolume || 1 };
  }),
  currentTime: 0,
  duration: 0,
  frequencyData: [],
  pendingSeek: null,
  setTrack: (track) => set((state) => {
    const exists = state.queue.some((t) => t.id === track.id);
    return {
      currentTrack: track,
      isPlaying: true,
      queue: exists ? state.queue : [...state.queue, track],
    };
  }),
  setPlaying: (playing) => set({ isPlaying: playing }),
  setQueue: (tracks) => set({ queue: tracks }),
  addToQueue: (track) => set((state) => ({ queue: [...state.queue, track] })),
  removeFromQueue: (trackId) => set((state) => ({
    queue: state.queue.filter((t) => t.id !== trackId),
  })),
  nextTrack: () => {
    const { queue, currentTrack } = get();
    if (queue.length === 0) return;
    const currentIndex = queue.findIndex((t) => t.id === currentTrack?.id);
    if (currentIndex === -1) {
      const next = queue[0];
      set({ currentTrack: next, isPlaying: true });
    } else if (currentIndex < queue.length - 1) {
      const next = queue[currentIndex + 1];
      set({ currentTrack: next, isPlaying: true });
    }
  },
  prevTrack: () => {
    const { queue, currentTrack } = get();
    if (queue.length === 0) return;
    const currentIndex = queue.findIndex((t) => t.id === currentTrack?.id);
    const prev = currentIndex > 0 ? queue[currentIndex - 1] : queue[queue.length - 1];
    set({ currentTrack: prev, isPlaying: true });
  },
  setVolume: (volume) => set({ volume }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setFrequencyData: (data) => set({ frequencyData: data }),
  seekTo: (time) => set({ pendingSeek: time }),
}));

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  login: async (username, password) => {
    const res = await api.login(username, password);
    localStorage.setItem('token', res.token);
    set({ token: res.token, isAuthenticated: true });
    await api.getMe().then((user) => set({ user })).catch(() => {});
  },
  register: async (username, email, password, displayName) => {
    const res = await api.register(username, email, password, displayName);
    localStorage.setItem('token', res.token);
    set({ token: res.token, isAuthenticated: true });
    await api.getMe().then((user) => set({ user })).catch(() => {});
  },
  logout: () => {
    localStorage.removeItem('token');
    usePlayerStore.getState().setPlaying(false);
    usePlayerStore.getState().reset();
    set({ user: null, token: null, isAuthenticated: false });
  },
  loadUser: async () => {
    try {
      const user = await api.getMe();
      set({ user, isAuthenticated: true });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },
}));
