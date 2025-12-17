import { ReactNode, useEffect } from 'react';
import { useAuthStore } from '../state/auth';
import { useNavigate } from 'react-router-dom';

export const RequireAuth = ({ children }: { children: ReactNode }) => {
  const token = useAuthStore((s) => s.token);
  const ready = useAuthStore((s) => s.ready);
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && !token) {
      navigate('/login');
    }
  }, [ready, token, navigate]);

  if (!ready) return null;
  if (!token) return null;
  return <>{children}</>;
};

export const RequireAdmin = ({ children }: { children: ReactNode }) => {
  const token = useAuthStore((s) => s.token);
  const role = useAuthStore((s) => s.role);
  const ready = useAuthStore((s) => s.ready);
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && (!token || role !== 'admin')) {
      navigate('/login');
    }
  }, [ready, token, role, navigate]);

  if (!ready) return null;
  if (!token || role !== 'admin') return null;
  return <>{children}</>;
};

