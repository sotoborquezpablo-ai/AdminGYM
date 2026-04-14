import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGymContext } from '../context/GymContext';
import { CreditCard, CheckCircle, AlertCircle, Clock, XCircle, ShieldAlert } from 'lucide-react';
import { hasPendingOverduePayment } from '../utils/paymentUtils';
import type { Payment } from '../types';


// --- Helpers ---
const formatCLP = (amount: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(amount);

const formatDate = (dateStr: string) => {
  try {
    const [y, m, d] = dateStr.split('T')[0].split('-');
    return `${d}/${m}/${y}`;
  } catch { return dateStr; }
};

const isOverdue = (dueDate: string, status: Payment['status']) =>
  status === 'pending' && dueDate < new Date().toISOString().split('T')[0];


// --- Status config ---
const STATUS_CONFIG = {
  paid: {
    label: 'Pagado',
    class: 'bg-green-500/15 text-green-400 border-green-500/20',
    icon: <CheckCircle size={13} />,
  },
  pending: {
    label: 'Pendiente',
    class: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    icon: <Clock size={13} />,
  },
  overdue: {
    label: 'Vencido',
    class: 'bg-red-500/15 text-red-400 border-red-500/20',
    icon: <AlertCircle size={13} />,
  },
  cancelled: {
    label: 'Cancelado',
    class: 'bg-gray-500/15 text-gray-400 border-gray-500/20',
    icon: <XCircle size={13} />,
  },
};

const PaymentBadge: React.FC<{ status: Payment['status'] }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.class}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
};


// --- Resumen card ---
const SummaryCard: React.FC<{
  label: string; value: string; sub: string;
  iconBg: string; icon: React.ReactNode;
}> = ({ label, value, sub, iconBg, icon }) => (
  <div className="bg-[#13151f] rounded-xl border border-white/5 p-4 flex items-center gap-4">
    <div className={`p-2.5 rounded-lg ${iconBg}`}>{icon}</div>
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-lg font-bold text-white tabular-nums mt-0.5">{value}</p>
      <p className="text-xs text-gray-600">{sub}</p>
    </div>
  </div>
);


// --- Componente principal ---
const MemberPayments: React.FC = () => {
  const { currentUser } = useAuth();
  const { state } = useGymContext();
  const [filter, setFilter] = useState<Payment['status'] | 'all'>('all');

  const memberId = currentUser?.id ?? '';

  // NUEVO: detectar suspensión por mora
  const memberProfile = state.profiles.find(p => p.id === memberId);
  const isSuspended = memberProfile
    ? hasPendingOverduePayment(memberProfile, state.payments)
    : false;

  const payments = state.payments
    .filter(p => p.memberId === memberId)
    .map(p => ({
      ...p,
      status: isOverdue(p.dueDate, p.status) ? 'overdue' as const : p.status,
    }))
    .sort((a, b) => b.dueDate.localeCompare(a.dueDate));

  const filtered = payments.filter(p => filter === 'all' || p.status === filter);

  // Resumen
  const totalPaid    = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'pending' || p.status === 'overdue').reduce((s, p) => s + p.amount, 0);
  const nextPayment  = payments.find(p => p.status === 'pending' || p.status === 'overdue');

  const METHOD_LABEL: Record<string, string> = {
    cash: 'Efectivo', transfer: 'Transferencia', card: 'Tarjeta', webpay: 'Webpay',
  };

  return (
    <div className="space-y-5 max-w-2xl">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Mis Pagos</h1>
        <p className="text-sm text-gray-500 mt-0.5">{payments.length} registros en total</p>
      </div>

      {/* NUEVO: Alerta de suspensión por mora */}
      {isSuspended && (
        <div className="flex items-start gap-3 p-4 bg-red-500/8 border border-red-500/20 rounded-xl">
          <ShieldAlert size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-300 text-sm font-semibold">Tu acceso está suspendido</p>
            <p className="text-red-400/70 text-xs mt-0.5">
              Tienes una cuota vencida hace más de 5 días. Acércate a recepción para regularizar tu situación y recuperar el acceso.
            </p>
          </div>
        </div>
      )}

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryCard
          label="Total pagado"
          value={formatCLP(totalPaid)}
          sub="pagos confirmados"
          iconBg="bg-green-500/10"
          icon={<CheckCircle size={18} className="text-green-400" />}
        />
        <SummaryCard
          label="Por pagar"
          value={formatCLP(totalPending)}
          sub={totalPending > 0 ? 'requiere atención' : 'al día 👍'}
          iconBg={totalPending > 0 ? 'bg-amber-500/10' : 'bg-green-500/10'}
          icon={<CreditCard size={18} className={totalPending > 0 ? 'text-amber-400' : 'text-green-400'} />}
        />
        <SummaryCard
          label="Próximo vencimiento"
          value={nextPayment ? formatDate(nextPayment.dueDate) : '—'}
          sub={nextPayment ? formatCLP(nextPayment.amount) : 'sin pagos pendientes'}
          iconBg="bg-blue-500/10"
          icon={<Clock size={18} className="text-blue-400" />}
        />
      </div>

      {/* Alerta vencido genérica (solo si NO está suspendido para no duplicar) */}
      {!isSuspended && payments.some(p => p.status === 'overdue') && (
        <div className="flex items-start gap-3 p-4 bg-red-500/8 border border-red-500/20 rounded-xl">
          <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-300 text-sm font-medium">Tienes pagos vencidos</p>
            <p className="text-red-400/70 text-xs mt-0.5">
              Comunícate con la administración del gimnasio para regularizar tu situación.
            </p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {([
          { key: 'all',       label: 'Todos' },
          { key: 'pending',   label: 'Pendientes' },
          { key: 'paid',      label: 'Pagados' },
          { key: 'overdue',   label: 'Vencidos' },
          { key: 'cancelled', label: 'Cancelados' },
        ] as const).map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f.key
                ? 'bg-[#01696f]/20 text-[#4f98a3]'
                : 'bg-white/5 text-gray-500 hover:text-gray-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista pagos */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-600">
          <CreditCard size={36} className="mb-3 opacity-30" />
          <p className="text-sm">Sin pagos con este filtro</p>
        </div>
      ) : (
        <div className="bg-[#13151f] rounded-xl border border-white/5 overflow-hidden">
          <div className="divide-y divide-white/5">
            {filtered.map(pay => (
              <div key={pay.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/3 transition-colors">

                {/* Icono estado */}
                <div className={`p-2 rounded-lg flex-shrink-0 ${STATUS_CONFIG[pay.status].class}`}>
                  {STATUS_CONFIG[pay.status].icon}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-semibold tabular-nums">{formatCLP(pay.amount)}</p>
                    <PaymentBadge status={pay.status} />
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-gray-500 text-xs">
                      Vence: <span className={pay.status === 'overdue' ? 'text-red-400' : 'text-gray-400'}>
                        {formatDate(pay.dueDate)}
                      </span>
                    </p>
                    {pay.paidAt && (
                      <p className="text-gray-600 text-xs">Pagado: {formatDate(pay.paidAt)}</p>
                    )}
                  </div>
                </div>

                {/* Método */}
                <p className="text-gray-600 text-xs flex-shrink-0 hidden sm:block capitalize">
                  {METHOD_LABEL[pay.method] ?? pay.method}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberPayments;