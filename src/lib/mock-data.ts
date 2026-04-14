import type {
  Profile, Professional, AvailabilitySlot, Appointment, AppointmentStatus,
  TrainingPlan, Exercise, PlanExercise, ExerciseLog, Payment
} from '../types';

// --- Profiles ---
export const mockProfiles: Profile[] = [
  { id: 'profile-admin-1',   fullName: 'Admin GymManager', email: 'admin@gym.cl',            role: 'admin',         phone: '123456789', status: 'active',   createdAt: '2023-01-15T10:00:00Z' },
  { id: 'profile-trainer-1', fullName: 'Ana Torres',       email: 'ana.torres@gym.cl',        role: 'trainer',       phone: '987654321', status: 'active',   createdAt: '2022-11-01T09:00:00Z' },
  { id: 'profile-trainer-2', fullName: 'Juan Pérez',       email: 'juan.perez@gym.cl',        role: 'trainer',       phone: '912345678', status: 'active',   createdAt: '2023-05-20T11:30:00Z' },
  { id: 'profile-kine-1',    fullName: 'Laura Méndez',     email: 'laura.mendez@gym.cl',      role: 'kinesiologist', phone: '934567890', status: 'active',   createdAt: '2021-03-10T14:00:00Z' },
  { id: 'profile-member-1',  fullName: 'Carlos Soto',      email: 'member@gym.cl',            role: 'member',        phone: '99887766',  status: 'active',   createdAt: '2023-07-01T00:00:00Z' },
  { id: 'profile-member-2',  fullName: 'Elena Ríos',       email: 'elena.rios@example.com',   role: 'member',        phone: '99112233',  status: 'active',   createdAt: '2023-07-01T00:00:00Z' },
  { id: 'profile-member-3',  fullName: 'Pedro Vargas',     email: 'pedro.v@example.com',      role: 'member',        phone: '911223344', status: 'active',   createdAt: '2022-01-10T00:00:00Z' },
  { id: 'profile-member-4',  fullName: 'Sofía Castro',     email: 'sofia.castro@example.com', role: 'member',        phone: '922334455', status: 'active',   createdAt: '2023-03-23T00:00:00Z' },
  { id: 'profile-member-5',  fullName: 'Javier Díaz',      email: 'javi.diaz@example.com',    role: 'member',        phone: '933445566', status: 'inactive', createdAt: '2021-05-01T00:00:00Z' },
  { id: 'profile-member-6',  fullName: 'Martín Rojas',     email: 'martin.r@example.com',     role: 'member',        phone: '944556677', status: 'active',   createdAt: '2023-01-01T00:00:00Z' },
  { id: 'profile-member-7',  fullName: 'Isidora Vega',     email: 'isadora.v@example.com',    role: 'member',        phone: '955667788', status: 'active',   createdAt: '2023-08-15T00:00:00Z' },
  { id: 'profile-member-8',  fullName: 'Tomás Soto',       email: 'tomas.soto@example.com',   role: 'member',        phone: '966778899', status: 'inactive', createdAt: '2022-12-01T00:00:00Z' },
];

// --- Professionals ---
export const mockProfessionals: Professional[] = [
  { id: 'prof-ana-1',   profileId: 'profile-trainer-1', specialty: 'Hipertrofia',     bio: 'Especialista en rutinas de fuerza y ganancia muscular.', calendarColor: '#01696f' },
  { id: 'prof-juan-2',  profileId: 'profile-trainer-2', specialty: 'Pérdida de peso', bio: 'Enfoque en resistencia y metabolismo acelerado.',        calendarColor: '#2d96b4' },
  { id: 'prof-laura-3', profileId: 'profile-kine-1',    specialty: 'Rehabilitación',  bio: 'Tratamientos de fisioterapia y prevención de lesiones.', calendarColor: '#ff8c00' },
];

// --- Availability Slots ---
const buildSlots = (profId: string): AvailabilitySlot[] => {
  const slots: AvailabilitySlot[] = [];
  [1, 2, 3, 4, 5].forEach(day => {
    for (let h = 8; h <= 19; h++) {
      slots.push({
        id: `slot-${profId}-d${day}-h${h}`,
        professionalId: profId,
        dayOfWeek: day,
        startTime: `${String(h).padStart(2, '0')}:00`,
        endTime:   `${String(h + 1).padStart(2, '0')}:00`,
        isRecurring: true,
      });
    }
  });
  return slots;
};

