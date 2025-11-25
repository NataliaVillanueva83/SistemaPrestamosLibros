let prestamosGlobal = [];

document.addEventListener('DOMContentLoaded', cargarPrestamos);

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
    idPrestamoTemp = id;
    document.getElementById('modal-confirmacion').style.display = 'block';
    
    document.getElementById('btn-confirmar-accion').onclick = async function() {
        try {
            const res = await fetch(`${API_URL}/prestamos/${idPrestamoTemp}/devolver`, { method: 'PUT' });
            if (res.ok) {
                alert("✅ Libro devuelto y stock actualizado");
                cerrarModal('modal-confirmacion');
                cargarPrestamos(); // Recargar lista
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
        alert('✅ Fecha corregida');
        cerrarModal('modal-editar-prestamo');
        cargarPrestamos();
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