import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useGymContext } from '../context/GymContext';
import AppointmentCalendar from '../components/AppointmentCalendar';

const ProfessionalCalendar: React.FC = () => {
  const { state }       = useGymContext();
  const { currentUser } = useAuth();

  const professional = state.professionals.find(p => p.profileId === currentUser?.id);
  const myApts       = state.appointments.filter(a => a.professionalId === professional?.id);

  return (
    <AppointmentCalendar
      appointments={myApts}
      canCreate={false}
      defaultProfessionalId={professional?.id}
    />
  );
};

export default ProfessionalCalendar;