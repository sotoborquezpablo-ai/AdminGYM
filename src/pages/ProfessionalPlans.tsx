import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGymContext } from '../context/GymContext';
import { Users, ChevronDown, ChevronUp, Search, Dumbbell } from 'lucide-react';
import TrainingPlanView from '../components/TrainingPlanView';

const ProfessionalPlans: React.FC = () => {
  const { currentUser }  = useAuth();
  const { state }        = useGymContext();
  const [search, setSearch]     = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const professional = state.professionals.find(p => p.profileId === currentUser?.id);

  const clientIds = [...new Set(
    state.appointments
      .filter(a => a.professionalId === professional?.id)
      .map(a => a.memberId)
  )];

  const clients = state.profiles
    .filter(p => clientIds.includes(p.id))
    .filter(p => p.fullName.toLowerCase().includes(search.toLowerCase()));

  const toggle = (id: string) =>
    setExpanded(prev => (prev === id ? null : id));

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-white font-bold text-xl">Planes de Entrenamiento</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {clientIds.length} cliente{clientIds.length !== 1 ? 's' : ''} asignados
        </p>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Buscar cliente..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-[#13151f] border border-white/5 rounded-lg pl-8 pr-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#01696f] transition-colors"
        />
      </div>

      {/* Lista accordion */}
      {clients.length === 0 ? (
        <div className="bg-[#13151f] rounded-xl border border-white/5 flex flex-col items-center justify-center py-16 text-gray-600">
          <Dumbbell size={32} className="mb-3 opacity-20" />
          <p className="text-sm">Sin clientes asignados</p>
        </div>
      ) : (
        <div className="bg-[#13151f] rounded-xl border border-white/5 divide-y divide-white/5 overflow-hidden">
          {clients.map(client => {
            const open = expanded === client.id;
            const initials = client.fullName
              .split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();

            return (
              <div key={client.id}>
                {/* Header row */}
                <button
                  onClick={() => toggle(client.id)}
                  className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/3 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-full bg-[#01696f]/20 flex items-center justify-center text-[#4f98a3] text-xs font-bold flex-shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{client.fullName}</p>
                    <p className="text-gray-600 text-xs">{client.email}</p>
                  </div>
                  <span className={`mr-2 px-2 py-0.5 rounded-full text-xs font-medium ${client.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {client.status === 'active' ? 'Activo' : 'Inactivo'}
                  </span>
                  {open
                    ? <ChevronUp size={16} className="text-[#4f98a3] flex-shrink-0" />
                    : <ChevronDown size={16} className="text-gray-500 flex-shrink-0" />
                  }
                </button>

                {/* Panel expandido */}
                {open && (
                  <div className="px-5 pb-5 pt-2 bg-[#0f1117]/40">
                    <TrainingPlanView memberId={client.id} editable={true} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProfessionalPlans;