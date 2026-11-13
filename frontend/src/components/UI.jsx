import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Eye,
  EyeOff,
  X,
  LoaderCircle,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
export function Brand({ light = false }) {
  return (
    <Link
      to="/"
      className={`brand ${light ? 'brand-light' : ''}`}
      aria-label="Tutorías, ir al inicio"
    >
      <GraduationCap size={29} strokeWidth={1.8} />
      <span>
        Tutorías<span className="brand-dot">.</span>
      </span>
    </Link>
  );
}
export function Button({ children, variant = 'primary', className = '', busy = false, ...props }) {
  return (
    <button
      className={`btn btn-${variant} ${className}`}
      disabled={busy || props.disabled}
      {...props}
    >
      {busy ? <LoaderCircle size={18} className="animate-spin" /> : null}
      {children}
    </button>
  );
}
export function ArrowLink({ to, children, className = '' }) {
  return (
    <Link to={to} className={`btn btn-primary ${className}`}>
      {children}
    </Link>
  );
}
export function Field({ label, id, error, hint, children, ...props }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children || (
        <input
          id={id}
          name={id}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          {...props}
        />
      )}
      {hint && !error ? <small id={`${id}-hint`}>{hint}</small> : null}
      {error ? (
        <small className="field-error" id={`${id}-error`} role="alert">
          {error}
        </small>
      ) : null}
    </div>
  );
}
export function PasswordField({ id = 'password', label = 'Contraseña', error, hint, ...props }) {
  const [show, setShow] = useState(false);
  return (
    <Field {...{ id, label, error, hint }}>
      <div className="password-wrap">
        <input
          id={id}
          name={id}
          type={show ? 'text' : 'password'}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          {...props}
        />
        <button
          type="button"
          className="password-toggle"
          aria-label={show ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
          aria-pressed={show}
          onClick={() => setShow(!show)}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </Field>
  );
}
export function Notice({ children, success = false }) {
  return children ? (
    <div
      className={`notice ${success ? 'notice-success' : ''}`}
      role={success ? 'status' : 'alert'}
    >
      {success ? <ShieldCheck size={19} /> : <AlertCircle size={19} />}
      <span>{children}</span>
    </div>
  ) : null;
}
export function Loading() {
  return (
    <main className="loading-screen" aria-live="polite">
      <LoaderCircle className="animate-spin" size={28} />
      <p>Preparando tu espacio académico…</p>
    </main>
  );
}
export function Modal({ title, children, onClose }) {
  const ref = useRef();
  useEffect(() => {
    const el = ref.current;
    el.showModal();
    return () => el.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-labelledby="modal-title"
    >
      <button className="modal-close" type="button" aria-label="Cerrar aviso" onClick={onClose}>
        <X size={22} />
      </button>
      <div className="icon-tile">
        <ShieldCheck size={25} />
      </div>
      <h2 id="modal-title">{title}</h2>
      <div className="modal-body">{children}</div>
      <Button onClick={onClose}>Entendido</Button>
    </dialog>
  );
}
export function PrivacyModal({ onClose }) {
  return (
    <Modal title="Tu información, en buenas manos" onClose={onClose}>
      <p>
        Usamos tu nombre, correo y datos académicos para crear tu cuenta e identificarte en la red
        de tutorías. Tu contraseña se protege mediante un hash y nunca se muestra públicamente.
      </p>
      <p>
        Al presentarte como tutor, guardamos tu especialidad, presentación, materias y dominio
        declarado. Puedes revisar estos datos y editarlos desde tu espacio de tutor.
      </p>
      <p>
        Cuando publicas una tutoría, otros estudiantes autenticados pueden ver su descripción, tu
        nombre, apellido, universidad y carrera, además del precio por sesión. El detalle muestra tu
        presentación y tu dominio declarado en esa materia. El correo y la dirección permanecen
        privados.
      </p>
      <p>
        Para mostrar al tutor las visitas recibidas, contamos una visita por estudiante y día a cada
        publicación. El tutor solo ve el total, sin la identidad de quienes la visitaron.
      </p>
      <p>
        Puedes guardar tu ciudad y dirección por separado para tu cuenta. La dirección se almacena
        cifrada y solo se entrega a tu sesión autenticada para consultarla o editarla. Estos datos
        no se publican en el catálogo ni se entregan a otros estudiantes.
      </p>
      <p>
        Esta es una versión académica local. No se procesa ningún pago ni se solicita tu ubicación.
        La cookie de sesión permite mantener tu acceso durante un máximo de 8 horas; puedes
        invalidarla cerrando sesión.
      </p>
      <p>
        El acceso a la información queda limitado a tu cuenta y al responsable del proyecto, Carlos
        Javier Toa Chávez. Para solicitar la revisión o eliminación de tus datos, contacta al
        responsable durante el piloto académico.
      </p>
    </Modal>
  );
}
