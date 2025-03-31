const express = require('express');
const router = express.Router();
const User = require('../models/User');
const mongoose = require('mongoose'); // 👈 Esta línea faltaba

// Obtener todos los trabajadores con sus imágenes
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
      if (trabajador.image_urla) {
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
    res.status(500).json({ error: 'Error al obtener los trabajadores' });
  }
});

module.exports = router;

// Obtener un usuario por ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('roles_id')
      .populate('puesto_id')
      .select('nombre apellido puesto_id roles_id image_url');
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json({
      _id: user._id,
      nombre: user.nombre,
      apellido: user.apellido,
      puesto: user.puesto_id?.nombre || 'Sin puesto',
      image_url: user.image_url || null,
      roles_id: user.roles_id
    });
  } catch (error) {
    console.error('Error al obtener el usuario:', error);
    res.status(500).json({ error: 'Error al obtener el usuario' });
  }
});

module.exports = router;
// Actualizar el puesto de un usuario
router.put('/:id/update-puesto', async (req, res) => {
  const { id } = req.params;
  const { puesto_id } = req.body;

  if (!id || !puesto_id) {
    return res.status(400).json({ error: 'ID del usuario y puesto_id son obligatorios' });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { puesto_id },
      { new: true }
    ).populate('puesto_id'); // 👈 Poblar puesto_id

    if (!updatedUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Error al actualizar el puesto del usuario:', error);
    res.status(500).json({ error: 'Error al actualizar el puesto del usuario' });
  }
});

  
// Corrige el endpoint update-role:
router.put('/:id/update-role', async (req, res) => {
  const { id } = req.params;
  const { roles_id } = req.body; // 👈 Asegúrate que coincide con el frontend

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'ID de usuario inválido' });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { roles_id },
      { new: true }
    ).populate('roles_id');

    if (!updatedUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Error al actualizar el rol:', error);
    res.status(500).json({ error: 'Error al actualizar el rol' });
  }
});

router.get('/:id/rol-puesto', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('roles_id', 'nombre_rol')  // Solo el campo nombre_rol
      .populate('puesto_id', 'nombre')     // Solo el campo nombre
      .select('roles_id puesto_id');

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      rol: user.roles_id,
      puesto: user.puesto_id
    });
  } catch (error) {
    console.error('Error al obtener rol y puesto:', error);
    res.status(500).json({ error: 'Error al obtener rol y puesto' });
  }
});

module.exports = router;