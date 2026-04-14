import React, { useState } from 'react';
import { useGymContext } from '../context/GymContext';
import {
  TrendingUp, Users, CreditCard, Calendar,
  CheckCircle, AlertCircle, Clock, XCircle, ChevronDown
} from 'lucide-react';

// --- Helpers ---
const formatCLP = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);

const formatDate = (s: string) => {
  try { const [y,m,d] = s.split('T')[0].split('-'); return `${d}/${m}/${y}`; }
  catch { return s; }
};

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

// --- KPI Card ---
const KpiCard: React.FC<{
  label: string; value: string; sub: string;
  icon: React.ReactNode; iconBg: string; trend?: string; trendUp?: boolean;
}> = ({ label, value, sub, icon, iconBg, trend, trendUp }) => (
  <div className="bg-[#13151f] rounded-xl border border-white/5 p-5">
    <div className="flex items-start justify-between gap-3">
      <div className={`p-2.5 rounded-lg ${iconBg}`}>{icon}</div>
      {trend && (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          trendUp ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
        }`}>
          {trendUp ? '↑' : '↓'} {trend}
        </span>
      )}
    </div>
    <p className="text-2xl font-bold text-white tabular-nums mt-3">{value}</p>
    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    <p className="text-xs text-gray-700 mt-0.5">{sub}</p>
  </div>
);

// --- Mini bar chart (CSS) ---
const BarChart: React.FC<{ data: { label: string; value: number; max: number }[] }> = ({ data }) => (
  <div className="space-y-2">
    {data.map(({ label, value, max }) => (
      <div key={label} className="flex items-center gap-3">
        <span className="text-xs text-gray-500 w-8 text-right tabular-nums">{label}</span>
        <div className="flex-1 h-5 bg-white/5 rounded-md overflow-hidden">
          <div
            className="h-full bg-[#01696f]/60 rounded-md transition-all duration-500"
            style={{ width: max > 0 ? `${(value / max) * 100}%` : '0%' }}
          />
        </div>
        <span className="text-xs text-gray-400 tabular-nums w-20 text-right">{formatCLP(value)}</span>
      </div>
    ))}
  </div>
);

// --- Componente principal ---
const AdminReports: React.FC = () => {
  const { state } = useGymContext();
  const [period, setPeriod] = useState<3 | 6 | 12>(6);

  const now = new Date();

  // --- Calcular métricas ---
  const members  = state.profiles.filter(p => p.role === 'member');
  const activeM  = members.filter(p => p.status === 'active').length;
  const inactiveM = members.filter(p => p.status === 'inactive').length;

  const payments = state.payments;
  const paid     = payments.filter(p => p.status === 'paid');
  const pending  = payments.filter(p => p.status === 'pending' || p.status === 'overdue');
  const totalPaid    = paid.reduce((s, p) => s + p.amount, 0);
  const totalPending = pending.reduce((s, p) => s + p.amount, 0);

  const appointments = state.appointments;
  const confirmedApts = appointments.filter(a => a.status === 'confirmed' || a.status === 'completed').length;

  // Pagos por mes (últimos N meses)
  const monthlyData = Array.from({ length: period }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (period - 1 - i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const total = paid
      .filter(p => p.paidAt?.startsWith(key))
      .reduce((s, p) => s + p.amount, 0);
    return { label: MONTHS[d.getMonth()], value: total, key };
  });
  const maxMonthly = Math.max(...monthlyData.map(d => d.value), 1);

  // Estado de pagos (donut simulado con barras)
  const paymentStatusData = [
    { label: 'Pagados',   count: paid.length,                                        color: 'bg-green-400' },
    { label: 'Pendientes',count: payments.filter(p => p.status === 'pending').length, color: 'bg-amber-400' },
    { label: 'Vencidos',  count: payments.filter(p => p.status === 'overdue').length, color: 'bg-red-400' },
    { label: 'Cancelados',count: payments.filter(p => p.status === 'cancelled').length, color: 'bg-gray-500' },
  ];
  const totalPayments = payments.length || 1;

  // Top miembros por deuda
  const memberDebt = members.map(m => ({
    name: m.fullName,
    debt: payments
      .filter(p => p.memberId === m.id && (p.status === 'pending' || p.status === 'overdue'))
      .reduce((s, p) => s + p.amount, 0),
  })).filter(m => m.debt > 0).sort((a, b) => b.debt - a.debt).slice(0, 5);

  // Citas por profesional
  const aptByProf = state.professionals.map(prof => {
    const name = state.profiles.find(p => p.id === prof.profileId)?.fullName ?? 'N/A';
    return {
      name,
      total: appointments.filter(a => a.professionalId === prof.id).length,
      confirmed: appointments.filter(a => a.professionalId === prof.id && (a.status === 'confirmed' || a.status === 'completed')).length,
    };
  }).sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Reportes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Resumen general del gimnasio</p>
        </div>
        {/* Selector período */}
        <div className="relative">
          <select
            value={period}
            onChange={e => setPeriod(Number(e.target.value) as 3 | 6 | 12)}
            className="appearance-none bg-[#13151f] border border-white/10 rounded-lg pl-3 pr-8 py-2 text-sm text-gray-300 focus:outline-none focus:border-[#01696f] cursor-pointer"
          >
            <option value={3}>Últimos 3 meses</option>
            <option value={6}>Últimos 6 meses</option>
            <option value={12}>Últimos 12 meses</option>
          </select>
          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Miembros activos"
          value={String(activeM)}
          sub={`${inactiveM} inactivos`}
          iconBg="bg-blue-500/10"
          icon={<Users size={18} className="text-blue-400" />}
        />
        <KpiCard
          label="Ingresos cobrados"
          value={formatCLP(totalPaid)}
          sub={`${paid.length} pagos`}
          iconBg="bg-green-500/10"
          icon={<TrendingUp size={18} className="text-green-400" />}
          trend="este período"
          trendUp
        />
        <KpiCard
          label="Por cobrar"
          value={formatCLP(totalPending)}
          sub={`${pending.length} pagos pendientes`}
          iconBg="bg-amber-500/10"
          icon={<CreditCard size={18} className="text-amber-400" />}
          trend={`${pending.length} en mora`}
          trendUp={false}
        />
        <KpiCard
          label="Citas confirmadas"
          value={String(confirmedApts)}
          sub={`de ${appointments.length} totales`}
          iconBg="bg-purple-500/10"
          icon={<Calendar size={18} className="text-purple-400" />}
        />
      </div>

      {/* Gráficos fila */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Ingresos por mes */}
        <div className="bg-[#13151f] rounded-xl border border-white/5 p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Ingresos por mes</h2>
          {monthlyData.every(d => d.value === 0) ? (
            <p className="text-gray-600 text-sm text-center py-8">Sin datos de ingresos</p>
          ) : (
            <BarChart data={monthlyData.map(d => ({ ...d, max: maxMonthly }))} />
          )}
        </div>

        {/* Estado de pagos */}
        <div className="bg-[#13151f] rounded-xl border border-white/5 p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Estado de pagos</h2>
          <div className="space-y-3">
            {paymentStatusData.map(({ label, count, color }) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${color} flex-shrink-0`} />
                <span className="text-sm text-gray-400 flex-1">{label}</span>
                <span className="text-sm text-gray-300 tabular-nums font-medium">{count}</span>
                <div className="w-24 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color} rounded-full opacity-70`}
                    style={{ width: `${(count / totalPayments) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600 w-8 tabular-nums">
                  {Math.round((count / totalPayments) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fila inferior */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Top deudores */}
        <div className="bg-[#13151f] rounded-xl border border-white/5 p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Miembros con deuda</h2>
          {memberDebt.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-600">
              <CheckCircle size={28} className="mb-2 opacity-40" />
              <p className="text-sm">Todos al día 🎉</p>
            </div>
          ) : (
            <div className="space-y-3">
              {memberDebt.map(({ name, debt }) => (
                <div key={name} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                      <AlertCircle size={11} className="text-red-400" />
                    </div>
                    <span className="text-sm text-gray-300 truncate">{name}</span>
                  </div>
                  <span className="text-sm text-red-400 font-semibold tabular-nums flex-shrink-0">
                    {formatCLP(debt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Citas por profesional */}
        <div className="bg-[#13151f] rounded-xl border border-white/5 p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Citas por profesional</h2>
          {aptByProf.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-8">Sin datos</p>
          ) : (
            <div className="space-y-3">
              {aptByProf.map(({ name, total, confirmed }) => (
                <div key={name} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#01696f]/15 flex items-center justify-center flex-shrink-0">
                    <span className="text-[#4f98a3] text-xs font-bold">{name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-300 truncate">{name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#01696f]/60 rounded-full"
                          style={{ width: total > 0 ? `${(confirmed / total) * 100}%` : '0%' }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 tabular-nums whitespace-nowrap">
                        {confirmed}/{total}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminReports;