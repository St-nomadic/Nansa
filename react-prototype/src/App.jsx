import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { getAuthSession, watchAuth } from './data/auth.js';

import Landing from './pages/Landing.jsx';
import Auth from './pages/Auth.jsx';
import Dashboard from './pages/Dashboard.jsx';
import JobPostings from './pages/JobPostings.jsx';
import JobDetail from './pages/JobDetail.jsx';
import DocumentGenerator from './pages/DocumentGenerator.jsx';
import DocumentEditor from './pages/DocumentEditor.jsx';
import Profile from './pages/Profile.jsx';
import InterviewChat from './pages/InterviewChat.jsx';
import Applications from './pages/Applications.jsx';
import MyPage from './pages/MyPage.jsx';
import NotFound from './pages/NotFound.jsx';

function SessionGate() {
  const [status, setStatus] = useState('checking');
  useEffect(() => {
    let mounted = true;
    getAuthSession().then(session => { if (mounted) setStatus(session ? 'active' : 'signed-out'); });
    const stop = watchAuth(session => setStatus(session ? 'active' : 'signed-out'));
    return () => { mounted = false; stop(); };
  }, []);
  if (status === 'checking') return null;
  return status === 'active' ? <Outlet /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Auth key="login" />} />
      <Route path="/signup" element={<Auth key="signup" signup />} />
      <Route element={<SessionGate />}>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/jobs" element={<JobPostings />} />
      <Route path="/jobs/:jobId" element={<JobDetail />} />
      <Route path="/generate" element={<DocumentGenerator />} />
      <Route path="/editor" element={<DocumentEditor />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/interview" element={<InterviewChat />} />
      <Route path="/applications" element={<Applications />} />
      <Route path="/me" element={<MyPage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
