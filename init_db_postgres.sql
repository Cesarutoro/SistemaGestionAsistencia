-- Esquema base PostgreSQL para SistemaGestionAsistencia
-- Ejecutar: psql -U postgres -d sistema_asistencia -f init_db_postgres.sql

CREATE TABLE IF NOT EXISTS cursos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(20) DEFAULT 'inspector',
  activo BOOLEAN DEFAULT TRUE,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS estudiantes (
  id SERIAL PRIMARY KEY,
  rut VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  curso_id INT REFERENCES cursos(id) ON DELETE SET NULL,
  sexo VARCHAR(10)
);

CREATE TABLE IF NOT EXISTS asistencia (
  id SERIAL PRIMARY KEY,
  estudiante_id INT NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  hora_ingreso TIME NOT NULL,
  es_atraso BOOLEAN DEFAULT FALSE,
  justificado BOOLEAN DEFAULT FALSE,
  justificacion_descripcion TEXT,
  UNIQUE (estudiante_id, fecha)
);

CREATE TABLE IF NOT EXISTS salidas_anticipadas (
  id SERIAL PRIMARY KEY,
  estudiante_id INT NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  hora_salida TIME NOT NULL,
  motivo VARCHAR(255) NOT NULL,
  es_medico BOOLEAN DEFAULT TRUE,
  autorizado_por INT REFERENCES usuarios(id) ON DELETE SET NULL,
  autorizado_en TIMESTAMPTZ DEFAULT NOW(),
  observaciones TEXT,
  UNIQUE (estudiante_id, fecha)
);

CREATE TABLE IF NOT EXISTS atrasos_internos (
  id SERIAL PRIMARY KEY,
  estudiante_id INT NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('recreo', 'almuerzo')),
  minutos_atraso INT NOT NULL CHECK (minutos_atraso > 0 AND minutos_atraso <= 120),
  observaciones TEXT,
  registrado_por INT REFERENCES usuarios(id) ON DELETE SET NULL,
  registrado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (estudiante_id, fecha, tipo)
);
