const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Role = require('../models/Role');
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).populate('roles_id');
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const roleName = user.roles_id.nombre_rol;
    const nombreCompleto = `${user.nombre} ${user.apellido}`;

    res.json({ 
      redirectTo: roleName.toLowerCase(),
      nombre: nombreCompleto,
      id: user._id // 👈 Asegúrate de enviar el ID
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});
module.exports = router;