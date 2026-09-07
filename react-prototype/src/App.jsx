import { useSyncExternalStore } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { isSessionActive, subscribeSession } from './data/session.js';

import Landing from './pages/Landing.jsx';
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
  const active = useSyncExternalStore(subscribeSession, isSessionActive);
  return active ? <Outlet /> : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
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
