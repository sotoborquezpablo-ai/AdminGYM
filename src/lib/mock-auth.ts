import { Profile } from '../types';
import { mockProfiles } from './mock-data';

interface MockUser {
  email: string;
  password: string;
  profileId: string;
}

export const MOCK_USERS: MockUser[] = [
  { email: 'admin@gym.cl',   password: 'admin123',   profileId: 'profile-admin-1' },
  { email: 'trainer@gym.cl', password: 'trainer123', profileId: 'profile-trainer-1' },
  { email: 'kine@gym.cl',    password: 'kine123',    profileId: 'profile-kine-1' },
  { email: 'member@gym.cl',  password: 'member123',  profileId: 'profile-member-1' },
];

export const authenticateUser = (email: string, password: string): Profile | null => {
  const user = MOCK_USERS.find(u => u.email === email && u.password === password);
  if (!user) return null;
  return mockProfiles.find(p => p.id === user.profileId) ?? null;
};