import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGymContext } from '../context/GymContext';
import { ArrowLeft, User, Dumbbell, Clock, CreditCard, History, Plus, Check, AlertCircle, ShieldOff, Shield } from 'lucide-react';
import { hasPendingOverduePayment } from '../utils/paymentUtils'; // NUEVO
import type { Payment, Appointment } from '../types';


// --- Helpers ---
const formatCLP = (amount: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(amount);

const formatDate = (dateStr: string) => {
  try { const [y,m,d] = dateStr.split('T')[0].split('-'); return `${d}/${m}/${y}`; }
  catch { return dateStr; }
};

const PaymentBadge: React.FC<{ status: Payment['status'] }> = ({ status }) => {
  const map = { paid:'bg-green-500/15 text-green-400', pending:'bg-amber-500/15 text-amber-400', overdue:'bg-red-500/15 text-red-400', cancelled:'bg-gray-500/15 text-gray-400' };
  const label = { paid:'Pagado', pending:'Pendiente', overdue:'Vencido', cancelled:'Cancelado' };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status]}`}>{label[status]}</span>;
};

const AppointmentBadge: React.FC<{ status: Appointment['status'] }> = ({ status }) => {
  const map = { confirmed:'bg-green-500/15 text-green-400', pending:'bg-amber-500/15 text-amber-400', cancelled:'bg-red-500/15 text-red-400', completed:'bg-blue-500/15 text-blue-400' };
  const label = { confirmed:'Confirmada', pending:'Pendiente', cancelled:'Cancelada', completed:'Completada' };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status]}`}>{label[status]}</span>;
};

type Tab = 'plan' | 'appointments' | 'payments' | 'history';


const MemberDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useGymContext();
  const [activeTab, setActiveTab] = useState<Tab>('plan');
  const [logForm, setLogForm] = useState<{ planExerciseId: string; weight: string; reps: string } | null>(null);

  const profile = state.profiles.find(p => p.id === id);
  if (!profile) return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
      <User size={36} className="mb-3 opacity-30" />
      <p>Miembro no encontrado</p>
      <button onClick={() => navigate(-1)} className="mt-4 text-[#4f98a3] text-sm hover:underline">Volver</button>
    </div>
  );

  const initials = profile.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  // Data relacionada
  const payments     = state.payments.filter(p => p.memberId === id).sort((a,b) => b.dueDate.localeCompare(a.dueDate));
  const appointments = state.appointments.filter(a => a.memberId === id).sort((a,b) => b.date.localeCompare(a.date));
  const activePlan   = state.trainingPlans.find(p => p.memberId === id && p.isActive);
  const planExercises = activePlan
    ? state.planExercises.filter(pe => pe.planId === activePlan.id).sort((a,b) => a.orderIndex - b.orderIndex)
    : [];

  // NUEVO: estado efectivo del miembro
  const isOverdue  = profile.status === 'active' && !profile.bypassSuspension && hasPendingOverduePayment(profile, state.payments);
  const isOverride = profile.status === 'active' && profile.bypassSuspension;

  const getExerciseName = (exerciseId: string) => state.exercises.find(e => e.id === exerciseId)?.name ?? 'Ejercicio';
  const getMuscleGroup  = (exerciseId: string) => state.exercises.find(e => e.id === exerciseId)?.muscleGroup ?? '';
  const getLastLog = (planExerciseId: string) =>
    state.exerciseLogs
      .filter(l => l.planExerciseId === planExerciseId && l.memberId === id)
      .sort((a,b) => b.loggedAt.localeCompare(a.loggedAt))[0];

  const getProfName = (professionalId: string) => {
    const prof = state.professionals.find(p => p.id === professionalId);
    if (!prof) return 'Desconocido';
    return state.profiles.find(p => p.id === prof.profileId)?.fullName ?? 'Desconocido';
  };

  const handleSaveLog = () => {
    if (!logForm || !logForm.weight) return;
    dispatch({
      type: 'ADD_EXERCISE_LOG',
      payload: {
        id: `log-${Date.now()}`,
        planExerciseId: logForm.planExerciseId,
        memberId: id!,
        weightKg: parseFloat(logForm.weight),
        repsDone: parseInt(logForm.reps) || 0,
        loggedAt: new Date().toISOString(),
      }
    });
    setLogForm(null);
  };

  const handleBypass = (value: boolean) => {
    dispatch({ type: 'BYPASS_SUSPENSION', payload: { memberId: profile.id, value } });
  };

  const totalPaid    = payments.filter(p => p.status === 'paid').reduce((s,p) => s + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'pending' || p.status === 'overdue').reduce((s,p) => s + p.amount, 0);

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'plan',         label: 'Plan Actual', icon: <Dumbbell size={14} /> },
    { key: 'appointments', label: 'Citas',       icon: <Clock size={14} /> },
    { key: 'payments',     label: 'Pagos',       icon: <CreditCard size={14} /> },
    { key: 'history',      label: 'Historial',   icon: <History size={14} /> },
  ];

  return (
    <div className="space-y-5 max-w-4xl">

      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors">
        <ArrowLeft size={15} /> Volver a usuarios
      </button>

      {/* NUEVO: Alerta de suspensión por mora */}
      {isOverdue && (
        <div className="flex items-start justify-between gap-4 p-4 bg-red-500/8 border border-red-500/20 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-300 text-sm font-semibold">Miembro suspendido por mora</p>
              <p className="text-red-400/70 text-xs mt-0.5">
                Tiene una cuota vencida (más de 5 días). Su acceso está bloqueado hasta regularizar el pago.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleBypass(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-xs font-medium flex-shrink-0 transition-colors"
          >
            <ShieldOff size={13} /> Activar igualmente
          </button>
        </div>
      )}

      {/* NUEVO: Badge de override activo */}
      {isOverride && (
        <div className="flex items-center justify-between gap-4 p-3 bg-amber-500/8 border border-amber-500/20 rounded-xl">
          <div className="flex items-center gap-3">
            <ShieldOff size={14} className="text-amber-400 flex-shrink-0" />
            <p className="text-amber-300 text-sm">
              Suspensión omitida por admin — tiene cuota vencida pero acceso activo.
            </p>
          </div>
          <button
            onClick={() => handleBypass(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 text-xs transition-colors"
          >
            <Shield size={13} /> Reaplicar restricción
          </button>
        </div>
      )}

      {/* Header perfil */}
      <div className="bg-[#13151f] rounded-xl border border-white/5 p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#01696f]/25 flex items-center justify-center text-[#4f98a3] text-lg font-bold">
            {initials}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-white">{profile.fullName}</h1>
              {/* MODIFICADO: badge refleja estado efectivo */}
              {isOverdue ? (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/15 text-red-400">
                  Suspendido · Mora
                </span>
              ) : isOverride ? (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-400">
                  Activo (override)
                </span>
              ) : (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  profile.status === 'active'
                    ? 'bg-green-500/15 text-green-400'
                    : 'bg-red-500/15 text-red-400'
                }`}>
                  {profile.status === 'active' ? 'Activo' : 'Inactivo'}
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm mt-0.5">{profile.email}</p>
            <p className="text-gray-600 text-xs mt-0.5">{profile.phone} · Ingresó el {formatDate(profile.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#13151f] rounded-lg p-1 border border-white/5 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
              activeTab === tab.key
                ? 'bg-[#01696f]/20 text-[#4f98a3] font-medium'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Plan Actual */}
      {activeTab === 'plan' && (
        <div className="bg-[#13151f] rounded-xl border border-white/5">
          {!activePlan ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-600">
              <Dumbbell size={36} className="mb-3 opacity-30" />
              <p className="text-sm">Sin plan activo asignado</p>
            </div>
          ) : (
            <>
              <div className="px-5 py-4 border-b border-white/5">
                <p className="text-white font-semibold">{activePlan.name}</p>
                <p className="text-gray-500 text-xs mt-0.5">Desde {formatDate(activePlan.startDate)}</p>
              </div>
              <div className="divide-y divide-white/5">
                {planExercises.map(pe => {
                  const lastLog  = getLastLog(pe.id);
                  const isEditing = logForm?.planExerciseId === pe.id;
                  return (
                    <div key={pe.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-gray-200 font-medium">{getExerciseName(pe.exerciseId)}</p>
                            <span className="px-1.5 py-0.5 bg-white/5 rounded text-gray-500 text-xs capitalize">{getMuscleGroup(pe.exerciseId)}</span>
                          </div>
                          <p className="text-gray-500 text-xs mt-0.5">{pe.sets} series × {pe.reps} reps · {pe.restSeconds}s descanso</p>
                          {lastLog && (
                            <p className="text-[#4f98a3] text-xs mt-1">
                              Último: <span className="font-semibold">{lastLog.weightKg} kg × {lastLog.repsDone} reps</span>
                              <span className="text-gray-600 ml-2">{formatDate(lastLog.loggedAt)}</span>
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => setLogForm(isEditing ? null : { planExerciseId: pe.id, weight: lastLog?.weightKg.toString() ?? '', reps: pe.reps.toString() })}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-white/5 text-gray-400 hover:bg-[#01696f]/15 hover:text-[#4f98a3] transition-colors flex-shrink-0"
                        >
                          <Plus size={12} /> Registrar
                        </button>
                      </div>
                      {isEditing && (
                        <div className="flex items-center gap-2 mt-3 p-3 bg-white/3 rounded-lg">
                          <div className="flex-1">
                            <label className="text-xs text-gray-500 block mb-1">Peso (kg)</label>
                            <input
                              type="number"
                              value={logForm.weight}
                              onChange={e => setLogForm({ ...logForm, weight: e.target.value })}
                              className="w-full bg-[#0f1117] border border-white/10 rounded-md px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[#01696f]"
                              placeholder="0"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs text-gray-500 block mb-1">Reps</label>
                            <input
                              type="number"
                              value={logForm.reps}
                              onChange={e => setLogForm({ ...logForm, reps: e.target.value })}
                              className="w-full bg-[#0f1117] border border-white/10 rounded-md px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[#01696f]"
                            />
                          </div>
                          <button
                            onClick={handleSaveLog}
                            className="mt-5 p-2 rounded-lg bg-[#01696f]/20 text-[#4f98a3] hover:bg-[#01696f]/30 transition-colors"
                          >
                            <Check size={15} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab: Citas */}
      {activeTab === 'appointments' && (
        <div className="bg-[#13151f] rounded-xl border border-white/5">
          {appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-600">
              <Clock size={36} className="mb-3 opacity-30" />
              <p className="text-sm">Sin citas registradas</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {appointments.slice(0,10).map(apt => (
                <div key={apt.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="text-center min-w-[52px]">
                    <p className="text-[#4f98a3] font-bold text-sm tabular-nums">{apt.startTime}</p>
                    <p className="text-gray-600 text-xs">{formatDate(apt.date)}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-300 text-sm">con {getProfName(apt.professionalId)}</p>
                    {apt.notes && <p className="text-gray-600 text-xs truncate">{apt.notes}</p>}
                  </div>
                  <AppointmentBadge status={apt.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Pagos */}
      {activeTab === 'payments' && (
        <div className="bg-[#13151f] rounded-xl border border-white/5">
          {payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-600">
              <CreditCard size={36} className="mb-3 opacity-30" />
              <p className="text-sm">Sin pagos registrados</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-xs text-gray-500 uppercase">
                      <th className="px-5 py-3 text-left font-medium">Vencimiento</th>
                      <th className="px-5 py-3 text-left font-medium">Monto</th>
                      <th className="px-5 py-3 text-left font-medium">Método</th>
                      <th className="px-5 py-3 text-left font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {payments.map(pay => (
                      <tr key={pay.id} className="hover:bg-white/3 transition-colors">
                        <td className="px-5 py-3 text-gray-400">{formatDate(pay.dueDate)}</td>
                        <td className="px-5 py-3 text-white font-medium tabular-nums">{formatCLP(pay.amount)}</td>
                        <td className="px-5 py-3 text-gray-400 capitalize">{pay.method}</td>
                        <td className="px-5 py-3"><PaymentBadge status={pay.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-6 px-5 py-3 border-t border-white/5">
                <div>
                  <p className="text-xs text-gray-500">Total pagado</p>
                  <p className="text-green-400 font-semibold tabular-nums">{formatCLP(totalPaid)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total pendiente</p>
                  <p className="text-amber-400 font-semibold tabular-nums">{formatCLP(totalPending)}</p>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab: Historial */}
      {activeTab === 'history' && (
        <div className="bg-[#13151f] rounded-xl border border-white/5">
          {state.exerciseLogs.filter(l => l.memberId === id).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-600">
              <History size={36} className="mb-3 opacity-30" />
              <p className="text-sm">Sin registros de entrenamiento</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {state.exerciseLogs
                .filter(l => l.memberId === id)
                .sort((a,b) => b.loggedAt.localeCompare(a.loggedAt))
                .map(log => {
                  const pe = state.planExercises.find(pe => pe.id === log.planExerciseId);
                  const exName = pe ? getExerciseName(pe.exerciseId) : 'Ejercicio';
                  return (
                    <div key={log.id} className="flex items-center gap-4 px-5 py-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#01696f] flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-gray-300 text-sm">{exName}</p>
                        <p className="text-gray-600 text-xs">{formatDate(log.loggedAt)}</p>
                      </div>
                      <p className="text-[#4f98a3] text-sm font-semibold tabular-nums">
                        {log.weightKg} kg × {log.repsDone} reps
                      </p>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MemberDetail;