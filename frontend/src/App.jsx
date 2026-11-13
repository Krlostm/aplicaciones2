import { useEffect } from 'react';
import { Link, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Brand, Button, Loading, Notice } from './components/UI';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
function ProtectedRoute() {
  const { user, loading, error, refresh } = useAuth();
  const location = useLocation();
  if (loading) return <Loading />;
  if (error)
    return (
      <main className="loading-screen">
        <Brand />
        <Notice>{error}</Notice>
        <Button onClick={refresh}>Volver a intentar</Button>
        <Link to="/">Volver al inicio</Link>
      </main>
    );
  return user ? (
    <Outlet />
  ) : (
    <Navigate to="/iniciar-sesion" replace state={{ from: location.pathname + location.search }} />
  );
}
function TutorRoute() {
  const { user } = useAuth();
  return user.isTutor ? <Outlet /> : <Navigate to="/dashboard/ser-tutor" replace />;
}
export default function App() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = `${pathname === '/registro' ? 'Crea tu cuenta' : pathname === '/iniciar-sesion' ? 'Iniciar sesión' : pathname.startsWith('/dashboard') ? 'Tu espacio académico' : 'Aprende más'} · Tutorías`;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  return (
    <>
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/iniciar-sesion" element={<Auth key="login" />} />
        <Route path="/login" element={<Navigate to="/iniciar-sesion" replace />} />
        <Route path="/registro" element={<Auth key="register" register />} />
        <Route element={<ProtectedRoute />}>
          {[
            '/dashboard',
            '/dashboard/cuenta',
            '/dashboard/tutorias',
            '/dashboard/mensajes',
            '/dashboard/ser-tutor',
            '/dashboard/publicaciones/:id',
          ].map((path) => (
            <Route key={path} path={path} element={<Dashboard />} />
          ))}
          <Route element={<TutorRoute />}>
            {[
              '/dashboard/tutor',
              '/dashboard/tutor/publicaciones',
              '/dashboard/tutor/publicaciones/nueva',
              '/dashboard/tutor/publicaciones/:id/editar',
              '/dashboard/tutor/perfil',
              '/dashboard/tutor/cuenta',
              '/dashboard/tutor/mensajes',
              '/dashboard/tutor/reservas',
              '/dashboard/tutor/ingresos',
              '/dashboard/tutor/vista/:id',
            ].map((path) => (
              <Route key={path} path={path} element={<Dashboard />} />
            ))}
          </Route>
        </Route>
        <Route
          path="*"
          element={
            <main className="loading-screen">
              <Brand />
              <span className="eyebrow">PÁGINA NO ENCONTRADA</span>
              <h1>Tomemos otro camino.</h1>
              <p>La página que buscas no está disponible.</p>
              <Link to="/" className="btn btn-primary">
                Volver al inicio
              </Link>
            </main>
          }
        />
      </Routes>
    </>
  );
}
