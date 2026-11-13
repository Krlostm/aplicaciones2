CREATE TABLE auth_login_attempts (
  identifier_hash varchar(64) PRIMARY KEY,
  failed_count smallint NOT NULL CHECK (failed_count BETWEEN 0 AND 5),
  window_started_at timestamptz NOT NULL,
  locked_until timestamptz,
  last_attempt_at timestamptz NOT NULL
);
CREATE INDEX auth_login_attempts_cleanup_idx ON auth_login_attempts(last_attempt_at);

CREATE TABLE subjects (
  id uuid PRIMARY KEY,
  name varchar(100) NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 100)
);
CREATE UNIQUE INDEX subjects_name_unique ON subjects(lower(name));
-- Catálogo académico de referencia, no ofertas ni tutores ficticios.
INSERT INTO subjects(id,name) VALUES
('10000000-0000-4000-8000-000000000001','Matemáticas'),
('10000000-0000-4000-8000-000000000002','Álgebra'),
('10000000-0000-4000-8000-000000000003','Cálculo'),
('10000000-0000-4000-8000-000000000004','Programación'),
('10000000-0000-4000-8000-000000000005','Bases de datos'),
('10000000-0000-4000-8000-000000000006','Física'),
('10000000-0000-4000-8000-000000000007','Química'),
('10000000-0000-4000-8000-000000000008','Estadística'),
('10000000-0000-4000-8000-000000000009','Inglés');

CREATE TABLE publications (
  id uuid PRIMARY KEY,
  tutor_id uuid NOT NULL REFERENCES tutor_profiles(user_id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id),
  title varchar(120) NOT NULL CHECK (length(trim(title)) BETWEEN 5 AND 120),
  description text NOT NULL CHECK (length(trim(description)) BETWEEN 20 AND 2000),
  modality varchar(20) NOT NULL CHECK (modality IN ('virtual','presencial','ambas')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX publications_directory_idx ON publications(subject_id,created_at DESC) WHERE is_active;
CREATE INDEX publications_owner_idx ON publications(tutor_id,created_at DESC);
