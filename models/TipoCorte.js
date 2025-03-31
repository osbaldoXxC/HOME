const mongoose = require('mongoose');

const TipoCorteSchema = new mongoose.Schema({
  modelo: { type: String, required: true },
  talla: { type: String, required: true },
  costo: { type: Number, required: true },
});

module.exports = mongoose.model('TipoCorte', TipoCorteSchema, 'tipo_cortes');