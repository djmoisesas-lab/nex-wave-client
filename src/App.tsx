import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Layout from './components/Layout';
import Home from './pages/Home';
import Explore from './pages/Explore';
import TrackDetail from './pages/TrackDetail';
import Upload from './pages/Upload';
import MyTracks from './pages/MyTracks';
import EditTrack from './pages/EditTrack';
import Playlists from './pages/Playlists';
import PlaylistDetail from './pages/PlaylistDetail';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Settings from './pages/Settings';
import { useAuthStore } from './services/store';
import PlayerBar from './components/PlayerBar';
import ToastContainer from './components/ToastContainer';
import WhatsAppButton from './components/WhatsAppButton';

function AnimatedOutlet({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  const loadUser = useAuthStore((s) => s.loadUser);
  const token = useAuthStore((s) => s.token);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (token) loadUser();
  }, []);

  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<AnimatedOutlet><Home /></AnimatedOutlet>} />
          <Route path="explore" element={<AnimatedOutlet><Explore /></AnimatedOutlet>} />
          <Route path="track/:id" element={<AnimatedOutlet><TrackDetail /></AnimatedOutlet>} />
          <Route path="upload" element={<AnimatedOutlet><Upload /></AnimatedOutlet>} />
          <Route path="my-tracks" element={<AnimatedOutlet><MyTracks /></AnimatedOutlet>} />
          <Route path="edit-track/:id" element={<AnimatedOutlet><EditTrack /></AnimatedOutlet>} />
          <Route path="playlists" element={<AnimatedOutlet><Playlists /></AnimatedOutlet>} />
          <Route path="playlist/:id" element={<AnimatedOutlet><PlaylistDetail /></AnimatedOutlet>} />
          <Route path="profile/:id" element={<AnimatedOutlet><Profile /></AnimatedOutlet>} />
          <Route path="settings" element={<AnimatedOutlet><Settings /></AnimatedOutlet>} />
          <Route path="login" element={<AnimatedOutlet><Login /></AnimatedOutlet>} />
          <Route path="register" element={<AnimatedOutlet><Register /></AnimatedOutlet>} />
          <Route path="forgot-password" element={<AnimatedOutlet><ForgotPassword /></AnimatedOutlet>} />
          <Route path="reset-password" element={<AnimatedOutlet><ResetPassword /></AnimatedOutlet>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      {isAuthenticated && <PlayerBar />}
      <WhatsAppButton />
      <ToastContainer />
    </>
  );
}
