import React, { useState, useEffect } from 'react';
import { useGymContext } from '../context/GymContext';
import { useAuth } from '../context/AuthContext';
import { Users, DollarSign, AlertCircle, UserPlus, Calendar, TrendingUp } from 'lucide-react';
import type { Payment, Appointment } from '../types';

// --- Helpers ---
const formatCLP = (amount: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(amount);

const formatDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

const today = new Date().toISOString().split('T')[0];

// --- Badge de estado pago ---
const PaymentBadge: React.FC<{ status: Payment['status'] }> = ({ status }) => {
  const map = {
    paid:     'bg-green-500/15 text-green-400',
    pending:  'bg-amber-500/15 text-amber-400',
    overdue:  'bg-red-500/15 text-red-400',
    cancelled:'bg-gray-500/15 text-gray-400',
  };
  const label = { paid: 'Pagado', pending: 'Pendiente', overdue: 'Vencido', cancelled: 'Cancelado' };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status]}`}>
      {label[status]}
    </span>
  );
};

// --- Badge de estado cita ---
const AppointmentBadge: React.FC<{ status: Appointment['status'] }> = ({ status }) => {
  const map = {
    confirmed: 'bg-green-500/15 text-green-400',
    pending:   'bg-amber-500/15 text-amber-400',
    cancelled: 'bg-red-500/15 text-red-400',
    completed: 'bg-blue-500/15 text-blue-400',
  };
  const label = { confirmed: 'Confirmada', pending: 'Pendiente', cancelled: 'Cancelada', completed: 'Completada' };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status]}`}>
      {label[status]}
    </span>
  );
};

// --- Skeleton ---
const SkeletonCard = () => (
  <div className="bg-[#13151f] rounded-xl p-5 border border-white/5 animate-pulse">
    <div className="h-3 w-24 bg-white/10 rounded mb-4" />
    <div className="h-8 w-32 bg-white/10 rounded mb-2" />
    <div className="h-3 w-20 bg-white/5 rounded" />
  </div>
);

// --- KPI Card ---
interface KpiCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  borderColor: string;
  sub?: string;
}
const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon, borderColor, sub }) => (
  <div className={`bg-[#13151f] rounded-xl p-5 border border-white/5 border-l-2 ${borderColor} flex items-start gap-4`}>
    <div className="p-2 bg-white/5 rounded-lg text-gray-400 mt-0.5">
      {icon}
    </div>
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  </div>
);

// --- AdminDashboard ---
const AdminDashboard: React.FC = () => {
  const { state } = useGymContext();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(t);
  }, []);

  // KPIs
  const activeMembers = state.profiles.filter(p => p.role === 'member' && p.status === 'active').length;

  const currentMonth = new Date().getMonth();
  const currentYear  = new Date().getFullYear();
  const monthRevenue = state.payments
    .filter(p => p.status === 'paid' && p.paidAt && new Date(p.paidAt).getMonth() === currentMonth && new Date(p.paidAt).getFullYear() === currentYear)
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingPayments = state.payments.filter(p => p.status === 'pending' || p.status === 'overdue').length;

  const thisMonthStart = new Date(currentYear, currentMonth, 1).toISOString();
  const newThisMonth = state.profiles.filter(p => p.role === 'member' && p.createdAt >= thisMonthStart).length;

  // Últimos 5 pagos
  const lastPayments = [...state.payments]
    .sort((a, b) => (b.dueDate > a.dueDate ? 1 : -1))
    .slice(0, 5);

  // Citas de hoy
  const todayAppointments = state.appointments.filter(a => a.date === today);

  // Helper: nombre de miembro
  const getMemberName = (id: string) =>
    state.profiles.find(p => p.id === id)?.fullName ?? 'Desconocido';

  // Helper: nombre de profesional
  const getProfName = (id: string) => {
    const prof = state.professionals.find(p => p.id === id);
    if (!prof) return 'Desconocido';
    return state.profiles.find(p => p.id === prof.profileId)?.fullName ?? 'Desconocido';
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Bienvenido, {currentUser?.fullName} — {formatDate(today)}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <KpiCard
              title="Miembros activos"
              value={String(activeMembers)}
              icon={<Users size={18} />}
              borderColor="border-l-[#01696f]"
              sub="usuarios con membresía"
            />
            <KpiCard
              title="Ingresos del mes"
              value={formatCLP(monthRevenue)}
              icon={<DollarSign size={18} />}
              borderColor="border-l-green-500"
              sub={`${new Date().toLocaleString('es-CL', { month: 'long', year: 'numeric' })}`}
            />
            <KpiCard
              title="Pagos pendientes"
              value={String(pendingPayments)}
              icon={<AlertCircle size={18} />}
              borderColor="border-l-amber-500"
              sub="pendientes + vencidos"
            />
            <KpiCard
              title="Nuevos este mes"
              value={String(newThisMonth)}
              icon={<UserPlus size={18} />}
              borderColor="border-l-blue-500"
              sub="miembros registrados"
            />
          </>
        )}
      </div>

      {/* Tablas */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* Últimos pagos */}
        <div className="bg-[#13151f] rounded-xl border border-white/5">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-white/5">
            <TrendingUp size={16} className="text-[#4f98a3]" />
            <h2 className="text-sm font-semibold text-white">Últimos pagos</h2>
          </div>
          {loading ? (
            <div className="p-5 space-y-3 animate-pulse">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-8 bg-white/5 rounded" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase">
                    <th className="px-5 py-3 text-left font-medium">Miembro</th>
                    <th className="px-5 py-3 text-left font-medium">Monto</th>
                    <th className="px-5 py-3 text-left font-medium">Estado</th>
                    <th className="px-5 py-3 text-left font-medium">Vencimiento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {lastPayments.map(pay => (
                    <tr key={pay.id} className="hover:bg-white/3 transition-colors">
                      <td className="px-5 py-3 text-gray-300">{getMemberName(pay.memberId)}</td>
                      <td className="px-5 py-3 text-white font-medium tabular-nums">{formatCLP(pay.amount)}</td>
                      <td className="px-5 py-3"><PaymentBadge status={pay.status} /></td>
                      <td className="px-5 py-3 text-gray-400">{formatDate(pay.dueDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Citas de hoy */}
        <div className="bg-[#13151f] rounded-xl border border-white/5">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-white/5">
            <Calendar size={16} className="text-[#4f98a3]" />
            <h2 className="text-sm font-semibold text-white">Citas de hoy</h2>
            <span className="ml-auto text-xs text-gray-500">{formatDate(today)}</span>
          </div>
          {loading ? (
            <div className="p-5 space-y-3 animate-pulse">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 bg-white/5 rounded" />
              ))}
            </div>
          ) : todayAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-600">
              <Calendar size={32} className="mb-3 opacity-30" />
              <p className="text-sm">Sin citas programadas para hoy</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {todayAppointments.map(apt => (
                <div key={apt.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/3 transition-colors">
                  <div className="text-center min-w-[48px]">
                    <p className="text-[#4f98a3] font-bold text-sm tabular-nums">{apt.startTime}</p>
                    <p className="text-gray-600 text-xs">{apt.endTime}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-200 text-sm truncate">{getMemberName(apt.memberId)}</p>
                    <p className="text-gray-500 text-xs truncate">con {getProfName(apt.professionalId)}</p>
                  </div>
                  <AppointmentBadge status={apt.status} />
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;