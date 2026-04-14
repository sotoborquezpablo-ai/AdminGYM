export type UserRole = 'admin' | 'trainer' | 'kinesiologist' | 'member';
export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';
export type PaymentMethod = 'cash' | 'transfer' | 'card' | 'webpay';
export type MuscleGroup = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core' | 'full_body';
export type MemberStatus = 'active' | 'inactive';

export interface Profile {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  phone: string;
  avatarUrl?: string;
  status: MemberStatus;
  createdAt: string;
  bypassSuspension?: boolean;   // override admin — ignora mora
  monthlyFee?: number;          // cuota mensual en CLP
  joinDate?: string; // si no lo tienes ya — es requerido por paymentUtils
}

export interface Professional {
  id: string;
  profileId: string;
  specialty: string;
  bio: string;
  calendarColor: string;
}

export interface AvailabilitySlot {
  id: string;
  professionalId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
}

export interface Appointment {
  id: string;
  memberId: string;
  professionalId: string;
  date: string;
  time: string;          // ← agregar esto
  duration: number;      // ← agregar esto si tampoco existe
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes: string;
  createdAt?: string;   // ← agregar esto
}

export interface TrainingPlan {
  id: string;
  memberId: string;
  trainerId: string;
  name: string;
  startDate: string;
  isActive: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  description: string;
}

export interface PlanExercise {
  id: string;
  planId: string;
  exerciseId: string;
  sets: number;
  reps: number;
  restSeconds: number;
  orderIndex: number;
}

export interface ExerciseLog {
  id: string;
  planExerciseId: string;
  memberId: string;
  weightKg: number;
  repsDone: number;
  loggedAt: string;
}

export interface Payment {
  id: string;
  memberId: string;
  amount: number;
  currency: 'CLP';
  status: PaymentStatus;
  dueDate: string;
  paidAt: string | null;
  method: PaymentMethod;
  notes?: string;
}