// models/ResumenDiarioCortes.js
const mongoose = require('mongoose');

const ResumenDiarioCortesSchema = new mongoose.Schema({
  fecha: {
    type: Date,
    required: true,
    index: true
  },
  usuario_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  nombre_usuario: {
    type: String,
    required: true
  },
  apellido_usuario: {
    type: String,
    required: true
  },
  total_cortes: {
    type: Number,
    required: true,
    default: 0
  },
  total_costo: {
    type: Number,
    required: true,
    default: 0
  },
  detalles_cortes: [{
    tipo_corte_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TipoCorte'
    },
    modelo: String,
    talla: String,
    cantidad: Number,
    costo_unitario: Number,
    subtotal: Number
  }]
}, { collection: 'resumen_diario_cortes' });

module.exports = mongoose.model('ResumenDiarioCortes', ResumenDiarioCortesSchema);