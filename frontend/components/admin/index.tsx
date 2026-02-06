import React from 'react';
import { User } from '../../types';
import { AdminOverview } from './overview';
import { AdminUsers } from './users';
import { AdminTransactions } from './transactions';
import { AdminModeration } from './moderation';
import { AdminSettings } from './settings';

interface AdminProps {
  user: User;
  currentView: string;
}

export const AdminDashboard: React.FC<AdminProps> = ({ user, currentView }) => {
  if (currentView === 'users') {
    return <AdminUsers />;
  }

  if (currentView === 'transactions') {
    return <AdminTransactions />;
  }

  if (currentView === 'moderation') {
    return <AdminModeration />;
  }

  if (currentView === 'settings') {
    return <AdminSettings />;
  }

  return <AdminOverview user={user} />;
};
