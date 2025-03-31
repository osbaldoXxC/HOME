const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
  nombre_rol: { 
    type: String, 
    required: true 
  }
});

module.exports = mongoose.model('Role', RoleSchema, 'roles');