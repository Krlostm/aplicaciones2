import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calculator, Code2, Database, GraduationCap, Zap } from 'lucide-react';
import { PrivacyModal } from '../components/UI';
import AcademicSymbols from '../components/AcademicSymbols';
import { useAuth } from '../context/AuthContext';
import './Landing.css';

const subjects = [
  { name: 'Cálculo', icon: Calculator },
  { name: 'Programación', icon: Code2 },
  { name: 'Física', icon: Zap },
  { name: 'Bases de Datos', icon: Database },
];
const steps = [
  {
    id: 'tu-cuenta',
    tone: 'orange',
    eyebrow: 'TU PUNTO DE PARTIDA',
    title: 'Crea tu cuenta.',
    text: 'Tu universidad, tu carrera y tu semestre. Empieza con lo que te hace parte de esta comunidad: ser estudiante, tener preguntas y querer ir un poco más allá.',
    note: 'Una cuenta para aprender y también para enseñar.',
    action: 'Empezar ahora',
    to: '/registro',
    image: '/images/llama-mascota.png',
    alt: 'Nuestra llama con su mochila, lista para comenzar un nuevo camino',
  },
  {
    id: 'tu-materia',
    tone: 'red',
    eyebrow: 'OTRA FORMA DE ENTENDERLO',
    title: 'Encuentra tu materia.',
    text: 'Ese ejercicio que todavía no sale. Ese concepto al que le falta hacer clic. Explora tutorías por asignatura y descubre cómo lo explica alguien que también es estudiante.',
    note: 'Empieza por una duda. Encuentra una nueva perspectiva.',
    action: 'Explorar materias',
    to: '/dashboard',
    image: '/images/llama-estudiando.png',
    alt: 'La llama de Tutorías estudiando con un libro abierto y su mochila al lado',
  },
  {
    id: 'comunidad',
    tone: 'plum',
    eyebrow: 'LO QUE SABES TAMBIÉN SUMA',
    title: 'Comparte lo que sabes.',
    text: 'Si una materia es tu fuerte, puedes ser quien la explique. Crea tu perfil de tutor, publica tus tutorías y gestiona lo que ofreces desde tu propio panel.',
    note: 'Hoy te ayudan a entender. Mañana, tú puedes ayudar.',
    action: 'Quiero ofrecer tutorías',
    to: '/dashboard/tutor',
    image: '/images/llama-ensenando.png',
    alt: 'La llama de Tutorías explicando los gráficos de un libro con un lápiz amarillo',
  },
  {
    id: 'tus-oportunidades',
    tone: 'orange',
    eyebrow: 'TU CONOCIMIENTO TIENE VALOR',
    title: 'Enseña. Comparte. Genera ingresos.',
    text: 'Lo que sabes puede abrirte nuevas oportunidades. Ofrecer tutorías es una forma de poner en práctica tus conocimientos y obtener ingresos mientras sigues estudiando.',
    note: 'Los acuerdos y pagos se realizan fuera de la plataforma.',
    action: 'Empezar a ofrecer tutorías',
    to: '/dashboard/tutor',
    image: '/images/llama-emprendiendo.png',
    alt: 'La llama de Tutorías con un libro, una bolsa y unas monedas, representando oportunidades al enseñar',
  },
];

function LandingBrand() {
  return (
    <Link className="landing-brand" to="/" aria-label="Tutorías, ir al inicio">
      <GraduationCap size={32} strokeWidth={1.8} aria-hidden="true" />
      <span>
        Tutorías<span className="landing-brand-dot">.</span>
      </span>
    </Link>
  );
}

function LlamaMotion() {
  const video = useRef(null);
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(preference.matches);
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (!video.current) return;
    let active = true;
    video.current.play().catch(() => {
      if (active) setFailed(true);
    });
    return () => {
      active = false;
    };
  }, [reduced, failed]);
  return (
    <div className="landing-mascot-scene">
      <div className="landing-motion-stage">
        {reduced || failed ? (
          <img
            className="landing-mascot landing-mascot-still"
            src="/images/llama-mascota.png"
            alt="La llama de Tutorías, con mochila y un pañuelo rojo, lista para acompañarte"
            width="1396"
            height="1127"
            fetchPriority="high"
          />
        ) : (
          <video
            ref={video}
            className="landing-mascot"
            src="/videos/llama-saludando.mp4"
            aria-label="La llama de Tutorías saludando"
            width="960"
            height="540"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onError={() => setFailed(true)}
          />
        )}
      </div>
      <p className="landing-mascot-caption">
        <span aria-hidden="true" />
        El siguiente paso, juntos.
      </p>
    </div>
  );
}

