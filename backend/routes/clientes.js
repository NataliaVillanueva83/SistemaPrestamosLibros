const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientesController');

// Rutas base: /api/clientes

// GET /api/clientes
router.get('/', clientesController.getClientes);

// GET /api/clientes/:id
router.get('/:id', clientesController.getClienteById);

// POST /api/clientes
router.post('/', clientesController.createCliente);

// PUT /api/clientes/:id
router.put('/:id', clientesController.updateCliente);

// DELETE /api/clientes/:id
router.delete('/:id', clientesController.deleteCliente);

module.exports = router;