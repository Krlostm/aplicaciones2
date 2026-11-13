-- Ejecutar en la base tutorias_local de la conexion
-- "Tutorias - Proyecto local (5433)" en pgAdmin.
-- Consulta de solo lectura: no muestra contrasenas, hashes ni cookies.
SELECT
    u.first_name AS nombres,
    u.last_name AS apellidos,
    u.email AS correo,
    p.university AS universidad,
    p.degree AS carrera,
    p.semester AS semestre,
    u.role AS permiso,
    (t.user_id IS NOT NULL) AS tiene_perfil_tutor,
    t.headline AS especialidad_tutor,
    c.city AS ciudad,
    (c.address_ciphertext IS NOT NULL) AS direccion_cifrada,
    octet_length(c.address_ciphertext) AS bytes_direccion_cifrada,
    u.created_at AS fecha_registro
FROM public.users AS u
JOIN public.student_profiles AS p ON p.user_id = u.id
LEFT JOIN public.tutor_profiles AS t ON t.user_id = u.id
LEFT JOIN public.user_contact_details AS c ON c.user_id = u.id
ORDER BY u.created_at DESC;
