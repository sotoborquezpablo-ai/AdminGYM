import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGymContext } from '../context/GymContext';
import { Clock, Calendar, ChevronDown, ChevronUp, X } from 'lucide-react';
import type { Appointment } from '../types';

// --- Helpers ---
const formatDate = (dateStr: string) => {
  try {
    const [y, m, d] = dateStr.split('T')[0].split('-');
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return date.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return dateStr; }
};

const isUpcoming = (dateStr: string) => dateStr >= new Date().toISOString().split('T')[0];

const STATUS_LABEL: Record<Appointment['status'], string> = {
  confirmed: 'Confirmada',
  pending:   'Pendiente',
  cancelled: 'Cancelada',
  completed: 'Completada',
};
const STATUS_CLASS: Record<Appointment['status'], string> = {
  confirmed: 'bg-green-500/15 text-green-400',
  pending:   'bg-amber-500/15 text-amber-400',
  cancelled: 'bg-red-500/15 text-red-400',
  completed: 'bg-blue-500/15 text-blue-400',
};

const AppointmentBadge: React.FC<{ status: Appointment['status'] }> = ({ status }) => (
  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CLASS[status]}`}>
    {STATUS_LABEL[status]}
  </span>
);

// --- Card de cita ---
const AppointmentCard: React.FC<{
  appointment: Appointment;
  profName: string;
  profSpecialty: string;
  onCancel?: (id: string) => void;
}> = ({ appointment, profName, profSpecialty, onCancel }) => {
  const [expanded, setExpanded] = useState(false);
  const upcoming = isUpcoming(appointment.date);
  const canCancel = upcoming && appointment.status !== 'cancelled';

  return (
    <div className={`bg-[#13151f] rounded-xl border transition-colors ${
      upcoming ? 'border-white/10' : 'border-white/5 opacity-70'
    }`}>
      <div className="px-5 py-4">
        <div className="flex items-start gap-4">

          {/* Fecha bloque */}
          <div className={`flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center ${
            upcoming ? 'bg-[#01696f]/15' : 'bg-white/5'
          }`}>
            <p className={`text-lg font-bold tabular-nums leading-none ${upcoming ? 'text-[#4f98a3]' : 'text-gray-500'}`}>
              {appointment.date.split('-')[2]}
            </p>
            <p className={`text-xs uppercase mt-0.5 ${upcoming ? 'text-[#4f98a3]/70' : 'text-gray-600'}`}>
              {new Date(appointment.date + 'T12:00:00').toLocaleDateString('es-CL', { month: 'short' })}
            </p>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-gray-200 font-medium text-sm">{profName}</p>
              <span className="text-gray-600 text-xs">·</span>
              <span className="text-gray-500 text-xs">{profSpecialty}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Clock size={12} className="text-gray-600" />
              <p className="text-gray-400 text-xs tabular-nums">
                {appointment.startTime} – {appointment.endTime}
              </p>
            </div>
            <p className="text-gray-600 text-xs mt-1 capitalize">{formatDate(appointment.date)}</p>
          </div>

          {/* Badge + acciones */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <AppointmentBadge status={appointment.status} />
            {appointment.notes && (
              <button
                onClick={() => setExpanded(e => !e)}
                className="p-1 rounded text-gray-600 hover:text-gray-300 transition-colors"
              >
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
          </div>
        </div>

        {/* Notas expandidas */}
        {expanded && appointment.notes && (
          <div className="mt-3 ml-[4.5rem] p-3 bg-white/3 rounded-lg">
            <p className="text-gray-400 text-xs">{appointment.notes}</p>
          </div>
        )}

        {/* Botón cancelar */}
        {canCancel && (
          <div className="mt-3 ml-[4.5rem]">
            <button
              onClick={() => onCancel?.(appointment.id)}
              className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-red-400 transition-colors"
            >
              <X size={12} /> Cancelar cita
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Componente principal ---
const MemberAppointments: React.FC = () => {
  const { currentUser } = useAuth();
  const { state, dispatch } = useGymContext();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  const memberId = currentUser?.id ?? '';

  const getProfInfo = (professionalId: string) => {
    const prof = state.professionals.find(p => p.id === professionalId);
    const profile = prof ? state.profiles.find(p => p.id === prof.profileId) : null;
    return {
      name:      profile?.fullName ?? 'Profesional',
      specialty: prof?.specialty ?? '',
    };
  };

  const allAppointments = state.appointments
    .filter(a => a.memberId === memberId)
    .sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      return dateCompare !== 0 ? dateCompare : a.startTime.localeCompare(b.startTime);
    });

  const today = new Date().toISOString().split('T')[0];
  const upcoming = allAppointments.filter(a => a.date >= today && a.status !== 'cancelled');
  const past     = allAppointments.filter(a => a.date < today || a.status === 'cancelled');

  const handleCancel = (id: string) => {
    dispatch({ type: 'UPDATE_APPOINTMENT_STATUS', payload: { id, status: 'cancelled' } });
  };

  const current = tab === 'upcoming' ? upcoming : past;

  return (
    <div className="space-y-5 max-w-2xl">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Mis Citas</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {upcoming.length} próxima{upcoming.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#13151f] rounded-lg p-1 border border-white/5 w-fit">
        {[
          { key: 'upcoming', label: `Próximas (${upcoming.length})` },
          { key: 'past',     label: `Historial (${past.length})` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
              tab === t.key
                ? 'bg-[#01696f]/20 text-[#4f98a3] font-medium'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {current.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-600">
          <Calendar size={36} className="mb-3 opacity-30" />
          <p className="text-sm">
            {tab === 'upcoming' ? 'No tienes citas próximas' : 'Sin historial de citas'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {current.map(apt => {
            const { name, specialty } = getProfInfo(apt.professionalId);
            return (
              <AppointmentCard
                key={apt.id}
                appointment={apt}
                profName={name}
                profSpecialty={specialty}
                onCancel={tab === 'upcoming' ? handleCancel : undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MemberAppointments;