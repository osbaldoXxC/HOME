const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.get('/', async (req, res) => {
  try {
    const trabajadores = await User.find({})
      .select('nombre apellido image_url puesto_id roles_id')
      .populate('puesto_id', 'nombre')
      .populate('roles_id', 'nombre_rol');
    
    // Formatear la respuesta incluyendo la URL completa de la imagen
    const trabajadoresFormateados = trabajadores.map(trabajador => {
      let imageUrl = null;
      
      // Construir URL completa si existe image_url
      if (trabajador.image_url) {
        // Asegúrate de que la URL sea accesible desde el cliente
        imageUrl = trabajador.image_url.startsWith('http') 
          ? trabajador.image_url 
          : `${req.protocol}://${req.get('host')}/${trabajador.image_url}`;
      }

      return {
        _id: trabajador._id,
        nombre: trabajador.nombre,
        apellido: trabajador.apellido,
        image_url: imageUrl, // URL completa
        puesto: trabajador.puesto_id?.nombre || 'Sin puesto',
        rol: trabajador.roles_id?.nombre_rol || 'Sin rol'
      };
    });

    res.json(trabajadoresFormateados);
  } catch (error) {
    console.error('Error al obtener los trabajadores:', error);
    res.status(500).json({ 
      error: 'Error al obtener los trabajadores',
      detalle: error.message 
    });
  }
});

module.exports = router;