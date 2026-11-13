import Select from './Select';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/http';
import { Field, Button, Notice } from './UI';
export default function AcademicProfile() {
  const { user, updateUser, refresh } = useAuth();
  const [error, setError] = useState('');
  const [fields, setFields] = useState({});
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  async function save(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setFields({});
    setBusy(true);
    const data = Object.fromEntries(new FormData(event.currentTarget));
    data.semester = Number(data.semester);
    try {
      const result = await authApi.updateProfile(data);
      updateUser(result.user);
      setSuccess('Tu perfil académico se actualizó correctamente.');
    } catch (e) {
      if (e.status === 401) void refresh();
      else {
        setError(e.message);
        setFields(e.fields || {});
      }
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="profile-edit-card">
      <h3>Actualizar perfil académico</h3>
      <form className="profile-edit-form" onSubmit={save} aria-label="Actualizar perfil académico">
        {[
          ['firstName', 'Nombres', 80],
          ['lastName', 'Apellidos', 80],
          ['university', 'Universidad', 120],
          ['degree', 'Carrera', 120],
        ].map(([name, label, max]) => (
          <Field
            key={name}
            id={name}
            label={label}
            defaultValue={user[name]}
            required
            minLength={2}
            maxLength={max}
            disabled={busy}
            error={fields[name]}
          />
        ))}
        <Field id="semester" label="Semestre" error={fields.semester}>
          <Select
            id="semester"
            name="semester"
            defaultValue={user.semester}
            required
            disabled={busy}
            aria-invalid={!!fields.semester}
          >
            {Array.from({ length: 8 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}.º semestre
              </option>
            ))}
          </Select>
        </Field>
        <Notice>{error}</Notice>
        <Notice success>{success}</Notice>
        <Button busy={busy} type="submit">
          {busy ? 'Guardando…' : 'Guardar perfil académico'}
        </Button>
      </form>
    </section>
  );
}
