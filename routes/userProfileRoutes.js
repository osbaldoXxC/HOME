const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Puesto = require('../models/Puesto'); // Asegúrate de importar el modelo Puesto

// Nuevo endpoint para obtener perfil básico del usuario
router.get('/profile/:id', async (req, res) => {
    try {
      console.log('Solicitud recibida para perfil de usuario con ID:', req.params.id);
      
      const user = await User.findById(req.params.id)
        .select('nombre apellido image_url puesto_id')
        .populate('puesto_id', 'nombre'); // Popula el campo puesto_id para obtener el nombre del puesto
      
      if (!user) {
        console.log('Usuario no encontrado');
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
  
      console.log('Datos encontrados:', {
        nombre: user.nombre,
        apellido: user.apellido,
        image_url: user.image_url,
        puesto: user.puesto_id?.nombre || 'Sin puesto' // Usamos el nombre del puesto si existe
      });
  
      res.json({
        nombre: user.nombre,
        apellido: user.apellido,
        image_url: user.image_url || null,
        puesto: user.puesto_id?.nombre || 'Sin puesto' // Incluimos el puesto en la respuesta
      });
    } catch (error) {
      console.error('Error en /profile/:id:', error);
      res.status(500).json({ error: 'Error al obtener el perfil del usuario' });
    }
});

module.exports = router;