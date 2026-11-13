-- Datos privados compartidos por los paneles de estudiante y tutor.
-- La dirección se cifra en el servicio, antes de llegar al repositorio.
CREATE TABLE user_contact_details (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  city varchar(100) NOT NULL CHECK (length(trim(city)) BETWEEN 2 AND 100),
  address_ciphertext bytea NOT NULL CHECK (octet_length(address_ciphertext) BETWEEN 5 AND 960),
  address_iv bytea NOT NULL CHECK (octet_length(address_iv) = 12),
  address_auth_tag bytea NOT NULL CHECK (octet_length(address_auth_tag) = 16),
  address_key_id varchar(32) NOT NULL CHECK (address_key_id ~ '^[0-9a-f]{32}$'),
  encryption_version smallint NOT NULL DEFAULT 1 CHECK (encryption_version = 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (address_key_id, address_iv)
);
