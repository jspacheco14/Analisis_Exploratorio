// src/App.js
import React from 'react';
import './App.css';
import DataVisualizer from './components/DataVisualizer';

function App() {
  return (
    <div className="App">
      <h1>Visualización de datos CSV</h1>
      <DataVisualizer />
    </div>
  );
}

export default App;