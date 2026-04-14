import React, { useState } from 'react';
import { useGymContext } from '../context/GymContext';
import { useNavigate } from 'react-router-dom';
import { Search, UserX, UserCheck, Eye, Users, AlertCircle, ShieldOff } from 'lucide-react';
import { hasPendingOverduePayment } from '../utils/paymentUtils';
import type { Profile } from '../types';


// --- Helpers ---
const formatDate = (dateStr: string) => {
  try {
    const [y, m, d] = dateStr.split('T')[0].split('-');
    return `${d}/${m}/${y}`;
  } catch { return dateStr; }
};


const RoleBadge: React.FC<{ role: Profile['role'] }> = ({ role }) => {
  const map = {
    admin:         'bg-purple-500/15 text-purple-400',
    trainer:       'bg-blue-500/15 text-blue-400',
    kinesiologist: 'bg-orange-500/15 text-orange-400',
    member:        'bg-gray-500/15 text-gray-400',
  };
  const label = {
    admin: 'Admin', trainer: 'Entrenador',
    kinesiologist: 'Kinesiólogo', member: 'Miembro',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[role]}`}>
      {label[role]}
    </span>
  );
};


// --- Status badge ahora recibe effectiveStatus ---
type EffectiveStatus = 'active' | 'inactive' | 'suspended' | 'override';

const StatusBadge: React.FC<{ effectiveStatus: EffectiveStatus }> = ({ effectiveStatus }) => {
  const map: Record<EffectiveStatus, { label: string; cls: string }> = {
    active:    { label: 'Activo',            cls: 'bg-green-500/15 text-green-400' },
    inactive:  { label: 'Inactivo',          cls: 'bg-red-500/15 text-red-400' },
    suspended: { label: 'Suspendido · Mora', cls: 'bg-red-500/15 text-red-400' },
    override:  { label: 'Activo (override)', cls: 'bg-amber-500/15 text-amber-400' },
  };
  const { label, cls } = map[effectiveStatus];
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
};


const Avatar: React.FC<{ name: string }> = ({ name }) => {
  const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full bg-[#01696f]/25 flex items-center justify-center text-[#4f98a3] text-xs font-bold flex-shrink-0">
      {initials}
    </div>
  );
};


// --- Helper para calcular el estado efectivo ---
function getEffectiveStatus(profile: Profile, payments: ReturnType<typeof useGymContext>['state']['payments']): EffectiveStatus {
  if (profile.status === 'inactive') return 'inactive';
  if (profile.bypassSuspension) return 'override';
  if (hasPendingOverduePayment(profile, payments)) return 'suspended';
  return 'active';
}


const ITEMS_PER_PAGE = 10;


const MembersList: React.FC = () => {
  const { state, dispatch } = useGymContext();
  const navigate = useNavigate();

  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'suspended'>('all');
  const [filterRole, setFilterRole]     = useState<'all' | 'trainer' | 'kinesiologist' | 'member'>('all');
  const [page, setPage]                 = useState(1);

  // Calcula estado efectivo una sola vez por perfil
  const profilesWithStatus = state.profiles
    .filter(p => p.role !== 'admin')
    .map(p => ({ profile: p, effectiveStatus: getEffectiveStatus(p, state.payments) }));

  const filtered = profilesWithStatus
    .filter(({ profile: p, effectiveStatus: es }) => {
      if (filterStatus === 'suspended') return es === 'suspended';
      if (filterStatus !== 'all') return p.status === filterStatus;
      return true;
    })
    .filter(({ profile: p }) => filterRole === 'all' || p.role === filterRole)
    .filter(({ profile: p }) =>
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase())
    );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const suspendedCount = profilesWithStatus.filter(({ effectiveStatus: es }) => es === 'suspended').length;

  const handleToggleStatus = (profile: Profile) => {
    const type = profile.status === 'active' ? 'DEACTIVATE_MEMBER' : 'REACTIVATE_MEMBER';
    dispatch({ type, payload: { id: profile.id } });
  };

  const handleBypassSuspension = (profileId: string, value: boolean) => {
    dispatch({ type: 'BYPASS_SUSPENSION', payload: { memberId: profileId, value } });
  };

  const handleSearch      = (v: string) => { setSearch(v);       setPage(1); };
  const handleFilterStatus = (v: typeof filterStatus) => { setFilterStatus(v); setPage(1); };
  const handleFilterRole   = (v: typeof filterRole)   => { setFilterRole(v);   setPage(1); };

  return (
    <div className="space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Usuarios</h1>
        <p className="text-sm text-gray-500 mt-0.5">{filtered.length} usuarios encontrados</p>
      </div>

      {/* Alerta mora global */}
      {suspendedCount > 0 && (
        <div className="flex items-center gap-3 p-4 bg-red-500/8 border border-red-500/20 rounded-xl">
          <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
          <p className="text-red-300 text-sm">
            <span className="font-semibold">{suspendedCount} miembro{suspendedCount > 1 ? 's' : ''}</span>
            {suspendedCount > 1 ? ' tienen' : ' tiene'} pagos vencidos y{suspendedCount > 1 ? ' están suspendidos' : ' está suspendido'}.
            {' '}
            <button
              onClick={() => handleFilterStatus('suspended')}
              className="underline text-red-400 hover:text-red-300"
            >
              Ver ahora
            </button>
          </p>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="w-full bg-[#13151f] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#01696f] transition-colors"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => handleFilterStatus(e.target.value as typeof filterStatus)}
          className="bg-[#13151f] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-[#01696f] transition-colors"
        >
          <option value="all">Todos los estados</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
          <option value="suspended">Suspendidos · Mora</option>
        </select>
        <select
          value={filterRole}
          onChange={e => handleFilterRole(e.target.value as typeof filterRole)}
          className="bg-[#13151f] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-[#01696f] transition-colors"
        >
          <option value="all">Todos los roles</option>
          <option value="member">Miembros</option>
          <option value="trainer">Entrenadores</option>
          <option value="kinesiologist">Kinesiólogos</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-[#13151f] rounded-xl border border-white/5 overflow-hidden">
        {paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-600">
            <Users size={36} className="mb-3 opacity-30" />
            <p className="text-sm font-medium text-gray-500">Sin resultados</p>
            <p className="text-xs mt-1">Intenta con otros filtros de búsqueda</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-xs text-gray-500 uppercase">
                    <th className="px-5 py-3 text-left font-medium">Usuario</th>
                    <th className="px-5 py-3 text-left font-medium hidden md:table-cell">Email</th>
                    <th className="px-5 py-3 text-left font-medium">Rol</th>
                    <th className="px-5 py-3 text-left font-medium">Estado</th>
                    <th className="px-5 py-3 text-left font-medium hidden lg:table-cell">Ingreso</th>
                    <th className="px-5 py-3 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {paginated.map(({ profile, effectiveStatus }) => (
                    <tr
                      key={profile.id}
                      className={`hover:bg-white/3 transition-colors ${
                        effectiveStatus === 'suspended' ? 'bg-red-500/3' : ''
                      }`}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={profile.fullName} />
                          <div>
                            <p className="text-gray-200 font-medium">{profile.fullName}</p>
                            <p className="text-gray-500 text-xs md:hidden">{profile.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-400 hidden md:table-cell">{profile.email}</td>
                      <td className="px-5 py-3"><RoleBadge role={profile.role} /></td>
                      <td className="px-5 py-3">
                        <StatusBadge effectiveStatus={effectiveStatus} />
                      </td>
                      <td className="px-5 py-3 text-gray-500 hidden lg:table-cell">
                        {formatDate(profile.createdAt)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">

                          {/* Override: activar igualmente si está suspendido */}
                          {effectiveStatus === 'suspended' && (
                            <button
                              onClick={() => handleBypassSuspension(profile.id, true)}
                              title="Activar igualmente (pasar por alto mora)"
                              className="p-1.5 rounded-lg text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                            >
                              <ShieldOff size={15} />
                            </button>
                          )}

                          {/* Quitar override si lo tiene */}
                          {effectiveStatus === 'override' && (
                            <button
                              onClick={() => handleBypassSuspension(profile.id, false)}
                              title="Quitar override — reaplicar suspensión por mora"
                              className="p-1.5 rounded-lg text-amber-400 hover:text-gray-400 hover:bg-white/5 transition-colors"
                            >
                              <ShieldOff size={15} />
                            </button>
                          )}

                          <button
                            onClick={() => navigate(`/admin/members/${profile.id}`)}
                            title="Ver detalle"
                            className="p-1.5 rounded-lg text-gray-500 hover:text-[#4f98a3] hover:bg-white/5 transition-colors"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(profile)}
                            title={profile.status === 'active' ? 'Dar de baja' : 'Reactivar'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              profile.status === 'active'
                                ? 'text-gray-500 hover:text-red-400 hover:bg-red-500/10'
                                : 'text-gray-500 hover:text-green-400 hover:bg-green-500/10'
                            }`}
                          >
                            {profile.status === 'active'
                              ? <UserX size={15} />
                              : <UserCheck size={15} />
                            }
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-white/5">
                <p className="text-xs text-gray-500">
                  Mostrando {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} de {filtered.length}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-xs rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Anterior
                  </button>
                  <span className="px-3 py-1.5 text-xs text-gray-400">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 text-xs rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MembersList;