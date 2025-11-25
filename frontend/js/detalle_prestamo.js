document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    
    if(!id) { 
        console.error("No hay ID en la URL");
        window.location.href = 'prestamos.html'; 
        return; 
    }
    
    window.prestamoIdActual = id;
    cargarPrestamo(id);
});

// --- CARGAR DATOS ---
async function cargarPrestamo(id) {
    try {
        const res = await fetch(`${API_URL}/prestamos/${id}`);
        if(!res.ok) throw new Error(`Error ${res.status}`);
        
        const p = await res.json();
        window.datosPrestamo = p; 

        document.getElementById('p-id').innerText = p.id;
        
        const badge = document.getElementById('p-estado');
        const btnDevolver = document.getElementById('btn-devolver');
        
        if(p.estado === 'activo') {
            badge.className = 'badge available';
            badge.innerText = 'EN CURSO';
            badge.style.backgroundColor = '#f1c40f'; badge.style.color = '#000';
            if(btnDevolver) btnDevolver.style.display = 'inline-flex';
        } else {
            badge.className = 'badge available';
            badge.innerText = 'DEVUELTO';
            badge.style.backgroundColor = 'var(--success-color)'; 
            if(btnDevolver) btnDevolver.style.display = 'none';
            document.getElementById('fecha-real').innerText = p.fecha_devolucion_real ? new Date(p.fecha_devolucion_real).toLocaleDateString() : '-';
        }

        document.getElementById('p-libro-titulo').innerText = p.titulo || 'Sin Título';
        document.getElementById('p-libro-autor').innerText = p.autor || 'Sin Autor';
        document.getElementById('p-img').src = p.imagen_url || 'https://placehold.co/100x150?text=Sin+Img';
        document.getElementById('link-libro').href = `detalle_libro.html?id=${p.libro_id}`;

        document.getElementById('p-alumno-nombre').innerText = `${p.nombre} ${p.apellido}`;
        document.getElementById('p-alumno-dni').innerText = p.dni || '-';
        document.getElementById('p-alumno-email').innerText = p.email || '-';
        document.getElementById('link-alumno').href = `detalle_cliente.html?id=${p.cliente_id}`;

        document.getElementById('fecha-salida').innerText = p.fecha_prestamo ? new Date(p.fecha_prestamo).toLocaleDateString() : '-';
        document.getElementById('fecha-esperada').innerText = p.fecha_devolucion_esperada ? new Date(p.fecha_devolucion_esperada).toLocaleDateString() : '-';

    } catch(e) { console.error(e); mostrarAlerta("Error al cargar datos."); }
}

// --- DEVOLUCIÓN ---
function devolverEstePrestamo() {
    document.getElementById('modal-confirmacion').style.display = 'block';
}

async function ejecutarDevolucion() {
    const id = window.prestamoIdActual;
    document.getElementById('modal-confirmacion').style.display = 'none';

    try {
        const res = await fetch(`${API_URL}/prestamos/${id}/devolver`, { method: 'PUT' });
        const data = await res.json(); // Usamos json directo

        if (res.ok) {
            mostrarExito("Libro devuelto correctamente.", () => location.reload());
        } else {
            mostrarAlerta("Error: " + (data.error || "No se pudo devolver"));
        }
    } catch (e) { mostrarAlerta("Error de conexión."); }
}

// --- ELIMINAR (BORRADO FÍSICO) ---
function eliminarPrestamoFisico() {
    document.getElementById('modal-borrar').style.display = 'block';
}

async function confirmarEliminacionFisica() {
    const id = window.prestamoIdActual;
    document.getElementById('modal-borrar').style.display = 'none';

    try {
        const res = await fetch(`${API_URL}/prestamos/${id}`, { method: 'DELETE' });
        const data = await res.json();

        if (res.ok) {
            // ÉXITO: REDIRIGIR A LISTA
            mostrarExito("Registro eliminado permanentemente.", () => {
                window.location.href = 'prestamos.html';
            });
        } else {
            mostrarAlerta(data.error || "No se pudo eliminar.");
        }
    } catch (e) { console.error(e); mostrarAlerta("Error de conexión."); }
}

