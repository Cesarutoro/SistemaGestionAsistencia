import React, { useState, useEffect } from 'react';
import api from '../api';
import { AlertTriangle, User, History } from 'lucide-react';
import { format } from 'date-fns';

const Atrasos = () => {
  const [estudiantes, setEstudiantes] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [filterCurso, setFilterCurso] = useState('');
  const [estudianteId, setEstudianteId] = useState('');
  const [atrasos, setAtrasos] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEstudiantes();
    fetchCursos();
  }, []);

  useEffect(() => {
    if (estudianteId) {
      fetchAtrasos();
    } else {
      setAtrasos([]);
    }
  }, [estudianteId]);

  const fetchEstudiantes = async () => {
    try {
      const res = await api.get('/estudiantes');
      setEstudiantes(res.data);
    } catch (err) {
      console.error('Error fetching estudiantes', err);
    }
  };

  const fetchCursos = async () => {
    try {
      const res = await api.get('/cursos');
      setCursos(res.data);
    } catch (err) {
      console.error('Error fetching cursos', err);
    }
  };

  const fetchAtrasos = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/asistencia/atrasos/${estudianteId}`);
      setAtrasos(res.data);
    } catch (err) {
      console.error('Error fetching atrasos', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Historial de Atrasos</h2>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 2fr', gap: '1rem', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#64748b', marginBottom: '0.5rem' }}>Filtrar por Curso</label>
              <select 
                value={filterCurso} 
                onChange={(e) => { setFilterCurso(e.target.value); setEstudianteId(''); }}
                className="btn btn-outline"
                style={{ width: '100%' }}
              >
                <option value="">Todos los cursos</option>
                {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#64748b', marginBottom: '0.5rem' }}>Seleccionar Estudiante</label>
              <div style={{ position: 'relative' }}>
                <User style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                <select 
                  value={estudianteId} 
                  onChange={(e) => setEstudianteId(e.target.value)}
                  className="btn btn-outline"
                  style={{ width: '100%', paddingLeft: '2.5rem' }}
                >
                  <option value="">-- Buscar estudiante --</option>
                  {estudiantes.filter(e => filterCurso ? String(e.curso_id) === String(filterCurso) : true).map(e => (
                    <option key={e.id} value={e.id}>{e.apellido}, {e.nombre} ({e.curso_nombre})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </header>

      {!estudianteId ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
          <History size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
          <p>Seleccione un estudiante para ver el detalle de sus atrasos.</p>
        </div>
      ) : loading ? <p>Cargando historial...</p> : (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle color="#b45309" size={20} />
            <h3 style={{ fontSize: '1.125rem' }}>Registros de Atraso ({atrasos.length})</h3>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Hora de Ingreso</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {atrasos.length === 0 ? (
                  <tr><td colSpan="3" style={{ textAlign: 'center', padding: '2rem' }}>Este estudiante no cuenta con atrasos registrados.</td></tr>
                ) : atrasos.map((atr, idx) => {
                  let dateObj;
                  if (atr.fecha.includes('T')) {
                    dateObj = new Date(atr.fecha);
                  } else {
                    dateObj = new Date(atr.fecha + 'T12:00:00Z');
                  }
                  
                  const safeFecha = isNaN(dateObj.getTime()) ? 'Invalid Date' : format(dateObj, 'dd/MM/yyyy');
                  const safeHora = atr.hora_ingreso ? atr.hora_ingreso.substring(0, 5) : '--:--';
                  
                  return (
                    <tr key={idx}>
                      <td style={{ fontWeight: '500' }}>{safeFecha}</td>
                      <td>{safeHora} hrs</td>
                      <td><span className="badge badge-warning">Atraso</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Atrasos;
