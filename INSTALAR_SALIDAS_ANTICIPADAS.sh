#!/bin/bash
# SCRIPT DE INSTALACIÓN Y CONFIGURACIÓN DEL MÓDULO DE SALIDAS ANTICIPADAS

echo "========================================"
echo "Instalador - Módulo Salidas Anticipadas"
echo "========================================"
echo ""

# Paso 1: Actualizar la base de datos
echo "📦 Paso 1: Actualizando base de datos..."
echo "Asegúrate de ejecutar init_db.sql para crear la tabla salidas_anticipadas"
echo ""
echo "Comando SQL a ejecutar:"
echo "CREATE TABLE IF NOT EXISTS salidas_anticipadas ("
echo "  id INT AUTO_INCREMENT PRIMARY KEY,"
echo "  estudiante_id INT NOT NULL,"
echo "  fecha DATE NOT NULL,"
echo "  hora_salida TIME NOT NULL,"
echo "  motivo VARCHAR(255) NOT NULL,"
echo "  es_medico TINYINT(1) DEFAULT 1,"
echo "  autorizado_por INT,"
echo "  autorizado_en DATETIME DEFAULT CURRENT_TIMESTAMP,"
echo "  observaciones TEXT,"
echo "  FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE,"
echo "  FOREIGN KEY (autorizado_por) REFERENCES usuarios(id) ON DELETE SET NULL,"
echo "  UNIQUE KEY unique_salida_anticipada (estudiante_id, fecha)"
echo ");"
echo ""

# Paso 2: Verificar archivos
echo "✅ Paso 2: Verificando archivos instalados..."
echo ""

files_to_check=(
  "backend/src/utils/earlyExit.js"
  "backend/src/routes/salidas-anticipadas.js"
  "backend/tests/earlyExit.test.js"
  "SALIDAS_ANTICIPADAS.md"
  "IMPLEMENTACION_SALIDAS_ANTICIPADAS.md"
)

for file in "${files_to_check[@]}"; do
  if [ -f "$file" ]; then
    echo "✓ $file"
  else
    echo "✗ FALTA: $file"
  fi
done
echo ""

# Paso 3: Ejecutar pruebas
echo "🧪 Paso 3: Ejecutando pruebas unitarias..."
echo "Comando: cd backend && npm test -- tests/earlyExit.test.js"
echo ""

# Paso 4: Iniciar servidor
echo "🚀 Paso 4: Para iniciar el servidor:"
echo "Comando: npm start"
echo ""

# Paso 5: Verificar funcionalidad
echo "✔️  Paso 5: Prueba la API:"
echo ""
echo "Ejemplo 1 - Registrar salida:"
echo "curl -X POST http://localhost:4000/api/salidas-anticipadas \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"Authorization: Bearer {tu_token}\" \\"
echo "  -d '{"
echo "    \"estudiante_id\": 1,"
echo "    \"fecha\": \"2024-01-15\","
echo "    \"hora_salida\": \"14:30\","
echo "    \"motivo\": \"Cita médica\","
echo "    \"es_medico\": true"
echo "  }'"
echo ""

echo "Ejemplo 2 - Consultar salidas:"
echo "curl http://localhost:4000/api/salidas-anticipadas/estudiante/1 \\"
echo "  -H \"Authorization: Bearer {tu_token}\""
echo ""

echo "========================================"
echo "✅ INSTALACIÓN LISTA"
echo "========================================"
echo ""
echo "Próximos pasos:"
echo "1. Ejecutar init_db.sql en la base de datos"
echo "2. Ejecutar pruebas: cd backend && npm test -- tests/earlyExit.test.js"
echo "3. Iniciar servidor: npm start"
echo "4. Probar los endpoints con curl o Postman"
echo ""
echo "Documentación disponible en:"
echo "- README_SALIDAS_ANTICIPADAS.md"
echo "- SALIDAS_ANTICIPADAS.md"
echo "- IMPLEMENTACION_SALIDAS_ANTICIPADAS.md"
echo "- EJEMPLOS_SALIDAS_ANTICIPADAS.js"
