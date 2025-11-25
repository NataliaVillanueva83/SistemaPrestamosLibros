const db = require('../config/db');

// Get /libros/ : listar todos los libros
exports.getLibros = async (req, res) => {
    try {
        const { soloDisponibles } = req.query;
        let query = 'SELECT * FROM libros WHERE activo = TRUE'; 
        
        if (soloDisponibles === 'true') {
            query += ' AND ejemplares_disponibles > 0';
        }
        
        query += ' ORDER BY titulo'; 
        
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (err) {
        console.error('Error en getLibros:', err); 
        res.status(500).json({ error: err.message });
    }
};

// Get /libros/:id : obtener un libro por ID
exports.getLibroById = async (req, res) => {
    try {
        // Validar que el ID sea un número válido
        const id = parseInt(req.params.id);
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({ error: 'ID inválido' });
        }
        
        // Filtrar por activo
        const [rows] = await db.query(
            'SELECT * FROM libros WHERE id = ? AND activo = TRUE', 
            [id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Libro no encontrado' });
        }
        
        res.json(rows[0]);
    } catch (err) {
        console.error('Error en getLibroById:', err);
        res.status(500).json({ error: err.message });
    }
};

// Post /libros/ : crear un nuevo libro
exports.createLibro = async (req, res) => {
    try {
        const { titulo, autor, genero, isbn, precio, ejemplares_totales, imagen_url } = req.body;
        
        //  Validar campos obligatorios
        if (!titulo || titulo.trim().length === 0) {
            return res.status(400).json({ error: 'El título es obligatorio' });
        }
        
        if (!autor || autor.trim().length === 0) {
            return res.status(400).json({ error: 'El autor es obligatorio' });
        }
        
       
        
        //  Sanitizar datos (eliminar espacios en blanco)
        const tituloLimpio = titulo.trim();
        const autorLimpio = autor.trim();
        const generoLimpio = genero ? genero.trim() : null;
        const isbnLimpio = isbn ? isbn.trim() : null;
        const precioNumerico = precio ? parseFloat(precio) : null;
        const imagenUrlLimpia = imagen_url ? imagen_url.trim() : null;
        
        const ejemplaresNum = ejemplares_totales ? parseInt(ejemplares_totales) : 1;

        
        //  Verificar si el ISBN ya existe
        if (isbnLimpio) {
            const [existente] = await db.query(
                'SELECT id FROM libros WHERE isbn = ? AND activo = TRUE',
                [isbnLimpio]
            );
            
            if (existente.length > 0) {
                return res.status(409).json({ 
                    error: 'Ya existe un libro con ese ISBN' 
                });
            }
        }
        
        const sql = `
            INSERT INTO libros 
            (titulo, autor, genero, isbn, precio, ejemplares_totales, ejemplares_disponibles, imagen_url) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const [result] = await db.query(sql, [
            tituloLimpio,
            autorLimpio,
            generoLimpio,
            isbnLimpio,
            precioNumerico,
            ejemplaresNum,
            ejemplaresNum ,
            imagenUrlLimpia
        ]);
        
        //  Devolver el objeto creado completo
        const [nuevoLibro] = await db.query(
            'SELECT * FROM libros WHERE id = ?',
            [result.insertId]
        );
        
        res.status(201).json({ 
            message: 'Libro creado exitosamente',
            data: nuevoLibro[0]
        });
    } catch (err) {
        console.error('Error en createLibro:', err);
        
        //  Manejo específico de ISBN duplicado
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'El ISBN ya existe' });
        }
        
        res.status(500).json({ error: err.message });
    }
};

// Update /libros/:id : actualizar un libro existente

exports.updateLibro = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { titulo, autor, genero, isbn, precio, ejemplares_totales, imagen_url } = req.body;
        
        if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
        
        // 1. Obtener datos actuales
        const [libroActual] = await db.query('SELECT * FROM libros WHERE id = ? AND activo = TRUE', [id]);
        if (libroActual.length === 0) return res.status(404).json({ error: 'Libro no encontrado' });
        
        const libro = libroActual[0];

        // 2. Preparar valores (usando los nuevos o manteniendo los viejos)
        const nuevoTitulo = titulo ? titulo.trim() : libro.titulo;
        const nuevoAutor = autor ? autor.trim() : libro.autor;
        const nuevoGenero = genero !== undefined ? genero : libro.genero;
        const nuevoIsbn = isbn !== undefined ? isbn : libro.isbn;
        const nuevoPrecio = precio !== undefined ? parseFloat(precio) : libro.precio;
        const nuevaImagen = imagen_url !== undefined ? imagen_url : libro.imagen_url;
        
        let nuevosTotales = libro.ejemplares_totales;
        let nuevosDisponibles = libro.ejemplares_disponibles;

        // 3. Calcular stock si cambia
        if (ejemplares_totales !== undefined && ejemplares_totales != libro.ejemplares_totales) {
            const cant = parseInt(ejemplares_totales);
            const diferencia = cant - libro.ejemplares_totales;
            nuevosTotales = cant;
            nuevosDisponibles = Math.max(0, libro.ejemplares_disponibles + diferencia);
        }

        // 4. CONSULTA SQL CORREGIDA (Todo con ?)
        const sql = `
            UPDATE libros 
            SET titulo=?, autor=?, genero=?, isbn=?, precio=?, 
                ejemplares_totales=?, ejemplares_disponibles=?, imagen_url=?
            WHERE id=? AND activo=TRUE
        `;

        const params = [
            nuevoTitulo, 
            nuevoAutor, 
            nuevoGenero, 
            nuevoIsbn, 
            nuevoPrecio, 
            nuevosTotales, 
            nuevosDisponibles, 
            nuevaImagen, 
            id
        ];
        
        await db.query(sql, params);
        
        res.json({ message: 'Libro actualizado exitosamente' });

    } catch (err) {
        console.error('Error en updateLibro:', err);
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ese ISBN ya existe' });
        res.status(500).json({ error: err.message });
    }
};

// Delete /libros/:id : eliminar un libro
exports.deleteLibro = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        
        //  Validar ID
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({ error: 'ID inválido' });
        }
        
        //  Verificar préstamos activos ANTES de eliminar
        const [prestamos] = await db.query(
            'SELECT COUNT(*) as count FROM prestamos WHERE libro_id = ? AND estado = "activo"',
            [id]
        );
        
        if (prestamos[0].count > 0) {
            return res.status(400).json({ 
                error: 'No se puede eliminar el libro porque tiene préstamos activos',
                prestamosActivos: prestamos[0].count
            });
        }
        
        //  Usar BORRADO LOGICO en lugar de DELETE físico
        const [result] = await db.query(
            'UPDATE libros SET activo = FALSE WHERE id = ?',
            [id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Libro no encontrado' });
        }
        
        res.json({ 
            message: 'Libro eliminado exitosamente',
            id: id
        });
    } catch (err) {
        console.error('Error en deleteLibro:', err);
        
        //  usar DELETE físico y hay restricciones FK
        if (err.errno === 1451) {
            return res.status(400).json({ 
                error: 'No se puede eliminar el libro porque tiene préstamos asociados' 
            });
        }
        
        res.status(500).json({ error: err.message });
    }

};