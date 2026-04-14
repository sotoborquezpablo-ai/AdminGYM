import React, { useState } from 'react';
import { useGymContext } from '../context/GymContext';
import { CreditCard, Plus, Check, X, AlertCircle, TrendingUp } from 'lucide-react';
import type { Payment, PaymentStatus, PaymentMethod } from '../types';

// --- Helpers ---
const formatCLP = (amount: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(amount);

const formatDate = (dateStr: string) => {
  try { const [y,m,d] = dateStr.split('T')[0].split('-'); return `${d}/${m}/${y}`; }
  catch { return dateStr; }
};

const STATUS_LABEL: Record<PaymentStatus, string> = {
  paid: 'Pagado', pending: 'Pendiente', overdue: 'Vencido', cancelled: 'Cancelado'
};
const STATUS_CLASS: Record<PaymentStatus, string> = {
  paid:      'bg-green-500/15 text-green-400',
  pending:   'bg-amber-500/15 text-amber-400',
  overdue:   'bg-red-500/15 text-red-400',
  cancelled: 'bg-gray-500/15 text-gray-400',
};
const METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: 'Efectivo', transfer: 'Transferencia', card: 'Tarjeta', webpay: 'Webpay'
};

const PaymentBadge: React.FC<{ status: PaymentStatus }> = ({ status }) => (
  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CLASS[status]}`}>
    {STATUS_LABEL[status]}
  </span>
);

// --- KPI card mini ---
const MiniKpi: React.FC<{ label: string; value: string; sub: string; color: string }> = ({ label, value, sub, color }) => (
  <div className={`bg-[#13151f] rounded-xl p-4 border border-white/5 border-l-2 ${color}`}>
    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
    <p className="text-xl font-bold text-white tabular-nums">{value}</p>
    <p className="text-xs text-gray-600 mt-0.5">{sub}</p>
  </div>
);

// --- Form nuevo pago ---
interface NewPaymentForm {
  memberId: string;
  amount: string;
  method: PaymentMethod;
  dueDate: string;
  notes: string;
}

const EMPTY_FORM: NewPaymentForm = {
  memberId: '', amount: '35000', method: 'webpay',
  dueDate: new Date().toISOString().split('T')[0], notes: ''
};

