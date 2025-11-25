document.addEventListener('DOMContentLoaded', async () => {
    // 1. Obtener el ID de la URL (ej: detalle_libro.html?id=5)
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    
    if(!id) {
        alert("No se especificó un libro.");
        window.location.href = 'libros.html';
        return;
    }
    
    // Guardamos el ID en el input oculto del formulario por si editamos
    const inputId = document.getElementById('libro-id');
    if(inputId) inputId.value = id;
    
    cargarDetalle(id);
});

// --- CARGAR DATOS (GET) ---
async function cargarDetalle(id) {
    try {
        const res = await fetch(`${API_URL}/libros/${id}`);
        if(!res.ok) throw new Error("Libro no encontrado");
        
        const l = await res.json();
        
        // Llenar la vista con los datos del libro
        setText('det-titulo', l.titulo);
        setText('det-autor', l.autor);
        setText('det-genero', l.genero || 'No especificado');
        setText('det-isbn', l.isbn || 'Sin ISBN');
        setText('det-precio', l.precio ? l.precio : '0.00');
        setText('det-total', l.ejemplares_totales);
        
        // Imagen de portada (con fallback si falla)
        const img = l.imagen_url || 'https://placehold.co/300x450?text=Sin+Portada';
        const imgElement = document.getElementById('det-img');
        if(imgElement) {
            imgElement.src = img;
            imgElement.onerror = function() { this.src = 'https://placehold.co/300x450?text=Error+Imagen'; };
        }

        // Badge de disponibilidad (Verde/Rojo)
        const badge = document.getElementById('det-badge');
        if(badge) {
            if(l.ejemplares_disponibles > 0) {
                badge.className = 'badge available';
                badge.innerText = `${l.ejemplares_disponibles} Disponibles`;
                badge.style.backgroundColor = 'var(--success-color)';
            } else {
                badge.className = 'badge unavailable';
                badge.innerText = 'Agotado';
                badge.style.backgroundColor = 'var(--danger-color)';
            }
        }
        
        // Actualizar título de la pestaña del navegador
        document.title = `Libro: ${l.titulo}`;

    } catch(e) { 
        console.error(e); 
        alert("Error al cargar el libro.");
        window.location.href = 'libros.html';
    }
}

// --- ABRIR MODAL DE EDICIÓN ---
function editarLibroActual() {
    const modal = document.getElementById('modal-libro');
    if(!modal) return; // Seguridad por si no existe el modal en el HTML
    
    modal.style.display = 'block';
    
    // Pre-llenar el formulario con los datos que ya vemos en pantalla
    setValue('lib-titulo', document.getElementById('det-titulo').innerText);
    setValue('lib-autor', document.getElementById('det-autor').innerText);
    
    // Limpiar textos por defecto ("No especificado") al editar
    const genero = document.getElementById('det-genero').innerText;
    setValue('lib-genero', genero === 'No especificado' ? '' : genero);
    
    const isbn = document.getElementById('det-isbn').innerText;
    setValue('lib-isbn', isbn === 'Sin ISBN' ? '' : isbn);
    
    setValue('lib-precio', document.getElementById('det-precio').innerText);
    setValue('lib-total', document.getElementById('det-total').innerText);
    
    // La imagen la tomamos del src actual
    const imgSrc = document.getElementById('det-img').src;
    // Si es la imagen de error o placeholder, dejamos el campo vacío
    setValue('lib-img', imgSrc.includes('placehold.co') ? '' : imgSrc);
}

// --- GUARDAR CAMBIOS (PUT) ---
async function guardarEdicionLibro(e) {
    e.preventDefault();
    
    // Obtenemos el ID del input oculto o de la URL
    const params = new URLSearchParams(window.location.search);
    const id = document.getElementById('libro-id').value || params.get('id');
    
    const datos = {
        titulo: document.getElementById('lib-titulo').value,
        autor: document.getElementById('lib-autor').value,
        genero: document.getElementById('lib-genero').value,
        isbn: document.getElementById('lib-isbn').value,
        precio: document.getElementById('lib-precio').value,
        ejemplares_totales: document.getElementById('lib-total').value,
        imagen_url: document.getElementById('lib-img').value
    };

    try {
        const res = await fetch(`${API_URL}/libros/${id}`, {
            method: 'PUT',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify(datos)
        });

        if (res.ok) {
            document.getElementById('modal-libro').style.display = 'none';
            mostrarExito("Libro actualizado correctamente", () => {
                cargarDetalle(id); // Recargar datos para ver los cambios
            });
        } else {
            const err = await res.json();
            alert("Error: " + (err.error || "No se pudo actualizar"));
        }
    } catch(err) { 
        console.error(err); 
        alert("Error de conexión"); 
    }
}

// --- UTILIDADES ---

// Función corta para asignar valor a un input 
function setValue(id, valor) {
    const el = document.getElementById(id);
    if(el) el.value = valor;
}

// Función corta para poner texto 
function setText(id, texto) {
    const el = document.getElementById(id);
    if(el) el.innerText = texto;
}

// Modal de Éxito (
function mostrarExito(mensaje, callback) {
    const modal = document.getElementById('modal-exito');
    if (modal) {
        const msgEl = document.getElementById('mensaje-exito');
        if(msgEl) msgEl.innerText = mensaje;
        
        modal.style.display = 'block';
        
        // Configurar botón aceptar
        const btn = modal.querySelector('button');
        if(btn) {
            btn.onclick = function() {
                modal.style.display = 'none';
                if (callback) callback();
            };
        }
    } else {
        
        alert("✅ " + mensaje);
        if (callback) callback();
    }
}