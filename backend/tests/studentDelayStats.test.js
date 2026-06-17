const { calcularEstadisticasAtrasos } = require("../src/utils/studentDelayStats");

describe("studentDelayStats", () => {
  const estudiante = {
    id: 1,
    nombre: "Juan",
    apellido: "Pérez",
    rut: "11111111-1",
    curso_nombre: "3°A",
  };

  test("calcula totales y porcentajes de atrasos de ingreso", () => {
    const stats = calcularEstadisticasAtrasos({
      estudiante,
      atrasosIngreso: [
        { fecha: "2026-06-02", justificado: true },
        { fecha: "2026-06-03", justificado: false },
        { fecha: "2026-06-04", justificado: false },
      ],
      atrasosInternos: [],
      fechaReferencia: "2026-06-10",
    });

    expect(stats.atrasos_ingreso.total).toBe(3);
    expect(stats.atrasos_ingreso.justificados).toBe(1);
    expect(stats.atrasos_ingreso.no_justificados).toBe(2);
    expect(stats.atrasos_ingreso.porcentaje_justificados).toBe(33.3);
    expect(stats.atrasos_ingreso.primer_atraso).toBe("2026-06-02");
    expect(stats.atrasos_ingreso.ultimo_atraso).toBe("2026-06-04");
  });

  test("resume atrasos internos por tipo", () => {
    const stats = calcularEstadisticasAtrasos({
      estudiante,
      atrasosIngreso: [],
      atrasosInternos: [
        { fecha: "2026-06-02", tipo: "recreo", minutos_atraso: 10 },
        { fecha: "2026-06-03", tipo: "recreo", minutos_atraso: 5 },
        { fecha: "2026-06-04", tipo: "almuerzo", minutos_atraso: 20 },
      ],
      fechaReferencia: "2026-06-10",
    });

    expect(stats.atrasos_internos.total_registros).toBe(3);
    expect(stats.atrasos_internos.total_minutos).toBe(35);
    expect(stats.atrasos_internos.recreo.cantidad).toBe(2);
    expect(stats.atrasos_internos.recreo.minutos_total).toBe(15);
    expect(stats.atrasos_internos.almuerzo.cantidad).toBe(1);
    expect(stats.resumen.total_eventos).toBe(3);
  });
});
