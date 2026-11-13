-- Ampliación solicitada: una misma cuenta puede aprender y ofrecer tutorías.
-- La presencia del perfil no cambia users.role ni crea otra identidad.
CREATE TABLE tutor_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  headline varchar(100) NOT NULL CHECK (length(trim(headline)) BETWEEN 2 AND 100),
  bio text NOT NULL CHECK (length(trim(bio)) BETWEEN 20 AND 1500),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
