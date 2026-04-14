import React, { useState } from 'react';
import { useGymContext } from '../context/GymContext';
import { Dumbbell, ChevronDown, ChevronUp, Plus, Check, TrendingUp } from 'lucide-react';

const formatDate = (dateStr: string) => {
  try { const [y, m, d] = dateStr.split('T')[0].split('-'); return `${d}/${m}/${y}`; }
  catch { return dateStr; }
};

const MUSCLE_COLOR: Record<string, string> = {
  legs:      'bg-green-500/15 text-green-400',
  chest:     'bg-red-500/15 text-red-400',
  back:      'bg-blue-500/15 text-blue-400',
  shoulders: 'bg-yellow-500/15 text-yellow-400',
  arms:      'bg-purple-500/15 text-purple-400',
  core:      'bg-orange-500/15 text-orange-400',
  cardio:    'bg-pink-500/15 text-pink-400',
};

const MuscleTag: React.FC<{ group: string }> = ({ group }) => (
  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${MUSCLE_COLOR[group.toLowerCase()] ?? 'bg-gray-500/15 text-gray-400'}`}>
    {group}
  </span>
);

const WeightProgress: React.FC<{ current: number; previous: number }> = ({ current, previous }) => {
  if (!previous) return null;
  const diff = current - previous;
  if (diff === 0) return null;
  const pct = Math.round((diff / previous) * 100);
  return (
    <span className={`text-xs font-medium ${diff > 0 ? 'text-green-400' : 'text-red-400'}`}>
      {diff > 0 ? '▲' : '▼'} {Math.abs(diff)} kg ({diff > 0 ? '+' : ''}{pct}%)
    </span>
  );
};

const LogHistory: React.FC<{ logs: { weightKg: number; repsDone: number; loggedAt: string }[] }> = ({ logs }) => {
  if (logs.length === 0) return <p className="text-xs text-gray-600 mt-2">Sin registros anteriores</p>;
  return (
    <div className="mt-3 space-y-1">
      <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
        <TrendingUp size={11} /> Últimos registros
      </p>
      {logs.slice(0, 4).map((log, i) => (
        <div key={i} className="flex items-center justify-between text-xs">
          <span className="text-gray-600">{formatDate(log.loggedAt)}</span>
          <span className="text-gray-400 tabular-nums">{log.weightKg} kg × {log.repsDone} reps</span>
        </div>
      ))}
    </div>
  );
};

// --- Props del componente genérico ---
interface TrainingPlanViewProps {
  memberId: string;
  editable?: boolean;   // true: puede registrar pesos | false: solo lectura
  showMemberName?: boolean; // true: muestra el nombre del miembro (útil para profesionales)
}

const TrainingPlanView: React.FC<TrainingPlanViewProps> = ({
  memberId,
  editable = true,
  showMemberName = false,
}) => {
  const { state, dispatch } = useGymContext();

  const activePlan = state.trainingPlans.find(p => p.memberId === memberId && p.isActive);
  const planExercises = activePlan
    ? state.planExercises
        .filter(pe => pe.planId === activePlan.id)
        .sort((a, b) => a.orderIndex - b.orderIndex)
    : [];

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [logForm, setLogForm]   = useState<{ planExerciseId: string; weight: string; reps: string } | null>(null);

  const toggleExpand = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const getExercise  = (exerciseId: string) => state.exercises.find(e => e.id === exerciseId);
  const getLogsFor   = (planExerciseId: string) =>
    state.exerciseLogs
      .filter(l => l.planExerciseId === planExerciseId && l.memberId === memberId)
      .sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));

  const handleSaveLog = () => {
    if (!logForm || !logForm.weight || parseFloat(logForm.weight) < 0) return;
    dispatch({
      type: 'ADD_EXERCISE_LOG',
      payload: {
        id:             `log-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        planExerciseId: logForm.planExerciseId,
        memberId,
        weightKg:  parseFloat(logForm.weight),
        repsDone:  parseInt(logForm.reps) || 0,
        loggedAt:  new Date().toISOString(),
      },
    });
    setLogForm(null);
  };

  const grouped = planExercises.reduce<Record<string, typeof planExercises>>((acc, pe) => {
    const group = getExercise(pe.exerciseId)?.muscleGroup ?? 'otros';
    if (!acc[group]) acc[group] = [];
    acc[group].push(pe);
    return acc;
  }, {});

  const memberName = showMemberName
    ? state.profiles.find(p => p.id === memberId)?.fullName
    : null;

  if (!activePlan) return (
    <div className="flex flex-col items-center justify-center h-48 text-gray-600">
      <Dumbbell size={36} className="mb-3 opacity-30" />
      <p className="text-sm font-medium text-gray-500">Sin plan activo</p>
      {!editable && <p className="text-xs mt-1 text-gray-600">No tiene plan asignado aún</p>}
      {editable  && <p className="text-xs mt-1">Tu entrenador aún no te ha asignado un plan</p>}
    </div>
  );

  return (
    <div className="space-y-4">

      {/* Header plan */}
      <div className="bg-[#13151f] rounded-xl border border-white/5 p-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#01696f]/15 rounded-lg">
            <Dumbbell size={20} className="text-[#4f98a3]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{activePlan.name}</h2>
            <p className="text-gray-500 text-xs mt-0.5">
              {memberName && <span className="text-[#4f98a3] mr-1">{memberName} ·</span>}
              Activo desde {formatDate(activePlan.startDate)} · {planExercises.length} ejercicios
              {!editable && (
                <span className="ml-2 px-1.5 py-0.5 rounded bg-white/5 text-gray-500">Solo lectura</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Ejercicios por grupo muscular */}
      {Object.entries(grouped).map(([group, exercises]) => (
        <div key={group} className="bg-[#13151f] rounded-xl border border-white/5 overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3 border-b border-white/5">
            <MuscleTag group={group} />
            <span className="text-gray-600 text-xs">{exercises.length} ejercicio{exercises.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="divide-y divide-white/5">
            {exercises.map(pe => {
              const exercise  = getExercise(pe.exerciseId);
              const logs      = getLogsFor(pe.id);
              const lastLog   = logs[0];
              const prevLog   = logs[1];
              const isOpen    = expanded[pe.id];
              const isEditing = logForm?.planExerciseId === pe.id;

              return (
                <div key={pe.id}>
                  <div className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-gray-500 text-xs flex-shrink-0 mt-0.5">
                        {pe.orderIndex}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-200 font-medium text-sm">{exercise?.name ?? 'Ejercicio'}</p>
                        <p className="text-gray-500 text-xs mt-0.5">
                          {pe.sets} series × {pe.reps} reps · {pe.restSeconds}s descanso
                        </p>
                        {lastLog && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[#4f98a3] text-xs font-semibold tabular-nums">
                              {lastLog.weightKg} kg × {lastLog.repsDone} reps
                            </span>
                            {prevLog && <WeightProgress current={lastLog.weightKg} previous={prevLog.weightKg} />}
                          </div>
                        )}
                      </div>

                      {/* Acciones — solo si editable */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {editable && (
                          <button
                            onClick={() => setLogForm(isEditing ? null : {
                              planExerciseId: pe.id,
                              weight: lastLog?.weightKg.toString() ?? '',
                              reps:   pe.reps.toString(),
                            })}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-white/5 text-gray-400 hover:bg-[#01696f]/15 hover:text-[#4f98a3] transition-colors"
                          >
                            <Plus size={11} /> Registrar
                          </button>
                        )}
                        {logs.length > 0 && (
                          <button
                            onClick={() => toggleExpand(pe.id)}
                            className="p-1.5 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-white/5 transition-colors"
                          >
                            {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Form inline — solo si editable */}
                    {editable && isEditing && (
                      <div className="flex items-end gap-2 mt-3 p-3 bg-white/3 rounded-lg ml-9">
                        <div className="flex-1">
                          <label className="text-xs text-gray-500 block mb-1">Peso (kg)</label>
                          <input
                            type="number"
                            value={logForm!.weight}
                            onChange={e => setLogForm({ ...logForm!, weight: e.target.value })}
                            className="w-full bg-[#0f1117] border border-white/10 rounded-md px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[#01696f]"
                            placeholder="0"
                            autoFocus
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs text-gray-500 block mb-1">Reps</label>
                          <input
                            type="number"
                            value={logForm!.reps}
                            onChange={e => setLogForm({ ...logForm!, reps: e.target.value })}
                            className="w-full bg-[#0f1117] border border-white/10 rounded-md px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[#01696f]"
                          />
                        </div>
                        <button
                          onClick={handleSaveLog}
                          className="p-2 rounded-lg bg-[#01696f] text-white hover:bg-[#0c4e54] transition-colors mb-0.5"
                        >
                          <Check size={14} />
                        </button>
                      </div>
                    )}

                    {isOpen && (
                      <div className="ml-9 mt-1">
                        <LogHistory logs={logs} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TrainingPlanView;