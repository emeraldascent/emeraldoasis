import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useMember } from './hooks/useMember';
import { useAdmin } from './hooks/useAdmin';
import { AuthGuard } from './components/auth/AuthGuard';
import { AdminGuard } from './components/auth/AdminGuard';
import { BottomNav } from './components/layout/BottomNav';
import { Welcome } from './pages/Welcome';
import { Join } from './pages/Join';
import { WelcomeConfirmation } from './pages/WelcomeConfirmation';
import { Dashboard } from './pages/Dashboard';
import { Book } from './pages/Book';
import { Guide } from './pages/Guide';
import { Profile } from './pages/Profile';
import { Admin } from './pages/Admin';

function AppContent() {
  const { user, member, badgeStatus, loading, logout, refreshMember } = useMember();
  const isAdmin = useAdmin(user);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Welcome />} />
      <Route path="/join" element={<Join />} />

      {/* Authenticated routes */}
      <Route
        path="/welcome"
        element={
          <AuthGuard user={user} loading={loading}>
            <WelcomeConfirmation />
          </AuthGuard>
        }
      />
      <Route
        path="/dashboard"
        element={
          <AuthGuard user={user} loading={loading}>
            <Dashboard member={member} badgeStatus={badgeStatus} />
            <BottomNav isAdmin={isAdmin} />
          </AuthGuard>
        }
      />
      <Route
        path="/book"
        element={
          <AuthGuard user={user} loading={loading}>
            <Book />
            <BottomNav isAdmin={isAdmin} />
          </AuthGuard>
        }
      />
      <Route
        path="/guide"
        element={
          <AuthGuard user={user} loading={loading}>
            <Guide />
            <BottomNav isAdmin={isAdmin} />
          </AuthGuard>
        }
      />
      <Route
        path="/profile"
        element={
          <AuthGuard user={user} loading={loading}>
            <Profile member={member} onLogout={logout} onRefresh={refreshMember} />
            <BottomNav isAdmin={isAdmin} />
          </AuthGuard>
        }
      />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <AuthGuard user={user} loading={loading}>
            <AdminGuard isAdmin={isAdmin} loading={loading}>
              <Admin />
              <BottomNav isAdmin={isAdmin} />
            </AdminGuard>
          </AuthGuard>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
