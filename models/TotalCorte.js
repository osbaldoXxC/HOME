const mongoose = require('mongoose');

const TotalCorteSchema = new mongoose.Schema({
  usuario_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fecha: {
    type: Date,
    required: true,
    default: Date.now
  },
  cantidad_total: {
    type: Number,
    default: 0
  },
  costo_total: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('TotalCorte', TotalCorteSchema, 'totales_cortes');