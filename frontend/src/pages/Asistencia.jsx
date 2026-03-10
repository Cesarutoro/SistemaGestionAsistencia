import React, { useState, useEffect } from 'react';
import api from '../api';
import { UserCheck, Clock, CheckCircle, Search, XCircle } from 'lucide-react';
import { format } from 'date-fns';

const Asistencia = () => {
  const [cursos, setCursos] = useState([]);
  const [cursoId, setCursoId] = useState('');
  const [fecha, setFecha] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [estudiantes, setEstudiantes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCursos();
  }, []);

  useEffect(() => {
    if (cursoId) {
      fetchAsistencia();
    }
  }, [cursoId, fecha]);

  const fetchCursos = async () => {
    try {
      const res = await api.get('/cursos');
      setCursos(res.data);
      if (res.data.length > 0) setCursoId(res.data[0].id);
    } catch (err) {
      console.error('Error fetching cursos', err);
    }
  };

  const fetchAsistencia = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/asistencia/curso/${cursoId}?fecha=${fecha}`);
      setEstudiantes(res.data);
    } catch (err) {
      console.error('Error fetching asistencia', err);
    } finally {
      setLoading(false);
    }
  };

  const registrarIngreso = async (estudiante_id) => {
    const hora_ingreso = format(new Date(), 'HH:mm:ss');
    try {
      await api.post('/asistencia', {
        estudiante_id,
        fecha,
        hora_ingreso
      });
      fetchAsistencia(); // Refresh list
    } catch (err) {
      alert('Error al registrar ingreso');
    }
  };

  const deshacerIngreso = async (estudiante_id) => {
    if (window.confirm('¿Deshacer el ingreso de este estudiante?')) {
      try {
        await api.delete(`/asistencia/${estudiante_id}/${fecha}`);
        fetchAsistencia();
      } catch (err) {
        alert('Error al deshacer ingreso');
      }
    }
  };

  const filteredEstudiantes = estudiantes.filter(est => 
    `${est.nombre} ${est.apellido} ${est.rut}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Control de Asistencia</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#64748b' }}>Curso</label>
            <select 
              value={cursoId} 
              onChange={(e) => setCursoId(e.target.value)}
              className="btn btn-outline"
              style={{ width: '200px', padding: '0.4rem' }}
            >
              {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#64748b' }}>Fecha</label>
            <input 
              type="date" 
              value={fecha} 
              onChange={(e) => setFecha(e.target.value)}
              className="btn btn-outline"
              style={{ padding: '0.4rem' }}
            />
          </div>
          <div style={{ flex: 1, marginLeft: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#64748b' }}>Buscar Estudiante</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', padding: '0.3rem 0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <Search size={16} color="#64748b" />
              <input 
                type="text" 
                placeholder="Nombre o RUT..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.9rem' }}
              />
            </div>
          </div>
        </div>
      </header>

      {loading ? <p>Cargando lista...</p> : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>RUT</th>
                  <th>Hora Ingreso</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredEstudiantes.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No se encontraron estudiantes</td></tr>
                ) : filteredEstudiantes.map(est => (
                  <tr key={est.estudiante_id}>
                    <td>
                      <div style={{ fontWeight: '600' }}>{est.apellido}, {est.nombre}</div>
                    </td>
                    <td style={{ color: '#64748b' }}>{est.rut}</td>
                    <td>
                      {est.hora_ingreso ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Clock size={16} />
                          {est.hora_ingreso.substring(0, 5)}
                        </div>
                      ) : '-'}
                    </td>
                    <td>
                      {est.hora_ingreso ? (
                        est.es_atraso ? (
                          <span className="badge badge-warning">Atraso</span>
                        ) : (
                          <span className="badge badge-success">Presente</span>
                        )
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Pendiente</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {est.hora_ingreso ? (
                        <button 
                          onClick={() => deshacerIngreso(est.estudiante_id)}
                          className="btn btn-outline"
                          style={{ color: '#b91c1c', borderColor: '#fca5a5' }}
                          title="Deshacer Ingreso"
                        >
                          <XCircle size={18} />
                          Deshacer
                        </button>
                      ) : (
                        <button 
                          onClick={() => registrarIngreso(est.estudiante_id)}
                          className="btn btn-primary"
                        >
                          <UserCheck size={18} />
                          Marcar Ingreso
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Asistencia;