// --- EDITAR (CORREGIR DATOS) ---
async function abrirModalEditar() {
    const p = window.datosPrestamo;
    if(!p) return;

    await cargarSelectoresEdicion();

    const modal = document.getElementById('modal-editar');
    document.getElementById('edit-id').value = p.id;
    document.getElementById('edit-libro-id').value = p.libro_id;
    document.getElementById('edit-cliente-id').value = p.cliente_id;
    
    if(p.fecha_prestamo) {
        document.getElementById('edit-fecha').value = new Date(p.fecha_prestamo).toISOString().split('T')[0];
    }
    modal.style.display = 'block';
}

async function cargarSelectoresEdicion() {
    const selLibro = document.getElementById('edit-libro-id');
    const selCliente = document.getElementById('edit-cliente-id');
    if (selCliente.options.length > 1) return; 

    try {
        const [resCli, resLib] = await Promise.all([fetch(`${API_URL}/clientes`), fetch(`${API_URL}/libros`)]);
        const clientes = await resCli.json();
        const libros = await resLib.json();

        selCliente.innerHTML = '<option value="">-- Seleccionar Alumno --</option>';
        clientes.forEach(c => {
            const op = document.createElement('option'); op.value = c.id; op.text = `${c.nombre} ${c.apellido} (${c.dni})`;
            selCliente.appendChild(op);
        });

        selLibro.innerHTML = '<option value="">-- Seleccionar Libro --</option>';
        libros.forEach(l => {
            const op = document.createElement('option'); op.value = l.id; op.text = l.titulo;
            selLibro.appendChild(op);
        });
    } catch (e) { console.error("Error listas", e); }
}

async function guardarEdicion(e) {
    e.preventDefault();
    const id = document.getElementById('edit-id').value;
    
    // Convertir a número y validar
    const libroId = parseInt(document.getElementById('edit-libro-id').value);
    const clienteId = parseInt(document.getElementById('edit-cliente-id').value);
    const fecha = document.getElementById('edit-fecha').value;

    // VALIDACIÓN: Si alguno es NaN (inválido), detenemos y mostramos alerta
    if (!id || isNaN(libroId) || isNaN(clienteId) || !fecha) {
        mostrarAlerta("Por favor, selecciona un libro y un alumno válidos de la lista.");
        return;
    }

    const datos = {
        libro_id: libroId,
        cliente_id: clienteId,
        fecha_prestamo: fecha
    };

    try {
        const res = await fetch(`${API_URL}/prestamos/${id}`, { 
            method: 'PUT', 
            headers: {'Content-Type':'application/json'}, 
            body: JSON.stringify(datos) 
        });
        
        // Parseamos la respuesta
        const data = await res.json();

        if (res.ok) {
            document.getElementById('modal-editar').style.display = 'none';
            mostrarExito("Préstamo corregido correctamente.");
            location.reload();
        } else {
            // Mostramos el error que viene del backend
            mostrarAlerta(data.error || "No se pudo editar.");
        }
    } catch(err) { 
        console.error(err); 
        mostrarAlerta("Error de conexión."); 
    }
}

// --- UTILIDADES ---
function mostrarExito(msg, callback) {
    const m = document.getElementById('modal-exito');
    if(m) {
        document.getElementById('mensaje-exito').innerText = msg;
        m.style.display = 'block';
        
        const btn = m.querySelector('button');
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.onclick = () => { 
            m.style.display = 'none'; 
            // Si hay una función callback (como el location.reload), la ejecutamos
            if(callback) callback(); 
        };
    } else {
        alert("✅ " + msg);
        if(callback) callback();
    }
}

function mostrarAlerta(msg) {
    const m = document.getElementById('modal-alerta');
    if(m) {
        document.getElementById('mensaje-alerta').innerText = msg;
        m.style.display = 'block';
    } else { alert("⚠️ " + msg); }
}

function cerrarExitoYRecargar() {
    document.getElementById('modal-exito').style.display = 'none';
    location.reload();
}