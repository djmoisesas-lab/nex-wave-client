import type { Track, User, Playlist, Comment, Notification } from '../types';

export interface TracksResponse {
  tracks: Track[];
  total: number;
  page: number;
  limit: number;
}

export interface AuthResponse {
  token: string;
  user: { id: string; username: string; displayName: string };
}

export interface UpdateProfilePayload {
  displayName?: string;
  bio?: string;
  socialInstagram?: string;
  socialTiktok?: string;
  socialFacebook?: string;
  isPublic?: boolean;
}

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return res.json();
}

export const api = {
  // Auth
  login: (username: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  register: (username: string, email: string, password: string, displayName?: string) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, displayName }),
    }),

  getMe: () => request<User>('/auth/me'),

  // Tracks
  getTracks: (params?: { page?: number; genre?: string; search?: string; sort?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.genre) searchParams.set('genre', params.genre);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.sort) searchParams.set('sort', params.sort);
    const qs = searchParams.toString();
    return request<TracksResponse>(`/tracks${qs ? `?${qs}` : ''}`);
  },

  getMyTracks: (params?: { page?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    const qs = searchParams.toString();
    return request<TracksResponse>(`/tracks/my${qs ? `?${qs}` : ''}`);
  },

  getTrack: (id: string) => request<Track>(`/tracks/${id}`),

  uploadTrack: (formData: FormData, onProgress?: (pct: number) => void) =>
    new Promise<Track>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE}/tracks`);
      const token = getToken();
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(data);
          } else {
            reject(new Error(data.error || 'Error al subir'));
          }
        } catch {
          reject(new Error('Error al subir el archivo'));
        }
      };

      xhr.onerror = () => reject(new Error('Error de conexión'));
      xhr.ontimeout = () => reject(new Error('La subida superó el tiempo máximo'));
      xhr.timeout = 35 * 60 * 1000;
      xhr.send(formData);
    }),

  updateTrack: (id: string, data: Partial<Track>) =>
    request<Track>(`/tracks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteTrack: (id: string) =>
    request<{ success: boolean }>(`/tracks/${id}`, { method: 'DELETE' }),

  registerPlay: (id: string) =>
    request<{ plays: number }>(`/tracks/${id}/play`, { method: 'POST' }),

  uploadTrackCover: (id: string, formData: FormData) =>
    request<{ coverUrl: string }>(`/tracks/${id}/cover`, {
      method: 'POST',
      body: formData,
    }),

  likeTrack: (id: string) =>
    request<{ liked: boolean; likes_count: number }>(`/tracks/${id}/like`, { method: 'POST' }),

  unlikeTrack: (id: string) =>
    request<{ liked: boolean; likes_count: number }>(`/tracks/${id}/unlike`, { method: 'POST' }),

  getComments: (trackId: string) => request<Comment[]>(`/tracks/${trackId}/comments`),

  addComment: (trackId: string, content: string, parentId?: string) =>
    request<Comment>(`/tracks/${trackId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, parentId }),
    }),

  deleteComment: (trackId: string, commentId: string) =>
    request<{ success: boolean }>(`/tracks/${trackId}/comments/${commentId}`, { method: 'DELETE' }),

  likeComment: (trackId: string, commentId: string) =>
    request<{ liked: boolean; likes_count: number }>(`/tracks/${trackId}/comments/${commentId}/like`, { method: 'POST' }),

  unlikeComment: (trackId: string, commentId: string) =>
    request<{ liked: boolean; likes_count: number }>(`/tracks/${trackId}/comments/${commentId}/unlike`, { method: 'POST' }),

  streamUrl: (id: string) => `${API_BASE}/tracks/${id}/stream`,

  downloadUrl: (id: string) => `${API_BASE}/tracks/${id}/download`,

  // Playlists
  getPlaylists: () => request<Playlist[]>('/playlists'),

  getMyPlaylists: () => request<Playlist[]>('/playlists/my'),

  getPlaylist: (id: string) => request<Playlist & { tracks: Track[] }>(`/playlists/${id}`),

  createPlaylist: (name: string, description?: string) =>
    request<Playlist>('/playlists', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    }),

  updatePlaylist: (id: string, data: Partial<Playlist>) =>
    request<Playlist>(`/playlists/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deletePlaylist: (id: string) =>
    request<{ success: boolean }>(`/playlists/${id}`, { method: 'DELETE' }),

  addTrackToPlaylist: (playlistId: string, trackId: string) =>
    request<{ success: boolean }>(`/playlists/${playlistId}/tracks`, {
      method: 'POST',
      body: JSON.stringify({ trackId }),
    }),

  removeTrackFromPlaylist: (playlistId: string, trackId: string) =>
    request<{ success: boolean }>(`/playlists/${playlistId}/tracks/${trackId}`, { method: 'DELETE' }),

  uploadPlaylistCover: (playlistId: string, formData: FormData) =>
    request<{ coverUrl: string }>(`/playlists/${playlistId}/cover`, {
      method: 'POST',
      body: formData,
    }),

  // Users
  searchUsers: (q: string) => request<Pick<User, 'id' | 'username' | 'display_name' | 'bio' | 'avatar_url'>[]>(`/users/search?q=${encodeURIComponent(q)}`),

  followUser: (id: string) => request<{ followed: boolean }>(`/users/follow/${id}`, { method: 'POST' }),

  unfollowUser: (id: string) => request<{ followed: boolean }>(`/users/unfollow/${id}`, { method: 'POST' }),

  getFollowers: (id: string) => request<Pick<User, 'id' | 'username' | 'display_name' | 'avatar_url'>[]>(`/users/followers/${id}`),

  getFollowing: (id: string) => request<Pick<User, 'id' | 'username' | 'display_name' | 'avatar_url'>[]>(`/users/following/${id}`),

  checkFollow: (id: string) => request<{ following: boolean; notify_on_upload: boolean }>(`/users/check-follow/${id}`),

  toggleNotifyOnUpload: (id: string) =>
    request<{ notify_on_upload: boolean }>(`/users/follow/${id}/notify-toggle`, { method: 'POST' }),

  getUser: (id: string) => request<User & { tracks: Track[]; playlists: Playlist[] }>(`/users/${id}`),

  updateProfile: (data: UpdateProfilePayload) =>
    request<User>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  uploadAvatar: (formData: FormData) =>
    request<{ avatarUrl: string }>('/users/avatar', {
      method: 'POST',
      body: formData,
    }),

  uploadBanner: (formData: FormData) =>
    request<{ bannerUrl: string }>('/users/banner', {
      method: 'POST',
      body: formData,
    }),

  // Notifications
  getNotifications: () => request<Notification[]>('/notifications'),

  markNotificationRead: (id: string) =>
    request<{ success: boolean }>(`/notifications/${id}/read`, { method: 'POST' }),

  markAllNotificationsRead: () =>
    request<{ success: boolean }>('/notifications/read-all', { method: 'POST' }),

  // Recommendations
  getRecommendations: () =>
    request<{ users: any[]; tracks: Track[] }>('/recommendations'),

  reportTrack: (id: string, reason: string, description?: string) =>
    request<{ success: boolean; message: string }>(`/tracks/${id}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason, description }),
    }),

  getRecentPlays: (userId: string) =>
    request<Track[]>(`/users/${userId}/recent-plays`),

  // Genres
  // Password Recovery
  forgotPassword: (email: string) =>
    request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, password: string) =>
    request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),

  getGenres: () => request<string[]>('/genres'),
};
