require ('dotenv').config();
const express = require ('express');
const cors = require ('cors');
const app = express ();
const port = process.env.PORT || 3000;

// Middlewares
app.use (cors ());
app.use (express.json ());

// Routes
app.use ('/api/libros', require ('./routes/libros'));
app.use ('/api/clientes', require ('./routes/clientes'));
app.use ('/api/prestamos', require ('./routes/prestamos'));

app.listen (port, () => {
  console.log (`Server is running on port ${port}`);
});