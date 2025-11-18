CREATE DATABASE IF NOT EXISTS biblioteca_prestamos;
USE biblioteca_prestamos;

-- Tabla de libros
CREATE TABLE libros (
    id INT PRIMARY KEY AUTO_INCREMENT,
    titulo VARCHAR(255) NOT NULL,
    autor VARCHAR(255) NOT NULL,
    genero VARCHAR(100),
    isbn VARCHAR(20) UNIQUE,
    precio DECIMAL(10,2),
    ejemplares_totales INT DEFAULT 1,
    ejemplares_disponibles INT DEFAULT 1
);

-- Tabla de clientes
CREATE TABLE clientes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    dni VARCHAR(20) UNIQUE NOT NULL
);

-- Tabla de préstamos
CREATE TABLE prestamos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cliente_id INT NOT NULL,
    libro_id INT NOT NULL,
    fecha_prestamo DATETIME NOT NULL,
    fecha_devolucion_esperada DATE NOT NULL,
    fecha_devolucion_real DATETIME,
    estado ENUM('activo', 'devuelto', 'vencido') DEFAULT 'activo',
    observaciones TEXT,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (libro_id) REFERENCES libros(id) ON DELETE CASCADE,
    INDEX idx_libro_cliente (libro_id, cliente_id)
);
