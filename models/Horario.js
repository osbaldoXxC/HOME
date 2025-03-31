// models/Horario.js
const mongoose = require('mongoose');

const HorarioSchema = new mongoose.Schema({
  usuario_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fecha: {
    type: Date,  // Cambiado de Date a String
    required: true,
  },
  entrada: {
    type: String,
    required: true,
  },
  salida: {
    type: String,
    required: true,
  },
  bono_minutos: {
    type: String,
    required: false,  // Cambiado a no requerido
  },
  bono_monto: {
    type: String,
    required: false,  // Cambiado a no requerido
  },
}, { collection: 'horarios' });

module.exports = mongoose.model('Horario', HorarioSchema);