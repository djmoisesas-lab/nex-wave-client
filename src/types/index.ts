export interface User {
  id: string;
  username: string;
  email?: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  banner_url?: string | null;
  social_instagram: string;
  social_tiktok: string;
  social_facebook: string;
  is_public: number;
  followers_count?: number;
  following_count?: number;
}

export interface Track {
  id: string;
  user_id: string;
  title: string;
  artist: string;
  genre: string;
  bpm: number | null;
  musical_key: string;
  description: string;
  filename: string;
  original_name: string;
  mime_type: string;
  duration: number;
  file_size: number;
  waveform_data: string | null;
  cover_url: string | null;
  plays: number;
  downloads: number;
  likes_count: number;
  is_liked: boolean;
  is_public: number;
  created_at: string;
  username?: string;
  display_name?: string;
}

export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  description: string;
  cover_url: string | null;
  is_public: number;
  created_at: string;
  track_count?: number;
  tracks?: Track[];
  username?: string;
  display_name?: string;
}

export interface Comment {
  id: string;
  track_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  likes_count: number;
  is_liked: boolean;
  replies?: Comment[];
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'like' | 'comment' | 'mention' | 'upload';
  message: string;
  track_id: string;
  actor_id: string;
  read: number;
  created_at: string;
  actor_username?: string;
  actor_display_name?: string;
  actor_avatar_url?: string | null;
  track_title?: string;
}

  export interface AuthResponse {

  token: string;
  user: {
    id: string;
    username: string;
    displayName: string;
  };
}
