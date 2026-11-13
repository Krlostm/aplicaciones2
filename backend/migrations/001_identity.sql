CREATE TABLE users (
  id uuid PRIMARY KEY,
  first_name varchar(80) NOT NULL CHECK (length(trim(first_name)) >= 2),
  last_name varchar(80) NOT NULL CHECK (length(trim(last_name)) >= 2),
  email varchar(254) NOT NULL CHECK (email = lower(trim(email))),
  password_hash text NOT NULL CHECK (password_hash LIKE '$argon2id$%'),
  role varchar(20) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_email_unique ON users (lower(email));
CREATE TABLE student_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  university varchar(120) NOT NULL CHECK (length(trim(university)) >= 2),
  degree varchar(120) NOT NULL CHECK (length(trim(degree)) >= 2),
  semester smallint NOT NULL CHECK (semester BETWEEN 1 AND 15)
);
-- student es una identidad única para solicitar u ofrecer. No se crean dos cuentas.
CREATE TABLE auth_sessions (
  sid varchar NOT NULL PRIMARY KEY,
  sess json NOT NULL,
  expire timestamp(6) NOT NULL
);
CREATE INDEX auth_sessions_expire_idx ON auth_sessions (expire);
