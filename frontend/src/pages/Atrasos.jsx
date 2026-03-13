import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { AlertTriangle, User, FileDown, Clock, Check, X, Pencil } from 'lucide-react';

const Atrasos = () => {
  const [estudiantes, setEstudiantes] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [filterCurso, setFilterCurso] = useState('');
  const [estudianteId, setEstudianteId] = useState('');
  const [atrasos, setAtrasos] = useState([]);
  const [loading, setLoading] = useState(false);

  // Estado para edición de hora
  const [editingId, setEditingId] = useState(null);
  const [editingHora, setEditingHora] = useState('');
  const [savingId, setSavingId] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    fetchEstudiantes();
    fetchCursos();
  }, []);

  useEffect(() => {
    fetchAtrasos();
  }, [estudianteId, filterCurso]);

  useEffect(() => {
    if (editingId !== null && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingId]);

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
      fetchAtrasos();
    } catch (err) {
      alert('Error al actualizar justificación');
    }
  };

  // Iniciar edición de hora
  const startEditHora = (atr) => {
    const horaActual = atr.hora_ingreso ? atr.hora_ingreso.substring(0, 5) : '';
    setEditingId(atr.id);
    setEditingHora(horaActual);
  };

  // Cancelar edición
  const cancelEdit = () => {
    setEditingId(null);
    setEditingHora('');
  };

  // Guardar nueva hora
  const saveHora = async (asistencia_id) => {
    if (!editingHora) {
      alert('Por favor ingrese una hora válida.');
      return;
    }
    setSavingId(asistencia_id);
    try {
      await api.put(`/asistencia/${asistencia_id}/hora`, { hora_ingreso: editingHora });
      setEditingId(null);
      setEditingHora('');
      fetchAtrasos();
    } catch (err) {
      alert('Error al actualizar la hora del atraso');
    } finally {
      setSavingId(null);
    }
  };

  const handleKeyDown = (e, id) => {
    if (e.key === 'Enter') saveHora(id);
    if (e.key === 'Escape') cancelEdit();
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
                  const [year, month, day] = atr.fecha.split('-');
                  const safeFecha = `${day}/${month}/${year}`;
                  const safeHora = atr.hora_ingreso ? atr.hora_ingreso.substring(0, 5) : '--:--';
                  const isEditing = editingId === atr.id;
                  const isSaving = savingId === atr.id;

                  return (
                    <tr key={idx}>
                      {!estudianteId && (
                        <td>
                          <div style={{ fontWeight: '600' }}>{atr.apellido}, {atr.nombre}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{atr.curso_nombre}</div>
                        </td>
                      )}
                      <td style={{ fontWeight: '500' }}>{safeFecha}</td>
                      <td>
                        {isEditing ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <input
                              ref={inputRef}
                              type="time"
                              value={editingHora}
                              onChange={(e) => setEditingHora(e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, atr.id)}
                              style={{
                                border: '2px solid #3b82f6',
                                borderRadius: '6px',
                                padding: '0.25rem 0.5rem',
                                fontSize: '0.9rem',
                                outline: 'none',
                                width: '110px',
                              }}
                            />
                            <button
                              onClick={() => saveHora(atr.id)}
                              disabled={isSaving}
                              title="Guardar hora"
                              style={{
                                background: '#22c55e',
                                border: 'none',
                                borderRadius: '5px',
                                padding: '0.25rem 0.4rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                color: 'white',
                              }}
                            >
                              <Check size={15} />
                            </button>
                            <button
                              onClick={cancelEdit}
                              title="Cancelar"
                              style={{
                                background: '#ef4444',
                                border: 'none',
                                borderRadius: '5px',
                                padding: '0.25rem 0.4rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                color: 'white',
                              }}
                            >
                              <X size={15} />
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Clock size={14} color="#94a3b8" />
                            <span>{safeHora} hrs</span>
                            <button
                              onClick={() => startEditHora(atr)}
                              title="Editar hora"
                              style={{
                                background: 'none',
                                border: '1px solid #cbd5e1',
                                borderRadius: '5px',
                                padding: '0.15rem 0.35rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                color: '#64748b',
                                transition: 'all 0.15s',
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.background = '#f1f5f9';
                                e.currentTarget.style.borderColor = '#3b82f6';
                                e.currentTarget.style.color = '#3b82f6';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = 'none';
                                e.currentTarget.style.borderColor = '#cbd5e1';
                                e.currentTarget.style.color = '#64748b';
                              }}
                            >
                              <Pencil size={13} />
                            </button>
                          </div>
                        )}
                      </td>
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
