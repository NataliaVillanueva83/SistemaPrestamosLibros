document.addEventListener('DOMContentLoaded', iniciarDetalle);

// --- INICIO ---
async function iniciarDetalle() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
        mostrarAlerta("No se especificó un alumno.");
        setTimeout(() => window.location.href = 'clientes.html', 2000);
        return;
    }

    document.getElementById('det-id').value = id;
    await cargarDatosCliente(id);
    await cargarHistorialCliente(id);
}

// --- CARGAR DATOS ---
async function cargarDatosCliente(id) {
    try {
        const res = await fetch(`${API_URL}/clientes/${id}`);
        if (!res.ok) throw new Error("Cliente no encontrado");
        
        const c = await res.json();
        document.getElementById('det-nombre').value = c.nombre;
        document.getElementById('det-apellido').value = c.apellido;
        document.getElementById('det-dni').value = c.dni;
        document.getElementById('det-email').value = c.email || '';
        document.getElementById('det-telefono').value = c.telefono || '';
        document.title = `Ficha: ${c.nombre} ${c.apellido}`;
    } catch (e) {
        console.error(e);
        mostrarAlerta("Error al cargar datos del alumno.");
    }
}

// --- CARGAR HISTORIAL ---
async function cargarHistorialCliente(id) {
    const tbody = document.getElementById('tabla-historial-detalle');
    try {
        const res = await fetch(`${API_URL}/prestamos/cliente/${id}`);
        const data = await res.json();
        tbody.innerHTML = '';
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:#777">Este alumno no tiene historial.</td></tr>';
            return;
        }

        data.forEach(p => {
            const fPrestamo = new Date(p.fecha_prestamo).toLocaleDateString();
            const fDevolucion = p.fecha_devolucion_real ? new Date(p.fecha_devolucion_real).toLocaleDateString() : '-';
            const claseEstado = p.estado === 'activo' ? 'status-active' : 'status-returned';
            
            tbody.innerHTML += `
                <tr>
                    <td style="font-weight:500">${p.titulo}</td>
                    <td>${fPrestamo}</td>
                    <td>${fDevolucion}</td>
                    <td><span class="${claseEstado}">${p.estado}</span></td>
                </tr>`;
        });
    } catch (e) { console.error(e); }
}

// --- ACTUALIZAR DATOS (PUT) ---
async function actualizarCliente(e) {
    e.preventDefault();
    const id = document.getElementById('det-id').value;
    
    const datos = {
        nombre: document.getElementById('det-nombre').value,
        apellido: document.getElementById('det-apellido').value,
        dni: document.getElementById('det-dni').value,
        email: document.getElementById('det-email').value,
        telefono: document.getElementById('det-telefono').value
    };

    try {
        const res = await fetch(`${API_URL}/clientes/${id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(datos)
        });

        if (res.ok) {
            // Usamos el modal bonito verde
            mostrarExito("Datos actualizados correctamente.");
        } else {
            mostrarAlerta("Error al actualizar");
        }
    } catch (err) { console.error(err); mostrarAlerta("Error de conexión"); }
}

// --- ELIMINAR (PASO 1: ABRIR PREGUNTA) ---
function eliminarClienteActual() {
    document.getElementById('modal-confirmar-borrado').style.display = 'block';
}

// --- ELIMINAR (PASO 2: EJECUTAR BORRADO) ---
async function confirmarEliminacionReal() {
    const id = document.getElementById('det-id').value;
    document.getElementById('modal-confirmar-borrado').style.display = 'none'; // Cerrar pregunta

    try {
        const res = await fetch(`${API_URL}/clientes/${id}`, { method: 'DELETE' });
        
        if (res.ok) {
            // AQUÍ ESTÁ LA MAGIA:
            // Mostramos el mensaje de éxito y esperamos a que el usuario toque "Aceptar"
            // antes de redirigir a la lista.
            mostrarExito("Alumno eliminado correctamente.", () => {
                window.location.href = 'clientes.html';
            });
        } else {
            const data = await res.json();
            mostrarAlerta(data.error || "No se pudo eliminar");
        }
    } catch (e) { 
        console.error(e);
        mostrarAlerta("Error de conexión con el servidor"); 
    }
}

// --- UTILIDAD: MODAL ROJO (ERROR) ---
function mostrarAlerta(mensaje) {
    const modal = document.getElementById('modal-alerta');
    if (modal) {
        document.getElementById('mensaje-alerta').innerText = mensaje;
        modal.style.display = 'block';
    } else { alert("⚠️ " + mensaje); }
}

// --- UTILIDAD: MODAL VERDE (ÉXITO) ---
// Recibe un 'callback' (función) opcional para ejecutar al cerrar
function mostrarExito(mensaje, callback) {
    const modal = document.getElementById('modal-exito');
    if (modal) {
        document.getElementById('mensaje-exito').innerText = mensaje;
        modal.style.display = 'block';
        
        // Configurar qué hace el botón "Aceptar"
        document.getElementById('btn-cerrar-exito').onclick = function() {
            modal.style.display = 'none';
            if (callback) callback(); // Si hay redirección pendiente, la ejecutamos
        };
    } else { 
        alert("✅ " + mensaje); 
        if (callback) callback();
    }
}