import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import AdminGuard from './components/AdminGuard';
import NotesList from './pages/NotesList';
import NoteDetail from './pages/NoteDetail';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import NoteForm from './pages/admin/NoteForm';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<NotesList />} />
          <Route path="/notes/:id" element={<NoteDetail />} />
          <Route path="/admin/login" element={<Login />} />
          <Route element={<AdminGuard />}>
            <Route path="/admin" element={<Dashboard />} />
            <Route path="/admin/new" element={<NoteForm />} />
            <Route path="/admin/:id/edit" element={<NoteForm />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
