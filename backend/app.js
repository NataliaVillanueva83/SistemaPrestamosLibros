const express = require ('express');
const cors = require ('cors');
require ('dotenv').config();

const app = express ();

// Middlewares
app.use (cors ());
app.use (express.json ());

// Routes
app.use ('/api/libros', require ('./routes/libros'));
app.use ('/api/clientes', require ('./routes/clientes'));
app.use ('/api/prestamos', require ('./routes/prestamos'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});