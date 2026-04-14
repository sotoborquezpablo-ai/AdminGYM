import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGymContext } from '../context/GymContext';
import { User, Phone, Mail, Save, Check, Lock } from 'lucide-react';

const formatDate = (dateStr: string) => {
  try {
    const [y, m, d] = dateStr.split('T')[0].split('-');
    return `${d}/${m}/${y}`;
  } catch { return dateStr; }
};

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrador', trainer: 'Entrenador',
  kinesiologist: 'Kinesiólogo', member: 'Miembro',
};

const ProfileManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const { state, dispatch } = useGymContext();

  const profile = state.profiles.find(p => p.id === currentUser?.id);

  const [form, setForm] = useState({
    fullName: profile?.fullName ?? '',
    phone:    profile?.phone    ?? '',
  });
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<{ fullName?: string; phone?: string }>({});

  if (!profile) return null;

  const initials = profile.fullName
    .split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  const validate = () => {
    const e: typeof errors = {};
    if (!form.fullName.trim()) e.fullName = 'El nombre es requerido';
    if (!form.phone.trim())    e.phone    = 'El teléfono es requerido';
    return e;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    dispatch({ type: 'UPDATE_PROFILE', payload: { id: profile.id, ...form } });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const inputCls = (err?: string) =>
    `w-full bg-[#0f1117] border rounded-lg px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none transition-colors ${
      err ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-[#01696f]'
    }`;

  return (
    <div className="space-y-5 max-w-xl">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Mi Perfil</h1>
        <p className="text-sm text-gray-500 mt-0.5">Actualiza tu información personal</p>
      </div>

      {/* Avatar + info fija */}
      <div className="bg-[#13151f] rounded-xl border border-white/5 p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-[#01696f]/25 flex items-center justify-center text-[#4f98a3] text-xl font-bold flex-shrink-0">
          {initials}
        </div>
        <div>
          <p className="text-white font-semibold text-base">{profile.fullName}</p>
          <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#01696f]/15 text-[#4f98a3]">
            {ROLE_LABEL[profile.role]}
          </span>
          <p className="text-gray-600 text-xs mt-1">Miembro desde {formatDate(profile.createdAt)}</p>
        </div>
      </div>

      {/* Formulario editable */}
      <form onSubmit={handleSave} className="bg-[#13151f] rounded-xl border border-white/5 p-6 space-y-5">

        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
          Datos personales
        </h2>

        {/* Nombre */}
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Nombre completo</label>
          <div className="relative">
            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={form.fullName}
              onChange={e => setForm({ ...form, fullName: e.target.value })}
              className={`${inputCls(errors.fullName)} pl-9`}
              placeholder="Tu nombre completo"
            />
          </div>
          {errors.fullName && <p className="text-red-400 text-xs mt-1">{errors.fullName}</p>}
        </div>

        {/* Teléfono */}
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Teléfono</label>
          <div className="relative">
            <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              className={`${inputCls(errors.phone)} pl-9`}
              placeholder="+56 9 1234 5678"
            />
          </div>
          {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
        </div>

        {/* Email — solo lectura */}
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">
            Email <span className="text-gray-600">(no editable)</span>
          </label>
          <div className="relative">
            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full bg-[#0a0c12] border border-white/5 rounded-lg px-4 py-2.5 pl-9 text-sm text-gray-600 cursor-not-allowed"
            />
            <Lock size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-700" />
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between pt-1">
          <p className="text-gray-600 text-xs">
            Los cambios se guardan localmente
          </p>
          <button
            type="submit"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              saved
                ? 'bg-green-500/15 text-green-400'
                : 'bg-[#01696f]/20 text-[#4f98a3] hover:bg-[#01696f]/30'
            }`}
          >
            {saved ? <><Check size={14} /> Guardado</> : <><Save size={14} /> Guardar cambios</>}
          </button>
        </div>
      </form>

      {/* Info adicional — solo lectura */}
      <div className="bg-[#13151f] rounded-xl border border-white/5 p-6 space-y-3">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
          Información de cuenta
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Estado',       value: profile.status === 'active' ? 'Activo' : 'Inactivo' },
            { label: 'Rol',          value: ROLE_LABEL[profile.role] },
            { label: 'Ingreso',      value: formatDate(profile.createdAt) },
            { label: 'ID de cuenta', value: profile.id.slice(0, 14) + '…' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-gray-600 mb-0.5">{label}</p>
              <p className="text-sm text-gray-300">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfileManagement;