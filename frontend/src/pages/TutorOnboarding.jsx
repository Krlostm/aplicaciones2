import Select from '../components/Select';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Field, Notice } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { contactApi, publicationApi, tutorApi } from '../services/http';
import AcademicSymbols from '../components/AcademicSymbols';

const stages = ['Sobre ti', 'Tus materias', 'Tu presentación', 'Revisar'];
const levels = [
  'Estoy empezando',
  'Lo practico',
  'Me desenvuelvo',
  'Lo explico con claridad',
  'Lo domino ampliamente',
];
const pictures = [
  'llama-mascota.png',
  'llama-estudiando.png',
  'llama-ensenando.png',
  'llama-emprendiendo.png',
];

export default function TutorOnboarding() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [subjectPage, setSubjectPage] = useState(0);
  const [activeSubject, setActiveSubject] = useState(null);
  const [reviewTab, setReviewTab] = useState('datos');
  const [reviewPage, setReviewPage] = useState(0);
  const [viewport, setViewport] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  useEffect(() => {
    const resize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);
  const pageSize = viewport.width <= 760 ? (viewport.height < 700 ? 4 : 6) : 12;
  const [form, setForm] = useState({
    university: user.university,
    degree: user.degree,
    semester: String(user.semester),
    city: '',
    address: '',
    headline: '',
    bio: '',
    subjects: [],
  });
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState({});
  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadFailed(false);
    setError('');
    Promise.all([publicationApi.subjects(), tutorApi.getOwnProfile(), contactApi.getOwnContact()])
      .then(([catalog, { profile }, { contact }]) => {
        if (!active) return;
        setSubjects(catalog.subjects);
        setForm((old) => ({
          ...old,
          headline: profile?.headline || '',
          bio: profile?.bio || '',
          subjects:
            profile?.subjects?.map(({ subjectId, proficiency }) => ({ subjectId, proficiency })) ||
            [],
          city: contact?.city || '',
          address: contact?.address || '',
        }));
      })
      .catch((e) => {
        if (active) {
          setError(e.message);
          setLoadFailed(true);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  function change({ target: { name, value } }) {
    setForm((old) => ({ ...old, [name]: value }));
    setFields((old) => ({ ...old, [name]: undefined }));
    setError('');
  }
  function toggleSubject(id) {
    setActiveSubject(id);
    setForm((old) => ({
      ...old,
      subjects: old.subjects.some((s) => s.subjectId === id)
        ? old.subjects.filter((s) => s.subjectId !== id)
        : [...old.subjects, { subjectId: id, proficiency: 0 }],
    }));
    setError('');
  }
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [step]);
  async function submit(event) {
    event.preventDefault();
    setError('');
    setFields({});
    if (step === 0 && Boolean(form.city.trim()) !== Boolean(form.address.trim())) {
      setError('Completa la ciudad y la dirección juntas, o deja ambas vacías.');
      return;
    }
    if (step === 1 && (!form.subjects.length || form.subjects.some((s) => !s.proficiency))) {
      setActiveSubject(form.subjects.find((s) => !s.proficiency)?.subjectId || null);
      setError('Selecciona al menos una materia e indica tu dominio en cada una.');
      return;
    }
    if (step < 3) {
      setStep((value) => value + 1);
      return;
    }
    setBusy(true);
    try {
      const result = await tutorApi.completeOnboarding({
        ...form,
        semester: Number(form.semester),
        city: form.city.trim() || undefined,
        address: form.address.trim() || undefined,
      });
      updateUser(result.user);
      navigate('/dashboard/tutor', {
        replace: true,
        state: {
          notice: 'Tu perfil de tutor está creado. Ya puedes preparar tu primera publicación.',
        },
      });
    } catch (e) {
      setError(e.message);
      setFields(e.fields || {});
      if (e.fields?.subjects) setStep(1);
      else if (e.fields?.headline || e.fields?.bio) setStep(2);
      else if (
        e.fields?.university ||
        e.fields?.degree ||
        e.fields?.semester ||
        e.fields?.city ||
        e.fields?.address
      )
        setStep(0);
    } finally {
      setBusy(false);
    }
  }
  if (loading)
    return (
      <div className="workspace-loading" role="status">
        Preparando tu presentación como tutor…
      </div>
    );
  if (loadFailed)
    return (
      <section className="workspace-empty">
        <Notice>{error}</Notice>
        <Button onClick={() => setAttempt((value) => value + 1)}>Volver a intentar</Button>
      </section>
    );
  const selectedIndex = Math.max(
    0,
    form.subjects.findIndex((s) => s.subjectId === activeSubject),
  );
  const visibleSubject = form.subjects[selectedIndex];
  const pages = Math.ceil(subjects.length / pageSize);
  const currentSubjectPage = Math.min(subjectPage, Math.max(0, pages - 1));
  const reviewSize =
    viewport.width <= 760 ? (viewport.height < 620 ? 2 : 3) : viewport.height < 700 ? 4 : 5;
  const bioPageSize = viewport.width <= 760 ? (viewport.height < 620 ? 140 : 260) : 500;
  const bioChunks = form.bio.match(
    new RegExp(`.{1,${bioPageSize}}(?:\\s|$)|.{1,${bioPageSize}}`, 'gs'),
  ) || [''];
  return (
    <section
      className={`onboarding-layout onboarding-fullscreen onboarding-step-${step} ${step % 2 ? 'onboarding-light' : 'onboarding-orange'}`}
    >
      <aside className="onboarding-companion">
        <AcademicSymbols section={step} />
        <img
          src={`/images/${pictures[step]}`}
          alt="La llama de Tutorías te acompaña en tu presentación"
          width="1396"
          height="1127"
        />
        <h2>Tu conocimiento puede ser el comienzo de alguien más.</h2>
        <p>Una misma cuenta para aprender y enseñar. Tú eliges cuándo cambiar de modo.</p>
        <Link to="/dashboard">Volver a explorar</Link>
      </aside>
      <div className="onboarding-card">
        <nav className="onboarding-progress" aria-label="Pasos para convertirte en tutor">
          {stages.map((label, index) => (
            <button
              key={label}
              type="button"
              disabled={busy || index > step}
              aria-current={index === step ? 'step' : undefined}
              onClick={() => setStep(index)}
            >
              {label}
            </button>
          ))}
        </nav>
        <form onSubmit={submit} aria-label="Presentación como tutor">
          {step === 0 && (
            <>
              <h2>Empecemos por ti.</h2>
              <p>Revisa tus datos académicos. Ya están vinculados a tu cuenta.</p>
              <Field
                id="tutor-university"
                name="university"
                label="Universidad"
                value={form.university}
                onChange={change}
                minLength={2}
                maxLength={120}
                required
                error={fields.university}
              />
              <Field
                id="tutor-degree"
                name="degree"
                label="Carrera"
                value={form.degree}
                onChange={change}
                minLength={2}
                maxLength={120}
                required
                error={fields.degree}
              />
              <Field id="tutor-semester" label="Semestre" error={fields.semester}>
                <Select
                  id="tutor-semester"
                  name="semester"
                  value={form.semester}
                  onChange={change}
                  required
                >
                  {Array.from({ length: 8 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}.º semestre
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="onboarding-private">
                <h3>Ciudad y dirección</h3>
                <p>Opcionales y privadas. Se usan los mismos datos de tu cuenta.</p>
                <Field
                  id="onboarding-city"
                  name="city"
                  label="Ciudad"
                  value={form.city}
                  onChange={change}
                  minLength={2}
                  maxLength={100}
                  autoComplete="address-level2"
                  error={fields.city}
                />
                <Field
                  id="onboarding-address"
                  name="address"
                  label="Dirección"
                  value={form.address}
                  onChange={change}
                  minLength={5}
                  maxLength={240}
                  autoComplete="street-address"
                  error={fields.address}
                />
              </div>
            </>
          )}
          {step === 1 && (
            <>
              <h2>¿Qué materias te gusta explicar?</h2>
              <p>Selecciona hasta diez y cuéntanos cómo te desenvuelves en cada una.</p>
              <div className="onboarding-subjects">
                {subjects
                  .slice(currentSubjectPage * pageSize, (currentSubjectPage + 1) * pageSize)
                  .map((subject) => (
                    <button
                      type="button"
                      aria-pressed={form.subjects.some((s) => s.subjectId === subject.id)}
                      disabled={
                        !form.subjects.some((s) => s.subjectId === subject.id) &&
                        form.subjects.length >= 10
                      }
                      onClick={() => toggleSubject(subject.id)}
                      key={subject.id}
                      className={
                        form.subjects.some((s) => s.subjectId === subject.id) ? 'selected' : ''
                      }
                    >
                      {subject.name}
                    </button>
                  ))}
              </div>
              {pages > 1 && (
                <div className="onboarding-mini-pager" aria-label="Páginas de materias">
                  <button
                    type="button"
                    disabled={currentSubjectPage === 0}
                    onClick={() => setSubjectPage(currentSubjectPage - 1)}
                  >
                    Materias anteriores
                  </button>
                  <span>
                    {currentSubjectPage + 1} de {pages}
                  </span>
                  <button
                    type="button"
                    disabled={currentSubjectPage === pages - 1}
                    onClick={() => setSubjectPage(currentSubjectPage + 1)}
                  >
                    Más materias
                  </button>
                </div>
              )}
              {visibleSubject &&
                [visibleSubject].map((selected) => (
                  <div className="proficiency-pager" key={selected.subjectId}>
                    {form.subjects.length > 1 && (
                      <div className="onboarding-mini-pager">
                        <button
                          type="button"
                          disabled={selectedIndex === 0}
                          onClick={() =>
                            setActiveSubject(form.subjects[selectedIndex - 1].subjectId)
                          }
                        >
                          Materia anterior
                        </button>
                        <span>
                          {selectedIndex + 1} de {form.subjects.length} elegidas
                        </span>
                        <button
                          type="button"
                          disabled={selectedIndex === form.subjects.length - 1}
                          onClick={() =>
                            setActiveSubject(form.subjects[selectedIndex + 1].subjectId)
                          }
                        >
                          Siguiente materia
                        </button>
                      </div>
                    )}
                    <fieldset className="proficiency-field" key={selected.subjectId}>
                      <legend>
                        Tu dominio en {subjects.find((s) => s.id === selected.subjectId)?.name}
                      </legend>
                      <div>
                        {levels.map((label, index) => (
                          <button
                            key={label}
                            type="button"
                            aria-label={`${index + 1}: ${label}`}
                            aria-pressed={selected.proficiency === index + 1}
                            onClick={() =>
                              setForm((old) => ({
                                ...old,
                                subjects: old.subjects.map((s) =>
                                  s.subjectId === selected.subjectId
                                    ? { ...s, proficiency: index + 1 }
                                    : s,
                                ),
                              }))
                            }
                          >
                            {index + 1}
                          </button>
                        ))}
                      </div>
                      <small>
                        {selected.proficiency
                          ? levels[selected.proficiency - 1]
                          : 'Elige un nivel del 1 al 5.'}
                      </small>
                    </fieldset>
                  </div>
                ))}
              <p className="onboarding-help">
                Es una valoración personal. Este cuestionario no es un examen ni una certificación.
              </p>
            </>
          )}
          {step === 2 && (
            <>
              <h2>Que conozcan tu forma de enseñar.</h2>
              <p>Tu presentación acompaña a las tutorías que publiques.</p>
              <Field
                id="headline"
                name="headline"
                label="Tu especialidad"
                value={form.headline}
                onChange={change}
                minLength={2}
                maxLength={100}
                required
                placeholder="Por ejemplo: Programación, con ejemplos claros"
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
                  placeholder="Cómo explicas, qué te gusta enseñar y cómo puedes ayudar…"
                />
              </Field>
              <p className="onboarding-help">
                Evita incluir tu dirección, contraseñas o datos de contacto privados.
              </p>
            </>
          )}
          {step === 3 && (
            <>
              <h2>Así comienza tu espacio de tutor.</h2>
              <p>Revisa tu presentación antes de continuar.</p>
              <div className="onboarding-review-tabs" aria-label="Apartados de tu presentación">
                {[
                  ['datos', 'Datos académicos'],
                  ['presentacion', 'Presentación'],
                  ['materias', 'Materias'],
                ].map(([value, label]) => (
                  <button
                    type="button"
                    key={value}
                    aria-pressed={reviewTab === value}
                    onClick={() => {
                      setReviewTab(value);
                      setReviewPage(0);
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="onboarding-review">
                {reviewTab === 'datos' && (
                  <>
                    <strong>
                      {user.firstName} {user.lastName}
                    </strong>
                    <span>
                      {form.degree} · {form.university}
                    </span>
                    <span>{form.semester}.º semestre</span>
                  </>
                )}
                {reviewTab === 'presentacion' && (
                  <>
                    <h3>{form.headline}</h3>
                    <p>{bioChunks[Math.min(reviewPage, bioChunks.length - 1)]}</p>
                    {bioChunks.length > 1 && (
                      <div className="onboarding-mini-pager">
                        <button
                          type="button"
                          disabled={reviewPage === 0}
                          onClick={() => setReviewPage((p) => p - 1)}
                        >
                          Texto anterior
                        </button>
                        <span>
                          {reviewPage + 1} de {bioChunks.length}
                        </span>
                        <button
                          type="button"
                          disabled={reviewPage >= bioChunks.length - 1}
                          onClick={() => setReviewPage((p) => p + 1)}
                        >
                          Seguir leyendo
                        </button>
                      </div>
                    )}
                  </>
                )}
                {reviewTab === 'materias' && (
                  <>
                    <ul>
                      {form.subjects
                        .slice(reviewPage * reviewSize, (reviewPage + 1) * reviewSize)
                        .map((s) => (
                          <li key={s.subjectId}>
                            {subjects.find((subject) => subject.id === s.subjectId)?.name}
                            <span>Dominio declarado: {s.proficiency}/5</span>
                          </li>
                        ))}
                    </ul>
                    {form.subjects.length > reviewSize && (
                      <div className="onboarding-mini-pager">
                        <button
                          type="button"
                          disabled={reviewPage === 0}
                          onClick={() => setReviewPage((p) => p - 1)}
                        >
                          Anteriores
                        </button>
                        <span>
                          {reviewPage + 1} de {Math.ceil(form.subjects.length / reviewSize)}
                        </span>
                        <button
                          type="button"
                          disabled={(reviewPage + 1) * reviewSize >= form.subjects.length}
                          onClick={() => setReviewPage((p) => p + 1)}
                        >
                          Siguientes
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
              <p className="onboarding-help">
                Tu ciudad y dirección permanecen privadas. Seguirás usando tu misma cuenta de
                estudiante.
              </p>
            </>
          )}
          <Notice>{error}</Notice>
          <div className="onboarding-actions">
            {step > 0 && (
              <Button
                variant="outline"
                type="button"
                disabled={busy}
                onClick={() => {
                  setStep((s) => s - 1);
                  setError('');
                }}
              >
                Anterior
              </Button>
            )}
            <Button type="submit" busy={busy}>
              {step < 3
                ? 'Continuar'
                : user.isTutor
                  ? 'Guardar perfil de tutor'
                  : 'Crear mi perfil de tutor'}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
