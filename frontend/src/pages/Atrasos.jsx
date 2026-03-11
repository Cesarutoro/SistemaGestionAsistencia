import React, { useState, useEffect } from 'react';
import api from '../api';
import { AlertTriangle, User, History, FileDown } from 'lucide-react';
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
    fetchAtrasos();
  }, [estudianteId, filterCurso]);

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
      let endpoint = '';
      if (estudianteId) {
        endpoint = `/asistencia/atrasos/${estudianteId}`;
      } else {
        endpoint = filterCurso ? `/asistencia/atrasos/curso/${filterCurso}` : '/asistencia/atrasos/curso';
      }
      const res = await api.get(endpoint);
      setAtrasos(res.data);
    } catch (err) {
      console.error('Error fetching atrasos', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleJustificado = async (asistencia_id, currentStatus) => {
    try {
      await api.put(`/asistencia/${asistencia_id}/justificar`, { justificado: !currentStatus });
      fetchAtrasos(); // Recargar el historial para ver el cambio
    } catch (err) {
      alert('Error al actualizar justificación');
    }
  };

  const handleExportCurso = () => {
    if (!filterCurso) return alert('Por favor, selecciona un curso primero.');
    const url = `${api.defaults.baseURL}/asistencia/export/curso/${filterCurso}`;
    window.open(url, '_blank');
  };

  const handleExportTodos = () => {
    const url = `${api.defaults.baseURL}/asistencia/export/todos`;
    window.open(url, '_blank');
  };

  const handleExportIndividual = () => {
    if (!estudianteId) return;
    const url = `${api.defaults.baseURL}/asistencia/export/estudiante/${estudianteId}`;
    window.open(url, '_blank');
  };

  const handleExportResumen = () => {
    const url = `${api.defaults.baseURL}/asistencia/export/resumen`;
    window.open(url, '_blank');
  };

  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.5rem' }}>Historial de Atrasos</h2>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-outline" onClick={handleExportIndividual} disabled={!estudianteId}>
              <FileDown size={18} />
              Exportar Selección
            </button>
            <button className="btn btn-outline" onClick={handleExportCurso} disabled={!filterCurso}>
              <FileDown size={18} />
              Exportar Curso
            </button>
            <button className="btn btn-outline" onClick={handleExportTodos}>
              <FileDown size={18} />
              Exportar Todo
            </button>
            <button className="btn btn-primary" onClick={handleExportResumen}>
              <FileDown size={18} />
              Exportar Resumen
            </button>
          </div>
        </div>
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

      {loading ? <p>Cargando historial...</p> : (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle color="#b45309" size={20} />
            <h3 style={{ fontSize: '1.125rem' }}>
              {estudianteId ? 'Detalle de Atrasos' : filterCurso ? 'Atrasos del Curso' : 'Todos los Atrasos'} ({atrasos.length})
            </h3>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  {!estudianteId && <th>Estudiante</th>}
                  <th>Fecha</th>
                  <th>Hora de Ingreso</th>
                  <th>Estado</th>
                  <th>Justificación</th>
                </tr>
              </thead>
              <tbody>
                {atrasos.length === 0 ? (
                  <tr><td colSpan={estudianteId ? "4" : "5"} style={{ textAlign: 'center', padding: '2rem' }}>No se cuentan con atrasos registrados en esta selección.</td></tr>
                ) : atrasos.map((atr, idx) => {
                  // Prevenir desfase horario: la fecha viene como YYYY-MM-DD
                  const [year, month, day] = atr.fecha.split('-');
                  const safeFecha = `${day}/${month}/${year}`;
                  const safeHora = atr.hora_ingreso ? atr.hora_ingreso.substring(0, 5) : '--:--';
                  
                  return (
                    <tr key={idx}>
                      {!estudianteId && (
                        <td>
                          <div style={{ fontWeight: '600' }}>{atr.apellido}, {atr.nombre}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{atr.curso_nombre}</div>
                        </td>
                      )}
                      <td style={{ fontWeight: '500' }}>{safeFecha}</td>
                      <td>{safeHora} hrs</td>
                      <td><span className="badge badge-warning">Atraso</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <input 
                            type="checkbox" 
                            checked={!!atr.justificado} 
                            onChange={() => toggleJustificado(atr.id, atr.justificado)} 
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '0.875rem', color: atr.justificado ? '#059669' : '#64748b' }}>
                            {atr.justificado ? 'Justificado' : 'Sin justificar'}
                          </span>
                        </div>
                      </td>
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
