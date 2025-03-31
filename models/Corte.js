const mongoose = require('mongoose');

const CorteSchema = new mongoose.Schema({
  usuario_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  tipo_corte_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TipoCorte',
    required: true,
  },
  cantidad: {
    type: Number,
    required: true,
  },
  fecha: {
    type: Date,
    default: Date.now,
    required: true
  },
});

module.exports = mongoose.model('Corte', CorteSchema, 'cortes');