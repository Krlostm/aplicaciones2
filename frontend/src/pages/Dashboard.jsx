import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  Grid2X2,
  List,
  BookOpen,
  CalendarDays,
  MessageSquare,
  GraduationCap,
  ShieldCheck,
  UserRound,
  Building2,
  Mail,
  Check,
  Clock3,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PrivateHeader, Footer } from '../components/Layout';
import { api } from '../services/http';
import TutorPanel, { TutorProfileEditor, TutorPendingSection } from './TutorPanel';
import TutorOnboarding from './TutorOnboarding';
import { Notice } from '../components/UI';
import ContactDetails from '../components/ContactDetails';
import AcademicProfile from '../components/AcademicProfile';
import AcademicSymbols from '../components/AcademicSymbols';
import {
  PublicationDirectory,
  PublicationManager,
  PublicationEditor,
  PublicationDetail,
} from './Publications';
const upcoming = {
  tutorias: {
    icon: CalendarDays,
    title: 'Un lugar para tus próximos encuentros.',
    description: 'Aquí encontrarás tus tutorías y podrás consultar cómo avanza cada sesión.',
    name: 'Mis tutorías',
    detail: 'La coordinación y consulta de sesiones estará disponible en una próxima etapa.',
  },
  mensajes: {
    icon: MessageSquare,
    title: 'Las buenas conexiones empiezan conversando.',
    description: 'Este será tu espacio para conversar y coordinar con otros estudiantes.',
    name: 'Mensajes y propuestas',
    detail: 'La mensajería y las propuestas se incorporarán en una próxima etapa.',
  },
};
export default function Dashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const path = location.pathname;
  const tutorMode = path === '/dashboard/tutor' || path.startsWith('/dashboard/tutor/');
  const section = path.split('/').filter(Boolean).at(-1);
  const onboarding = path === '/dashboard/ser-tutor';
  const detail =
    path.startsWith('/dashboard/publicaciones/') || path.startsWith('/dashboard/tutor/vista/');
  const publications = path === '/dashboard/tutor/publicaciones';
  const editor =
    path === '/dashboard/tutor/publicaciones/nueva' || /\/publicaciones\/[^/]+\/editar$/.test(path);
  const account = section === 'cuenta';
  const tutorProfile = path === '/dashboard/tutor/perfil';
  const tutorPending = tutorMode && ['mensajes', 'reservas', 'ingresos'].includes(section);
  const page = !tutorMode ? upcoming[section] : null;
  const heading = onboarding
    ? 'Conviértete en tutor.'
    : account
      ? 'Tu cuenta, tu espacio.'
      : publications
        ? 'Mis publicaciones'
        : editor
          ? section === 'nueva'
            ? 'Agregar una tutoría'
            : 'Editar tutoría'
          : tutorProfile
            ? 'Mi perfil de tutor'
            : tutorPending
              ? { mensajes: 'Mensajes', reservas: 'Reservas', ingresos: 'Ingresos' }[section]
              : page
                ? page.name
                : null;
  if (onboarding)
    return (
      <main id="contenido" className="tutor-onboarding-screen">
        <TutorOnboarding />
      </main>
    );
  return (
    <>
      <PrivateHeader />
      <main
        className={`dashboard-main workspace ${tutorMode ? 'workspace-tutor' : 'workspace-student'}`}
        id="contenido"
      >
        <div className="container dashboard-content">
          {!detail && (
            <div className="dashboard-greeting">
              <div>
                <h1>
                  {heading || (
                    <>
                      Hola, {user.firstName}
                      <span className="greeting-dot">.</span>
                    </>
                  )}
                </h1>
                <p>
                  {onboarding
                    ? 'Un recorrido breve para contar lo que sabes y cómo te gusta enseñar.'
                    : tutorMode
                      ? 'Tu espacio para enseñar, compartir y gestionar tus tutorías.'
                      : account
                        ? 'Los datos con los que formas parte de esta comunidad.'
                        : 'Qué bueno verte por aquí. Sigamos construyendo tu próximo logro.'}
                </p>
              </div>
              <div className="dashboard-welcome-side">
                <img
                  className="dashboard-mascot"
                  src={tutorMode ? '/images/llama-ensenando.png' : '/images/llama-estudiando.png'}
                  alt=""
                  width="1396"
                  height="1127"
                />
                <div className="campus-badge">
                  <Building2 size={20} />
                  <span>
                    <small>MI UNIVERSIDAD</small>
                    <strong>{user.university}</strong>
                  </span>
                </div>
              </div>
            </div>
          )}
          <Notice success>{location.state?.notice}</Notice>
          {detail ? (
            <PublicationDetail />
          ) : onboarding ? (
            <TutorOnboarding />
          ) : account ? (
            <Account user={user} />
          ) : publications ? (
            <PublicationManager />
          ) : editor ? (
            <PublicationEditor />
          ) : tutorProfile ? (
            <TutorProfileEditor />
          ) : tutorPending ? (
            <TutorPendingSection type={section} />
          ) : tutorMode ? (
            <TutorPanel />
          ) : page ? (
            <section className="workspace-empty workspace-pending">
              <img
                src="/images/llama-mascota.png"
                alt="La llama de Tutorías"
                width="1396"
                height="1127"
              />
              <h2>{page.title}</h2>
              <p>{page.description}</p>
              <p className="workspace-caption">{page.detail}</p>
              <Link to="/dashboard" className="btn btn-primary">
                Volver a explorar
              </Link>
            </section>
          ) : (
            <PublicationDirectory />
          )}
        </div>
      </main>
      <Footer compact />
    </>
  );
}

function Account({ user }) {
  return (
    <div className="account-layout account-with-mascot">
      <AcademicSymbols section={2} />
      <section className="account-card">
        <span className="large-avatar">
          {user.firstName[0]}
          {user.lastName[0]}
        </span>
        <h2>
          {user.firstName} {user.lastName}
        </h2>
        <span className="role-label">
          <UserRound size={14} />{' '}
          {user.role === 'admin' ? 'Administrador' : 'Estudiante universitario'}
        </span>
        <dl>
          <div>
            <dt>
              <Mail size={16} /> Correo electrónico
            </dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>
              <Building2 size={16} /> Universidad
            </dt>
            <dd>{user.university}</dd>
          </div>
          <div>
            <dt>
              <GraduationCap size={16} /> Carrera
            </dt>
            <dd>{user.degree}</dd>
          </div>
          <div>
            <dt>
              <BookOpen size={16} /> Semestre
            </dt>
            <dd>{user.semester}.º semestre</dd>
          </div>
        </dl>
        <AcademicProfile />
      </section>
      <div className="account-sidebar">
        <ContactDetails />
        <aside className="account-llama" aria-label="La llama te acompaña">
          <img
            src="/images/llama-estudiando.png"
            alt="La llama de Tutorías leyendo junto a su mochila"
            width="1396"
            height="1127"
          />
        </aside>
      </div>
    </div>
  );
}
