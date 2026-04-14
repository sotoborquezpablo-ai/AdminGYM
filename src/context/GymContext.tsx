import React, { createContext, useReducer, useContext, useEffect } from 'react';
import type {
  Profile, AvailabilitySlot, Appointment, TrainingPlan,
  Exercise, PlanExercise, ExerciseLog, Payment,
  PaymentStatus, AppointmentStatus
} from '../types';
import {
  mockAvailabilitySlots, mockAppointments, mockPayments,
  mockTrainingPlans, mockExercises, mockPlanExercises,
  mockExerciseLogs, mockProfiles, mockProfessionals
} from '../lib/mock-data';


// --- Types ---
interface Professional {
  id: string;
  profileId: string;
  specialty: string;
  bio: string;
  calendarColor: string;
}

interface GymState {
  profiles:      Profile[];
  professionals: Professional[];
  slots:         AvailabilitySlot[];
  appointments:  Appointment[];
  trainingPlans: TrainingPlan[];
  exercises:     Exercise[];
  planExercises: PlanExercise[];
  exerciseLogs:  ExerciseLog[];
  payments:      Payment[];
}

type GymAction =
  | { type: 'ADD_PAYMENT';               payload: Payment }
  | { type: 'UPDATE_PAYMENT_STATUS';     payload: { id: string; status: PaymentStatus } }
  | { type: 'ADD_APPOINTMENT';           payload: Appointment }
  | { type: 'UPDATE_APPOINTMENT_STATUS'; payload: { id: string; status: AppointmentStatus } }
  | { type: 'DEACTIVATE_MEMBER';         payload: { id: string } }
  | { type: 'REACTIVATE_MEMBER';         payload: { id: string } }
  | { type: 'ADD_EXERCISE_LOG';          payload: ExerciseLog }
  | { type: 'BYPASS_SUSPENSION';         payload: { memberId: string; value: boolean } }
  | { type: 'UPDATE_PROFILE';            payload: { id: string; fullName: string; phone: string } };


// --- Initial State ---
const STORAGE_KEY = 'gymmanager-data';

const getInitialState = (): GymState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as GymState;
  } catch (e) {
    console.error('Error leyendo localStorage:', e);
  }
  return {
    profiles:      mockProfiles,
    professionals: mockProfessionals,
    slots:         mockAvailabilitySlots,
    appointments:  mockAppointments,
    trainingPlans: mockTrainingPlans,
    exercises:     mockExercises,
    planExercises: mockPlanExercises,
    exerciseLogs:  mockExerciseLogs,
    payments:      mockPayments,
  };
};


// --- Reducer ---
const gymReducer = (state: GymState, action: GymAction): GymState => {
  switch (action.type) {

    case 'ADD_PAYMENT':
      return { ...state, payments: [...state.payments, action.payload] };

    case 'UPDATE_PAYMENT_STATUS':
      return {
        ...state,
        payments: state.payments.map(p =>
          p.id === action.payload.id
            ? {
                ...p,
                status: action.payload.status,
                paidAt: action.payload.status === 'paid'
                  ? new Date().toISOString()
                  : p.paidAt,
              }
            : p
        ),
      };

    case 'ADD_APPOINTMENT':
      return { ...state, appointments: [...state.appointments, action.payload] };

    case 'UPDATE_APPOINTMENT_STATUS':
      return {
        ...state,
        appointments: state.appointments.map(a =>
          a.id === action.payload.id
            ? { ...a, status: action.payload.status }
            : a
        ),
      };

    case 'DEACTIVATE_MEMBER':
      return {
        ...state,
        profiles: state.profiles.map(p =>
          p.id === action.payload.id ? { ...p, status: 'inactive' } : p
        ),
      };

    case 'REACTIVATE_MEMBER':
      return {
        ...state,
        profiles: state.profiles.map(p =>
          p.id === action.payload.id ? { ...p, status: 'active' } : p
        ),
      };

    case 'UPDATE_PROFILE':
      return {
        ...state,
        profiles: state.profiles.map(p =>
          p.id === action.payload.id
            ? { ...p, fullName: action.payload.fullName, phone: action.payload.phone }
            : p
        ),
      };

    case 'ADD_EXERCISE_LOG':
      return { ...state, exerciseLogs: [...state.exerciseLogs, action.payload] };

    case 'BYPASS_SUSPENSION':
      return {
        ...state,
        profiles: state.profiles.map(p =>
          p.id === action.payload.memberId
            ? { ...p, bypassSuspension: action.payload.value }
            : p
        ),
      };

    default:
      return state;
  }
};


// --- Context ---
interface GymContextValue {
  state: GymState;
  dispatch: React.Dispatch<GymAction>;
}

const GymContext = createContext<GymContextValue | null>(null);


// --- Provider ---
export const GymProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gymReducer, undefined, getInitialState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Error guardando en localStorage:', e);
    }
  }, [state]);

  return (
    <GymContext.Provider value={{ state, dispatch }}>
      {children}
    </GymContext.Provider>
  );
};


// --- Hook ---
export const useGymContext = (): GymContextValue => {
  const context = useContext(GymContext);
  if (!context) throw new Error('useGymContext must be used within a GymProvider');
  return context;
};