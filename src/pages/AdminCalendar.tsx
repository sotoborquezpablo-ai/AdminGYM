import React from 'react';
import { useGymContext } from '../context/GymContext';
import AppointmentCalendar from '../components/AppointmentCalendar';

const AdminCalendar: React.FC = () => {
  const { state } = useGymContext();
  return (
    <AppointmentCalendar
      appointments={state.appointments}
      canCreate={true}
    />
  );
};

export default AdminCalendar;