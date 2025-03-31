const express = require('express');
const router = express.Router();
const mongoose = require('mongoose'); // ¡Esta línea faltaba!
const Horario = require('../models/Horario');
// Usar PUT para actualizar o crear horarios
router.post('/sincronizar-horarios', async (req, res) => {
  try {
    // 1. Obtener el horario más reciente
    const ultimoHorario = await Horario.findOne().sort({ fecha: -1 });
    
    if (!ultimoHorario) {
      return res.status(404).json({ error: 'No hay horarios registrados' });
    }

    // 2. Obtener todos los usuarios
    const usuarios = await User.find({});
    
    // 3. Para cada usuario, verificar si tiene horario y asignarle el último si no lo tiene
    let usuariosActualizados = 0;
    
    for (const usuario of usuarios) {
      const tieneHorario = await Horario.exists({ usuario_id: usuario._id });
      
      if (!tieneHorario) {
        await Horario.create({
          usuario_id: usuario._id,
          fecha: ultimoHorario.fecha,
          entrada: ultimoHorario.entrada,
          salida: ultimoHorario.salida,
          bono_minutos: ultimoHorario.bono_minutos,
          bono_monto: ultimoHorario.bono_monto
        });
        usuariosActualizados++;
      }
    }

    res.json({
      message: `Horarios sincronizados. ${usuariosActualizados} usuarios actualizados.`,
      horarioBase: {
        fecha: ultimoHorario.fecha,
        entrada: ultimoHorario.entrada,
        salida: ultimoHorario.salida
      }
    });
    
  } catch (error) {
    console.error('Error al sincronizar horarios:', error);
    res.status(500).json({ error: 'Error al sincronizar horarios' });
  }
});
// Obtener horarios por usuario y fecha
router.get('/', async (req, res) => {
  try {
    const { usuario_id, fecha } = req.query;
    
    console.log('Solicitud recibida con parámetros:', { usuario_id, fecha });

    if (!usuario_id || !fecha) {
      return res.status(400).json({ error: 'Usuario y fecha son requeridos' });
    }

    // Solución: Usar fecha directamente como string en formato YYYY-MM-DD
    const dateStr = fecha; // Usamos el string directamente
    
    console.log('Buscando horario para:', { usuario_id, fecha: dateStr });

    const horario = await Horario.findOne({
      usuario_id,
      fecha: {
        $gte: new Date(`${dateStr}T00:00:00.000Z`),
        $lt: new Date(`${dateStr}T23:59:59.999Z`)
      }
    });

    if (!horario) {
      console.log('No se encontró horario para esta fecha');
      return res.json({
        entrada: '--:--',
        salida: '--:--',
        mensaje: 'No se encontró registro de horario'
      });
    }

    console.log('Horario encontrado:', {
      entrada: horario.entrada,
      salida: horario.salida,
      fecha: horario.fecha
    });

    res.json({
      entrada: horario.entrada,
      salida: horario.salida,
      fecha: horario.fecha
    });

  } catch (error) {
    console.error('Error en GET /api/horarios:', error);
    res.status(500).json({ 
      error: 'Error al obtener horarios',
      detalle: error.message 
    });
  }
});

router.put('/guardar-horarios', async (req, res) => {
  try {
    const { usuarios, horarios } = req.body;
    console.log('Datos recibidos:', { usuarios, horarios });

    if (!usuarios || !Array.isArray(usuarios) || !horarios || !Array.isArray(horarios)) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }

    const horariosActualizados = [];
    for (const usuario_id of usuarios) {
      for (const horario of horarios) {
        const horarioExistente = await Horario.findOneAndUpdate(
          {
            usuario_id,
            fecha: new Date(horario.date),
          },
          {
            entrada: horario.entrada,
            salida: horario.salida,
            bono_minutos: horario.bonoMinutes,
            bono_monto: horario.bonoAmount,
          },
          { new: true, upsert: true } 
        );
        horariosActualizados.push(horarioExistente);
      }
    }

    res.status(200).json(horariosActualizados);
  } catch (error) {
    console.error('Error al actualizar los horarios:', error);
    res.status(500).json({ error: 'Error al actualizar los horarios' });
  }
});



module.exports = router;