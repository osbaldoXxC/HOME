const mongoose = require('mongoose');

const AsistenciaSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  nombre: { type: String, required: true },
  apellido: { type: String, required: true },
  hora: { type: String, required: true },
  fecha: { type: String, required: true },
  estado: { type: String, required: true }
}, { collection: 'asistencias' }); // Especifica el nombre de la colección

module.exports = mongoose.model('Asistencia', AsistenciaSchema);