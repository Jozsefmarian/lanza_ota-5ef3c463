import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  LogOut,
  LayoutDashboard,
  Users,
  Hotel,
  Settings,
  BarChart3,
  Bell,
  Search,
  ChevronDown,
  Menu,
  X,
  Globe,
  CreditCard,
  MessageSquare,
  TrendingUp,
  Calendar,
  Activity,
} from 'lucide-react';
import { adminSignOut } from '@/lib/adminAuth';
import { AdminAuthContext } from './AdminProtectedRoute';

type SidebarItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
};

const sidebarItems: SidebarItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'bookings', label: 'Bookings', icon: <Calendar className="w-4 h-4" />, badge: '12' },
  { id: 'hotels', label: 'Hotels', icon: <Hotel className="w-4 h-4" /> },
  { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'payments', label: 'Payments', icon: <CreditCard className="w-4 h-4" /> },
  { id: 'messages', label: 'Messages', icon: <MessageSquare className="w-4 h-4" />, badge: '3' },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
];

const statsCards = [
  { label: 'Total Bookings', value: '1,284', change: '+12.5%', up: true, icon: <Calendar className="w-5 h-5" /> },
  { label: 'Revenue', value: '$48,290', change: '+8.2%', up: true, icon: <TrendingUp className="w-5 h-5" /> },
  { label: 'Active Users', value: '3,421', change: '+5.1%', up: true, icon: <Users className="w-5 h-5" /> },
  { label: 'Conversion Rate', value: '3.2%', change: '-0.4%', up: false, icon: <Activity className="w-5 h-5" /> },
];

const recentBookings = [
  { id: 'BK-001', guest: 'Anna Kovács', hotel: 'Hotel Marriott Budapest', date: '2026-02-12', status: 'confirmed', amount: '$342' },
  { id: 'BK-002', guest: 'Peter Nagy', hotel: 'Hilton Garden Inn', date: '2026-02-11', status: 'pending', amount: '$189' },
  { id: 'BK-003', guest: 'Maria Szabó', hotel: 'Corinthia Budapest', date: '2026-02-11', status: 'confirmed', amount: '$567' },
  { id: 'BK-004', guest: 'László Tóth', hotel: 'Four Seasons Gresham', date: '2026-02-10', status: 'cancelled', amount: '$890' },
  { id: 'BK-005', guest: 'Éva Kiss', hotel: 'Aria Hotel Budapest', date: '2026-02-10', status: 'confirmed', amount: '$445' },
];

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { admin } = useContext(AdminAuthContext);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
  await adminSignOut();
  navigate('/admin/login', { replace: true });
};

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'pending': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-white/[0.06] flex flex-col transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white text-sm">Lanza Admin</span>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveSection(item.id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeSection === item.id
                  ? 'bg-indigo-500/10 text-indigo-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              {item.icon}
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span className="px-1.5 py-0.5 text-xs rounded-full bg-indigo-500/20 text-indigo-300">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
              {admin?.fullName?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{admin?.fullName || 'Admin'}</p>
              <p className="text-xs text-slate-500 truncate">{admin?.role || 'admin'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 bg-slate-900/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Search */}
            <div className="hidden sm:flex items-center gap-2 bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-1.5 w-64">
              <Search className="w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent text-sm text-white placeholder-slate-500 outline-none w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button
              type="button"
              className="relative p-2 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full" />
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 hover:bg-white/[0.06] rounded-lg transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                  {admin?.fullName?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <span className="hidden sm:block text-sm text-slate-300">{admin?.fullName || 'Admin'}</span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-slate-800 border border-white/10 rounded-lg shadow-xl z-50 py-1">
                    <div className="px-3 py-2 border-b border-white/[0.06]">
                      <p className="text-sm text-white font-medium truncate">{admin?.fullName}</p>
                      <p className="text-xs text-slate-500 truncate">{admin?.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setActiveSection('settings'); setUserMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-white/[0.06] flex items-center gap-2"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      Settings
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-white/[0.06] flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {activeSection === 'dashboard' && (
            <div className="space-y-6">
              {/* Page Title */}
              <div>
                <h2 className="text-xl font-bold text-white">Dashboard</h2>
                <p className="text-sm text-slate-400 mt-0.5">Welcome back, {admin?.fullName || 'Admin'}</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statsCards.map((stat, i) => (
                  <div
                    key={i}
                    className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.06] transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                        {stat.icon}
                      </div>
                      <span
                        className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                          stat.up
                            ? 'text-emerald-400 bg-emerald-500/10'
                            : 'text-red-400 bg-red-500/10'
                        }`}
                      >
                        {stat.change}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Recent Bookings Table */}
              <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                  <h3 className="font-semibold text-white text-sm">Recent Bookings</h3>
                  <button
                    type="button"
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    onClick={() => setActiveSection('bookings')}
                  >
                    View all
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">ID</th>
                        <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Guest</th>
                        <th className="text-left text-xs font-medium text-slate-500 px-5 py-3 hidden md:table-cell">Hotel</th>
                        <th className="text-left text-xs font-medium text-slate-500 px-5 py-3 hidden sm:table-cell">Date</th>
                        <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Status</th>
                        <th className="text-right text-xs font-medium text-slate-500 px-5 py-3">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentBookings.map((booking) => (
                        <tr
                          key={booking.id}
                          className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="px-5 py-3 text-sm text-slate-300 font-mono">{booking.id}</td>
                          <td className="px-5 py-3 text-sm text-white">{booking.guest}</td>
                          <td className="px-5 py-3 text-sm text-slate-400 hidden md:table-cell">{booking.hotel}</td>
                          <td className="px-5 py-3 text-sm text-slate-500 hidden sm:table-cell">{booking.date}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex px-2 py-0.5 text-xs rounded-full border ${getStatusColor(booking.status)}`}>
                              {booking.status}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-sm text-white text-right font-medium">{booking.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setActiveSection('hotels')}
                  className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.06] transition-colors text-left group"
                >
                  <Hotel className="w-5 h-5 text-indigo-400 mb-2" />
                  <p className="text-sm font-medium text-white">Manage Hotels</p>
                  <p className="text-xs text-slate-500 mt-0.5">View and edit hotel listings</p>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('users')}
                  className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.06] transition-colors text-left group"
                >
                  <Users className="w-5 h-5 text-purple-400 mb-2" />
                  <p className="text-sm font-medium text-white">User Management</p>
                  <p className="text-xs text-slate-500 mt-0.5">Manage registered users</p>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('analytics')}
                  className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.06] transition-colors text-left group"
                >
                  <Globe className="w-5 h-5 text-emerald-400 mb-2" />
                  <p className="text-sm font-medium text-white">Site Analytics</p>
                  <p className="text-xs text-slate-500 mt-0.5">Traffic and performance data</p>
                </button>
              </div>
            </div>
          )}

          {/* Placeholder sections for other nav items */}
          {activeSection !== 'dashboard' && (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-4">
                {sidebarItems.find(s => s.id === activeSection)?.icon || <Settings className="w-6 h-6 text-slate-500" />}
              </div>
              <h3 className="text-lg font-semibold text-white mb-1 capitalize">{activeSection}</h3>
              <p className="text-sm text-slate-500 max-w-sm">
                This section is under development. Content for <strong className="text-slate-300">{activeSection}</strong> will be available soon.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
