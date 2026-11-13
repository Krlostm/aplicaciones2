-- Conexión: Tutorias - Proyecto local (5433), base tutorias_local.
-- Consultas de lectura. No muestran contraseña, hash, cookies, dirección ni claves.
SELECT current_database() AS base, inet_server_port() AS puerto;

-- Catálogo de asignaturas de referencia (no son publicaciones de tutores).
SELECT id, name AS asignatura FROM public.subjects ORDER BY name;

-- Ofertas reales creadas desde la aplicación, incluidas las desactivadas.
SELECT p.id, u.first_name AS nombres, u.last_name AS apellidos,
       s.name AS asignatura, p.title AS titulo, p.modality AS modalidad,
       p.is_active AS activa, p.created_at AS creacion, p.updated_at AS actualizacion
FROM public.publications p
JOIN public.tutor_profiles t ON t.user_id = p.tutor_id
JOIN public.users u ON u.id = t.user_id
JOIN public.subjects s ON s.id = p.subject_id
ORDER BY p.created_at DESC;

-- Estado de intentos sin mostrar la identidad ni ningún secreto.
-- locked_until NULL indica que todavía no se alcanzó el umbral.
-- Una fecha vencida deja de bloquear automáticamente en el siguiente intento.
SELECT failed_count AS fallos, window_started_at AS inicio_ventana,
       locked_until AS bloqueo_hasta,
       COALESCE(locked_until > now(), false) AS bloqueo_vigente,
       last_attempt_at AS ultimo_intento
FROM public.auth_login_attempts
ORDER BY last_attempt_at DESC;
