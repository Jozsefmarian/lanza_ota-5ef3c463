import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAdminAuthenticated, getStoredAdmin, type AdminUser } from '@/lib/adminAuth';
import { Shield } from 'lucide-react';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export const AdminAuthContext = React.createContext<{
  admin: AdminUser | null;
  refreshAdmin: () => void;
}>({
  admin: null,
  refreshAdmin: () => {},
});

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [admin, setAdmin] = useState<AdminUser | null>(null);

  const checkAuth = async () => {
  const isAuth = await isAdminAuthenticated();
  const storedAdmin = getStoredAdmin();
  setAuthenticated(isAuth);
  setAdmin(storedAdmin);
  setChecking(false);
};

  useEffect(() => {
    // Small delay to simulate auth check
    const timer = setTimeout(() => { void checkAuth(); }, 200)
    return () => clearTimeout(timer);
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500/20 mb-3">
            <Shield className="w-6 h-6 text-indigo-400 animate-pulse" />
          </div>
          <p className="text-slate-400 text-sm">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return (
    <AdminAuthContext.Provider value={{ admin, refreshAdmin: checkAuth }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export default AdminProtectedRoute;
