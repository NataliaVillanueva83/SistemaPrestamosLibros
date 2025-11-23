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
        const { id_cliente, id_libro, fecha_prestamo, fecha_devolucion } = req.body;

        if (!id_cliente || isNaN(parseInt(id_cliente)) || parseInt(id_cliente) <= 0) {
            return res.status(400).json({ error: 'El ID del cliente es obligatorio y debe ser un número válido' });
        }
        if (!id_libro || isNaN(parseInt(id_libro)) || parseInt(id_libro) <= 0) {
            return res.status(400).json({ error: 'El ID del libro es obligatorio y debe ser un número válido' });
        }
        if (!fecha_prestamo || isNaN(Date.parse(fecha_prestamo))) {
            return res.status(400).json({ error: 'La fecha de préstamo es obligatoria y debe ser una fecha válida' });
        }

        const [result] = await db.query(
            'INSERT INTO prestamos (id_cliente, id_libro, fecha_prestamo, fecha_devolucion) VALUES (?, ?, ?, ?)',
            [id_cliente, id_libro, fecha_prestamo, fecha_devolucion ? fecha_devolucion : null]
        );
        const nuevoPrestamo = { id: result.insertId, id_cliente, id_libro, fecha_prestamo, fecha_devolucion };
        res.status(201).json(nuevoPrestamo);
    } catch (err) {
        console.error('Error en createPrestamo:', err);
        res.status(500).json({ error: err.message });
    }
};

//PUT /prestamos/:id : actualizar un préstamo
exports.updatePrestamo = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({ error: 'ID inválido' });
        }

        const { id_cliente, id_libro, fecha_prestamo, fecha_devolucion } = req.body;

        const [result] = await db.query(
            'UPDATE prestamos SET id_cliente = ?, id_libro = ?, fecha_prestamo = ?, fecha_devolucion = ? WHERE id = ?',
            [id_cliente, id_libro, fecha_prestamo, fecha_devolucion ? fecha_devolucion : null, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Préstamo no encontrado' });
        }

        res.json({ id, id_cliente, id_libro, fecha_prestamo, fecha_devolucion });
    } catch (err) {
        console.error('Error en updatePrestamo:', err);
        res.status(500).json({ error: err.message });
    }
};  
};
        console.error('Error en updateCliente:', err);
        res.status(500).json({ error: err.message });
    }
};  
};