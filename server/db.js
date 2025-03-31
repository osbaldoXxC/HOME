const mongoose = require('mongoose');
const Horario = require('../models/Horario');
const User = require('../models/User');
const Role = require('../models/Role');

// Función para asegurar que el rol "Usuario" exista
async function asegurarRolUsuario() {
  try {
    // Buscar el rol "Usuario" (exactamente así, con mayúscula)
    let rolUsuario = await Role.findOne({ nombre_rol: 'Usuario' });
    
    if (!rolUsuario) {
      // Si no existe, crearlo
      rolUsuario = await Role.create({ nombre_rol: 'Usuario' });
      console.log('✅ Rol "Usuario" creado correctamente');
    }
    
    return rolUsuario;
  } catch (error) {
    console.error('❌ Error al verificar rol Usuario:', error);
    throw error;
  }
}

// Función para asignar rol solo a usuarios sin rol
async function assignDefaultRole() {
  try {
    // Asegurar que el rol Usuario existe
    const rolUsuario = await asegurarRolUsuario();
    
    // Actualizar SOLO usuarios sin rol asignado
    const result = await User.updateMany(
      { 
        $or: [
          { roles_id: { $exists: false } }, // Campo no existe
          { roles_id: null } // Campo existe pero es null
        ]
      },
      { $set: { roles_id: rolUsuario._id } }
    );

    console.log(`🔧 Usuarios actualizados: ${result.modifiedCount} recibieron el rol "Usuario"`);
    
    // Solo para información (opcional)
    const totalUsuarios = await User.countDocuments();
    const usuariosConRol = await User.countDocuments({ roles_id: { $exists: true, $ne: null } });
    
    console.log(`📊 Estadísticas roles:`);
    console.log(`- Total usuarios: ${totalUsuarios}`);
    console.log(`- Usuarios con rol asignado: ${usuariosConRol}`);
    console.log(`- Usuarios sin rol: ${totalUsuarios - usuariosConRol}`);
  } catch (error) {
    console.error('❌ Error al asignar roles por defecto:', error);
  }
}

// Función para sincronizar horarios (se mantiene igual)
async function sincronizarHorariosAlInicio() {
  try {
    const ultimoHorario = await Horario.findOne().sort({ fecha: -1 });
    if (!ultimoHorario) {
      console.log('ℹ️ No hay horarios registrados para sincronizar');
      return;
    }

    const usuariosSinHorario = await User.aggregate([
      {
        $lookup: {
          from: "horarios",
          localField: "_id",
          foreignField: "usuario_id",
          as: "horarios"
        }
      },
      {
        $match: {
          horarios: { $size: 0 }
        }
      }
    ]);

    if (usuariosSinHorario.length > 0) {
      const bulkOps = usuariosSinHorario.map(usuario => ({
        insertOne: {
          document: {
            usuario_id: usuario._id,
            fecha: ultimoHorario.fecha,
            entrada: ultimoHorario.entrada,
            salida: ultimoHorario.salida,
            bono_minutos: ultimoHorario.bono_minutos,
            bono_monto: ultimoHorario.bono_monto
          }
        }
      }));

      await Horario.bulkWrite(bulkOps);
      console.log(`⏰ Horarios asignados a ${usuariosSinHorario.length} usuarios`);
    } else {
      console.log('✅ Todos los usuarios ya tienen horarios asignados');
    }
  } catch (error) {
    console.error('❌ Error al sincronizar horarios:', error);
  }
}

// Conexión principal a la base de datos
const connectDB = async () => {
  try {
    const conn = await mongoose.connect('mongodb+srv://irvinmartinealejo:Password@maquiladora.uuwci.mongodb.net/maquila?retryWrites=true&w=majority&appName=maquiladora', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      retryWrites: true,
      w: 'majority'
    });
    
    console.log(`\n📊 MongoDB Connected: ${conn.connection.host}`);
    
    // 1. Asignar rol solo a usuarios sin rol
    await assignDefaultRole();
    
    // 2. Sincronizar horarios
    await sincronizarHorariosAlInicio();
    
    console.log('\n🟢 Inicialización completada exitosamente\n');
  } catch (error) {
    console.error('\n❌ Error de conexión a MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;