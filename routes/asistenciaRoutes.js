const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Asistencia = require('../models/Asistencia');

// Middleware de depuración para todas las rutas de asistencia
router.use((req, res, next) => {
  console.log('\n===== Nueva petición de asistencia =====');
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log('Params:', req.params);
  console.log('Query:', req.query);
  next();
});

// Endpoint para obtener primer registro (entrada)
router.get('/primer-registro/:fecha/:id', async (req, res) => {
  try {
    const { fecha, id } = req.params;
    
    console.log('\nBuscando PRIMER registro para:');
    console.log('Usuario ID:', id);
    console.log('Fecha:', fecha);

    const registro = await Asistencia.findOne({
      user_id: id,
      fecha: fecha,
      estado: 'check'
    }).sort({ hora: 1 }).lean(); // .lean() para obtener objeto plano

    console.log('\nResultado de la búsqueda:');
    console.log(registro || 'No se encontraron registros');

    if (!registro) {
      return res.json({ 
        hora: '--:--',
        mensaje: 'No se encontró registro de entrada' 
      });
    }

    res.json({
      hora: registro.hora,
      detalles: {
        idRegistro: registro._id,
        nombre: registro.nombre,
        apellido: registro.apellido,
        estado: registro.estado
      }
    });

  } catch (error) {
    console.error('Error en primer-registro:', error);
    res.status(500).json({ 
      error: 'Error al obtener entrada',
      detalle: error.message 
    });
  }
});

// Endpoint para obtener segundo registro (salida)
router.get('/segundo-registro/:fecha/:id', async (req, res) => {
  try {
    const { fecha, id } = req.params;
    
    console.log('\nBuscando SEGUNDO registro para:');
    console.log('Usuario ID:', id);
    console.log('Fecha:', fecha);

    const registros = await Asistencia.find({
      user_id: id,
      fecha: fecha,
      estado: 'check'
    }).sort({ hora: 1 }).lean();

    console.log('\nTodos los registros encontrados:');
    console.log(registros.length > 0 ? registros : 'No se encontraron registros');

    if (registros.length < 2) {
      return res.json({ 
        hora: '--:--',
        mensaje: 'No se encontró registro de salida' 
      });
    }

    // El segundo registro es el último si están ordenados por hora ascendente
    const registroSalida = registros[registros.length - 1];

    res.json({
      hora: registroSalida.hora,
      detalles: {
        idRegistro: registroSalida._id,
        nombre: registroSalida.nombre,
        apellido: registroSalida.apellido,
        estado: registroSalida.estado
      }
    });

  } catch (error) {
    console.error('Error en segundo-registro:', error);
    res.status(500).json({ 
      error: 'Error al obtener salida',
      detalle: error.message 
    });
  }
});

module.exports = router;