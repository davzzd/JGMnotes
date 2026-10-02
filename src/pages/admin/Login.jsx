import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isSample, signIn, signOut } from '../../lib/api';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const state = await signIn(email, password);
      if (state === 'admin') return navigate('/admin', { replace: true });
      await signOut();
      setError('This account is not on the admin list.');
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className="surface mx-auto mt-16 max-w-sm p-8 !shadow-2">
      <h1 className="font-serif text-3xl font-medium text-ink">Admin sign in</h1>
      <p className="mt-1 text-sm text-ink2">
        {isSample ? 'Sample mode: any email and password will work.' : 'For the JGM notes team.'}
      </p>

      <div className="mt-7 space-y-4">
        <div>
          <label htmlFor="email" className="label">Email</label>
          <div className="well">
            <input
              id="email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field"
            />
          </div>
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <div className="well">
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field"
            />
          </div>
        </div>
      </div>

      {error && <p className="mt-4 rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-danger">{error}</p>}

      <button disabled={busy} className="btn-primary mt-6 w-full !py-3">
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