export default function Landing() {
  const { user } = useAuth();
  const [privacy, setPrivacy] = useState(false);
  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-shell landing-header-inner">
          <LandingBrand />
          <nav className="landing-navigation" aria-label="Navegación principal">
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#comunidad">Para tutores</a>
          </nav>
          <Link className="landing-header-access" to={user ? '/dashboard' : '/iniciar-sesion'}>
            {user ? 'Mi espacio' : 'Iniciar sesión'}
          </Link>
        </div>
      </header>
      <main id="contenido">
        <section className="landing-hero landing-shell" aria-labelledby="landing-title">
          <LlamaMotion />
          <div className="landing-hero-copy">
            <p className="landing-eyebrow">
              <span aria-hidden="true" />
              DE ESTUDIANTE A ESTUDIANTE
            </p>
            <h1 id="landing-title">
              La universidad,
              <br />
              mejor en <br />
              <span>compañía.</span>
            </h1>
            <p className="landing-hero-description">
              Encuentra apoyo en las materias que te cuestan y comparte las que dominas. Aprender
              juntos cambia las cosas.
            </p>
            <div className="landing-hero-actions">
              <Link
                className="landing-button landing-button-primary"
                to={user ? '/dashboard' : '/registro'}
              >
                {user ? 'Explorar tutorías' : 'Crear mi cuenta'}
              </Link>
              <Link
                className="landing-button landing-button-secondary"
                to={user ? '/dashboard/tutor' : '/iniciar-sesion'}
              >
                {user ? 'Ir a mi panel de tutor' : 'Ya tengo una cuenta'}
              </Link>
            </div>
            <p className="landing-hero-note">Una cuenta. Dos formas de crecer.</p>
          </div>
        </section>
        <section className="landing-subjects" id="areas" aria-labelledby="landing-subjects-title">
          <div className="landing-shell landing-subjects-inner">
            <p id="landing-subjects-title">
              ¿Por dónde
              <br />
              <strong>empezamos?</strong>
            </p>
            <div className="landing-subject-links">
              {subjects.map(({ name, icon: Icon }) => (
                <Link key={name} to={`/dashboard?asignatura=${encodeURIComponent(name)}`}>
                  <Icon size={21} strokeWidth={1.6} aria-hidden="true" />
                  <span>{name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
        <section
          className="landing-journey landing-shell"
          id="como-funciona"
          aria-label="Cómo funciona Tutorías"
        >
          {steps.map((step, index) => (
            <article
              className={`landing-story landing-story-${step.tone} ${index % 2 ? 'landing-story-reverse' : ''}`}
              id={step.id}
              key={step.id}
              aria-labelledby={`${step.id}-title`}
            >
              <AcademicSymbols section={index} />
              <div className="landing-story-copy">
                <p className="landing-eyebrow">{step.eyebrow}</p>
                <h2 id={`${step.id}-title`}>{step.title}</h2>
                <p className="landing-story-description">{step.text}</p>
                <p className="landing-story-note">{step.note}</p>
                <Link
                  className="landing-button landing-button-primary landing-story-link"
                  to={index === 0 && user ? '/dashboard/cuenta' : step.to}
                >
                  {index === 0 && user ? 'Ver mi perfil' : step.action}
                </Link>
              </div>
              <div className={`landing-story-art landing-story-art-${index + 1}`}>
                <span className="landing-art-halo" aria-hidden="true" />
                <img
                  src={step.image}
                  alt={step.alt}
                  width="1396"
                  height="1127"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </article>
          ))}
        </section>
        <section className="landing-invitation" aria-labelledby="landing-invitation-title">
          <div className="landing-shell landing-invitation-inner">
            <p className="landing-eyebrow">UNA BUENA EXPLICACIÓN PUEDE CAMBIAR TU SEMESTRE</p>
            <h2 id="landing-invitation-title">
              Lo que aprendes hoy,
              <br />
              <span>crece al compartirlo.</span>
            </h2>
            <p>Las preguntas nos acercan. El conocimiento nos lleva más lejos.</p>
            <Link
              className="landing-button landing-button-primary"
              to={user ? '/dashboard' : '/registro'}
            >
              {user ? 'Volver a mi espacio' : 'Dar el primer paso'}
            </Link>
            <span
              className="landing-invitation-mark landing-invitation-mark-one"
              aria-hidden="true"
            >
              ✳
            </span>
            <span
              className="landing-invitation-mark landing-invitation-mark-two"
              aria-hidden="true"
            >
              +
            </span>
          </div>
        </section>
      </main>
      <footer className="landing-footer">
        <div className="landing-shell landing-footer-inner">
          <div>
            <LandingBrand />
            <p>El conocimiento crece cuando se comparte.</p>
          </div>
          <div className="landing-footer-links">
            <a href="#como-funciona">Cómo funciona</a>
            <button type="button" onClick={() => setPrivacy(true)}>
              Privacidad
            </button>
            <span>@Carlos Toa</span>
          </div>
        </div>
      </footer>
      {privacy && <PrivacyModal onClose={() => setPrivacy(false)} />}
    </div>
  );
}
