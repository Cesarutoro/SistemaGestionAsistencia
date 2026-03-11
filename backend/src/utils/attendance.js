/**
 * Verifica si una hora de ingreso constituye un atraso
 * @param {string} horaIngreso - Formato HH:MM:SS
 * @param {string} limiteAtraso - Formato HH:MM:SS (defecto: '08:00:00')
 * @returns {number} 1 si es atraso, 0 si no
 */
function verificarAtraso(horaIngreso, limiteAtraso = '08:00:00') {
    if (!horaIngreso) return 0;
    return horaIngreso > limiteAtraso ? 1 : 0;
}

module.exports = {
    verificarAtraso
};
