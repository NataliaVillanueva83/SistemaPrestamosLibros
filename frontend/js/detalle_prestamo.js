document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if(!id) window.location.href = 'prestamos.html';
    
    // Guardamos el ID globalmente para usarlo al devolver
    window.prestamoIdActual = id; 
    
    cargarPrestamo(id);
});

async function cargarPrestamo(id) {
    try {
        const res = await fetch(`${API_URL}/prestamos/${id}`);
        if(!res.ok) throw new Error("No encontrado");
        const p = await res.json();

        document.getElementById('p-id').innerText = p.id;
        
        // Estado y Botón
        const badge = document.getElementById('p-estado');
        if(p.estado === 'activo') {
            badge.className = 'badge available';
            badge.innerText = 'EN CURSO';
            badge.style.backgroundColor = '#f1c40f'; badge.style.color = '#000';
            // Mostrar botón de devolver
            document.getElementById('btn-devolver').style.display = 'inline-block';
        } else {
            badge.className = 'badge available';
            badge.innerText = 'DEVUELTO';
            badge.style.backgroundColor = 'var(--success-color)'; // Verde si ya se devolvió
            document.getElementById('fecha-real').innerText = new Date(p.fecha_devolucion_real).toLocaleDateString();
        }

        // Datos Libro
        document.getElementById('p-libro-titulo').innerText = p.titulo;
        document.getElementById('p-libro-autor').innerText = p.autor;
        document.getElementById('p-img').src = p.imagen_url || 'https://placehold.co/100x150';
        document.getElementById('link-libro').href = `detalle_libro.html?id=${p.libro_id}`;

        // Datos Alumno
        document.getElementById('p-alumno-nombre').innerText = `${p.nombre} ${p.apellido}`;
        document.getElementById('p-alumno-dni').innerText = p.dni;
        document.getElementById('p-alumno-email').innerText = p.email || '-';
        document.getElementById('link-alumno').href = `detalle_cliente.html?id=${p.cliente_id}`;

        // Fechas
        document.getElementById('fecha-salida').innerText = new Date(p.fecha_prestamo).toLocaleDateString();
        document.getElementById('fecha-esperada').innerText = new Date(p.fecha_devolucion_esperada).toLocaleDateString();

    } catch(e) { console.error(e); alert("Error al cargar el préstamo"); }
}

// --- LÓGICA DE DEVOLUCIÓN ---

// 1. Se llama al hacer clic en el botón rojo (abre la pregunta)
function devolverEstePrestamo() {
    document.getElementById('modal-confirmacion').style.display = 'block';
}

// 2. Se llama al hacer clic en "Sí, Confirmar"
async function ejecutarDevolucion() {
    const id = window.prestamoIdActual;
    
    // Ocultamos la pregunta
    document.getElementById('modal-confirmacion').style.display = 'none';

    try {
        const res = await fetch(`${API_URL}/prestamos/${id}/devolver`, { method: 'PUT' });
        
        if (res.ok) {
            // Mostramos el éxito (Verde)
            document.getElementById('modal-exito').style.display = 'block';
        } else {
            alert("Hubo un error al intentar devolver el libro.");
        }
    } catch (e) { 
        console.error(e); 
        alert("Error de conexión.");
    }
}

// 3. Se llama al hacer clic en "Aceptar" en el modal verde
function cerrarExitoYRecargar() {
    document.getElementById('modal-exito').style.display = 'none';
    location.reload(); // Recargamos para ver el estado actualizado
}