// --- Componente principal ---
const PaymentsAdmin: React.FC = () => {
  const { state, dispatch } = useGymContext();

  const [filterStatus, setFilterStatus] = useState<PaymentStatus | 'all'>('all');
  const [search, setSearch]             = useState('');
  const [showForm, setShowForm]         = useState(false);
  const [form, setForm]                 = useState<NewPaymentForm>(EMPTY_FORM);
  const [formError, setFormError]       = useState('');

  // Solo members
  const members = state.profiles.filter(p => p.role === 'member' && p.status === 'active');
  const getMemberName = (id: string) => state.profiles.find(p => p.id === id)?.fullName ?? 'Desconocido';

  // Pagos filtrados
  const filtered = state.payments
    .filter(p => filterStatus === 'all' || p.status === filterStatus)
    .filter(p => getMemberName(p.memberId).toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.dueDate.localeCompare(a.dueDate));

  // KPIs
  const totalPaid     = state.payments.filter(p => p.status === 'paid').reduce((s,p) => s + p.amount, 0);
  const totalPending  = state.payments.filter(p => p.status === 'pending').reduce((s,p) => s + p.amount, 0);
  const totalOverdue  = state.payments.filter(p => p.status === 'overdue').length;
  const currentMonth  = new Date().getMonth();
  const currentYear   = new Date().getFullYear();
  const monthRevenue  = state.payments
    .filter(p => p.status === 'paid' && p.paidAt &&
      new Date(p.paidAt).getMonth() === currentMonth &&
      new Date(p.paidAt).getFullYear() === currentYear)
    .reduce((s,p) => s + p.amount, 0);

  // Acciones
  const handleMarkPaid = (id: string) => {
    dispatch({ type: 'UPDATE_PAYMENT_STATUS', payload: { id, status: 'paid' } });
  };

  const handleMarkCancelled = (id: string) => {
    dispatch({ type: 'UPDATE_PAYMENT_STATUS', payload: { id, status: 'cancelled' } });
  };

  const handleSubmitForm = () => {
    if (!form.memberId) { setFormError('Selecciona un miembro'); return; }
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      setFormError('Ingresa un monto válido'); return;
    }
    if (!form.dueDate) { setFormError('Ingresa una fecha de vencimiento'); return; }

    dispatch({
      type: 'ADD_PAYMENT',
      payload: {
        id: `pay-${Date.now()}`,
        memberId: form.memberId,
        amount: Number(form.amount),
        currency: 'CLP',
        status: 'pending',
        dueDate: form.dueDate,
        paidAt: null,
        method: form.method,
        notes: form.notes,
      }
    });
    setForm(EMPTY_FORM);
    setShowForm(false);
    setFormError('');
  };

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Pagos</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} registros</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setFormError(''); }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#01696f]/20 text-[#4f98a3] hover:bg-[#01696f]/30 text-sm font-medium transition-colors"
        >
          <Plus size={15} /> Nuevo pago
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <MiniKpi label="Ingresos del mes"  value={formatCLP(monthRevenue)} sub="pagos confirmados"      color="border-l-green-500" />
        <MiniKpi label="Total cobrado"     value={formatCLP(totalPaid)}    sub="histórico"              color="border-l-[#01696f]" />
        <MiniKpi label="Por cobrar"        value={formatCLP(totalPending)} sub="pagos pendientes"       color="border-l-amber-500" />
        <MiniKpi label="Vencidos"          value={String(totalOverdue)}    sub="requieren atención"     color="border-l-red-500" />
      </div>

      {/* Formulario nuevo pago */}
      {showForm && (
        <div className="bg-[#13151f] rounded-xl border border-white/5 p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Registrar nuevo pago</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* Miembro */}
            <div>
              <label className="text-xs text-gray-500 block mb-1.5">Miembro *</label>
              <select
                value={form.memberId}
                onChange={e => setForm({ ...form, memberId: e.target.value })}
                className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-[#01696f] transition-colors"
              >
                <option value="">Seleccionar miembro...</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.fullName}</option>
                ))}
              </select>
            </div>

            {/* Monto */}
            <div>
              <label className="text-xs text-gray-500 block mb-1.5">Monto (CLP) *</label>
              <input
                type="number"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#01696f] transition-colors"
                placeholder="35000"
              />
            </div>

            {/* Método */}
            <div>
              <label className="text-xs text-gray-500 block mb-1.5">Método de pago</label>
              <select
                value={form.method}
                onChange={e => setForm({ ...form, method: e.target.value as PaymentMethod })}
                className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-[#01696f] transition-colors"
              >
                {(Object.keys(METHOD_LABEL) as PaymentMethod[]).map(m => (
                  <option key={m} value={m}>{METHOD_LABEL[m]}</option>
                ))}
              </select>
            </div>

            {/* Vencimiento */}
            <div>
              <label className="text-xs text-gray-500 block mb-1.5">Fecha vencimiento *</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={e => setForm({ ...form, dueDate: e.target.value })}
                className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-[#01696f] transition-colors"
              />
            </div>

            {/* Notas */}
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-500 block mb-1.5">Notas (opcional)</label>
              <input
                type="text"
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-[#01696f] transition-colors"
                placeholder="Ej: Mensualidad abril 2026"
              />
            </div>
          </div>

          {/* Error */}
          {formError && (
            <div className="flex items-center gap-2 mt-3 text-red-400 text-xs">
              <AlertCircle size={13} /> {formError}
            </div>
          )}

          {/* Acciones form */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSubmitForm}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#01696f] text-white text-sm font-medium hover:bg-[#0c4e54] transition-colors"
            >
              <Check size={14} /> Registrar pago
            </button>
            <button
              onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setFormError(''); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-gray-400 text-sm hover:bg-white/10 transition-colors"
            >
              <X size={14} /> Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-[#13151f] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#01696f] transition-colors"
        />
        <div className="flex gap-2 flex-wrap">
          {(['all', 'paid', 'pending', 'overdue', 'cancelled'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === s
                  ? 'bg-[#01696f]/20 text-[#4f98a3]'
                  : 'bg-white/5 text-gray-500 hover:text-gray-300'
              }`}
            >
              {s === 'all' ? 'Todos' : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-[#13151f] rounded-xl border border-white/5 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-600">
            <CreditCard size={36} className="mb-3 opacity-30" />
            <p className="text-sm">Sin pagos con este filtro</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-xs text-gray-500 uppercase">
                  <th className="px-5 py-3 text-left font-medium">Miembro</th>
                  <th className="px-5 py-3 text-left font-medium">Monto</th>
                  <th className="px-5 py-3 text-left font-medium hidden md:table-cell">Método</th>
                  <th className="px-5 py-3 text-left font-medium">Vencimiento</th>
                  <th className="px-5 py-3 text-left font-medium hidden lg:table-cell">Pagado el</th>
                  <th className="px-5 py-3 text-left font-medium">Estado</th>
                  <th className="px-5 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(pay => (
                  <tr key={pay.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-5 py-3 text-gray-200">{getMemberName(pay.memberId)}</td>
                    <td className="px-5 py-3 text-white font-medium tabular-nums">{formatCLP(pay.amount)}</td>
                    <td className="px-5 py-3 text-gray-400 hidden md:table-cell capitalize">{METHOD_LABEL[pay.method]}</td>
                    <td className="px-5 py-3 text-gray-400">{formatDate(pay.dueDate)}</td>
                    <td className="px-5 py-3 text-gray-500 hidden lg:table-cell">
                      {pay.paidAt ? formatDate(pay.paidAt) : '—'}
                    </td>
                    <td className="px-5 py-3"><PaymentBadge status={pay.status} /></td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {(pay.status === 'pending' || pay.status === 'overdue') && (
                          <button
                            onClick={() => handleMarkPaid(pay.id)}
                            title="Marcar como pagado"
                            className="p-1.5 rounded-lg text-gray-500 hover:text-green-400 hover:bg-green-500/10 transition-colors"
                          >
                            <Check size={14} />
                          </button>
                        )}
                        {pay.status !== 'cancelled' && pay.status !== 'paid' && (
                          <button
                            onClick={() => handleMarkCancelled(pay.id)}
                            title="Cancelar pago"
                            className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentsAdmin;