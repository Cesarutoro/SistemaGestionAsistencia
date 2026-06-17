const {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
  parseISO,
} = require("date-fns");

const DIAS_SEMANA = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

function toDateStr(value) {
  if (!value) return null;
  if (typeof value === "string") return value.slice(0, 10);
  return format(value, "yyyy-MM-dd");
}

function isInRange(fechaStr, inicioStr, finStr) {
  return fechaStr >= inicioStr && fechaStr <= finStr;
}

function calcularModa(items) {
  if (!items.length) return null;
  const conteo = {};
  for (const item of items) {
    conteo[item] = (conteo[item] || 0) + 1;
  }
  let max = 0;
  let moda = null;
  for (const [valor, count] of Object.entries(conteo)) {
    if (count > max) {
      max = count;
      moda = valor;
    }
  }
  return moda;
}

function calcularPromedio(valores) {
  if (!valores.length) return 0;
  const suma = valores.reduce((acc, v) => acc + v, 0);
  return Math.round((suma / valores.length) * 10) / 10;
}

function calcularSemanasEnPeriodo(fechaInicio, fechaFin) {
  if (!fechaInicio || !fechaFin) return 1;
  const inicio = parseISO(fechaInicio);
  const fin = parseISO(fechaFin);
  const diffMs = fin.getTime() - inicio.getTime();
  const dias = Math.max(1, Math.ceil(diffMs / 86400000) + 1);
  return Math.max(1, Math.ceil(dias / 7));
}

function resumirInternosPorTipo(registros, tipo) {
  const filtrados = registros.filter((r) => r.tipo === tipo);
  const minutos = filtrados.map((r) => Number(r.minutos_atraso) || 0);
  return {
    cantidad: filtrados.length,
    minutos_total: minutos.reduce((acc, v) => acc + v, 0),
    promedio_minutos: calcularPromedio(minutos),
  };
}

function calcularEstadisticasAtrasos({
  estudiante,
  atrasosIngreso = [],
  atrasosInternos = [],
  fechaReferencia = new Date(),
}) {
  const ref = new Date(`${toDateStr(fechaReferencia) || format(new Date(), "yyyy-MM-dd")}T12:00:00`);

  const inicioSemana = format(startOfWeek(ref, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const finSemana = format(endOfWeek(ref, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const inicioMes = format(startOfMonth(ref), "yyyy-MM-dd");
  const finMes = format(endOfMonth(ref), "yyyy-MM-dd");
  const inicioMesAnterior = format(startOfMonth(subMonths(ref, 1)), "yyyy-MM-dd");
  const finMesAnterior = format(endOfMonth(subMonths(ref, 1)), "yyyy-MM-dd");

  const fechasIngreso = atrasosIngreso
    .map((a) => toDateStr(a.fecha))
    .filter(Boolean)
    .sort();
  const fechasInternos = atrasosInternos
    .map((a) => toDateStr(a.fecha))
    .filter(Boolean)
    .sort();

  const todasFechas = [...fechasIngreso, ...fechasInternos].sort();
  const fechaInicio = todasFechas[0] || null;
  const fechaFin = todasFechas[todasFechas.length - 1] || null;

  const justificados = atrasosIngreso.filter((a) => a.justificado).length;
  const noJustificados = atrasosIngreso.length - justificados;

  const diasSemanaIngreso = fechasIngreso.map((f) => {
    const d = parseISO(f);
    return DIAS_SEMANA[d.getDay()];
  });

  const semanasPeriodo = calcularSemanasEnPeriodo(fechaInicio, fechaFin);
  const atrasosSemanaIngreso = atrasosIngreso.filter((a) =>
    isInRange(toDateStr(a.fecha), inicioSemana, finSemana),
  ).length;
  const atrasosMesIngreso = atrasosIngreso.filter((a) =>
    isInRange(toDateStr(a.fecha), inicioMes, finMes),
  ).length;
  const atrasosMesAnteriorIngreso = atrasosIngreso.filter((a) =>
    isInRange(toDateStr(a.fecha), inicioMesAnterior, finMesAnterior),
  ).length;

  const minutosInternos = atrasosInternos.map((a) => Number(a.minutos_atraso) || 0);
  const atrasosSemanaInternos = atrasosInternos.filter((a) =>
    isInRange(toDateStr(a.fecha), inicioSemana, finSemana),
  ).length;
  const atrasosMesInternos = atrasosInternos.filter((a) =>
    isInRange(toDateStr(a.fecha), inicioMes, finMes),
  ).length;

  const recreo = resumirInternosPorTipo(atrasosInternos, "recreo");
  const almuerzo = resumirInternosPorTipo(atrasosInternos, "almuerzo");

  let tendenciaMes = "sin_datos";
  if (atrasosMesAnteriorIngreso === 0 && atrasosMesIngreso > 0) {
    tendenciaMes = "aumento";
  } else if (atrasosMesAnteriorIngreso > 0) {
    if (atrasosMesIngreso > atrasosMesAnteriorIngreso) tendenciaMes = "aumento";
    else if (atrasosMesIngreso < atrasosMesAnteriorIngreso) tendenciaMes = "disminucion";
    else tendenciaMes = "estable";
  } else if (atrasosMesIngreso === 0 && atrasosMesAnteriorIngreso === 0) {
    tendenciaMes = "sin_datos";
  } else {
    tendenciaMes = "disminucion";
  }

  const variacionMesPct =
    atrasosMesAnteriorIngreso > 0
      ? Math.round(
          ((atrasosMesIngreso - atrasosMesAnteriorIngreso) /
            atrasosMesAnteriorIngreso) *
            1000,
        ) / 10
      : atrasosMesIngreso > 0
        ? 100
        : 0;

  return {
    estudiante: {
      id: estudiante.id,
      nombre: estudiante.nombre,
      apellido: estudiante.apellido,
      rut: estudiante.rut,
      curso_nombre: estudiante.curso_nombre,
    },
    periodo: {
      inicio: fechaInicio,
      fin: fechaFin,
      semanas: semanasPeriodo,
    },
    atrasos_ingreso: {
      total: atrasosIngreso.length,
      justificados,
      no_justificados: noJustificados,
      porcentaje_justificados:
        atrasosIngreso.length > 0
          ? Math.round((justificados / atrasosIngreso.length) * 1000) / 10
          : 0,
      esta_semana: atrasosSemanaIngreso,
      este_mes: atrasosMesIngreso,
      mes_anterior: atrasosMesAnteriorIngreso,
      promedio_semanal:
        Math.round((atrasosIngreso.length / semanasPeriodo) * 10) / 10,
      dia_frecuente: calcularModa(diasSemanaIngreso),
      primer_atraso: fechasIngreso[0] || null,
      ultimo_atraso: fechasIngreso[fechasIngreso.length - 1] || null,
      tendencia_mes: tendenciaMes,
      variacion_mes_pct: variacionMesPct,
    },
    atrasos_internos: {
      total_registros: atrasosInternos.length,
      total_minutos: minutosInternos.reduce((acc, v) => acc + v, 0),
      promedio_minutos: calcularPromedio(minutosInternos),
      esta_semana: atrasosSemanaInternos,
      este_mes: atrasosMesInternos,
      recreo,
      almuerzo,
    },
    resumen: {
      total_eventos: atrasosIngreso.length + atrasosInternos.length,
      atrasos_ingreso: atrasosIngreso.length,
      atrasos_internos: atrasosInternos.length,
      minutos_internos_total: minutosInternos.reduce((acc, v) => acc + v, 0),
    },
  };
}

module.exports = {
  calcularEstadisticasAtrasos,
  DIAS_SEMANA,
};
