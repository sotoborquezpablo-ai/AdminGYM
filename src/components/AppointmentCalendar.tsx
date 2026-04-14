import React, { useState } from 'react';
import { useGymContext } from '../context/GymContext';
import {
  ChevronLeft, ChevronRight, Plus, X, Check,
  Calendar, CheckCircle, XCircle
} from 'lucide-react';
import type { Appointment, AppointmentStatus } from '../types';

const DAYS_ES   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                   'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const toKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

const addMinutes = (time: string, minutes: number): string => {
  const [h, m] = time.split(':').map(Number);
  const total  = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2,'0')}:${String(total % 60).padStart(2,'0')}`;
};

export const STATUS_CFG = {
  pending:   { label: 'Pendiente',  cls: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  confirmed: { label: 'Confirmada', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  completed: { label: 'Completada', cls: 'bg-green-500/15 text-green-400 border-green-500/20' },
  cancelled: { label: 'Cancelada',  cls: 'bg-red-500/15 text-red-400 border-red-500/20' },
} as const;

const HOURS = Array.from({ length: 13 }, (_, i) => `${String(i + 8).padStart(2,'0')}:00`);

interface AptForm {
  memberId: string;
  professionalId: string;
  date: string;
  time: string;
  duration: number;
  notes: string;
}

const EMPTY_FORM: AptForm = {
  memberId: '', professionalId: '', date: '', time: '09:00', duration: 60, notes: '',
};

// --- Props ---
interface AppointmentCalendarProps {
  appointments: Appointment[];        // ya filtradas desde el wrapper
  canCreate?: boolean;                // admin: true | profesional: false
  defaultProfessionalId?: string;     // profesional: pre-selecciona su id
}

const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  appointments,
  canCreate = false,
  defaultProfessionalId,
}) => {
  const { state, dispatch } = useGymContext();

  const today = new Date();
  const [cursor, setCursor]     = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selected, setSelected] = useState(toKey(today));
  const [modal, setModal]       = useState(false);
  const [form, setForm]         = useState<AptForm>({ ...EMPTY_FORM, date: toKey(today) });
  const [detailId, setDetailId] = useState<string | null>(null);

  // Calendario
  const firstDay = new Date(cursor.year, cursor.month, 1);
  const lastDay  = new Date(cursor.year, cursor.month + 1, 0);
  const cells: (Date | null)[] = [
    ...Array(firstDay.getDay()).fill(null),
    ...Array.from({ length: lastDay.getDate() }, (_, i) =>
      new Date(cursor.year, cursor.month, i + 1)
    ),
  ];

  const prevMonth = () => setCursor(c => ({
    year: c.month === 0 ? c.year - 1 : c.year,
    month: c.month === 0 ? 11 : c.month - 1,
  }));
  const nextMonth = () => setCursor(c => ({
    year: c.month === 11 ? c.year + 1 : c.year,
    month: c.month === 11 ? 0 : c.month + 1,
  }));

  const aptsByDay: Record<string, number> = {};
  appointments.forEach(a => { aptsByDay[a.date] = (aptsByDay[a.date] ?? 0) + 1; });

  const dayApts = appointments
    .filter(a => a.date === selected)
    .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));

  // Opciones form
  const members       = state.profiles.filter(p => p.role === 'member' && p.status === 'active');
  const professionals = state.professionals.map(pr => ({
    id:        pr.id,
    name:      state.profiles.find(p => p.id === pr.profileId)?.fullName ?? 'N/A',
    specialty: pr.specialty,
  }));

  const openNewModal = () => {
    setForm({
      ...EMPTY_FORM,
      date:           selected,
      professionalId: defaultProfessionalId ?? '',
    });
    setModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.memberId || !form.professionalId || !form.date || !form.time) return;
    dispatch({
      type: 'ADD_APPOINTMENT',
      payload: {
        id:             `apt-${Date.now()}`,
        memberId:       form.memberId,
        professionalId: form.professionalId,
        date:           form.date,
        time:           form.time,
        duration:       form.duration,
        startTime:      form.time,
        endTime:        addMinutes(form.time, form.duration),
        status:         'confirmed' as AppointmentStatus,
        notes:          form.notes,
        createdAt:      new Date().toISOString(),
      },
    });
    setModal(false);
  };

  const handleStatus = (id: string, status: keyof typeof STATUS_CFG) => {
    dispatch({ type: 'UPDATE_APPOINTMENT_STATUS', payload: { id, status } });
  };

  const inputCls  = 'w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-[#01696f] transition-colors';
  const selectCls = inputCls + ' appearance-none cursor-pointer';

  return (
    <div className="flex flex-col lg:flex-row gap-5 h-full">

      {/* ── Columna izquierda ── */}
      <div className="flex flex-col gap-4 w-full lg:w-80 flex-shrink-0">

        {/* Calendario */}
        <div className="bg-[#13151f] rounded-xl border border-white/5 p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
              <ChevronLeft size={16} />
            </button>
            <h2 className="text-sm font-semibold text-white">
              {MONTHS_ES[cursor.month]} {cursor.year}
            </h2>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {DAYS_ES.map(d => (
              <div key={d} className="text-center text-xs text-gray-600 py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((date, i) => {
              if (!date) return <div key={`e-${i}`} />;
              const key        = toKey(date);
              const isToday    = key === toKey(today);
              const isSelected = key === selected;
              const count      = aptsByDay[key] ?? 0;
              return (
                <button
                  key={key}
                  onClick={() => { setSelected(key); setDetailId(null); }}
                  className={`relative flex flex-col items-center justify-center h-9 w-full rounded-lg text-xs font-medium transition-colors ${
                    isSelected  ? 'bg-[#01696f] text-white'
                    : isToday   ? 'bg-[#01696f]/15 text-[#4f98a3]'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {date.getDate()}
                  {count > 0 && (
                    <span className={`absolute bottom-1 w-1 h-1 rounded-full ${isSelected ? 'bg-white/70' : 'bg-[#4f98a3]'}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Botón nueva cita — solo si canCreate */}
        {canCreate && (
          <button
            onClick={openNewModal}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#01696f]/20 text-[#4f98a3] hover:bg-[#01696f]/30 text-sm font-medium transition-colors"
          >
            <Plus size={15} /> Nueva cita
          </button>
        )}

        {/* Leyenda */}
        <div className="bg-[#13151f] rounded-xl border border-white/5 p-4 space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Estado</p>
          {Object.entries(STATUS_CFG).map(([key, { label, cls }]) => (
            <div key={key} className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-xs border ${cls}`}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Columna derecha: citas del día ── */}
      <div className="flex-1 min-w-0">
        <div className="bg-[#13151f] rounded-xl border border-white/5 h-full">

          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <div>
              <h2 className="text-white font-semibold text-sm">
                {(() => {
                  const [y, m, d] = selected.split('-');
                  const date = new Date(Number(y), Number(m) - 1, Number(d));
                  return `${DAYS_ES[date.getDay()]}, ${d} de ${MONTHS_ES[Number(m) - 1]}`;
                })()}
              </h2>
              <p className="text-gray-500 text-xs mt-0.5">
                {dayApts.length} cita{dayApts.length !== 1 ? 's' : ''}
              </p>
            </div>
            {canCreate && (
              <button
                onClick={openNewModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#01696f]/20 text-[#4f98a3] hover:bg-[#01696f]/30 text-xs font-medium transition-colors"
              >
                <Plus size={13} /> Añadir
              </button>
            )}
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: 480 }}>
            {dayApts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-600">
                <Calendar size={32} className="mb-3 opacity-30" />
                <p className="text-sm">Sin citas para este día</p>
                {canCreate && (
                  <button onClick={openNewModal} className="mt-3 text-xs text-[#4f98a3] hover:underline">
                    + Crear primera cita
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {dayApts.map(apt => {
                  const member = state.profiles.find(p => p.id === apt.memberId);
                  const prof   = professionals.find(p => p.id === apt.professionalId);
                  const cfg    = STATUS_CFG[apt.status as keyof typeof STATUS_CFG];
                  const isOpen = detailId === apt.id;
                  return (
                    <div key={apt.id}>
                      <button
                        onClick={() => setDetailId(isOpen ? null : apt.id)}
                        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/3 transition-colors text-left"
                      >
                        <div className="flex-shrink-0 text-center w-12">
                          <p className="text-[#4f98a3] text-sm font-bold tabular-nums">
                            {(apt.time ?? apt.startTime ?? '').slice(0, 5)}
                          </p>
                          <p className="text-gray-600 text-xs">{apt.duration ?? 60}min</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-white text-sm font-medium truncate">
                              {member?.fullName ?? 'N/A'}
                            </p>
                            <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs border ${cfg?.cls}`}>
                              {cfg?.label}
                            </span>
                          </div>
                          <p className="text-gray-500 text-xs mt-0.5 truncate">
                            {prof?.specialty ?? ''}{prof ? ` · ${prof.name}` : ''}
                          </p>
                        </div>
                      </button>

                      {isOpen && (
                        <div className="px-5 pb-4 pt-1 bg-white/2 border-t border-white/5 space-y-3">
                          {apt.notes && <p className="text-gray-400 text-xs">📝 {apt.notes}</p>}
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-gray-600 text-xs mr-1">Cambiar estado:</p>
                            {(Object.entries(STATUS_CFG) as [keyof typeof STATUS_CFG, typeof STATUS_CFG[keyof typeof STATUS_CFG]][]).map(([key, { label, cls }]) => (
                              <button
                                key={key}
                                onClick={() => handleStatus(apt.id, key)}
                                className={`px-2 py-0.5 rounded-full text-xs border transition-opacity ${cls} ${
                                  apt.status === key ? 'opacity-100 ring-1 ring-white/20' : 'opacity-50 hover:opacity-100'
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal nueva cita ── */}
      {modal && canCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#13151f] rounded-2xl border border-white/10 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <h3 className="text-white font-semibold text-sm">Nueva cita</h3>
              <button onClick={() => setModal(false)} className="text-gray-500 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Miembro</label>
                <select required value={form.memberId} onChange={e => setForm({ ...form, memberId: e.target.value })} className={selectCls}>
                  <option value="">Seleccionar miembro...</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
                </select>
              </div>

              {/* Solo admin elige profesional; profesional ya está fijo */}
              {!defaultProfessionalId && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Profesional</label>
                  <select required value={form.professionalId} onChange={e => setForm({ ...form, professionalId: e.target.value })} className={selectCls}>
                    <option value="">Seleccionar profesional...</option>
                    {professionals.map(p => <option key={p.id} value={p.id}>{p.name} — {p.specialty}</option>)}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Fecha</label>
                  <input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Hora</label>
                  <select value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} className={selectCls}>
                    {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Duración</label>
                <select value={form.duration} onChange={e => setForm({ ...form, duration: Number(e.target.value) })} className={selectCls}>
                  {[30, 45, 60, 90, 120].map(d => <option key={d} value={d}>{d} minutos</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1.5">
                  Notas <span className="text-gray-700">(opcional)</span>
                </label>
                <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Indicaciones, objetivo de la sesión..." className={inputCls + ' resize-none'} />
              </div>

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setModal(false)} className="flex-1 py-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 text-sm transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-[#01696f]/20 text-[#4f98a3] hover:bg-[#01696f]/30 text-sm font-medium transition-colors">
                  <Check size={14} /> Crear cita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentCalendar;