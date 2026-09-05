import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

const Landing = lazy(() => import('./pages/Landing.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const JobPostings = lazy(() => import('./pages/JobPostings.jsx'));
const JobDetail = lazy(() => import('./pages/JobDetail.jsx'));
const DocumentGenerator = lazy(() => import('./pages/DocumentGenerator.jsx'));
const DocumentEditor = lazy(() => import('./pages/DocumentEditor.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const Applications = lazy(() => import('./pages/Applications.jsx'));
const MyPage = lazy(() => import('./pages/MyPage.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

export default function App() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: '#86868b', fontSize: 14 }}>불러오는 중…</div>}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/jobs" element={<JobPostings />} />
        <Route path="/jobs/:jobId" element={<JobDetail />} />
        <Route path="/generate" element={<DocumentGenerator />} />
        <Route path="/editor" element={<DocumentEditor />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/applications" element={<Applications />} />
        <Route path="/me" element={<MyPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
