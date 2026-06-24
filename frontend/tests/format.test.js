import { describe, it, expect } from 'vitest';
import { formatRut } from '../src/utils/format';

describe('Format Utility - formatRut', () => {
    it('deberia formatear un RUT sin puntos ni guion', () => {
        expect(formatRut('12345678k')).toBe('12.345.678-k');
    });

    it('deberia manejar RUTs ya formateados', () => {
        expect(formatRut('12.345.678-k')).toBe('12.345.678-k');
    });

    it('deberia manejar RUTs con solo guion', () => {
        expect(formatRut('12345678-k')).toBe('12.345.678-k');
    });

    it('deberia retornar string vacio si no hay rut', () => {
        expect(formatRut('')).toBe('');
        expect(formatRut(null)).toBe('');
    });

    it('deberia manejar rut muy corto', () => {
        expect(formatRut('1')).toBe('1');
    });
});
