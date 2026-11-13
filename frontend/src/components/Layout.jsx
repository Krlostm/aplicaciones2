import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, ChevronDown, UserRound, Bell } from 'lucide-react';
import { Brand, PrivacyModal, Notice } from './UI';
import { useAuth } from '../context/AuthContext';
export function PublicHeader() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Brand />
        <nav className={`public-nav ${open ? 'is-open' : ''}`} aria-label="Navegación principal">
          <a href="/#areas" onClick={() => setOpen(false)}>
            Áreas académicas
          </a>
          <a href="/#como-funciona" onClick={() => setOpen(false)}>
            Cómo funciona
          </a>
          <a href="/#comunidad" onClick={() => setOpen(false)}>
            Para tutores
          </a>
        </nav>
        <div className="header-actions">
          {user ? (
            <Link className="btn btn-primary btn-sm" to="/dashboard">
              Mi espacio
            </Link>
          ) : (
            <>
              <Link className="login-link" to="/iniciar-sesion">
                Iniciar sesión
              </Link>
              <Link className="btn btn-primary btn-sm" to="/registro">
                Crear cuenta
              </Link>
            </>
          )}
          <button
            className="icon-button mobile-menu"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </header>
  );
}
export function PrivateHeader() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const tutorMode = pathname === '/dashboard/tutor' || pathname.startsWith('/dashboard/tutor/');
  const modeTarget = tutorMode
    ? '/dashboard'
    : user.isTutor
      ? '/dashboard/tutor'
      : '/dashboard/ser-tutor';
  const modeLabel = tutorMode
    ? 'Modo estudiante'
    : user.isTutor
      ? 'Modo tutor'
      : 'Conviértete en tutor';
  const links = tutorMode
    ? [
        ['/dashboard/tutor', 'Panel de tutor'],
        ['/dashboard/tutor/publicaciones', 'Mis publicaciones'],
        ['/dashboard/tutor/mensajes', 'Mensajes'],
        ['/dashboard/tutor/reservas', 'Reservas'],
      ]
    : [
        ['/dashboard', 'Explorar'],
        ['/dashboard/tutorias', 'Mis tutorías'],
        ['/dashboard/mensajes', 'Mensajes'],
      ];
  const [menu, setMenu] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const closeSession = async () => {
    setBusy(true);
    setError('');
    try {
      await logout();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <header className="site-header private-header">
        <div className="container header-inner">
          <Brand />
          <nav className="private-nav" aria-label="Tu espacio académico">
            {links.map(([to, label]) => (
              <NavLink end={to === '/dashboard' || to === '/dashboard/tutor'} key={to} to={to}>
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="header-actions">
            <Link className="workspace-mode-link" to={modeTarget} aria-label={modeLabel}>
              <span className="mode-full">{modeLabel}</span>
              <span className="mode-short" aria-hidden="true">
                {tutorMode ? 'Estudiante' : user.isTutor ? 'Tutor' : 'Ser tutor'}
              </span>
            </Link>
            <div className="popover-wrap">
              <button
                className="icon-button"
                aria-label="Notificaciones"
                aria-expanded={notifications}
                onClick={() => {
                  setNotifications(!notifications);
                  setMenu(false);
                }}
              >
                <Bell size={19} />
              </button>
              {notifications && (
                <div className="popover">
                  <strong>Tus notificaciones</strong>
                  <p>Estás al día. No tienes nuevas notificaciones.</p>
                </div>
              )}
            </div>
            <div className="popover-wrap">
              <button
                className="user-button"
                aria-expanded={menu}
                onClick={() => {
                  setMenu(!menu);
                  setNotifications(false);
                }}
              >
                <span className="avatar">
                  {user.firstName[0]}
                  {user.lastName[0]}
                </span>
                <span className="user-caption">
                  <strong>{user.firstName}</strong>
                  <small>{user.university}</small>
                </span>
                <ChevronDown size={15} />
              </button>
              {menu && (
                <div className="popover user-menu">
                  <strong>
                    {user.firstName} {user.lastName}
                  </strong>
                  <small className="break-all">{user.email}</small>
                  <Link
                    to={tutorMode ? '/dashboard/tutor/cuenta' : '/dashboard/cuenta'}
                    onClick={() => setMenu(false)}
                  >
                    <UserRound size={17} /> Mi cuenta
                  </Link>
                  <Link to={modeTarget} onClick={() => setMenu(false)}>
                    {modeLabel}
                  </Link>
                  <button disabled={busy} onClick={closeSession}>
                    <LogOut size={17} />
                    {busy ? 'Cerrando sesión…' : 'Cerrar sesión'}
                  </button>
                  <Notice>{error}</Notice>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <nav className="mobile-private-nav" aria-label="Navegación móvil">
        {links.map(([to, label]) => (
          <NavLink end={to === '/dashboard' || to === '/dashboard/tutor'} key={to} to={to}>
            {label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
export function Footer({ compact = false }) {
  const [privacy, setPrivacy] = useState(false);
  return (
    <>
      <footer className={`site-footer ${compact ? 'compact-footer' : ''}`}>
        <div className="container">
          {!compact && (
            <div className="footer-top">
              <div>
                <Brand />
                <p>
                  El conocimiento se comparte.
                  <br />
                  Las metas se alcanzan juntos.
                </p>
              </div>
              <div>
                <span className="eyebrow">EXPLORA LA RED</span>
                <a href="/#areas">Áreas académicas</a>
                <a href="/#como-funciona">Cómo funciona</a>
                <Link to="/registro">Únete a la comunidad</Link>
              </div>
              <div>
                <span className="eyebrow">HECHO PARA ESTUDIANTES</span>
                <p>
                  Un proyecto académico que conecta
                  <br />a universitarios de Ecuador.
                </p>
                <span className="country-label">
                  <i /> Ecuador · Red entre pares
                </span>
              </div>
            </div>
          )}
          <div className="footer-bottom">
            <p>@Carlos Toa</p>
            <span>Proyecto académico · Versión local</span>
            <button onClick={() => setPrivacy(true)}>Privacidad y datos</button>
          </div>
        </div>
      </footer>
      {privacy && <PrivacyModal onClose={() => setPrivacy(false)} />}
    </>
  );
}
