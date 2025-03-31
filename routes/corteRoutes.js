const express = require('express');
const router = express.Router();
const Corte = require('../models/Corte');
const TipoCorte = require('../models/TipoCorte');
const TotalCorte = require('../models/TotalCorte');

// Obtener cortes por usuario y fecha
router.get('/usuario/:usuario_id', async (req, res) => {
  try {
    const { usuario_id } = req.params;
    const { fecha } = req.query;
    
    // Construir query con filtro de fecha si existe
    const query = { usuario_id };
    if (fecha) {
      const startDate = new Date(fecha);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 1);
      
      query.fecha = {
        $gte: startDate,
        $lt: endDate
      };
    }

    const cortes = await Corte.find(query)
      .populate('tipo_corte_id')
      .sort({ fecha: -1 });

    res.json(cortes);
  } catch (error) {
    console.error('Error al obtener cortes:', error);
    res.status(500).json({ error: 'Error al obtener cortes' });
  }
});

// Agregar nuevo corte
router.post('/', async (req, res) => {
  try {
    const { usuario_id, tipo_corte_id, cantidad } = req.body;

    // Validación
    if (!usuario_id || !tipo_corte_id || !cantidad) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    // Obtener costo del tipo de corte
    const tipoCorte = await TipoCorte.findById(tipo_corte_id);
    if (!tipoCorte) {
      return res.status(404).json({ error: 'Tipo de corte no encontrado' });
    }

    // Crear nuevo corte con fecha actual
    const newCorte = new Corte({
      usuario_id,
      tipo_corte_id,
      cantidad,
      fecha: new Date() // Fecha actual
    });

    await newCorte.save();

    // Actualizar totales diarios
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await TotalCorte.findOneAndUpdate(
      {
        usuario_id,
        fecha: today
      },
      {
        $inc: {
          cantidad_total: parseInt(cantidad),
          costo_total: cantidad * tipoCorte.costo
        }
      },
      { upsert: true, new: true }
    );

    res.status(201).json(newCorte);
  } catch (error) {
    console.error('Error al agregar corte:', error);
    res.status(500).json({ error: 'Error al agregar corte' });
  }
});

// Obtener totales por usuario y fecha
router.get('/totales/:usuario_id/:fecha', async (req, res) => {
  try {
    const { usuario_id, fecha } = req.params;
    const date = new Date(fecha);
    date.setHours(0, 0, 0, 0);

    const total = await TotalCorte.findOne({
      usuario_id,
      fecha: date
    });

    res.json(total || { cantidad_total: 0, costo_total: 0 });
  } catch (error) {
    console.error('Error al obtener totales:', error);
    res.status(500).json({ error: 'Error al obtener totales' });
  }
});

// Eliminar corte
router.delete('/:id', async (req, res) => {
  try {
    const corte = await Corte.findByIdAndDelete(req.params.id);
    if (!corte) {
      return res.status(404).json({ error: 'Corte no encontrado' });
    }
    
    // Actualizar totales si el corte existía
    const corteDate = new Date(corte.fecha);
    corteDate.setHours(0, 0, 0, 0);

    const tipoCorte = await TipoCorte.findById(corte.tipo_corte_id);
    if (tipoCorte) {
      await TotalCorte.findOneAndUpdate(
        {
          usuario_id: corte.usuario_id,
          fecha: corteDate
        },
        {
          $inc: {
            cantidad_total: -corte.cantidad,
            costo_total: -(corte.cantidad * tipoCorte.costo)
          }
        }
      );
    }

    res.json(corte);
  } catch (error) {
    console.error('Error al eliminar corte:', error);
    res.status(500).json({ error: 'Error al eliminar corte' });
  }
});

module.exports = router;