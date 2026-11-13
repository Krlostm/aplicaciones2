import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Eye, Plus, Pencil, Wallet, MessageSquare, CalendarDays } from 'lucide-react';
import { Button, Field, Notice } from '../components/UI';
import { tutorApi } from '../services/http';
import { Price, useOwnPublications } from './Publications';

export default function TutorPanel() {
  const { items, loading, error } = useOwnPublications();
  const stats = [
    ['Publicaciones', items.length, BookOpen],
    ['Tutorías activas', items.filter((p) => p.isActive).length, Plus],
    ['Visitas recibidas', items.reduce((total, p) => total + (p.views || 0), 0), Eye],
  ];
  return (
    <section className="tutor-dashboard">
      <div className="workspace-section-heading">
        <div>
          <h2>Tu conocimiento, en marcha.</h2>
          <p>Prepara tus tutorías y gestiona todo lo que compartes.</p>
        </div>
        <div className="publication-actions">
          <Link className="btn btn-outline" to="/dashboard/tutor/publicaciones">
            Mis publicaciones
          </Link>
          <Link className="btn btn-primary" to="/dashboard/tutor/publicaciones/nueva">
            <Plus size={18} />
            Agregar una tutoría
          </Link>
        </div>
      </div>
      <Notice>{error}</Notice>
      <div className="tutor-stats">
        {stats.map(([label, value, Icon]) => (
          <article key={label}>
            <span>
              <Icon size={20} />
              {label}
            </span>
            <strong>{loading ? '—' : value}</strong>
          </article>
        ))}
      </div>
      <div className="tutor-overview-grid">
        <section className="workspace-surface">
          <div className="workspace-section-heading">
            <div>
              <h3>Tus publicaciones recientes</h3>
              <p>Todo lo que ofreces, listo para una nueva mirada.</p>
            </div>
            <Link to="/dashboard/tutor/publicaciones">Ver todas</Link>
          </div>
          {loading ? (
            <p role="status">Cargando tus publicaciones…</p>
          ) : !items.length ? (
            <div className="tutor-start">
              <img
                src="/images/llama-ensenando.png"
                alt="La llama lista para tu primera tutoría"
                width="1396"
                height="1127"
              />
              <h3>Tu primera publicación empieza con una materia que dominas.</h3>
              <Link className="btn btn-primary" to="/dashboard/tutor/publicaciones/nueva">
                Agregar una tutoría
              </Link>
            </div>
          ) : (
            <div className="tutor-recent-list">
              {items.slice(0, 4).map((item) => (
                <article key={item.id}>
                  <div>
                    <span className={`offer-status ${item.isActive ? 'active' : ''}`}>
                      {item.isActive ? 'Activa' : 'Pausada'}
                    </span>
                    <h4>{item.title}</h4>
                    <p>{item.subject}</p>
                  </div>
                  <Price publication={item} />
                  <Link
                    className="btn btn-outline"
                    to={`/dashboard/tutor/publicaciones/${item.id}/editar`}
                  >
                    <Pencil size={15} />
                    Editar
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
        <aside className="tutor-quick-links">
          <Link to="/dashboard/tutor/perfil">
            <Pencil size={22} />
            <span>
              <strong>Mi perfil de tutor</strong>
              <small>Tu presentación y tus materias</small>
            </span>
          </Link>
          <Link to="/dashboard/tutor/mensajes">
            <MessageSquare size={22} />
            <span>
              <strong>Mensajes</strong>
              <small>El espacio para tus conversaciones</small>
            </span>
          </Link>
          <Link to="/dashboard/tutor/reservas">
            <CalendarDays size={22} />
            <span>
              <strong>Reservas</strong>
              <small>Tu espacio para próximos encuentros</small>
            </span>
          </Link>
          <Link to="/dashboard/tutor/ingresos">
            <Wallet size={22} />
            <span>
              <strong>Ingresos</strong>
              <small>Precios y acuerdos de tus tutorías</small>
            </span>
          </Link>
          <p>
            Las visitas se cuentan una vez por estudiante y día. Tus propias visitas no se suman.
          </p>
        </aside>
      </div>
    </section>
  );
}

export function TutorProfileEditor() {
  const [form, setForm] = useState({ headline: '', bio: '' }),
    [profile, setProfile] = useState(null),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [success, setSuccess] = useState(''),
    [fields, setFields] = useState({});
  useEffect(() => {
    let active = true;
    tutorApi
      .getOwnProfile()
      .then(({ profile: saved }) => {
        if (active) {
          setProfile(saved);
          setForm({ headline: saved?.headline || '', bio: saved?.bio || '' });
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  function change({ target: { name, value } }) {
    setForm((old) => ({ ...old, [name]: value }));
    setSuccess('');
    setFields((old) => ({ ...old, [name]: undefined }));
  }
  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const result = await tutorApi.saveOwnProfile(form);
      setProfile(result.profile);
      setSuccess('Los cambios de tu perfil de tutor se guardaron correctamente.');
    } catch (e) {
      setError(e.message);
      setFields(e.fields || {});
    } finally {
      setBusy(false);
    }
  }
  if (loading)
    return (
      <div className="workspace-loading" role="status">
        Abriendo tu perfil de tutor…
      </div>
    );
  return (
    <div className="tutor-profile-layout">
      <section className="workspace-surface">
        <h2>Tu forma de enseñar.</h2>
        <p>Esta presentación acompaña a tus publicaciones.</p>
        <form className="tutor-form" onSubmit={save}>
          <Field
            id="headline"
            label="Tu especialidad"
            value={form.headline}
            onChange={change}
            minLength={2}
            maxLength={100}
            required
            error={fields.headline}
          />
          <Field id="bio" label="Presentación" error={fields.bio}>
            <textarea
              id="bio"
              name="bio"
              rows={7}
              value={form.bio}
              onChange={change}
              minLength={20}
              maxLength={1500}
              required
            />
          </Field>
          <Notice>{error}</Notice>
          <Notice success>{success}</Notice>
          <Button type="submit" busy={busy}>
            Guardar cambios
          </Button>
        </form>
      </section>
      <aside className="workspace-surface tutor-subject-summary">
        <img
          src="/images/llama-ensenando.png"
          alt="La llama que comparte lo que sabe"
          width="1396"
          height="1127"
        />
        <h3>Tus materias</h3>
        {profile?.subjects?.length ? (
          <ul>
            {profile.subjects.map((s) => (
              <li key={s.subjectId}>
                {s.name}
                <span>Dominio declarado: {s.proficiency}/5</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>Añade las materias que quieres compartir.</p>
        )}
        <Link className="btn btn-outline" to="/dashboard/ser-tutor">
          Actualizar mis materias
        </Link>
      </aside>
    </div>
  );
}

export function TutorPendingSection({ type }) {
  const data = {
    ingresos: {
      image: 'llama-emprendiendo.png',
      title: 'El valor de lo que enseñas.',
      text: 'El precio de cada tutoría aparece en tus publicaciones. Puedes ajustarlo cuando lo necesites.',
      detail:
        'La aplicación todavía no registra cobros ni ganancias. Los acuerdos y pagos se realizan fuera de la plataforma.',
    },
    reservas: {
      image: 'llama-mascota.png',
      title: 'Un espacio para tus próximos encuentros.',
      text: 'Aquí podrás organizar las sesiones que acuerdes con tus estudiantes.',
      detail: 'La gestión de reservas todavía no está disponible.',
    },
    mensajes: {
      image: 'llama-estudiando.png',
      title: 'Las buenas conexiones empiezan conversando.',
      text: 'Este será tu espacio para las conversaciones con estudiantes.',
      detail: 'La mensajería todavía no está disponible.',
    },
  }[type];
  return (
    <section className="workspace-empty workspace-pending">
      <img src={`/images/${data.image}`} alt="La llama de Tutorías" width="1396" height="1127" />
      <h2>{data.title}</h2>
      <p>{data.text}</p>
      <p className="workspace-caption">{data.detail}</p>
      <Link className="btn btn-primary" to="/dashboard/tutor/publicaciones">
        Ir a mis publicaciones
      </Link>
    </section>
  );
}
