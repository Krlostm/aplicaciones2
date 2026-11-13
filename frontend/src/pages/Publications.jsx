import Select from '../components/Select';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  BookOpen,
  GraduationCap,
  Search,
  Plus,
  Eye,
  Pencil,
  MapPin,
  Monitor,
  X,
} from 'lucide-react';
import { Button, Field, Notice } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { publicationApi } from '../services/http';
import AcademicSymbols from '../components/AcademicSymbols';
import SubjectIcon from '../components/SubjectIcon';
import { formatPrice, parsePrice, priceUnitLabel } from '../utils/price';

const modes = { virtual: 'Virtual', presencial: 'Presencial', ambas: 'Virtual y presencial' };
const blank = {
  subjectId: '',
  title: '',
  description: '',
  modality: 'virtual',
  price: '',
  priceUnit: 'session',
};
export function Price({ publication }) {
  return (
    <span className={`offer-price ${publication.priceCents == null ? 'offer-price-pending' : ''}`}>
      <strong>{formatPrice(publication)}</strong>
      {publication.priceCents > 0 && <small>{priceUnitLabel(publication.priceUnit)}</small>}
    </span>
  );
}
export function useOwnPublications() {
  const { refresh } = useAuth();
  const [items, setItems] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    publicationApi
      .mine()
      .then((d) => {
        if (active) setItems(d.publications);
      })
      .catch((e) => {
        if (active) setError(e.message);
        if (e.status === 401) void refresh();
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [revision, refresh]);
  return { items, loading, error, reload: () => setRevision((v) => v + 1) };
}

export function PublicationManager() {
  const { items, loading, error, reload } = useOwnPublications();
  const [tab, setTab] = useState('all'),
    [busy, setBusy] = useState(false),
    [failure, setFailure] = useState('');
  const shown = items.filter((p) => tab === 'all' || (tab === 'active' ? p.isActive : !p.isActive));
  async function toggle(item) {
    setBusy(true);
    setFailure('');
    try {
      await publicationApi.state(item.id, !item.isActive);
      reload();
    } catch (e) {
      setFailure(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="owner-publications">
      <div className="workspace-section-heading">
        <div>
          <h2>Tus tutorías, en un solo lugar.</h2>
          <p>Revisa lo que ofreces, actualiza tus precios y decide qué mantener visible.</p>
        </div>
        <Link className="btn btn-primary" to="/dashboard/tutor/publicaciones/nueva">
          <Plus size={18} />
          Agregar una tutoría
        </Link>
      </div>
      <Notice>{error || failure}</Notice>
      <div className="owner-tabs" aria-label="Filtrar mis publicaciones">
        {[
          ['all', 'Todas', items.length],
          ['active', 'Activas', items.filter((p) => p.isActive).length],
          ['inactive', 'Pausadas', items.filter((p) => !p.isActive).length],
        ].map(([value, label, count]) => (
          <button key={value} aria-pressed={tab === value} onClick={() => setTab(value)}>
            {label}
            <span>{count}</span>
          </button>
        ))}
      </div>
      {loading ? (
        <div role="status" className="workspace-loading">
          Cargando tus publicaciones…
        </div>
      ) : !shown.length ? (
        <div className="workspace-empty">
          <img
            src="/images/llama-ensenando.png"
            alt="La llama de Tutorías lista para enseñar"
            width="1396"
            height="1127"
          />
          <h3>
            {items.length
              ? 'No tienes publicaciones en este estado.'
              : 'Tu primera tutoría empieza aquí.'}
          </h3>
          <p>Elige una asignatura, cuenta qué vas a enseñar y añade tu precio.</p>
          <Link className="btn btn-primary" to="/dashboard/tutor/publicaciones/nueva">
            Agregar una tutoría
          </Link>
        </div>
      ) : (
        <div className="owner-publication-list">
          {shown.map((item) => (
            <article className="publication-manage-item" key={item.id}>
              <div className="owner-offer-summary">
                <span className="owner-offer-icon">
                  <BookOpen size={24} />
                </span>
                <div>
                  <span className={`offer-status ${item.isActive ? 'active' : ''}`}>
                    {item.isActive ? 'Activa' : 'Pausada'}
                  </span>
                  <h3>{item.title}</h3>
                  <p>
                    {item.subject} · {modes[item.modality]}
                  </p>
                </div>
              </div>
              <Price publication={item} />
              <span className="owner-views">
                <Eye size={16} />
                {item.views || 0}
                <small>visitas</small>
              </span>
              <div className="publication-actions">
                <Link
                  className="btn btn-outline"
                  to={`/dashboard/tutor/publicaciones/${item.id}/editar`}
                >
                  <Pencil size={15} />
                  Editar
                </Link>
                <Button variant="outline" disabled={busy} onClick={() => toggle(item)}>
                  {item.isActive ? 'Desactivar' : 'Activar'}
                </Button>
                <Link className="owner-preview-link" to={`/dashboard/tutor/vista/${item.id}`}>
                  Ver tutoría
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
      <p className="workspace-caption">
        Las visitas cuentan una vez por estudiante y día. Tus propias visitas no se suman.
      </p>
    </section>
  );
}

export function PublicationEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(blank),
    [subjects, setSubjects] = useState([]),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [fields, setFields] = useState({});
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    if (!id) setForm(blank);
    Promise.all([
      publicationApi.subjects(),
      id ? publicationApi.mine() : Promise.resolve({ publications: [] }),
    ])
      .then(([catalog, own]) => {
        if (!active) return;
        setSubjects(catalog.subjects);
        if (id) {
          const item = own.publications.find((p) => p.id === id);
          if (!item) throw new Error('No encontramos esta publicación en tu cuenta.');
          setForm({
            subjectId: item.subjectId,
            title: item.title,
            description: item.description,
            modality: item.modality,
            price: item.priceCents == null ? '' : (item.priceCents / 100).toFixed(2),
            priceUnit: item.priceUnit,
          });
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
  }, [id]);
  function change({ target: { name, value } }) {
    setForm((old) => ({ ...old, [name]: value }));
    setFields((old) => ({ ...old, [name]: undefined }));
  }
  async function save(event) {
    event.preventDefault();
    const priceCents = parsePrice(form.price);
    if (priceCents === null) {
      setFields({ priceCents: 'Escribe un precio válido con hasta dos decimales.' });
      return;
    }
    setBusy(true);
    setError('');
    setFields({});
    try {
      const { price, ...data } = form;
      const payload = { ...data, priceCents };
      if (id) await publicationApi.update(id, payload);
      else await publicationApi.create(payload);
      navigate('/dashboard/tutor/publicaciones', {
        replace: true,
        state: { notice: id ? 'Publicación actualizada.' : 'Tu tutoría se publicó correctamente.' },
      });
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
        Preparando tu publicación…
      </div>
    );
  const preview = { ...form, priceCents: parsePrice(form.price) };
  return (
    <div className="publication-editor-layout">
      <section className="publication-form-card">
        <form
          className="publication-form"
          onSubmit={save}
          aria-label={id ? 'Editar tutoría' : 'Crear tutoría'}
        >
          <h2>{id ? 'Dale una nueva versión a tu tutoría.' : '¿Qué vas a enseñar?'}</h2>
          <p>La información se mostrará a los estudiantes que exploran tutorías.</p>
          <fieldset disabled={busy || !subjects.length}>
            <Field id="subjectId" label="Asignatura" error={fields.subjectId}>
              <Select
                id="subjectId"
                name="subjectId"
                value={form.subjectId}
                onChange={change}
                required
              >
                <option value="">Selecciona una asignatura</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              id="title"
              label="Título de la tutoría"
              value={form.title}
              onChange={change}
              minLength={5}
              maxLength={120}
              required
              error={fields.title}
              placeholder="Por ejemplo: Entiende programación con ejercicios"
            />
            <Field id="description" label="Descripción de la tutoría" error={fields.description}>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={change}
                rows={7}
                minLength={20}
                maxLength={2000}
                required
                placeholder="Qué aprenderán, a quién va dirigido y cómo lo explicarás…"
              />
            </Field>
            <div className="form-row">
              <Field
                id="price"
                label="Precio por sesión (USD)"
                value={form.price}
                onChange={change}
                type="number"
                min="0"
                max="10000"
                step="0.01"
                required
                error={fields.priceCents}
                placeholder="0.00"
              />
              <div className="price-unit-note">
                <span>Precio en dólares</span>
                <strong>Por sesión</strong>
              </div>
            </div>
            <Field
              id="modality"
              label="Modalidad"
              error={fields.modality}
              hint="Indica si enseñarás en línea, de forma presencial o de ambas maneras."
            >
              <Select id="modality" name="modality" value={form.modality} onChange={change}>
                <option value="virtual">Virtual</option>
                <option value="presencial">Presencial</option>
                <option value="ambas">Virtual y presencial</option>
              </Select>
            </Field>
          </fieldset>
          <Notice>{error}</Notice>
          <div className="publication-actions">
            <Button busy={busy} type="submit" disabled={!subjects.length}>
              {id ? 'Guardar publicación' : 'Publicar tutoría'}
            </Button>
            <Link className="btn btn-outline" to="/dashboard/tutor/publicaciones">
              Cancelar
            </Link>
          </div>
        </form>
      </section>
      <aside className="offer-preview">
        <img
          src="/images/llama-ensenando.png"
          alt="La llama te acompaña al preparar tu tutoría"
          width="1396"
          height="1127"
        />
        <span>VISTA PREVIA</span>
        <h3>{form.title || 'Así se verá tu tutoría'}</h3>
        <p>
          {subjects.find((s) => s.id === form.subjectId)?.name || 'Tu asignatura'} ·{' '}
          {modes[form.modality]}
        </p>
        <Price publication={preview} />
        <p className="workspace-caption">
          Los acuerdos y pagos se realizan fuera de la plataforma. Tu dirección permanece privada.
        </p>
      </aside>
    </div>
  );
}

export function PublicationDirectory() {
  const { refresh } = useAuth();
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const q = params.get('q') || '',
    subjectId = params.get('subjectId') || '',
    page = Number(params.get('page')) || 1;
  const subjectName = params.get('asignatura');
  const [draft, setDraft] = useState(q),
    [subject, setSubject] = useState(subjectId),
    [subjects, setSubjects] = useState([]),
    [result, setResult] = useState({ publications: [], total: 0, pageSize: 12 }),
    [loading, setLoading] = useState(true),
    [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    publicationApi
      .subjects()
      .then((d) => {
        if (active) {
          setSubjects(d.subjects);
          if (subjectName) {
            const normalize = (value) =>
              value
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase();
            const found = d.subjects.find((s) => normalize(s.name) === normalize(subjectName));
            setParams(
              { ...(q ? { q } : {}), ...(found ? { subjectId: found.id } : {}) },
              { replace: true },
            );
          }
        }
      })
      .catch((e) => {
        if (active) {
          setError(e.message);
          if (subjectName) setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [subjectName, setParams, q]);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setDraft(q);
    setSubject(subjectId);
    if (subjectName)
      return () => {
        active = false;
      };
    publicationApi
      .search({ q, subjectId, page })
      .then((d) => {
        if (active) setResult(d);
      })
      .catch((e) => {
        if (active) setError(e.message);
        if (e.status === 401) void refresh();
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [q, subjectId, page, refresh, subjectName]);
  function search(event) {
    event.preventDefault();
    setParams({
      ...(draft.trim() ? { q: draft.trim() } : {}),
      ...(subject ? { subjectId: subject } : {}),
    });
  }
  return (
    <section className="publication-directory workspace-directory">
      <AcademicSymbols section={1} />
      <div className="workspace-section-heading">
        <div>
          <h2>Encuentra tu próxima tutoría.</h2>
          <p>Busca por el nombre de la tutoría y filtra por asignatura.</p>
        </div>
      </div>
      <form className="publication-search" onSubmit={search} aria-label="Buscar tutorías">
        <Field id="publication-query" label="Buscar por nombre">
          <input
            id="publication-query"
            value={draft}
            maxLength={100}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Límites, derivadas, consultas SQL…"
          />
        </Field>
        <Field id="publication-subject" label="Asignatura">
          <Select
            id="publication-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            <option value="">Todas las asignaturas</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Button type="submit">
          <Search size={17} />
          Buscar
        </Button>
      </form>
      {(q || subjectId) && (
        <div className="active-filters">
          {q && <span>Nombre: {q}</span>}
          {subjectId && (
            <span>
              Asignatura:{' '}
              {subjects.find((s) => s.id === subjectId)?.name || 'Asignatura seleccionada'}
            </span>
          )}
          <button type="button" onClick={() => setParams({})}>
            <X size={15} />
            Eliminar filtros
          </button>
        </div>
      )}
      <Notice>{error}</Notice>
      {loading ? (
        <div className="workspace-loading" role="status">
          Buscando tutorías…
        </div>
      ) : (
        <>
          <p className="publication-count">
            {result.total}{' '}
            {result.total === 1 ? 'publicación disponible' : 'publicaciones disponibles'}
          </p>
          {!result.publications.length ? (
            <div className="directory-empty">
              <img
                className="directory-mascot"
                src="/images/llama-estudiando.png"
                alt="La llama de Tutorías buscando una nueva explicación"
                width="1396"
                height="1127"
              />
              <h3>No encontramos tutorías para esta búsqueda.</h3>
              <p>Prueba otra asignatura o vuelve a explorar todas las materias.</p>
            </div>
          ) : (
            <div className="publication-cards">
              {result.publications.map((item, index) => (
                <article className={`publication-card offer-color-${index % 3}`} key={item.id}>
                  <div className="offer-card-heading">
                    <span className="offer-subject-icon">
                      <SubjectIcon subject={item.subject} size={24} />
                    </span>
                    <div className="offer-card-titles">
                      <span className="role-label">{item.subject}</span>
                      <span className="publication-mode">{modes[item.modality]}</span>
                      <h3>
                        <Link
                          to={`/dashboard/publicaciones/${item.id}`}
                          state={{ from: location.pathname + location.search }}
                        >
                          {item.title}
                        </Link>
                      </h3>
                    </div>
                  </div>
                  <p className="publication-description">{item.description}</p>
                  <div className="publication-tutor">
                    <span className="offer-avatar">
                      {item.tutor.firstName[0]}
                      {item.tutor.lastName[0]}
                    </span>
                    <span>
                      <strong>
                        {item.tutor.firstName} {item.tutor.lastName}
                      </strong>
                      <small>
                        {item.tutor.university} · {item.tutor.degree}
                      </small>
                    </span>
                  </div>
                  <div className="offer-card-bottom">
                    <Price publication={item} />
                    <Link
                      className="btn btn-outline"
                      to={`/dashboard/publicaciones/${item.id}`}
                      state={{ from: location.pathname + location.search }}
                    >
                      Ver tutoría
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
          {result.total > result.pageSize && (
            <nav className="publication-pagination" aria-label="Páginas de tutorías">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() =>
                  setParams({
                    ...(q ? { q } : {}),
                    ...(subjectId ? { subjectId } : {}),
                    page: String(page - 1),
                  })
                }
              >
                Anterior
              </Button>
              <span>
                Página {page} de {Math.ceil(result.total / result.pageSize)}
              </span>
              <Button
                variant="outline"
                disabled={page * result.pageSize >= result.total}
                onClick={() =>
                  setParams({
                    ...(q ? { q } : {}),
                    ...(subjectId ? { subjectId } : {}),
                    page: String(page + 1),
                  })
                }
              >
                Siguiente
              </Button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}

export function PublicationDetail() {
  const { id } = useParams();
  const location = useLocation();
  const [item, setItem] = useState(null),
    [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setItem(null);
    setError('');
    publicationApi
      .detail(id)
      .then((d) => {
        if (!active) return;
        setItem(d.publication);
        if (!d.publication.isOwner) void publicationApi.recordView(id).catch(() => {});
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [id]);
  const back =
    typeof location.state?.from === 'string' && location.state.from.startsWith('/dashboard')
      ? location.state.from
      : '/dashboard';
  if (error)
    return (
      <section className="workspace-empty">
        <Notice>{error}</Notice>
        <Link className="btn btn-primary" to={back}>
          Volver a las tutorías
        </Link>
      </section>
    );
  if (!item)
    return (
      <div role="status" className="workspace-loading">
        Abriendo tutoría…
      </div>
    );
  return (
    <section className="offer-detail">
      <div className="offer-detail-main">
        <Link
          className="workspace-back"
          to={item.isOwner ? '/dashboard/tutor/publicaciones' : back}
        >
          Volver a las tutorías
        </Link>
        <span className="role-label">{item.subject}</span>
        <h2>{item.title}</h2>
        <div className="offer-detail-tutor">
          <span className="offer-avatar">
            {item.tutor.firstName[0]}
            {item.tutor.lastName[0]}
          </span>
          <span>
            <strong>
              {item.tutor.firstName} {item.tutor.lastName}
            </strong>
            <small>
              {item.tutor.degree} · {item.tutor.university}
            </small>
          </span>
        </div>
        <h3>Sobre esta tutoría</h3>
        <p className="offer-detail-description">{item.description}</p>
        <h3>Conoce a tu tutor</h3>
        <strong>{item.tutor.headline}</strong>
        <p>{item.tutor.bio}</p>
        {item.tutor.proficiency && (
          <p className="workspace-caption">
            Dominio declarado por el tutor en esta materia: {item.tutor.proficiency}/5.
          </p>
        )}
      </div>
      <aside className="offer-detail-booking">
        <img
          src="/images/llama-estudiando.png"
          alt="La llama de Tutorías preparada para aprender"
          width="1396"
          height="1127"
        />
        <Price publication={item} />
        <span className="offer-detail-modality">
          {item.modality === 'virtual' ? <Monitor size={19} /> : <MapPin size={19} />}{' '}
          {modes[item.modality]}
        </span>
        <p>Una nueva forma de entender {item.subject.toLowerCase()}.</p>
        {item.isOwner ? (
          <Link className="btn btn-primary" to={`/dashboard/tutor/publicaciones/${item.id}/editar`}>
            Editar mi publicación
          </Link>
        ) : (
          <div className="offer-contact-note">
            La mensajería y la reserva de sesiones todavía no están disponibles.
          </div>
        )}
        <small>
          El precio es informativo. Los acuerdos y pagos se realizan fuera de la plataforma.
        </small>
      </aside>
    </section>
  );
}
