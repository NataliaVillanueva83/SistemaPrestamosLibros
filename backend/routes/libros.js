const express = require('express');
const router = express.Router();
const librosController = require('../controllers/librosController');

// Rutas base: /api/libros

// GET /api/libros (listar todos los libros)
router.get('/', librosController.getLibros);

// GET /api/libros/:id
router.get('/:id', librosController.getLibroById);

// POST /api/libros
router.post('/', librosController.createLibro);

// PUT /api/libros/:id
router.put('/:id', librosController.updateLibro);

// DELETE /api/libros/:id (Borrado lógico)
router.delete('/:id', librosController.deleteLibro);

module.exports = router;