const db = require('../config/db');

//GET /clientes/ : listar todos los clientes
exports.getClientes = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM clientes ORDER BY nombre');
        res.json(rows);
    } catch (err) {
        console.error('Error en getClientes:', err);
        res.status(500).json({ error: err.message });
    }
};

//GET /clientes/:id : obtener un cliente por ID
exports.getClienteById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({ error: 'ID inválido' });
        }

        const [rows] = await db.query(
            'SELECT * FROM clientes WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error('Error en getClienteById:', err);
        res.status(500).json({ error: err.message });
    }
};

//POST /clientes/ : crear un nuevo cliente
exports.createCliente = async (req, res) => {
    try {
        const { nombre,apellido, email, telefono, dni } = req.body;

        if (!nombre || nombre.trim().length === 0) {
            return res.status(400).json({ error: 'El nombre es obligatorio' });
        }
        if (!apellido || apellido.trim().length === 0) {
            return res.status(400).json({ error: 'El apellido es obligatorio' });
        }
        if (!dni || dni.trim().length === 0) {  
            return res.status(400).json({ error: 'El DNI es obligatorio' });
        }

        const [result] = await db.query(
            'INSERT INTO clientes (nombre, apellido, email, telefono, dni) VALUES (?, ?, ?, ?, ?)',
            [nombre.trim(), apellido.trim(), email ? email.trim() : null, telefono ? telefono.trim() : null, dni ? dni.trim() : null]
        );
        const nuevoCliente = { id: result.insertId, nombre, apellido, email, telefono, dni };
        res.status(201).json(nuevoCliente);
    } catch (err) {
        console.error('Error en createCliente:', err);
        res.status(500).json({ error: err.message });
    }
};