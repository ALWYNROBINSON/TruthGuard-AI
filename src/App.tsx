import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { Shield, Upload, BarChart3, History, Settings, LogOut, Menu, X, User as UserIcon, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthState, User, AnalysisResult } from './types';

// Pages (to be created)
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import AnalysisPage from './pages/AnalysisPage';
import ReportsPage from './pages/ReportsPage';
import AdminPage from './pages/AdminPage';

export default function App() {
  const initialToken = localStorage.getItem('token');
  const initialUserStr = localStorage.getItem('user');
  let initialUser = null;
  if (initialToken && initialUserStr) {
    try {
      initialUser = JSON.parse(initialUserStr);
    } catch { }
  }

  const [auth, setAuth] = useState<AuthState>({
    user: initialUser,
    token: initialToken,
    isAuthenticated: !!initialToken && !!initialUser
  });

  useEffect(() => {
    if (auth.token) {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setAuth(prev => ({ ...prev, user: JSON.parse(savedUser), isAuthenticated: true }));
      }
    }
  }, [auth.token]);

  const login = (token: string, user: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setAuth({ token, user, isAuthenticated: true });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuth({ token: null, user: null, isAuthenticated: false });
  };

  return (
    <Router>
      <div className="min-h-screen bg-cyber-bg text-slate-800">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage onLogin={login} />} />

          <Route
            path="/dashboard/*"
            element={
              auth.isAuthenticated ? (
                <DashboardLayout auth={auth} onLogout={logout}>
                  <Routes>
                    <Route index element={<Dashboard user={auth.user!} />} />
                    <Route path="upload" element={<AnalysisPage user={auth.user!} token={auth.token!} />} />
                    <Route path="reports" element={<ReportsPage user={auth.user!} token={auth.token!} />} />
                    {auth.user?.role === 'admin' && <Route path="admin" element={<AdminPage token={auth.token!} />} />}
                  </Routes>
                </DashboardLayout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

function DashboardLayout({ children, auth, onLogout }: { children: React.ReactNode, auth: AuthState, onLogout: () => void }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const navItems = [
    { icon: BarChart3, label: 'Overview', path: '/dashboard' },
    { icon: Upload, label: 'New Analysis', path: '/dashboard/upload' },
    { icon: History, label: 'Report History', path: '/dashboard/reports' },
  ];

  if (auth.user?.role === 'admin') {
    navItems.push({ icon: Settings, label: 'Admin Panel', path: '/dashboard/admin' });
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 80 }}
        className="bg-cyber-card border-r border-slate-200 flex flex-col z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]"
      >
        <Link to="/" className="p-6 flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer border-b border-white/5">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-cyber-accent/20 blur-md rounded-full -z-10" />
            <img src="/logo.png" alt="TruthGuard AI Logo" className="w-8 h-8 object-contain drop-shadow-[0_2px_4px_rgba(255,90,0,0.4)]" />
          </div>
          {isSidebarOpen && (
            <span className="font-bold text-xl tracking-tight text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
              TruthGuard AI
            </span>
          )}
        </Link>

        <nav className="flex-1 px-4 space-y-2 mt-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-900"
            >
              <item.icon size={24} className="shrink-0" />
              {isSidebarOpen && <span className="font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <button
            onClick={onLogout}
            className="flex items-center gap-4 p-3 w-full rounded-xl hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
          >
            <LogOut size={24} className="shrink-0" />
            {isSidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-cyber-bg relative">
        <header className="h-16 border-bottom border-slate-200 flex items-center justify-between px-8 sticky top-0 bg-cyber-bg/80 backdrop-blur-md z-10">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg">
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{auth.user?.name}</p>
              <p className="text-xs text-slate-500 capitalize">{auth.user?.role}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-cyber-accent/5 flex items-center justify-center border border-cyber-accent/30">
              <UserIcon size={20} className="text-cyber-accent" />
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
