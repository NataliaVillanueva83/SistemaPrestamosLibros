// Estado global
let librosGlobal = [];

// Al iniciar, cargamos libros y también los clientes (para poder llenar el select de préstamos)
document.addEventListener('DOMContentLoaded', () => {
    cargarLibros();
    cargarClientesSelect();
});

// --- 1. CARGA DE LIBROS ---
async function cargarLibros() {
    try {
        const res = await fetch(`${API_URL}/libros`);
        librosGlobal = await res.json();
        renderizarLibros(librosGlobal);
    } catch (e) { 
        console.error(e); 
        const cont = document.getElementById('contenedor-libros');
        cont.innerHTML = '<p class="error-msg" style="grid-column:1/-1">Error de conexión al cargar libros.</p>';
    }
}

function renderizarLibros(lista) {
    const contenedor = document.getElementById('contenedor-libros');
    contenedor.innerHTML = '';
    
    if (!Array.isArray(lista) || lista.length === 0) {
        contenedor.innerHTML = '<p class="error-msg" style="grid-column: 1/-1;">No se encontraron libros.</p>';
        return;
    }
    
    lista.forEach(l => {
        const stock = l.ejemplares_disponibles;
        const badgeClass = stock > 0 ? 'available' : 'unavailable';
        // Imagen por defecto si no tiene o falla
        const img = l.imagen_url || 'https://placehold.co/200x300?text=Sin+Portada';
        
        contenedor.innerHTML += `
            <div class="book-card">
                <div style="position:relative">
                    <a href="detalle_libro.html?id=${l.id}">
                        <img src="${img}" class="book-cover" alt="${l.titulo}" onerror="this.src='https://placehold.co/200x300?text=Error'">
                    </a>
                    
                    <button class="btn-edit-icon" onclick="abrirModalLibro(${l.id})" title="Editar Libro">✎</button>
                </div>
                
                <div class="book-info">
                    <div class="book-title">
                        <a href="detalle_libro.html?id=${l.id}" style="text-decoration:none; color:var(--text-color)">
                            ${l.titulo}
                        </a>
                    </div>
                    <div class="book-author">${l.autor}</div>
                    <div style="font-size:0.85em; color:#888; margin-bottom:10px;">${l.genero || 'General'}</div>
                    
                    <div class="book-footer">
                        <span class="badge ${badgeClass}">${stock} Disp.</span>
                        
                        ${stock > 0 ? 
                            `<button class="btn-action" onclick="prepararPrestamo(${l.id}, '${l.titulo}')" title="Realizar Préstamo">
                                <span class="material-symbols-outlined" style="font-size:18px">backpack</span>
                             </button>` 
                            : ''}
                    </div>
                </div>
            </div>
        `;
    });
}

// --- 2. GESTIÓN DE LIBROS (Crear / Editar) ---

function abrirModalLibro(id = null) {
    document.getElementById('modal-libro').style.display = 'block';
    const form = document.getElementById('form-libro');
    
    if (id) {
        // MODO EDICIÓN: Llenar campos
        document.getElementById('titulo-modal-libro').innerText = '✏️ Editar Libro';
        document.getElementById('libro-id').value = id;
        
        const l = librosGlobal.find(x => x.id === id);
        if(l) {
            document.getElementById('lib-titulo').value = l.titulo;
            document.getElementById('lib-autor').value = l.autor;
            document.getElementById('lib-genero').value = l.genero || '';
            document.getElementById('lib-isbn').value = l.isbn || '';     // <--- ISBN
            document.getElementById('lib-precio').value = l.precio || '';
            document.getElementById('lib-total').value = l.ejemplares_totales;
            document.getElementById('lib-img').value = l.imagen_url || '';
        }
    } else {
        // MODO CREACIÓN: Limpiar campos
        document.getElementById('titulo-modal-libro').innerText = '📖 Nuevo Libro';
        document.getElementById('libro-id').value = '';
        form.reset();
    }
}

async function guardarLibro(e) {
    e.preventDefault();
    const id = document.getElementById('libro-id').value;
    
    const datos = {
        titulo: document.getElementById('lib-titulo').value,
        autor: document.getElementById('lib-autor').value,
        genero: document.getElementById('lib-genero').value,
        isbn: document.getElementById('lib-isbn').value,       // <--- ISBN
        precio: document.getElementById('lib-precio').value,
        ejemplares_totales: document.getElementById('lib-total').value,
        imagen_url: document.getElementById('lib-img').value
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_URL}/libros/${id}` : `${API_URL}/libros`;

    try {
        const res = await fetch(url, { 
            method, 
            headers: {'Content-Type':'application/json'}, 
            body: JSON.stringify(datos) 
        });

        if(res.ok) {
            document.getElementById('modal-libro').style.display = 'none';
            mostrarExito(id ? "Libro actualizado correctamente" : "Libro creado exitosamente");
            cargarLibros(); // Recargar la cuadrícula
        } else {
            const err = await res.json();
            alert("Error: " + (err.error || "No se pudo guardar"));
        }
    } catch(err) { console.error(err); alert("Error de conexión"); }
}

// --- 3. GESTIÓN DE PRÉSTAMOS ---

// Cargar lista de alumnos para el select del modal
async function cargarClientesSelect() {
    try {
        const res = await fetch(`${API_URL}/clientes`);
        const clientes = await res.json();
        const select = document.getElementById('prestamo-cliente-id');
        
        select.innerHTML = '<option value="">-- Seleccionar Alumno --</option>';
        if (Array.isArray(clientes)) {
            clientes.forEach(c => {
                const option = document.createElement('option');
                option.value = c.id;
                option.text = `${c.nombre} ${c.apellido} (DNI: ${c.dni})`;
                select.appendChild(option);
            });
        }
    } catch (e) { console.error("Error cargando clientes para select", e); }
}

function prepararPrestamo(id, titulo) {
    document.getElementById('modal-prestamo').style.display = 'block';
    document.getElementById('prestamo-titulo-libro').innerText = titulo;
    document.getElementById('prestamo-libro-id').value = id;
    // Poner fecha de hoy por defecto
    document.getElementById('prestamo-fecha').valueAsDate = new Date();
}

async function guardarPrestamo(e) {
    e.preventDefault();
    
    const datos = {
        id_libro: document.getElementById('prestamo-libro-id').value,
        id_cliente: document.getElementById('prestamo-cliente-id').value,
        fecha_prestamo: document.getElementById('prestamo-fecha').value
    };
    
    try {
        const res = await fetch(`${API_URL}/prestamos`, { 
            method: 'POST', 
            headers: {'Content-Type':'application/json'}, 
            body: JSON.stringify(datos)
        });
        
        if(res.ok) { 
            document.getElementById('modal-prestamo').style.display = 'none';
            mostrarExito("Préstamo registrado exitosamente");
            cargarLibros(); // Recargar para actualizar el stock visible
        } else { 
            const err = await res.json(); 
            alert("Error: " + (err.error || "No se pudo prestar")); 
        }
    } catch(err) { console.error(err); alert("Error de conexión"); }
}

// --- 4. UTILIDADES ---

function mostrarExito(mensaje) {
    const modal = document.getElementById('modal-exito');
    if (modal) {
        document.getElementById('mensaje-exito').innerText = mensaje;
        modal.style.display = 'block';
    } else {
        alert("✅ " + mensaje);
    }
}

function filtrarLibros() {
    const texto = document.getElementById('buscador').value.toLowerCase();
    const filtrados = librosGlobal.filter(l => 
        l.titulo.toLowerCase().includes(texto) || 
        l.autor.toLowerCase().includes(texto)
    );
    renderizarLibros(filtrados);
}