export const mockAvailabilitySlots: AvailabilitySlot[] = [
  ...buildSlots('prof-ana-1'),
  ...buildSlots('prof-juan-2'),
  ...buildSlots('prof-laura-3'),
];

// --- Appointments ---
export const mockAppointments: Appointment[] = [
  {
    id: 'appt-101', memberId: 'profile-member-1', professionalId: 'prof-ana-1',
    date: '2026-04-11', time: '10:00', duration: 60,
    startTime: '10:00', endTime: '11:00',
    status: 'confirmed' as AppointmentStatus,
    notes: 'Evaluación inicial.', createdAt: '2026-04-01T10:00:00Z',
  },
  {
    id: 'appt-102', memberId: 'profile-member-2', professionalId: 'prof-juan-2',
    date: '2026-04-11', time: '14:00', duration: 60,
    startTime: '14:00', endTime: '15:00',
    status: 'pending' as AppointmentStatus,
    notes: 'Seguimiento de dieta.', createdAt: '2026-04-01T10:00:00Z',
  },
  {
    id: 'appt-103', memberId: 'profile-member-3', professionalId: 'prof-laura-3',
    date: '2026-04-09', time: '11:00', duration: 60,
    startTime: '11:00', endTime: '12:00',
    status: 'completed' as AppointmentStatus,
    notes: 'Sesión de movilidad.', createdAt: '2026-04-01T10:00:00Z',
  },
  {
    id: 'appt-104', memberId: 'profile-member-4', professionalId: 'prof-ana-1',
    date: '2026-04-10', time: '15:00', duration: 60,
    startTime: '15:00', endTime: '16:00',
    status: 'cancelled' as AppointmentStatus,
    notes: 'Cambiamos fecha.', createdAt: '2026-04-01T10:00:00Z',
  },
  {
    id: 'appt-105', memberId: 'profile-member-5', professionalId: 'prof-juan-2',
    date: '2026-04-12', time: '09:00', duration: 60,
    startTime: '09:00', endTime: '10:00',
    status: 'pending' as AppointmentStatus,
    notes: '', createdAt: '2026-04-01T10:00:00Z',
  },
  {
    id: 'appt-106', memberId: 'profile-member-6', professionalId: 'prof-laura-3',
    date: '2026-04-11', time: '16:00', duration: 60,
    startTime: '16:00', endTime: '17:00',
    status: 'confirmed' as AppointmentStatus,
    notes: 'Dolor lumbar.', createdAt: '2026-04-01T10:00:00Z',
  },
];

// --- Exercises ---
export const mockExercises: Exercise[] = [
  { id: 'ex-squat',    name: 'Sentadillas',       muscleGroup: 'legs',      description: 'Movimiento fundamental para cuádriceps e isquiotibiales.' },
  { id: 'ex-chest',    name: 'Press de Banca',    muscleGroup: 'chest',     description: 'Ejercicio principal para el pectoral mayor.' },
  { id: 'ex-back',     name: 'Jalón al Pecho',    muscleGroup: 'back',      description: 'Fortalece la espalda y los bíceps.' },
  { id: 'ex-shoulder', name: 'Press Militar',     muscleGroup: 'shoulders', description: 'Desarrolla fuerza en hombros y tríceps.' },
  { id: 'ex-core',     name: 'Plancha Abdominal', muscleGroup: 'core',      description: 'Ejercicio isométrico para el core completo.' },
  { id: 'ex-bicep',    name: 'Curl de Bíceps',    muscleGroup: 'arms',      description: 'Enfocado en el desarrollo del bíceps.' },
];

// --- Training Plans ---
export const mockTrainingPlans: TrainingPlan[] = [
  { id: 'plan-1', memberId: 'profile-member-1', trainerId: 'profile-trainer-1', name: 'Inicio Fuerza Total',        startDate: '2023-07-05', isActive: true },
  { id: 'plan-2', memberId: 'profile-member-2', trainerId: 'profile-trainer-2', name: 'Resistencia Cardiovascular', startDate: '2023-08-15', isActive: true },
];

