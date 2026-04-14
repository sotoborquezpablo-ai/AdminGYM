import React from 'react';
import { useAuth } from '../context/AuthContext';
import TrainingPlanView from '../components/TrainingPlanView';

const MemberPlan: React.FC = () => {
  const { currentUser } = useAuth();
  return (
    <div className="max-w-2xl">
      <TrainingPlanView memberId={currentUser?.id ?? ''} editable={true} />
    </div>
  );
};

export default MemberPlan;