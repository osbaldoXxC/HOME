const mongoose = require('mongoose');

const PuestoSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('Puesto', PuestoSchema, 'puestos');