// --- Plan Exercises ---
export const mockPlanExercises: PlanExercise[] = [
  { id: 'pex-1-1', planId: 'plan-1', exerciseId: 'ex-squat',    sets: 3, reps: 10, restSeconds: 60, orderIndex: 1 },
  { id: 'pex-1-2', planId: 'plan-1', exerciseId: 'ex-chest',    sets: 3, reps: 12, restSeconds: 60, orderIndex: 2 },
  { id: 'pex-1-3', planId: 'plan-1', exerciseId: 'ex-core',     sets: 3, reps: 20, restSeconds: 30, orderIndex: 3 },
  { id: 'pex-2-1', planId: 'plan-2', exerciseId: 'ex-shoulder', sets: 3, reps: 15, restSeconds: 45, orderIndex: 1 },
  { id: 'pex-2-2', planId: 'plan-2', exerciseId: 'ex-bicep',    sets: 3, reps: 15, restSeconds: 45, orderIndex: 2 },
];

// --- Exercise Logs ---
export const mockExerciseLogs: ExerciseLog[] = [
  { id: 'log-1', planExerciseId: 'pex-1-1', memberId: 'profile-member-1', weightKg: 70, repsDone: 10, loggedAt: '2023-07-05T10:00:00Z' },
  { id: 'log-2', planExerciseId: 'pex-1-2', memberId: 'profile-member-1', weightKg: 40, repsDone: 12, loggedAt: '2023-07-05T10:05:00Z' },
  { id: 'log-3', planExerciseId: 'pex-1-3', memberId: 'profile-member-1', weightKg: 0,  repsDone: 20, loggedAt: '2023-07-05T10:15:00Z' },
  { id: 'log-4', planExerciseId: 'pex-2-1', memberId: 'profile-member-2', weightKg: 5,  repsDone: 15, loggedAt: '2023-08-15T11:00:00Z' },
];

// --- Payments ---
export const mockPayments: Payment[] = [
  { id: 'pay-1',  memberId: 'profile-member-1', amount: 35000, currency: 'CLP', status: 'paid',    dueDate: '2026-01-15', paidAt: '2026-01-14', method: 'card' },
  { id: 'pay-2',  memberId: 'profile-member-1', amount: 35000, currency: 'CLP', status: 'overdue', dueDate: '2026-02-15', paidAt: null,         method: 'cash' },
  { id: 'pay-3',  memberId: 'profile-member-1', amount: 35000, currency: 'CLP', status: 'pending', dueDate: '2026-04-15', paidAt: null,         method: 'webpay' },
  { id: 'pay-4',  memberId: 'profile-member-2', amount: 35000, currency: 'CLP', status: 'paid',    dueDate: '2026-03-20', paidAt: '2026-03-19', method: 'transfer' },
  { id: 'pay-5',  memberId: 'profile-member-3', amount: 35000, currency: 'CLP', status: 'paid',    dueDate: '2026-03-20', paidAt: '2026-03-20', method: 'card' },
  { id: 'pay-6',  memberId: 'profile-member-4', amount: 35000, currency: 'CLP', status: 'overdue', dueDate: '2026-03-15', paidAt: null,         method: 'webpay' },
  { id: 'pay-7',  memberId: 'profile-member-5', amount: 35000, currency: 'CLP', status: 'paid',    dueDate: '2021-04-01', paidAt: '2021-04-01', method: 'cash' },
  { id: 'pay-8',  memberId: 'profile-member-6', amount: 35000, currency: 'CLP', status: 'pending', dueDate: '2026-04-01', paidAt: null,         method: 'transfer' },
  { id: 'pay-9',  memberId: 'profile-member-7', amount: 35000, currency: 'CLP', status: 'paid',    dueDate: '2026-04-01', paidAt: '2026-03-31', method: 'card' },
  { id: 'pay-10', memberId: 'profile-member-8', amount: 35000, currency: 'CLP', status: 'pending', dueDate: '2026-01-01', paidAt: null,         method: 'webpay' },
  { id: 'pay-11', memberId: 'profile-member-3', amount: 35000, currency: 'CLP', status: 'overdue', dueDate: '2026-02-20', paidAt: null,         method: 'transfer' },
  { id: 'pay-12', memberId: 'profile-member-7', amount: 35000, currency: 'CLP', status: 'pending', dueDate: '2026-05-01', paidAt: null,         method: 'webpay' },
];