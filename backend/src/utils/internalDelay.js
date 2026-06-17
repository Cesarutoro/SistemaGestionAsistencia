const TIPOS_VALIDOS = ["recreo", "almuerzo"];
const MIN_MINUTOS = 1;
const MAX_MINUTOS = 120;

function validarFecha(fecha) {
  if (!fecha || typeof fecha !== "string") {
    return false;
  }

  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(fecha)) {
    return false;
  }

  const [y, m, d] = fecha.split("-").map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;

  const fechaObj = new Date(y, m - 1, d);
  if (
    fechaObj.getFullYear() !== y ||
    fechaObj.getMonth() !== m - 1 ||
    fechaObj.getDate() !== d
  ) {
    return false;
  }

  const ahora = new Date();
  const hoyUTC = Date.UTC(
    ahora.getUTCFullYear(),
    ahora.getUTCMonth(),
    ahora.getUTCDate(),
  );
  const fechaUTC = Date.UTC(y, m - 1, d);

  return fechaUTC <= hoyUTC;
}

function validarTipo(tipo) {
  return typeof tipo === "string" && TIPOS_VALIDOS.includes(tipo);
}

function validarMinutos(minutos) {
  const valor = Number(minutos);
  return (
    Number.isInteger(valor) && valor >= MIN_MINUTOS && valor <= MAX_MINUTOS
  );
}

function normalizarDatos(datos) {
  return {
    estudiante_id: parseInt(datos.estudiante_id, 10),
    fecha: datos.fecha,
    tipo: String(datos.tipo || "").trim().toLowerCase(),
    minutos_atraso: parseInt(datos.minutos_atraso, 10),
    observaciones: datos.observaciones ? String(datos.observaciones).trim() : null,
  };
}

function validarAtrasoInterno(datos) {
  const errores = [];

  if (
    !datos.estudiante_id ||
    typeof datos.estudiante_id !== "number" ||
    datos.estudiante_id <= 0
  ) {
    errores.push("estudiante_id inválido o no proporcionado");
  }

  if (!validarFecha(datos.fecha)) {
    errores.push("fecha inválida o en el futuro (formato: YYYY-MM-DD)");
  }

  if (!validarTipo(datos.tipo)) {
    errores.push("tipo inválido (debe ser recreo o almuerzo)");
  }

  if (!validarMinutos(datos.minutos_atraso)) {
    errores.push(`minutos_atraso inválido (debe ser entre ${MIN_MINUTOS} y ${MAX_MINUTOS})`);
  }

  return {
    valido: errores.length === 0,
    errores,
  };
}

module.exports = {
  TIPOS_VALIDOS,
  MIN_MINUTOS,
  MAX_MINUTOS,
  validarFecha,
  validarTipo,
  validarMinutos,
  normalizarDatos,
  validarAtrasoInterno,
};
