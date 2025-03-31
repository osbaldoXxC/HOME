const express = require('express');
const router = express.Router();
const TipoCorte = require('../models/TipoCorte');
const mongoose = require('mongoose'); // 👈 Esta línea faltaba


router.get('/', async (req, res) => {
  try {
    const cortes = await TipoCorte.find({});
    res.json(cortes);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los cortes' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { modelo, talla, costo } = req.body;

    if (!modelo || !talla || !costo) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    const newCorte = new TipoCorte({
      modelo,
      talla,
      costo,
    });

    await newCorte.save();
    res.status(201).json(newCorte);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el corte' });
  }
});


router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { modelo, talla, costo } = req.body;

    const updatedCorte = await TipoCorte.findByIdAndUpdate(
      id,
      { modelo, talla, costo },
      { new: true }
    );

    if (!updatedCorte) {
      return res.status(404).json({ error: 'Corte no encontrado' });
    }

    res.json(updatedCorte);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el corte' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCorte = await TipoCorte.findByIdAndDelete(id);

    if (!deletedCorte) {
      return res.status(404).json({ error: 'Corte no encontrado' });
    }

    res.json(deletedCorte);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el corte' });
  }
});

module.exports = router;