/**
 * Formatea un RUT de 12345678k a 12.345.678-k
 * @param {string} rut 
 * @returns {string} RUT formateado
 */
export function formatRut(rut) {
    if (!rut) return '';
    let value = rut.replace(/\./g, '').replace(/-/g, '');
    if (value.length < 2) return value;
    
    let cuerpo = value.slice(0, -1);
    let dv = value.slice(-1).toLowerCase();
    
    let formatted = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${formatted}-${dv}`;
}
