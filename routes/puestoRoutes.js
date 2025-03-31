const express = require('express');
const router = express.Router();
const Puesto = require('../models/Puesto');

// Obtener todos los puestos
router.get('/', async (req, res) => {
  try {
    const puestos = await Puesto.find({});
    res.json(puestos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los puestos' });
  }
});

// Crear un nuevo puesto
router.post('/', async (req, res) => {
  try {
    const { nombre } = req.body; // Extrae el campo "nombre" del cuerpo de la solicitud

    if (!nombre) {
      return res.status(400).json({ error: 'El nombre del puesto es obligatorio' });
    }

    const newPuesto = new Puesto({ nombre });
    await newPuesto.save();
    res.status(201).json(newPuesto);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el puesto' });
  }
});

// Actualizar un puesto
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('puesto_id'); // 👈 Poblar puesto_id
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error al obtener el usuario:', error);
    res.status(500).json({ error: 'Error al obtener el usuario' });
  }
});


router.put('/:id/update-puesto', async (req, res) => {
  const { id } = req.params;
  const { puesto_id } = req.body;

  console.log("ID del usuario:", id); // 👈 Log para depuración
  console.log("ID del puesto:", puesto_id); // 👈 Log para depuración

  if (!id || !puesto_id) {
    return res.status(400).json({ error: 'ID del usuario y puesto_id son obligatorios' });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { puesto_id },
      { new: true }
    ).populate('puesto_id'); // 👈 Poblar el campo puesto_id

    if (!updatedUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    console.log("Usuario actualizado:", updatedUser); // 👈 Log para depuración
    res.json(updatedUser);
  } catch (error) {
    console.error('Error al actualizar el puesto del usuario:', error);
    res.status(500).json({ error: 'Error al actualizar el puesto del usuario' });
  }
});
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deletedPuesto = await Puesto.findByIdAndDelete(id);

    if (!deletedPuesto) {
      return res.status(404).json({ error: 'Puesto no encontrado' });
    }

    res.json(deletedPuesto);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el puesto' });
  }
});

module.exports = router;