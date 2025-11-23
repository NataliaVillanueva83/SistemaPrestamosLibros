const express = require('express');
const router = express.Router();
const prestamosController = require('../controllers/prestamosController');

// Rutas base: /api/prestamos

// --- GESTIÓN PRINCIPAL ---

// GET /api/prestamos (Listar todos)
router.get('/', prestamosController.getPrestamos);

// GET /api/prestamos/:id (Obtener un préstamo por ID)
router.get('/:id', prestamosController.getPrestamoById);

// POST /api/prestamos (Crear nuevo préstamo )
router.post('/', prestamosController.createPrestamo);

// PUT /api/prestamos/:id (Editar préstamo por error de carga)
router.put('/:id', prestamosController.updatePrestamo);

// DELETE /api/prestamos/:id (Eliminar físicamente y devolver stock si estaba activo)
router.delete('/:id', prestamosController.deletePrestamo);


// --- ACCIONES ESPECÍFICAS ---

// PUT /api/prestamos/:id/devolver (Registrar devolución )
router.put('/:id/devolver', prestamosController.devolverPrestamo);


// --- CONSULTAS AVANZADAS ---

// GET /api/prestamos/cliente/:clienteId (Historial completo de un cliente)
router.get('/cliente/:clienteId', prestamosController.getPrestamosByClienteId);

// GET /api/prestamos/cliente/:clienteId/activos (Solo lo que tiene en su poder ahora)
router.get('/cliente/:clienteId/activos', prestamosController.getPrestamosActivosPorCliente);

module.exports = router;