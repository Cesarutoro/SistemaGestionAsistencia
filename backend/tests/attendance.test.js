const { verificarAtraso } = require('../src/utils/attendance');

describe('Attendance Utility - verificarAtraso', () => {
    test('deberia marcar como 0 (Presente) si llega justo a las 08:00:00', () => {
        expect(verificarAtraso('08:00:00')).toBe(0);
    });

    test('deberia marcar como 0 (Presente) si llega antes de las 08:00:00', () => {
        expect(verificarAtraso('07:55:00')).toBe(0);
    });

    test('deberia marcar como 1 (Atraso) si llega después de las 08:00:00', () => {
        expect(verificarAtraso('08:01:00')).toBe(1);
    });

    test('deberia marcar como 1 (Atraso) si llega mucho después', () => {
        expect(verificarAtraso('09:30:00')).toBe(1);
    });

    test('deberia usar un limite personalizado si se provee', () => {
        // Si el límite es 08:30:00
        expect(verificarAtraso('08:15:00', '08:30:00')).toBe(0);
        expect(verificarAtraso('08:45:00', '08:30:00')).toBe(1);
    });

    test('deberia retornar 0 si no se envia hora', () => {
        expect(verificarAtraso(null)).toBe(0);
        expect(verificarAtraso('')).toBe(0);
    });
});
