const { notificarApoderadoSalida, notificarApoderadoAtraso } = require('../src/utils/notificationService');

const mockSend = jest.fn();

jest.mock('resend', () => {
  return {
    Resend: jest.fn().mockImplementation(() => {
      return {
        emails: {
          send: (opts) => mockSend(opts),
        },
      };
    }),
  };
});

describe('Notification Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.ENVIAR_CORREOS_REALES;
    delete process.env.CORREO_TEST_DESARROLLO;
    delete process.env.NOTIFICACION_ATRASO_INMEDIATA;
  });

  describe('notificarApoderadoSalida', () => {
    it('deberia enviar correo de salida al apoderado si ENVIAR_CORREOS_REALES es true', async () => {
      process.env.ENVIAR_CORREOS_REALES = 'true';
      mockSend.mockResolvedValueOnce({ id: 'success-id' });

      const datos = {
        nombre_estudiante: 'Ana Pérez',
        correo_apoderado: 'apoderado@test.com',
        fecha: '2026-03-24',
        hora_salida: '14:30',
        motivo: 'Médico',
      };

      await notificarApoderadoSalida(datos);

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'apoderado@test.com',
          subject: '[ALERTA] Retiro Anticipado de Ana Pérez',
          html: expect.stringContaining('Ana Pérez'),
        })
      );
    });

    it('deberia enviar correo al CORREO_TEST_DESARROLLO si ENVIAR_CORREOS_REALES no es true', async () => {
      process.env.ENVIAR_CORREOS_REALES = 'false';
      process.env.CORREO_TEST_DESARROLLO = 'dev-test@test.com';
      mockSend.mockResolvedValueOnce({ id: 'success-id' });

      const datos = {
        nombre_estudiante: 'Ana Pérez',
        correo_apoderado: 'apoderado@test.com',
        fecha: '2026-03-24',
        hora_salida: '14:30',
        motivo: 'Médico',
      };

      await notificarApoderadoSalida(datos);

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'dev-test@test.com',
        })
      );
    });

    it('deberia capturar y registrar el error en consola si Resend falla', async () => {
      mockSend.mockRejectedValueOnce(new Error('Resend Fail'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await notificarApoderadoSalida({
        nombre_estudiante: 'Ana',
        correo_apoderado: 'apoderado@test.com',
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('notificarApoderadoAtraso', () => {
    it('deberia no hacer nada si NOTIFICACION_ATRASO_INMEDIATA es false', async () => {
      process.env.NOTIFICACION_ATRASO_INMEDIATA = 'false';

      await notificarApoderadoAtraso({
        nombre_estudiante: 'Ana Pérez',
      });

      expect(mockSend).not.toHaveBeenCalled();
    });

    it('deberia enviar correo de atraso si NOTIFICACION_ATRASO_INMEDIATA no es false', async () => {
      process.env.ENVIAR_CORREOS_REALES = 'true';
      mockSend.mockResolvedValueOnce({ id: 'success-id' });

      const datos = {
        nombre_estudiante: 'Pedro Gómez',
        correo_apoderado: 'apoderado-pedro@test.com',
        fecha: '2026-03-24',
        hora_ingreso: '08:15',
      };

      await notificarApoderadoAtraso(datos);

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'apoderado-pedro@test.com',
          subject: '[ATRASO] Notificación de ingreso tardío de Pedro Gómez',
          html: expect.stringContaining('Registro de Atraso'),
        })
      );
    });

    it('deberia capturar el error de Resend en notificarApoderadoAtraso', async () => {
      mockSend.mockRejectedValueOnce(new Error('Resend Fail'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await notificarApoderadoAtraso({
        nombre_estudiante: 'Pedro',
        correo_apoderado: 'apoderado@test.com',
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });
});
