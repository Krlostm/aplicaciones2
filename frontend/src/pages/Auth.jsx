import Select from '../components/Select';
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Check, ShieldCheck } from 'lucide-react';
import { Brand, Button, Field, PasswordField, Notice, PrivacyModal } from '../components/UI';
import { authApi } from '../services/http';
import { useAuth } from '../context/AuthContext';
function AuthShell({ register, children }) {
  return (
    <main className={`auth-layout ${register ? 'auth-register' : ''}`}>
      <aside className="auth-story">
        <Brand />
        <div className="auth-story-copy">
          <span className="eyebrow">DE ESTUDIANTE A ESTUDIANTE</span>
          <h1>
            {register ? (
              <>
                Tu siguiente logro
                <br />
                empieza con una
                <br />
                <em>buena conexión.</em>
              </>
            ) : (
              <>
                Hay una forma
                <br />
                de entenderlo.
                <br />
                <em>Encontrémosla.</em>
              </>
            )}
          </h1>
          <p>
            Lo que hoy parece difícil, mañana puede ser
            <br className="desktop-break" /> lo que tú le expliques a alguien más.
          </p>
          <div className="auth-story-points">
            <span>
              <Check size={17} /> Una comunidad para aprender y enseñar
            </span>
            <span>
              <Check size={17} /> A tu ritmo, en tu misma universidad
            </span>
          </div>
        </div>
        <div className="auth-mascot">
          <img
            src={register ? '/images/llama-mascota.png' : '/images/llama-estudiando.png'}
            alt={
              register
                ? 'La llama de Tutorías lista para comenzar contigo'
                : 'La llama de Tutorías con su libro abierto'
            }
            width="1396"
            height="1127"
          />
        </div>
        <span className="auth-story-footer">ECUADOR · RED ACADÉMICA ENTRE PARES</span>
      </aside>
      <section className="auth-form-side" id="contenido">
        <div className="auth-topbar">
          <Link to="/" className="back-link">
            Volver al inicio
          </Link>
          <span>
            {register ? '¿Ya tienes cuenta?' : '¿Aún no eres parte?'}{' '}
            <Link to={register ? '/iniciar-sesion' : '/registro'}>
              {register ? 'Inicia sesión' : 'Regístrate'}
            </Link>
          </span>
        </div>
        <div className="auth-form-content">
          <div className="auth-mobile-brand">
            <Brand />
          </div>
          {children}
        </div>
        <p className="auth-bottom-note">
          <ShieldCheck size={15} /> Tu espacio académico, con acceso seguro.
        </p>
      </section>
    </main>
  );
}
export default function Auth({ register = false }) {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState({});
  const [privacy, setPrivacy] = useState(false);
  if (user && !loading) return <Navigate to="/dashboard" replace />;
  async function submit(e) {
    e.preventDefault();
    setError('');
    setFields({});
    const values = Object.fromEntries(new FormData(e.currentTarget));
    if (register && values.password !== values.confirmPassword) {
      setFields({ confirmPassword: 'Las contraseñas no coinciden.' });
      document.getElementById('confirmPassword')?.focus();
      return;
    }
    if (
      register &&
      (Array.from(values.password).length < 8 || Array.from(values.password).length > 128)
    ) {
      setFields({ password: 'Usa entre 8 y 128 caracteres.' });
      document.getElementById('password')?.focus();
      return;
    }
    setBusy(true);
    try {
      if (register) {
        await authApi.register({
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          email: values.email.trim(),
          password: values.password,
          university: values.university.trim(),
          degree: values.degree.trim(),
          semester: Number(values.semester),
          city: values.city?.trim() || undefined,
          address: values.address?.trim() || undefined,
          acceptedPrivacy: values.acceptedPrivacy === 'on',
        });
        navigate('/iniciar-sesion', {
          replace: true,
          state: { registered: true, email: values.email.trim() },
        });
      } else {
        await login({ email: values.email.trim(), password: values.password });
        const next = location.state?.from;
        navigate(typeof next === 'string' && next.startsWith('/dashboard') ? next : '/dashboard', {
          replace: true,
        });
      }
    } catch (err) {
      setError(err.message);
      setFields(err.fields || {});
      const first = Object.keys(err.fields || {})[0];
      if (first) document.getElementById(first)?.focus();
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <AuthShell register={register}>
        <span className="eyebrow">
          {register ? 'TU LUGAR EN LA COMUNIDAD' : 'QUÉ BUENO TENERTE DE VUELTA'}
        </span>
        <h2>{register ? 'Aprendamos juntos.' : 'Tu próxima meta te espera.'}</h2>
        <p className="auth-intro">
          {register
            ? 'Crea tu cuenta y empieza a formar parte de la red.'
            : 'Inicia sesión para volver a tu espacio académico.'}
        </p>
        {!register && location.state?.registered && (
          <Notice success>Tu cuenta se creó correctamente. Inicia sesión para continuar.</Notice>
        )}
        {!register && new URLSearchParams(location.search).get('sesion') === 'cerrada' && (
          <Notice success>Cerraste sesión correctamente. ¡Nos vemos pronto!</Notice>
        )}
        <Notice>{error}</Notice>
        <form
          onSubmit={submit}
          className="auth-form"
          aria-label={register ? 'Crear cuenta' : 'Iniciar sesión'}
        >
          {register && (
            <div className="form-row">
              <Field
                label="Nombres"
                id="firstName"
                autoComplete="given-name"
                placeholder="Tus nombres"
                required
                minLength={2}
                maxLength={80}
                error={fields.firstName}
              />
              <Field
                label="Apellidos"
                id="lastName"
                autoComplete="family-name"
                placeholder="Tus apellidos"
                required
                minLength={2}
                maxLength={80}
                error={fields.lastName}
              />
            </div>
          )}
          <Field
            label="Correo electrónico"
            id="email"
            type="email"
            autoComplete="email"
            placeholder="tu.nombre@universidad.edu.ec"
            required
            maxLength={254}
            defaultValue={!register ? location.state?.email || '' : ''}
            error={fields.email}
            hint={register ? 'Usa preferiblemente tu correo universitario.' : undefined}
          />
          {register && (
            <>
              <Field
                label="Universidad"
                id="university"
                placeholder="Ej. Escuela Superior Politécnica de Chimborazo"
                required
                minLength={2}
                maxLength={120}
                autoComplete="organization"
                error={fields.university}
              />
              <div className="form-row academic-row">
                <Field
                  label="Carrera"
                  id="degree"
                  placeholder="Ej. Ingeniería de Software"
                  required
                  minLength={2}
                  maxLength={120}
                  error={fields.degree}
                />
                <Field label="Semestre" id="semester" error={fields.semester}>
                  <Select
                    id="semester"
                    name="semester"
                    defaultValue=""
                    required
                    aria-invalid={!!fields.semester}
                  >
                    <option value="" disabled>
                      Selecciona
                    </option>
                    {Array.from({ length: 8 }, (_, i) => (
                      <option value={i + 1} key={i}>
                        {i + 1}.º semestre
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            </>
          )}
          {register && (
            <fieldset className="registration-contact">
              <legend>
                Tu ciudad y dirección <span>(opcional)</span>
              </legend>
              <p>Completa ambos campos si quieres guardarlos. Son privados.</p>
              <Field
                id="city"
                label="Ciudad"
                autoComplete="address-level2"
                minLength={2}
                maxLength={100}
                error={fields.city}
              />
              <Field
                id="address"
                label="Dirección"
                autoComplete="street-address"
                minLength={5}
                maxLength={240}
                error={fields.address}
                hint="Solo tú puedes consultar esta dirección en tu cuenta."
              />
            </fieldset>
          )}
          <PasswordField
            autoComplete={register ? 'new-password' : 'current-password'}
            placeholder={register ? 'Crea una contraseña segura' : 'Tu contraseña'}
            required
            minLength={register ? 8 : 1}
            maxLength={256}
            error={fields.password}
            hint={
              register
                ? 'Entre 8 y 128 caracteres. Evita claves comunes; una frase larga es más segura.'
                : undefined
            }
          />
          {register && (
            <>
              <PasswordField
                id="confirmPassword"
                label="Confirmar contraseña"
                autoComplete="new-password"
                placeholder="Escríbela una vez más"
                required
                minLength={8}
                maxLength={256}
                error={fields.confirmPassword}
              />
              <label className="privacy-check">
                <input type="checkbox" name="acceptedPrivacy" required />
                <span>
                  He leído y acepto el{' '}
                  <button type="button" onClick={() => setPrivacy(true)}>
                    aviso de privacidad y uso de mis datos
                  </button>{' '}
                  para el piloto académico.
                </span>
              </label>
            </>
          )}
          <Button busy={busy} type="submit" className="auth-submit">
            {busy
              ? register
                ? 'Creando tu cuenta…'
                : 'Entrando a tu espacio…'
              : register
                ? 'Crear mi cuenta'
                : 'Iniciar sesión'}
          </Button>
        </form>
        <div className="auth-divider">
          <span>UNA CUENTA, MUCHAS POSIBILIDADES</span>
        </div>
        <p className="auth-footnote">
          {register ? (
            'Podrás buscar apoyo y compartir lo que sabes desde la misma cuenta.'
          ) : (
            <>
              ¿Es tu primera vez? <Link to="/registro">Crea tu cuenta gratuita</Link>
            </>
          )}
        </p>
      </AuthShell>
      {privacy && <PrivacyModal onClose={() => setPrivacy(false)} />}
    </>
  );
}
