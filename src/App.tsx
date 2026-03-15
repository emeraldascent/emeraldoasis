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
import { Map } from './pages/Map';
import { Profile } from './pages/Profile';
import { Admin } from './pages/Admin';
import { ResetPassword } from './pages/ResetPassword';

function AppContent() {
  const { user, member, badgeStatus, loading, logout, refreshMember } = useMember();
  const { isAdmin, loading: adminLoading } = useAdmin(user);
  const isAuthenticated = !!user;

  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Welcome />} />
        <Route path="/join" element={<Join />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Public — useful for everyone */}
        <Route
          path="/guide"
          element={
            <>
              <Guide />
              <BottomNav isAuthenticated={isAuthenticated} isAdmin={isAdmin} />
            </>
          }
        />
        <Route
          path="/map"
          element={
            <>
              <Map />
              <BottomNav isAuthenticated={isAuthenticated} isAdmin={isAdmin} />
            </>
          }
        />

        {/* Authenticated routes */}
        <Route
          path="/welcome"
          element={
            <AuthGuard user={user} loading={loading}>
              <WelcomeConfirmation member={member} />
            </AuthGuard>
          }
        />
        <Route
          path="/dashboard"
          element={
            <AuthGuard user={user} loading={loading}>
              <Dashboard member={member} badgeStatus={badgeStatus} />
              <BottomNav isAuthenticated={isAuthenticated} isAdmin={isAdmin} />
            </AuthGuard>
          }
        />
        <Route
          path="/book"
          element={
            <AuthGuard user={user} loading={loading}>
              <Book member={member} badgeStatus={badgeStatus} onRefreshMember={refreshMember} />
              <BottomNav isAuthenticated={isAuthenticated} isAdmin={isAdmin} />
            </AuthGuard>
          }
        />
        <Route
          path="/profile"
          element={
            <AuthGuard user={user} loading={loading}>
              <Profile member={member} onLogout={logout} onRefresh={refreshMember} />
              <BottomNav isAuthenticated={isAuthenticated} isAdmin={isAdmin} />
            </AuthGuard>
          }
        />

        {/* Admin — role-based access via user_roles table */}
        <Route
          path="/admin"
          element={
            <AuthGuard user={user} loading={loading}>
              <AdminGuard isAdmin={isAdmin} loading={adminLoading}>
                <Admin />
                <BottomNav isAuthenticated={isAuthenticated} isAdmin={isAdmin} />
              </AdminGuard>
            </AuthGuard>
          }
        />
      </Routes>
    </>
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
