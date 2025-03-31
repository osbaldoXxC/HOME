const express = require('express');
const router = express.Router();
const Corte = require('../models/Corte');
const mongoose = require('mongoose'); // Añade esta línea al inicio
const TipoCorte = require('../models/TipoCorte');
const TotalCorte = require('../models/TotalCorte');
const ResumenDiarioCortes = require('../models/ResumenDiarioCortes');
async function sincronizarTotales(usuario_id, fecha) {
  console.log(`Sincronizando totales para usuario ${usuario_id} en fecha ${fecha}`);
  
  const date = new Date(fecha);
  date.setHours(0, 0, 0, 0);

  const cortes = await Corte.find({
    usuario_id,
    fecha: {
      $gte: date,
      $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000)
    }
  }).populate('tipo_corte_id');

  let cantidad_total = 0;
  let costo_total = 0;

  cortes.forEach(corte => {
    cantidad_total += corte.cantidad;
    costo_total += corte.cantidad * corte.tipo_corte_id.costo;
  });

  await TotalCorte.findOneAndUpdate(
    { usuario_id, fecha: date },
    { cantidad_total, costo_total },
    { upsert: true }
  );

  console.log(`Sincronización completada: ${cantidad_total} cortes, $${costo_total}`);
}
// Obtener cortes por usuario y fecha
router.get('/usuario/:usuario_id', async (req, res) => {
  try {
    const { usuario_id } = req.params;
    const { fecha } = req.query;
    
    // Constrauir query con filtro de fecha si existe
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
    
    console.log('\n===== SOLICITUD DE TOTALES =====');
    console.log('Usuario ID:', usuario_id);
    console.log('Fecha recibida:', fecha);

    // Validar el ID de usuario
    if (!mongoose.Types.ObjectId.isValid(usuario_id)) {
      console.log('ID de usuario inválido');
      return res.status(400).json({ error: 'ID de usuario inválido' });
    }

    // Procesar la fecha
    const date = new Date(fecha);
    if (isNaN(date.getTime())) {
      console.log('Fecha inválida');
      return res.status(400).json({ error: 'Fecha inválida' });
    }

    date.setHours(0, 0, 0, 0);
    console.log('Fecha procesada:', date);

    // Buscar totales en la colección TotalCorte
    console.log('Buscando totales en TotalCorte...');
    const total = await TotalCorte.findOne({
      usuario_id,
      fecha: date
    });

    if (total) {
      console.log('Totales encontrados en TotalCorte:', total);
      return res.json(total);
    }

    // Si no hay totales, calcularlos desde los cortes
    console.log('No se encontraron totales, calculando desde cortes...');
    
    const cortes = await Corte.find({
      usuario_id,
      fecha: {
        $gte: date,
        $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000) // Sumar 1 día
      }
    }).populate('tipo_corte_id');

    console.log('Cortes encontrados:', cortes.length);

    let cantidad_total = 0;
    let costo_total = 0;

    cortes.forEach(corte => {
      cantidad_total += corte.cantidad;
      costo_total += corte.cantidad * corte.tipo_corte_id.costo;
    });

    console.log('Totales calculados:', {
      cantidad_total,
      costo_total
    });

    // Crear nuevo registro de totales si hay cortes
    if (cortes.length > 0) {
      const nuevoTotal = new TotalCorte({
        usuario_id,
        fecha: date,
        cantidad_total,
        costo_total
      });

      await nuevoTotal.save();
      console.log('Nuevo total guardado:', nuevoTotal);
      return res.json(nuevoTotal);
    }

    console.log('No hay cortes para esta fecha');
    res.json({ cantidad_total: 0, costo_total: 0 });

  } catch (error) {
    console.error('Error en GET /totales:', error);
    res.status(500).json({ 
      error: 'Error al obtener totales',
      detalle: error.message 
    });
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
router.post('/generar-resumen-diario', async (req, res) => {
  try {
    const { fecha } = req.body;
    
    if (!fecha) {
      return res.status(400).json({ error: 'La fecha es requerida (YYYY-MM-DD)' });
    }

    // Crear fechas para el rango del día completo
    const startDate = new Date(fecha);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(fecha);
    endDate.setHours(23, 59, 59, 999);

    // Obtener todos los cortes del día con sus tipos de corte y datos de usuario
    const cortes = await Corte.find({
      fecha: { $gte: startDate, $lte: endDate }
    })
    .populate('tipo_corte_id')
    .populate('usuario_id', 'nombre apellido');

    if (cortes.length === 0) {
      return res.status(404).json({ 
        message: 'No se encontraron cortes para la fecha especificada' 
      });
    }

    // Agrupar cortes por usuario
    const cortesPorUsuario = cortes.reduce((acc, corte) => {
      const usuarioId = corte.usuario_id._id.toString();
      
      if (!acc[usuarioId]) {
        acc[usuarioId] = {
          usuario_id: corte.usuario_id._id,
          nombre_usuario: corte.usuario_id.nombre,
          apellido_usuario: corte.usuario_id.apellido,
          total_cortes: 0,
          total_costo: 0,
          detalles_cortes: []
        };
      }

      const subtotal = corte.cantidad * corte.tipo_corte_id.costo;
      
      acc[usuarioId].total_cortes += corte.cantidad;
      acc[usuarioId].total_costo += subtotal;
      
      acc[usuarioId].detalles_cortes.push({
        tipo_corte_id: corte.tipo_corte_id._id,
        modelo: corte.tipo_corte_id.modelo,
        talla: corte.tipo_corte_id.talla,
        cantidad: corte.cantidad,
        costo_unitario: corte.tipo_corte_id.costo,
        subtotal: subtotal
      });

      return acc;
    }, {});

    // Guardar los resúmenes en la base de datos
    const resultados = [];
    
    for (const usuarioId in cortesPorUsuario) {
      const resumenUsuario = cortesPorUsuario[usuarioId];
      
      // Verificar si ya existe un resumen para este usuario y fecha
      const resumenExistente = await ResumenDiarioCortes.findOne({
        fecha: startDate,
        usuario_id: resumenUsuario.usuario_id
      });

      let resumenGuardado;
      
      if (resumenExistente) {
        // Actualizar resumen existente
        resumenGuardado = await ResumenDiarioCortes.findByIdAndUpdate(
          resumenExistente._id,
          {
            $set: {
              total_cortes: resumenUsuario.total_cortes,
              total_costo: resumenUsuario.total_costo,
              detalles_cortes: resumenUsuario.detalles_cortes
            }
          },
          { new: true }
        );
      } else {
        // Crear nuevo resumen
        resumenGuardado = await ResumenDiarioCortes.create({
          fecha: startDate,
          ...resumenUsuario
        });
      }

      resultados.push(resumenGuardado);
    }

    res.json({
      message: `Resumen diario generado para ${Object.keys(cortesPorUsuario).length} usuarios`,
      fecha: startDate,
      resultados
    });

  } catch (error) {
    console.error('Error al generar resumen diario:', error);
    res.status(500).json({ 
      error: 'Error al generar resumen diario',
      detalle: error.message 
    });
  }
});
router.get('/resumenes-diarios', async (req, res) => {
  try {
    const { fecha, usuario_id } = req.query;
    
    console.log('Solicitud recibida con parámetros:', { usuario_id, fecha });

    // Validaciones
    if (!usuario_id || !fecha) {
      return res.status(400).json({ error: 'Usuario y fecha son requeridos' });
    }

    if (!mongoose.Types.ObjectId.isValid(usuario_id)) {
      return res.status(400).json({ error: 'ID de usuario inválido' });
    }

    // Procesamiento de fechas
    const startDate = new Date(fecha);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(fecha);
    endDate.setHours(23, 59, 59, 999);

    console.log('Buscando resúmenes para:', {
      usuario_id,
      fecha_inicio: startDate,
      fecha_fin: endDate
    });

    // Consulta optimizada
    const resumenes = await ResumenDiarioCortes.find({
      usuario_id,
      fecha: {
        $gte: startDate,
        $lte: endDate
      }
    })
    .populate('usuario_id', 'nombre apellido')
    .populate('detalles_cortes.tipo_corte_id', 'modelo talla costo')
    .lean();

    console.log('Resúmenes encontrados:', resumenes.length);

    if (resumenes.length === 0) {
      // Si no hay resúmenes, buscar cortes directamente
      console.log('No se encontraron resúmenes, buscando cortes directos...');
      
      const cortes = await Corte.find({
        usuario_id,
        fecha: {
          $gte: startDate,
          $lte: endDate
        }
      })
      .populate('tipo_corte_id', 'modelo talla costo')
      .lean();

      console.log('Cortes encontrados:', cortes.length);

      if (cortes.length > 0) {
        // Crear un resumen manualmente
        const resumenManual = {
          fecha: startDate,
          usuario_id,
          nombre_usuario: 'Usuario',
          apellido_usuario: '',
          total_cortes: cortes.reduce((sum, corte) => sum + corte.cantidad, 0),
          total_costo: cortes.reduce((sum, corte) => {
            return sum + (corte.cantidad * (corte.tipo_corte_id?.costo || 0));
          }, 0),
          detalles_cortes: cortes.map(corte => ({
            tipo_corte_id: corte.tipo_corte_id,
            modelo: corte.tipo_corte_id?.modelo || 'Desconocido',
            talla: corte.tipo_corte_id?.talla || 'Desconocida',
            cantidad: corte.cantidad,
            costo_unitario: corte.tipo_corte_id?.costo || 0,
            subtotal: corte.cantidad * (corte.tipo_corte_id?.costo || 0)
          }))
        };

        return res.json([resumenManual]);
      }
    }

    res.json(resumenes);
  } catch (error) {
    console.error('Error en GET /api/cortes/resumenes-diarios:', error);
    res.status(500).json({ 
      error: 'Error al obtener resúmenes diarios',
      detalle: error.message 
    });
  }
});
// En tu archivo de rutas de cortes (corteRoutes.js)
// En tu archivo de rutas de cortes (corteRoutes.js)
router.get('/resumenes-diarios', async (req, res) => {
  try {
    const { fecha, usuario_id, fecha_inicio, fecha_fin } = req.query;
    const query = {};

    if (usuario_id) {
      query.usuario_id = usuario_id;
    }

    // Para consulta por fecha específica (diaria)
    if (fecha) {
      const startDate = new Date(fecha);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(fecha);
      endDate.setHours(23, 59, 59, 999);

      query.fecha = { $gte: startDate, $lte: endDate };
    }

    // Para consulta por rango de fechas (semanal)
    if (fecha_inicio && fecha_fin) {
      const startDate = new Date(fecha_inicio);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(fecha_fin);
      endDate.setHours(23, 59, 59, 999);

      query.fecha = { $gte: startDate, $lte: endDate };
    }

    console.log('Query parameters:', { fecha, usuario_id, fecha_inicio, fecha_fin });
    console.log('MongoDB query:', query);

    const resumenes = await ResumenDiarioCortes.find(query)
      .sort({ fecha: 1 }); // Ordenar por fecha ascendente

    console.log('Resúmenes encontrados:', resumenes.length);

    res.json(resumenes);
  } catch (error) {
    console.error('Error al obtener resúmenes diarios:', error);
    res.status(500).json({ 
      error: 'Error al obtener resúmenes diarios',
      detalle: error.message 
    });
  }
});

module.exports = router;