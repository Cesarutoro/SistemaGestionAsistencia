import React, { useState, useEffect } from 'react';
import api from '../api';
import { BookOpen, Plus, Edit2, Trash2, X } from 'lucide-react';

const Cursos = () => {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCurso, setEditingCurso] = useState(null);
  const [formData, setFormData] = useState({ nombre: '' });

  useEffect(() => {
    fetchCursos();
  }, []);

  const fetchCursos = async () => {
    setLoading(true);
    try {
      const res = await api.get('/cursos');
      setCursos(res.data);
    } catch (err) {
      console.error('Error fetching cursos', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCurso) {
        await api.put(`/cursos/${editingCurso.id}`, formData);
      } else {
        await api.post('/cursos', formData);
      }
      setShowModal(false);
      setEditingCurso(null);
      setFormData({ nombre: '' });
      fetchCursos();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al guardar el curso');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este curso? Solo se podrá eliminar si no tiene estudiantes asociados.')) {
      try {
        await api.delete(`/cursos/${id}`);
        fetchCursos();
      } catch (err) {
        alert(err.response?.data?.error || 'Error al eliminar el curso');
      }
    }
  };

  const openEdit = (curso) => {
    setEditingCurso(curso);
    setFormData({ nombre: curso.nombre });
    setShowModal(true);
  };

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem' }}>Gestión de Cursos</h2>
        <button className="btn btn-primary" onClick={() => { setEditingCurso(null); setFormData({ nombre: '' }); setShowModal(true); }}>
          <Plus size={20} />
          Nuevo Curso
        </button>
      </header>

      {loading ? <p>Cargando cursos...</p> : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nombre del Curso</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cursos.length === 0 ? (
                  <tr><td colSpan="2" style={{ textAlign: 'center', padding: '2rem' }}>No hay cursos registrados</td></tr>
                ) : cursos.map(curso => (
                  <tr key={curso.id}>
                    <td style={{ fontWeight: '600' }}>{curso.nombre}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-outline" style={{ padding: '0.4rem' }} onClick={() => openEdit(curso)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="btn btn-outline" style={{ padding: '0.4rem', color: '#dc2626' }} onClick={() => handleDelete(curso.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>{editingCurso ? 'Editar Curso' : 'Nuevo Curso'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Nombre del Curso</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej: 1° Medio A"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cursos;
