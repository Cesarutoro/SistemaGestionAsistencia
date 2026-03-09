import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Asistencia from './pages/Asistencia';
import Estudiantes from './pages/Estudiantes';
import Atrasos from './pages/Atrasos';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Asistencia />} />
          <Route path="estudiantes" element={<Estudiantes />} />
          <Route path="atrasos" element={<Atrasos />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
