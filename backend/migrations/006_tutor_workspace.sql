ALTER TABLE tutor_profiles ADD COLUMN onboarding_completed_at timestamptz;
-- Conservar el acceso de quienes ya habían creado su perfil antes del nuevo alta guiada.
UPDATE tutor_profiles SET onboarding_completed_at=created_at;

CREATE TABLE tutor_subjects (
  user_id uuid NOT NULL REFERENCES tutor_profiles(user_id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id),
  proficiency smallint NOT NULL CHECK (proficiency BETWEEN 1 AND 5),
  PRIMARY KEY(user_id,subject_id)
);

ALTER TABLE publications ADD COLUMN price_cents integer
  CHECK (price_cents IS NULL OR price_cents BETWEEN 0 AND 1000000);
ALTER TABLE publications ADD COLUMN price_unit varchar(10) NOT NULL DEFAULT 'hour'
  CHECK (price_unit IN ('hour','session'));
-- Los precios antiguos quedan pendientes de completar por su propietario.

CREATE TABLE publication_views (
  publication_id uuid NOT NULL REFERENCES publications(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewed_on date NOT NULL DEFAULT CURRENT_DATE,
  PRIMARY KEY(publication_id,viewer_id,viewed_on)
);
CREATE INDEX publication_views_owner_idx ON publication_views(publication_id);
