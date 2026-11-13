import { useEffect, useState } from 'react';
import { LoaderCircle, LockKeyhole, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { contactApi } from '../services/http';
import { Button, Field, Notice } from './UI';

export default function ContactDetails() {
  const { user, refresh } = useAuth();
  const [form, setForm] = useState({ city: '', address: '' });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState({});
  const [success, setSuccess] = useState('');
  useEffect(() => {
    let current = true;
    setLoading(true);
    setLoadError('');
    contactApi
      .getOwnContact()
      .then(({ contact }) => {
        if (current) setForm({ city: contact?.city || '', address: contact?.address || '' });
      })
      .catch((e) => {
        if (!current) return;
        if (e.status === 401) void refresh();
        else setLoadError(e.message);
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [user.id, refresh, attempt]);

  const change = ({ target: { name, value } }) => {
    setForm((previous) => ({ ...previous, [name]: value }));
    setFields((previous) => ({ ...previous, [name]: undefined }));
    setSuccess('');
  };
  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setFields({});
    setSuccess('');
    try {
      const { contact } = await contactApi.saveOwnContact(form);
      setForm({ city: contact.city, address: contact.address });
      setSuccess('Tu ciudad y dirección se guardaron correctamente.');
    } catch (e) {
      if (e.status === 401) void refresh();
      else {
        setError(e.message);
        setFields(e.fields || {});
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="contact-card" aria-labelledby="contact-title">
      <div className="contact-heading">
        <span className="icon-tile">
          <MapPin size={23} />
        </span>
        <span>
          <h2 id="contact-title">Ciudad y dirección</h2>
          <small>DATOS PRIVADOS DE TU CUENTA</small>
        </span>
      </div>
      <p>
        Los mismos datos para tus paneles de estudiante y tutor. Puedes completarlos cuando quieras.
      </p>
      {loading ? (
        <div className="contact-loading" role="status">
          <LoaderCircle size={18} className="animate-spin" /> Cargando tus datos…
        </div>
      ) : loadError ? (
        <>
          <Notice>{loadError}</Notice>
          <Button onClick={() => setAttempt((value) => value + 1)}>Volver a intentar</Button>
        </>
      ) : (
        <form className="contact-form" onSubmit={save} aria-label="Ciudad y dirección privadas">
          <Field
            id="contact-city"
            name="city"
            label="Ciudad"
            value={form.city}
            onChange={change}
            autoComplete="address-level2"
            minLength={2}
            maxLength={100}
            required
            disabled={busy}
            error={fields.city}
          />
          <Field
            id="contact-address"
            name="address"
            label="Dirección"
            value={form.address}
            onChange={change}
            autoComplete="street-address"
            minLength={5}
            maxLength={240}
            required
            disabled={busy}
            error={fields.address}
            hint="Calle, número y referencia. Se guarda cifrada y solo puedes consultarla desde tu sesión."
          />
          <Notice>{error}</Notice>
          <Notice success>{success}</Notice>
          <Button type="submit" busy={busy}>
            {busy ? 'Guardando…' : 'Guardar ciudad y dirección'}
          </Button>
        </form>
      )}
      <p className="contact-privacy">
        <LockKeyhole size={15} /> Tu dirección no se publica ni se comparte con otros estudiantes.
      </p>
    </section>
  );
}
