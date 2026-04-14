import React, { useState } from 'react';
import { Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGymContext } from '../context/GymContext';
import { hasPendingOverduePayment } from '../utils/paymentUtils';
import {
  LayoutDashboard, Users, CreditCard, Calendar, BarChart2,
  CalendarCheck, ClipboardList, Dumbbell,
  Clock, Wallet, User, LogOut, Menu, X, ShieldAlert
} from 'lucide-react';
import AdminDashboard       from '../pages/AdminDashboard';
import MembersList          from '../pages/MembersList';
import MemberDetail         from '../pages/MemberDetail';
import PaymentsAdmin        from '../pages/PaymentsAdmin';
import MemberPlan           from '../pages/MemberPlan';
import MemberAppointments   from '../pages/MemberAppointments';
import MemberPayments       from '../pages/MemberPayments';
import ProfileManagement    from '../pages/ProfileManagement';
import AdminReports         from '../pages/AdminReports';
import AdminCalendar        from '../pages/AdminCalendar';
import ProfessionalCalendar from '../pages/ProfessionalCalendar';
import ProfessionalPlans    from '../pages/ProfessionalPlans';

// --- Helpers de rol ---
const PROFESSIONAL_ROLES = ['trainer', 'kinesiologist'];
const isProfessional = (role: string) => PROFESSIONAL_ROLES.includes(role);

const ROLE_LABELS: Record<string, string> = {
  admin:         'Admin',
  trainer:       'Entrenador',
  kinesiologist: 'Kinesiólogo',
  member:        'Miembro',
};

// --- Placeholder ---
const Placeholder: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex flex-col items-center justify-center h-64 text-gray-400">
    <Dumbbell size={40} className="mb-4 opacity-30" />
    <p className="text-lg font-medium">{title}</p>
    <p className="text-sm opacity-60">Próximamente</p>
  </div>
);

// --- Pantalla bloqueada por mora ---
const BlockedScreen: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#0f1117] px-6 text-center">
      <div className="p-4 rounded-full bg-red-500/10 mb-5">
        <ShieldAlert size={40} className="text-red-400" />
      </div>
      <h1 className="text-white text-xl font-bold mb-2">Acceso suspendido</h1>
      <p className="text-gray-400 text-sm max-w-sm mb-1">
        Tu cuenta tiene una cuota vencida y tu acceso ha sido bloqueado temporalmente.
      </p>
      <p className="text-gray-600 text-xs max-w-sm mb-8">
        Acércate a recepción o comunícate con la administración del gimnasio para regularizar tu situación.
      </p>
      <button
        onClick={() => { logout(); navigate('/login'); }}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white text-sm transition-colors"
      >
        <LogOut size={15} /> Cerrar sesión
      </button>
    </div>
  );
};

// --- Redirección por rol ---
const NavigateByRole: React.FC = () => {
  const { currentUser } = useAuth();
  const dest =
    currentUser?.role === 'member'               ? '/member/plan'
    : isProfessional(currentUser?.role ?? '')    ? '/professional/calendar'
    : '/dashboard';
  return <Navigate to={dest} replace />;
};

// --- Nav items ---
interface NavItem { path: string; label: string; icon: React.ReactNode; }

const navByRole: Record<string, NavItem[]> = {
  admin: [
    { path: '/dashboard',             label: 'Dashboard',     icon: <LayoutDashboard size={18} /> },
    { path: '/admin/members',         label: 'Usuarios',      icon: <Users size={18} /> },
    { path: '/admin/payments',        label: 'Pagos',         icon: <CreditCard size={18} /> },
    { path: '/admin/calendar',        label: 'Calendario',    icon: <Calendar size={18} /> },
    { path: '/admin/reports',         label: 'Reportes',      icon: <BarChart2 size={18} /> },
  ],
  professional: [
    { path: '/professional/calendar', label: 'Mi Calendario', icon: <CalendarCheck size={18} /> },
    { path: '/professional/plans',    label: 'Clientes',      icon: <ClipboardList size={18} /> },
    { path: '/professional/profile',  label: 'Mi Perfil',     icon: <User size={18} /> },
  ],
  member: [
    { path: '/member/plan',           label: 'Mi Plan',       icon: <Dumbbell size={18} /> },
    { path: '/member/appointments',   label: 'Mis Citas',     icon: <Clock size={18} /> },
    { path: '/member/payments',       label: 'Mis Pagos',     icon: <Wallet size={18} /> },
    { path: '/member/profile',        label: 'Mi Perfil',     icon: <User size={18} /> },
  ],
};

const getNavKey = (role: string) =>
  isProfessional(role) ? 'professional' : role;

// --- Sidebar ---
const Sidebar: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const role     = currentUser?.role ?? 'member';
  const navItems = navByRole[getNavKey(role)] ?? [];

  const initials = currentUser?.fullName
    .split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() ?? '?';

  return (
    <aside className="flex flex-col h-full bg-[#13151f] border-r border-white/5" style={{ width: 240 }}>

      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-white/5">
        <Dumbbell size={22} className="text-[#01696f]" />
        <span className="font-bold text-white text-base tracking-wide">GymManager</span>
        <button onClick={onClose} className="ml-auto md:hidden text-gray-500 hover:text-white">
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-[#01696f]/20 text-[#4f98a3] font-medium'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-white/5">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-[#01696f]/30 flex items-center justify-center text-[#4f98a3] text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{currentUser?.fullName}</p>
            <p className="text-gray-500 text-xs">{ROLE_LABELS[role] ?? role}</p>
          </div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            title="Cerrar sesión"
            className="text-gray-500 hover:text-red-400 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

// --- Layout principal ---
const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser } = useAuth();
  const { state } = useGymContext();

  const memberProfile = currentUser?.role === 'member'
    ? state.profiles.find(p => p.id === currentUser.id)
    : null;
  const isBlocked = memberProfile
    ? hasPendingOverduePayment(memberProfile, state.payments)
    : false;

  if (isBlocked) return <BlockedScreen />;

  return (
    <div className="flex h-screen bg-[#0f1117] overflow-hidden">

      {/* Sidebar desktop */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar onClose={() => {}} />
      </div>

      {/* Sidebar mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-50">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header mobile */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-[#13151f] border-b border-white/5">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-white">
            <Menu size={20} />
          </button>
          <Dumbbell size={18} className="text-[#01696f]" />
          <span className="text-white font-semibold text-sm">GymManager</span>
        </header>

        {/* Rutas */}
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            {/* Admin */}
            <Route path="dashboard"             element={<AdminDashboard />} />
            <Route path="admin/members"         element={<MembersList />} />
            <Route path="admin/members/:id"     element={<MemberDetail />} />
            <Route path="admin/payments"        element={<PaymentsAdmin />} />
            <Route path="admin/calendar"        element={<AdminCalendar />} />
            <Route path="admin/reports"         element={<AdminReports />} />

            {/* Profesional */}
            <Route path="professional/calendar" element={<ProfessionalCalendar />} />
            <Route path="professional/plans"    element={<ProfessionalPlans />} />
            <Route path="professional/profile"  element={<ProfileManagement />} />

            {/* Member */}
            <Route path="member/plan"           element={<MemberPlan />} />
            <Route path="member/appointments"   element={<MemberAppointments />} />
            <Route path="member/payments"       element={<MemberPayments />} />
            <Route path="member/profile"        element={<ProfileManagement />} />

            {/* Fallback */}
            <Route path="*"                     element={<NavigateByRole />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;