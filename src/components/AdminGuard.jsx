import { useEffect, useState } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { getAdminState, signOut } from '../lib/api';

export default function AdminGuard() {
  const [state, setState] = useState('loading');
  const navigate = useNavigate();

  useEffect(() => {
    getAdminState().then(setState, () => setState('out'));
  }, []);

  if (state === 'loading') return <div className="skeleton mt-12 h-40" />;
  if (state === 'out') return <Navigate to="/admin/login" replace />;
  if (state === 'notAdmin') {
    return (
      <div className="surface mx-auto mt-16 max-w-md p-8 text-center">
        <h1 className="font-serif text-2xl text-ink">No admin access</h1>
        <p className="mt-2 text-sm text-ink2">This account is signed in but is not on the admin list.</p>
        <button className="btn-soft mt-6" onClick={() => signOut().then(() => navigate('/admin/login'))}>
          Sign out
        </button>
      </div>
    );
  }
  return <Outlet />;
}
