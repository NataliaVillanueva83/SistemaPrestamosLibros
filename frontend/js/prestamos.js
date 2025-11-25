let prestamosGlobal = [];

document.addEventListener('DOMContentLoaded', () => {
    cargarPrestamos();
    cargarClientesSelect();
    cargarLibrosSelect();
});

// CARGAR LISTA
async function cargarPrestamos() {
    const tbody = document.getElementById('tabla-prestamos');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">Cargando...</td></tr>';
    
    try {
        const res = await fetch(`${API_URL}/prestamos`);
        const data = await res.json();
        
        // Filtramos solo los activos para esta vista principal
        prestamosGlobal = data.filter(p => p.estado === 'activo');
        
        renderizarTabla(prestamosGlobal);
    } catch (e) { 
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="5" class="error-msg">Error de conexión</td></tr>';
    }
}

function renderizarTabla(lista) {
    const tbody = document.getElementById('tabla-prestamos');
    tbody.innerHTML = '';

    if (lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">No hay libros prestados actualmente.</td></tr>';
        return;
    }

    lista.forEach(p => {
        const alumno = `${p.cliente_nombre} ${p.cliente_apellido}`;
        const libro = p.libro_titulo;
        const fecha = new Date(p.fecha_prestamo).toLocaleDateString();

        tbody.innerHTML += `
            <tr>
                <td style="font-weight:bold; color:var(--text-color)">${alumno}</td>
                <td style="color:#555">${libro}</td>
                <td>${fecha}</td>
                <td><span class="status-active">En curso</span></td>
                <td>
                    <div style="display:flex; gap:5px; justify-content: flex-end;">
                        
                        <a href="detalle_prestamo.html?id=${p.id}" class="btn-action" style="text-decoration:none; color:#333; display:flex; align-items:center;" title="Ver Contrato">
                            <span class="material-symbols-outlined" style="font-size:18px">visibility</span>
                        </a>

                        <button class="btn-edit-small" onclick="abrirModalEditar(${p.id}, '${p.fecha_prestamo}')" title="Corregir Fecha">
                            ✎
                        </button>

                        <button class="btn-action" style="color:var(--danger-color); background: #ffebee;" onclick="confirmarDevolucion(${p.id})" title="Registrar Devolución">
                           <span class="material-symbols-outlined" style="font-size:18px">assignment_return</span> Devolver
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
}

// ACCIONES (DEVOLVER)
let idPrestamoTemp = null;

function confirmarDevolucion(id) {
    // 1. Mostrar el modal
    const modal = document.getElementById('modal-confirmacion');
    modal.style.display = 'block';
    
    // 2. Obtener el botón y CLONARLO para borrar eventos viejos
    const oldBtn = document.getElementById('btn-confirmar-accion');
    const newBtn = oldBtn.cloneNode(true);
    oldBtn.parentNode.replaceChild(newBtn, oldBtn);
    
    // 3. Asignar el nuevo evento al botón limpio
    newBtn.onclick = async function() {
        try {
            const res = await fetch(`${API_URL}/prestamos/${id}/devolver`, { method: 'PUT' });
            
            modal.style.display = 'none'; // Cerrar pregunta

            if (res.ok) {
                mostrarExito("Libro devuelto y stock actualizado", () => {
                    cargarPrestamos(); 
                    cargarLibrosSelect();
                });
            } else {
                alert("❌ Error al procesar la devolución");
            }
        } catch (e) { console.error(e); }
    };
}

// ACCIONES (EDITAR FECHA)
function abrirModalEditar(id, fecha) {
    document.getElementById('modal-editar-prestamo').style.display = 'block';
    document.getElementById('edit-prestamo-id').value = id;
    // Ajustar fecha para input date (formato YYYY-MM-DD)
    document.getElementById('edit-prestamo-fecha').value = new Date(fecha).toISOString().split('T')[0];
}

async function guardarEdicionPrestamo(e) {
    e.preventDefault();
    const id = document.getElementById('edit-prestamo-id').value;
    const fecha = document.getElementById('edit-prestamo-fecha').value;

    try {
        await fetch(`${API_URL}/prestamos/${id}`, {
            method: 'PUT',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ fecha_prestamo: fecha })
        });
       document.getElementById('modal-editar-prestamo').style.display = 'none';
        
        mostrarExito("Fecha corregida correctamente", () => {
            cargarPrestamos();
        });
    } catch(err) { alert('Error al editar'); }
}

// UTILIDADES
function cerrarModal(id) { document.getElementById(id).style.display = 'none'; }

function filtrarPrestamos() {
    const texto = document.getElementById('buscador').value.toLowerCase();
    const filtrados = prestamosGlobal.filter(p => 
        p.cliente_nombre.toLowerCase().includes(texto) || 
        p.cliente_apellido.toLowerCase().includes(texto) ||
        p.libro_titulo.toLowerCase().includes(texto)
    );
    renderizarTabla(filtrados);
}
function mostrarExito(mensaje, callback) {
    const modal = document.getElementById('modal-exito');
    if (modal) {
        document.getElementById('mensaje-exito').innerText = mensaje;
        modal.style.display = 'block';
        
        
        document.getElementById('btn-cerrar-exito').onclick = function() {
            modal.style.display = 'none';
            if (callback) callback();
        };
    } else {
        // Por si acaso no se cargó el HTML del modal
        alert("✅ " + mensaje);
        if (callback) callback();
    }
}
async function cargarClientesSelect() {
    try {
        const res = await fetch(`${API_URL}/clientes`);
        const clientes = await res.json();
        const select = document.getElementById('prestamo-cliente-id');
        if(select) {
            select.innerHTML = '<option value="">-- Seleccionar Alumno --</option>';
            clientes.forEach(c => {
                const op = document.createElement('option');
                op.value = c.id;
                op.text = `${c.nombre} ${c.apellido} (DNI: ${c.dni})`;
                select.appendChild(op);
            });
        }
    } catch (e) { console.error(e); }
}

function abrirModalPrestamo() {
    document.getElementById('modal-prestamo').style.display = 'block';
    document.getElementById('prestamo-fecha').valueAsDate = new Date();
}

async function guardarPrestamo(e) {
    e.preventDefault();
    const d = {
        id_libro: document.getElementById('prestamo-libro-id').value,
        id_cliente: document.getElementById('prestamo-cliente-id').value,
        fecha_prestamo: document.getElementById('prestamo-fecha').value
    };
    
    try {
        const res = await fetch(`${API_URL}/prestamos`, { 
            method: 'POST', 
            headers: {'Content-Type':'application/json'}, 
            body: JSON.stringify(d)
        });
        
        if(res.ok) { 
            document.getElementById('modal-prestamo').style.display = 'none';
            mostrarExito("Préstamo registrado exitosamente", () => {
                cargarPrestamos();
                cargarLibrosSelect();
            });
        } else { 
            const err = await res.json(); 
            alert("Error: " + (err.error || "No se pudo prestar. Revisa el ID del libro o el stock.")); 
        }
    } catch(err) { console.error(err); alert("Error de conexión"); }
}
async function cargarLibrosSelect() {
    try {
        // Pedimos solo los disponibles
        const res = await fetch(`${API_URL}/libros?soloDisponibles=true`);
        const libros = await res.json();
        
        const select = document.getElementById('prestamo-libro-id');
        if(select) {
            select.innerHTML = '<option value="">-- Seleccionar Libro --</option>';
            libros.forEach(l => {
                const option = document.createElement('option');
                option.value = l.id;
                option.text = `${l.titulo} - ${l.autor}`;
                select.appendChild(option);
            });
        }
    } catch (e) { console.error(e); }
}