const {
  validarHoraSalida,
  validarFecha,
  validarMotivo,
  validarEsMedico,
  normalizarHora,
  validarSalidaAnticipada,
  normalizarDatos,
  esHoraSalidaValida,
} = require("../src/utils/earlyExit");

describe("Utilidades de Salidas Anticipadas", () => {
  describe("validarHoraSalida", () => {
    test("debe aceptar hora válida en formato HH:MM:SS", () => {
      expect(validarHoraSalida("14:30:00")).toBe(true);
      expect(validarHoraSalida("08:00:00")).toBe(true);
      expect(validarHoraSalida("23:59:59")).toBe(true);
      expect(validarHoraSalida("00:00:00")).toBe(true);
    });

    test("debe aceptar hora válida en formato HH:MM", () => {
      expect(validarHoraSalida("14:30")).toBe(true);
      expect(validarHoraSalida("08:00")).toBe(true);
      expect(validarHoraSalida("23:59")).toBe(true);
    });

    test("debe rechazar hora inválida", () => {
      expect(validarHoraSalida("24:00:00")).toBe(false);
      expect(validarHoraSalida("14:60:00")).toBe(false);
      expect(validarHoraSalida("14:30:60")).toBe(false);
      expect(validarHoraSalida("invalid")).toBe(false);
      expect(validarHoraSalida("")).toBe(false);
      expect(validarHoraSalida(null)).toBe(false);
      expect(validarHoraSalida(undefined)).toBe(false);
    });

    test("debe rechazar valores no string", () => {
      expect(validarHoraSalida(123)).toBe(false);
      expect(validarHoraSalida({})).toBe(false);
      expect(validarHoraSalida([])).toBe(false);
    });
  });

  describe("validarFecha", () => {
    test("debe aceptar fecha válida en formato YYYY-MM-DD", () => {
      const hoy = new Date();
      const fechaHoy = hoy.toISOString().split("T")[0];
      expect(validarFecha(fechaHoy)).toBe(true);

      // Fecha pasada
      expect(validarFecha("2024-01-15")).toBe(true);
    });

    test("debe rechazar fecha en el futuro", () => {
      const futuro = new Date();
      futuro.setDate(futuro.getDate() + 1);
      const fechaFuturo = futuro.toISOString().split("T")[0];
      expect(validarFecha(fechaFuturo)).toBe(false);
    });

    test("debe rechazar fecha inválida", () => {
      expect(validarFecha("2024-13-01")).toBe(false);
      expect(validarFecha("2024-12-32")).toBe(false);
      expect(validarFecha("24-01-15")).toBe(false);
      expect(validarFecha("invalid")).toBe(false);
      expect(validarFecha("")).toBe(false);
    });

    test("debe rechazar valores no string", () => {
      expect(validarFecha(123)).toBe(false);
      expect(validarFecha(null)).toBe(false);
      expect(validarFecha(undefined)).toBe(false);
    });
  });

  describe("validarMotivo", () => {
    test("debe aceptar motivo válido", () => {
      expect(validarMotivo("Cita médica")).toBe(true);
      expect(validarMotivo("Consulta al dentista")).toBe(true);
      expect(validarMotivo("abc")).toBe(true); // Mínimo 3 caracteres
    });

    test("debe rechazar motivo muy corto", () => {
      expect(validarMotivo("ab")).toBe(false);
      expect(validarMotivo("a")).toBe(false);
    });

    test("debe rechazar motivo muy largo", () => {
      const largo = "a".repeat(256);
      expect(validarMotivo(largo)).toBe(false);
    });

    test("debe rechazar motivo vacío o inválido", () => {
      expect(validarMotivo("")).toBe(false);
      expect(validarMotivo(null)).toBe(false);
      expect(validarMotivo(undefined)).toBe(false);
      expect(validarMotivo("   ")).toBe(false);
    });

    test("debe rechazar valores no string", () => {
      expect(validarMotivo(123)).toBe(false);
      expect(validarMotivo({})).toBe(false);
    });
  });

  describe("validarEsMedico", () => {
    test("debe aceptar booleanos", () => {
      expect(validarEsMedico(true)).toBe(true);
      expect(validarEsMedico(false)).toBe(true);
    });

    test("debe aceptar 0 y 1", () => {
      expect(validarEsMedico(0)).toBe(true);
      expect(validarEsMedico(1)).toBe(true);
    });

    test("debe rechazar otros valores", () => {
      expect(validarEsMedico(2)).toBe(false);
      expect(validarEsMedico(-1)).toBe(false);
      expect(validarEsMedico("true")).toBe(false);
      expect(validarEsMedico(null)).toBe(false);
    });
  });

  describe("normalizarHora", () => {
    test("debe convertir HH:MM a HH:MM:SS", () => {
      expect(normalizarHora("14:30")).toBe("14:30:00");
      expect(normalizarHora("08:00")).toBe("08:00:00");
    });

    test("debe mantener HH:MM:SS", () => {
      expect(normalizarHora("14:30:45")).toBe("14:30:45");
    });

    test("debe retornar null para valor inválido", () => {
      expect(normalizarHora(null)).toBe(null);
      expect(normalizarHora(undefined)).toBe(null);
      expect(normalizarHora("")).toBe(null);
    });
  });

  describe("validarSalidaAnticipada", () => {
    const datosValidos = {
      estudiante_id: 1,
      fecha: "2024-01-15",
      hora_salida: "14:30:00",
      motivo: "Cita médica",
    };

    test("debe validar datos completos correctos", () => {
      const resultado = validarSalidaAnticipada(datosValidos);
      expect(resultado.valido).toBe(true);
      expect(resultado.errores).toHaveLength(0);
    });

    test("debe rechazar estudiante_id inválido", () => {
      const datos = { ...datosValidos, estudiante_id: null };
      const resultado = validarSalidaAnticipada(datos);
      expect(resultado.valido).toBe(false);
      expect(resultado.errores[0]).toContain("estudiante_id");
    });

    test("debe rechazar fecha inválida", () => {
      const futuro = new Date();
      futuro.setDate(futuro.getDate() + 30);
      const fechaFuturo = futuro.toISOString().split("T")[0];

      const datos = { ...datosValidos, fecha: fechaFuturo };
      const resultado = validarSalidaAnticipada(datos);
      expect(resultado.valido).toBe(false);
      expect(resultado.errores.some((e) => e.includes("fecha"))).toBe(true);
    });

    test("debe rechazar hora_salida inválida", () => {
      const datos = { ...datosValidos, hora_salida: "25:00:00" };
      const resultado = validarSalidaAnticipada(datos);
      expect(resultado.valido).toBe(false);
      expect(resultado.errores.some((e) => e.includes("hora_salida"))).toBe(
        true,
      );
    });

    test("debe rechazar motivo inválido", () => {
      const datos = { ...datosValidos, motivo: "ab" };
      const resultado = validarSalidaAnticipada(datos);
      expect(resultado.valido).toBe(false);
      expect(resultado.errores.some((e) => e.includes("motivo"))).toBe(true);
    });

    test("debe rechazar es_medico inválido", () => {
      const datos = { ...datosValidos, es_medico: "invalid" };
      const resultado = validarSalidaAnticipada(datos);
      expect(resultado.valido).toBe(false);
      expect(resultado.errores.some((e) => e.includes("es_medico"))).toBe(true);
    });

    test("debe reportar múltiples errores", () => {
      const datos = {
        estudiante_id: -1,
        fecha: "2025-12-31",
        hora_salida: "invalid",
        motivo: "ab",
      };
      const resultado = validarSalidaAnticipada(datos);
      expect(resultado.valido).toBe(false);
      expect(resultado.errores.length).toBeGreaterThan(1);
    });
  });

  describe("normalizarDatos", () => {
    const datosEntrada = {
      estudiante_id: "1",
      fecha: "2024-01-15",
      hora_salida: "14:30",
      motivo: "  Cita médica  ",
      es_medico: true,
      observaciones: "  Nota importante  ",
    };

    test("debe normalizar todos los campos", () => {
      const resultado = normalizarDatos(datosEntrada);

      expect(resultado.estudiante_id).toBe(1);
      expect(typeof resultado.estudiante_id).toBe("number");

      expect(resultado.hora_salida).toBe("14:30:00");

      expect(resultado.motivo).toBe("Cita médica");

      expect(resultado.es_medico).toBe(1);

      expect(resultado.observaciones).toBe("Nota importante");
    });

    test("debe manejar datos faltantes", () => {
      const datos = {
        estudiante_id: "1",
        fecha: "2024-01-15",
        hora_salida: "14:30",
        motivo: "Cita médica",
      };

      const resultado = normalizarDatos(datos);
      expect(resultado.observaciones).toBe(null);
    });

    test("debe convertir es_medico correctamente", () => {
      const datos1 = { ...datosEntrada, es_medico: true };
      const datos2 = { ...datosEntrada, es_medico: 1 };
      const datos3 = { ...datosEntrada, es_medico: false };
      const datos4 = { ...datosEntrada, es_medico: 0 };

      expect(normalizarDatos(datos1).es_medico).toBe(1);
      expect(normalizarDatos(datos2).es_medico).toBe(1);
      expect(normalizarDatos(datos3).es_medico).toBe(0);
      expect(normalizarDatos(datos4).es_medico).toBe(0);
    });
  });

  describe("esHoraSalidaValida", () => {
    test("debe aceptar hora después de las 08:00", () => {
      expect(esHoraSalidaValida("08:00:00")).toBe(true);
      expect(esHoraSalidaValida("08:00:01")).toBe(true);
      expect(esHoraSalidaValida("14:30:00")).toBe(true);
      expect(esHoraSalidaValida("23:59:59")).toBe(true);
    });

    test("debe rechazar hora antes de las 08:00", () => {
      expect(esHoraSalidaValida("07:59:59")).toBe(false);
      expect(esHoraSalidaValida("07:00:00")).toBe(false);
      expect(esHoraSalidaValida("00:00:00")).toBe(false);
    });

    test("debe permitir hora mínima personalizada", () => {
      expect(esHoraSalidaValida("10:00:00", "10:00:00")).toBe(true);
      expect(esHoraSalidaValida("09:59:59", "10:00:00")).toBe(false);
      expect(esHoraSalidaValida("10:00:01", "10:00:00")).toBe(true);
    });
  });

  describe("Flujo completo de validación", () => {
    test("debe validar un flujo correcto de entrada", () => {
      const entrada = {
        estudiante_id: "5",
        fecha: "2024-01-15",
        hora_salida: "14:30",
        motivo: "  Cita al médico  ",
        es_medico: true,
        observaciones: "Requiere acompañamiento",
      };

      // Normalizar
      const normalizado = normalizarDatos(entrada);

      // Validar
      const validacion = validarSalidaAnticipada(normalizado);

      expect(validacion.valido).toBe(true);
      expect(normalizado.estudiante_id).toBe(5);
      expect(normalizado.hora_salida).toBe("14:30:00");
      expect(normalizado.es_medico).toBe(1);
    });

    test("debe detectar errores en flujo incorrecto", () => {
      const futuro = new Date();
      futuro.setDate(futuro.getDate() + 30);
      const fechaFuturo = futuro.toISOString().split("T")[0];

      const entrada = {
        estudiante_id: "-5",
        fecha: fechaFuturo,
        hora_salida: "invalid",
        motivo: "ab",
        es_medico: "invalid",
      };

      const normalizado = normalizarDatos(entrada);
      const validacion = validarSalidaAnticipada(normalizado);

      expect(validacion.valido).toBe(false);
      expect(validacion.errores.length).toBeGreaterThan(0);
    });
  });
});
