const mongoose = require('mongoose');

const UserProfileSchema = new mongoose.Schema({
  nombre: String,
  apellido: String,
  image_url: String
}, { collection: 'usuarios' }); // Misma colección que User

module.exports = mongoose.model('UserProfile', UserProfileSchema);