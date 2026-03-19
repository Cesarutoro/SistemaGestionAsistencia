CREATE TABLE IF NOT EXISTS cursos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS estudiantes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rut VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  curso_id INT,
  sexo VARCHAR(10),
  FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS asistencia (
  id INT AUTO_INCREMENT PRIMARY KEY,
  estudiante_id INT NOT NULL,
  fecha DATE NOT NULL,
  hora_ingreso TIME NOT NULL,
  es_atraso TINYINT(1) DEFAULT 0,
  justificado TINYINT(1) DEFAULT 0,
  justificacion_descripcion TEXT NULL,
  FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE,
  UNIQUE KEY unique_asistencia (estudiante_id, fecha)
);

CREATE TABLE IF NOT EXISTS salidas_anticipadas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  estudiante_id INT NOT NULL,
  fecha DATE NOT NULL,
  hora_salida TIME NOT NULL,
  motivo VARCHAR(255) NOT NULL,
  es_medico TINYINT(1) DEFAULT 1,
  autorizado_por INT,
  autorizado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  observaciones TEXT,
  FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE,
  FOREIGN KEY (autorizado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
  UNIQUE KEY unique_salida_anticipada (estudiante_id, fecha)
);
