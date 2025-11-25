# 📚 Sistema de Gestión de Biblioteca Escolar

Aplicación web Full Stack diseñada para administrar el inventario de libros, el directorio de alumnos y el flujo de préstamos de una biblioteca escolar.

El sistema destaca por su interfaz visual intuitiva (fichas, portadas de libros) y su robustez en la integridad de datos (control de stock automático y validaciones de seguridad).

## 🚀 Características Principales

### 📖 Gestión de Libros (Inventario)
* **Vista en Cuadrícula:** Visualización atractiva con portadas de libros e indicadores de stock (etiquetas verde/roja).
* **CRUD Completo:** Crear, Editar (con pre-llenado de datos) y Eliminar libros.
* **Gestión de Portadas:** Soporte para URLs de imágenes externas.
* **Control de Stock Automático:** El stock disponible disminuye al prestar y aumenta al devolver.

### 👥 Gestión de Alumnos (Clientes)
* **Directorio Visual:** Diseño de tarjetas tipo "Ficha Escolar".
* **Perfil Detallado:** Vista dedicada con información de contacto.
* **Historial Académico:** Registro completo de préstamos (activos y pasados) en la ficha del alumno.
* **Mochila Virtual:** Acceso rápido para ver y devolver los libros que el alumno tiene actualmente en su poder.
* **Eliminación Segura:** El sistema impide borrar alumnos si tienen libros pendientes de devolución.

### 🎒 Gestión de Préstamos
* **Creación Intuitiva:** Selección de libros y alumnos mediante listas desplegables (Selects) dinámicas.
* **Estados Claros:** Visualización de estados: "En Curso", "Devuelto" y "Vencido" (cálculo automático basado en fecha).
* **Devolución Simple:** Botón de devolución rápida que actualiza el estado y repone el stock.
* **Corrección de Errores:** Permite editar fechas o eliminar registros físicos en caso de error administrativo.

---

## 🛠️ Tecnologías Utilizadas

**Backend:**
* **Node.js** (Entorno de ejecución)
* **Express.js** (Framework del servidor)
* **MySQL** (Base de datos relacional)
* **MySQL2/Promise** (Conexión asíncrona para uso de `async/await`)

**Frontend:**
* **HTML5 / CSS3** (Diseño personalizado, Variables CSS, Flexbox y Grid)
* **JavaScript Vanilla** (Lógica del cliente, Fetch API, Manipulación del DOM)
* **Google Material Symbols** (Iconografía)

---

## 📂 Estructura del Proyecto

El proyecto sigue una arquitectura modular separando el Backend (API) del Frontend (Cliente).


/SISTEMA-BIBLIOTECA
├── /backend
│   ├── /config          # Configuración de Base de Datos (db.js)
│   ├── /controllers     # Lógica de negocio (Libros, Clientes, Préstamos)
│   ├── /routes          # Rutas de la API
│   ├── app.js           # Servidor Express
│   └── .env             # Variables de entorno (Credenciales)
│
└── /frontend
    ├── /css             # Estilos globales (style.css)
    ├── /js              # Lógica modular (libros.js, clientes.js, etc.)
    └── /pages           # Vistas HTML (libros.html, clientes.html, etc.)

   
##⚙️ Instalación y Configuración
1. **Requisitos Previos**
Node.js instalado.

MySQL Server corriendo.

2. **Instalación de Dependencias**
Navega a la carpeta del servidor e instala los paquetes necesarios:

Bash
cd backend
npm install

3.**Configuración de la Base de Datos**
Ejecuta el siguiente script SQL en tu gestor de base de datos para crear la estructura y cargar datos iniciales:

SQL

CREATE DATABASE IF NOT EXISTS biblioteca_prestamos;
USE biblioteca_prestamos;

-- Tabla Libros
CREATE TABLE libros (
    id INT PRIMARY KEY AUTO_INCREMENT,
    titulo VARCHAR(255) NOT NULL,
    autor VARCHAR(255) NOT NULL,
    genero VARCHAR(100),
    isbn VARCHAR(20),
    precio DECIMAL(10,2),
    ejemplares_totales INT DEFAULT 1,
    ejemplares_disponibles INT DEFAULT 1,
    imagen_url VARCHAR(500),
    activo BOOLEAN DEFAULT TRUE
);

-- Tabla Clientes
CREATE TABLE clientes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(150),
    telefono VARCHAR(20),
    dni VARCHAR(20) UNIQUE NOT NULL
);

-- Tabla Préstamos
CREATE TABLE prestamos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cliente_id INT NOT NULL,
    libro_id INT NOT NULL,
    fecha_prestamo DATETIME NOT NULL,
    fecha_devolucion_esperada DATE NOT NULL,
    fecha_devolucion_real DATETIME,
    estado ENUM('activo', 'devuelto', 'vencido') DEFAULT 'activo',
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (libro_id) REFERENCES libros(id) ON DELETE CASCADE
);
4. **Variables de Entorno**
Crea un archivo .env dentro de la carpeta /backend con tus credenciales locales:

PORT=3000
DB_HOST=127.0.0.1
DB_USER=tu_usuario (ej: natalia)
DB_PASSWORD=tu_contraseña
DB_NAME=biblioteca_prestamos

5. **Ejecutar el Sistema**
Paso A: Iniciar el Backend

Bash

cd backend
node app.js
La consola mostrará: "Servidor corriendo en el puerto 3000"

Paso B: Iniciar el Frontend Se recomienda usar Live Server (extensión de VS Code) para evitar problemas de CORS.

Abre la carpeta frontend en VS Code.

Haz clic derecho en pages/libros.html.

Selecciona "Open with Live Server".

##🔧API Endpoints
El backend provee una API RESTful completa:

📚 **Libros**
GET /api/libros - Listar todos (opcional ?soloDisponibles=true).

GET /api/libros/:id - Detalle de un libro.

POST /api/libros - Crear libro.

PUT /api/libros/:id - Editar libro (actualiza stock si cambia el total).

DELETE /api/libros/:id - Eliminar libro (Valida si tiene préstamos activos).

👥 **Clientes**
GET /api/clientes - Listar alumnos.

GET /api/clientes/:id - Detalle de alumno.

POST /api/clientes - Registrar alumno.

PUT /api/clientes/:id - Editar datos.

DELETE /api/clientes/:id - Eliminar alumno (Bloquea si tiene deudas).

🎒 **Préstamos**
GET /api/prestamos - Listar todos los préstamos.

GET /api/prestamos/:id - Detalle de un préstamo (con datos de libro y alumno).

GET /api/prestamos/cliente/:id/activos - Mochila virtual (solo activos).

GET /api/prestamos/libro/:id - Historial de préstamos de un libro.

POST /api/prestamos - Crear préstamo (Resta 1 al stock).

PUT /api/prestamos/:id - Corregir datos del préstamo.

PUT /api/prestamos/:id/devolver - Registrar devolución (Suma 1 al stock).

DELETE /api/prestamos/:id - Eliminar registro físico.

##✒️ Autor
Villanueva Natalia
