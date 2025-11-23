const db = require('../config/db');
//GET /prestamos/ : listar todos los préstamos
exports.getPrestamos = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM prestamos ORDER BY fecha_prestamo DESC');
        res.json(rows);
    } catch (err) {
        console.error('Error en getPrestamos:', err);
        res.status(500).json({ error: err.message });
    }
};

//GET /prestamos/:id : obtener un préstamo por ID
exports.getPrestamoById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({ error: 'ID inválido' });
        }

        const [rows] = await db.query(
            'SELECT * FROM prestamos WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Préstamo no encontrado' });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error('Error en getPrestamoById:', err);
        res.status(500).json({ error: err.message });
    }
};

//POST /prestamos/ : crear un nuevo préstamo
exports.createPrestamo = async (req, res) => {

    try {
 
    const { id_cliente, id_libro, fecha_prestamo, fecha_devolucion_esperada: fecha_esperada_input } = req.body;
       
     if (!id_cliente || isNaN(parseInt(id_cliente)) || parseInt(id_cliente) <= 0) {
            return res.status(400).json({ error: 'El ID del cliente es obligatorio y debe ser un número válido' });
        }
        if (!id_libro || isNaN(parseInt(id_libro)) || parseInt(id_libro) <= 0) {
            return res.status(400).json({ error: 'El ID del libro es obligatorio y debe ser un número válido' });
        }
        if (!fecha_prestamo || isNaN(Date.parse(fecha_prestamo))) {
            return res.status(400).json({ error: 'La fecha de préstamo es obligatoria y debe ser una fecha válida' });
        }
    
    //validar si hay ejemplares disponibles del libro
        const [libroRows] = await db.query(
            'SELECT ejemplares_disponibles FROM libros WHERE id = ?',
            [id_libro]
        );

        if (libroRows.length === 0 || libroRows[0].activo === 0) {
            return res.status(404).json({ error: 'Libro no encontrado o inactivo' });
        }

        if (libroRows[0].ejemplares_disponibles <= 0) {
            return res.status(400).json({ error: 'No hay ejemplares disponibles para este libro' });
        }
        //Establecer fecha_devolucion_esperada si no se proporciona
        let fecha_devolucion_esperada = fecha_esperada_input;
        if (!fecha_esperada_input) {
            const prestamoDate = new Date(fecha_prestamo);
            prestamoDate.setDate(prestamoDate.getDate() + 14); 
           fecha_devolucion_esperada = prestamoDate.toISOString().split('T')[0];
        }

 
     //realizar el prestamo y actualizar la cantidad de ejemplares disponibles
       

        const [result] = await db.query(
            'INSERT INTO prestamos (cliente_id, libro_id, fecha_prestamo, fecha_devolucion_esperada, estado) VALUES (?, ?, ?, ?, ?)',
            [id_cliente, id_libro, fecha_prestamo, fecha_devolucion_esperada , 'activo']
        );
        
        await db.query(
            'UPDATE libros SET ejemplares_disponibles = ejemplares_disponibles - 1 WHERE id = ?',
            [id_libro]
        );

        
        const nuevoPrestamo = { 
            id: result.insertId, 
            cliente_id: id_cliente, 
            libro_id: id_libro, 
            fecha_prestamo, 
            fecha_devolucion_esperada: fecha_devolucion_esperada, 
            estado: 'activo'
        };
        
        res.status(201).json(nuevoPrestamo);

    } catch (err) {
        console.error('Error en createPrestamo:', err);
        // Manejar error de validación de FK (cliente o libro no existen)
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
             return res.status(400).json({ error: 'El cliente o el libro proporcionado no existe.' });
        }
        res.status(500).json({ error: err.message });
    }
};
//PUT /prestamos/:id/devolver : marcar un préstamo como devuelto
exports.devolverPrestamo = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const fecha_devolucion_real = new Date().toISOString().slice(0, 19).replace('T', ' '); 

        if (isNaN(id) || id <= 0) {
            return res.status(400).json({ error: 'ID inválido' });
        }

        const [prestamoRows] = await db.query(
            'SELECT libro_id, estado FROM prestamos WHERE id = ?',
            [id]
        );
        if (prestamoRows.length === 0) {
            return res.status(404).json({ error: 'Préstamo no encontrado' });
        }
       const prestamo = prestamoRows[0];
        if (prestamo.estado === 'devuelto') {
            return res.status(400).json({ error: 'El préstamo ya ha sido devuelto' });
        }

      const [resultPrestamo] = await db.query(
            'UPDATE prestamos SET estado = ?, fecha_devolucion_real = ? WHERE id = ?',
            ['devuelto', fecha_devolucion_real, id]
        );
        await db.query(
             'UPDATE libros SET ejemplares_disponibles = ejemplares_disponibles + 1 WHERE id = ?',
            [prestamo.libro_id]
        );
        res.json({ 
            message: 'Devolución registrada exitosamente', 
            id_prestamo: id,
            libro_id: prestamo.libro_id,
            fecha_devolucion_real: fecha_devolucion_real 
        });

    } catch (err) {
        console.error('Error en registrarDevolucion:', err);
        res.status(500).json({ error: err.message });
    }
};

// PUT /prestamos/:id : Editar un préstamo existente (corregir errores)
exports.updatePrestamo = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { cliente_id, libro_id, fecha_prestamo, fecha_devolucion_esperada } = req.body;

        if (isNaN(id) || id <= 0) {
            return res.status(400).json({ error: 'ID de préstamo inválido' });
        }

        
        const [rows] = await db.query('SELECT * FROM prestamos WHERE id = ?', [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Préstamo no encontrado' });
        }

        const prestamoActual = rows[0];

        // si la modficacion es por el libro_id
        if (libro_id && libro_id !== prestamoActual.libro_id) {
            // A. Verificar que el NUEVO libro tenga stock
            const [nuevoLibro] = await db.query('SELECT ejemplares_disponibles FROM libros WHERE id = ?', [libro_id]);
            if (nuevoLibro.length === 0 || nuevoLibro[0].ejemplares_disponibles <= 0) {
                return res.status(400).json({ error: 'El nuevo libro seleccionado no tiene ejemplares disponibles' });
            }

            //  Devolver stock al libro ANTERIOR (si el préstamo estaba activo)
            if (prestamoActual.estado === 'activo') {
                await db.query('UPDATE libros SET ejemplares_disponibles = ejemplares_disponibles + 1 WHERE id = ?', [prestamoActual.libro_id]);
                
                await db.query('UPDATE libros SET ejemplares_disponibles = ejemplares_disponibles - 1 WHERE id = ?', [libro_id]);
            }
        }

        //  Preparar datos para actualizar (usar los nuevos o mantener los viejos)
        const nuevoClienteId = cliente_id || prestamoActual.cliente_id;
        const nuevoLibroId = libro_id || prestamoActual.libro_id;
        const nuevaFechaPrestamo = fecha_prestamo || prestamoActual.fecha_prestamo;
        const nuevaFechaDevolucion = fecha_devolucion_esperada || prestamoActual.fecha_devolucion_esperada;
o
        await db.query(
            'UPDATE prestamos SET cliente_id = ?, libro_id = ?, fecha_prestamo = ?, fecha_devolucion_esperada = ? WHERE id = ?',
            [nuevoClienteId, nuevoLibroId, nuevaFechaPrestamo, nuevaFechaDevolucion, id]
        );

        res.json({
            message: 'Préstamo actualizado exitosamente',
            id,
            cliente_id: nuevoClienteId,
            libro_id: nuevoLibroId
        });

    } catch (err) {
        console.error('Error en updatePrestamo:', err);
        res.status(500).json({ error: err.message });
    }
};

//get consultas de prestamos por cliente
exports.getPrestamosByClienteId = async (req, res) => {
    try {
        const clienteId = parseInt(req.params.clienteId);
        if (isNaN(clienteId) || clienteId <= 0) {
            return res.status(400).json({ error: 'ID de cliente inválido' });
        }

         const query = `
            SELECT 
                p.id, p.fecha_prestamo, p.fecha_devolucion_esperada, p.fecha_devolucion_real, p.estado,
                l.titulo, l.autor, l.genero
            FROM prestamos p
            JOIN libros l ON p.libro_id = l.id
            WHERE p.cliente_id = ? 
            ORDER BY p.fecha_prestamo DESC
        `;

         const [rows] = await db.query(query, [clienteId]);

        res.json(rows);
    } catch (err) {
        console.error('Error en getPrestamosByClienteId:', err);
        res.status(500).json({ error: err.message });
    }
};

// DELETE /prestamos/:id : Eliminar un préstamo por error o cancelación
exports.deletePrestamo = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({ error: 'ID inválido' });
        }

       
        const [prestamoRows] = await db.query(
            'SELECT libro_id, estado FROM prestamos WHERE id = ?',
            [id]
        );

        if (prestamoRows.length === 0) {
            return res.status(404).json({ error: 'Préstamo no encontrado' });
        }

        const prestamo = prestamoRows[0];

        // Si el préstamo estaba ACTIVO, debemos restaurar el inventario del libro
      
        if (prestamo.estado === 'activo') {
            await db.query(
                'UPDATE libros SET ejemplares_disponibles = ejemplares_disponibles + 1 WHERE id = ?',
                [prestamo.libro_id]
            );
        }

        //  Eliminar  el registro
        await db.query('DELETE FROM prestamos WHERE id = ?', [id]);

        res.json({ 
            message: 'Préstamo eliminado y stock ajustado correctamente',
            id_eliminado: id 
        });

    } catch (err) {
        console.error('Error en deletePrestamo:', err);
        res.status(500).json({ error: err.message });
    }
};