-- Ajuste solicitado por el usuario: la carrera tiene ocho semestres.
-- Conservar la migración inicial y evolucionar la restricción sin cambiar datos.
ALTER TABLE student_profiles DROP CONSTRAINT student_profiles_semester_check;
ALTER TABLE student_profiles
  ADD CONSTRAINT student_profiles_semester_check CHECK (semester BETWEEN 1 AND 8);
