let clientesGlobal = [];

document.addEventListener('DOMContentLoaded', cargarClientes);

async function cargarClientes() {
    try {
        const res = await fetch(`${API_URL}/clientes`);
        clientesGlobal = await res.json();
        renderizarClientes(clientesGlobal);
    } catch (e) { console.error(e); }
}

function renderizarClientes(lista) {
    const grid = document.getElementById('grid-clientes'); 
    grid.innerHTML = '';
    
    if (!Array.isArray(lista)) return;

    lista.forEach(c => {
        grid.innerHTML += `
            <div class="school-card">
                <div class="card-content">
                    <div style="display:flex; align-items:center; margin-bottom:10px;">
                        <span class="material-symbols-outlined" style="font-size:30px; color:var(--primary-color); margin-right:10px;">person</span>
                        <div>
                            <span class="student-name" style="margin-bottom:0;">${c.nombre} ${c.apellido}</span>
                            <small style="color:#666">DNI: ${c.dni}</small>
                        </div>
                    </div>
                </div>
                
                <div class="card-actions" style="margin-top:15px; border-top:1px dashed #ccc; padding-top:10px; display:flex; justify-content: space-between; gap:5px;">
                    
                    <button class="btn-action btn-secondary" onclick="verHistorial(${c.id}, '${c.nombre}')" title="Historial Rápido">
                        <span class="material-symbols-outlined">history</span>
                    </button>
                    
                    <button class="btn-action" onclick="verMochila(${c.id}, '${c.nombre}')" title="Ver Préstamos Activos">
                        <span class="material-symbols-outlined">backpack</span>
                    </button>

                    <button class="btn-action" style="background-color:var(--primary-color); color:white;" 
                            onclick="window.location.href='detalle_cliente.html?id=${c.id}'">
                        <span class="material-symbols-outlined" style="color:white">id_card</span> Ficha
                    </button>
                </div>
            </div>`;
    });
}

// --- MOCHILA (Solo Activos - Para devolver rápido) ---
async function verMochila(id, nombre) {
    document.getElementById('modal-mochila').style.display = 'block';
    document.getElementById('mochila-nombre-alumno').innerText = nombre;
    const lista = document.getElementById('lista-mochila'); 
    lista.innerHTML = 'Cargando...';
    
    try {
        const res = await fetch(`${API_URL}/prestamos/cliente/${id}/activos`);
        const data = await res.json();
        
        lista.innerHTML = '';
        if(data.prestamos.length === 0) { 
            lista.innerHTML = '<p style="text-align:center; color:#888">Mochila vacía. No debe libros.</p>'; 
            return; 
        }
        
        data.prestamos.forEach(p => {
            lista.innerHTML += `
                <div style="border-bottom:1px solid #eee; padding:10px; display:flex; justify-content:space-between; align-items:center;">
                    <div><strong>${p.titulo}</strong><br><small>Fecha: ${new Date(p.fecha_prestamo).toLocaleDateString()}</small></div>
                    <button class="btn-action" style="color:var(--danger-color)" onclick="devolverLibro(${p.id})">Devolver</button>
                </div>`;
        });
    } catch(e){ console.error(e); }
}

// --- HISTORIAL (Todos los movimientos) ---
async function verHistorial(id, nombre) {
    document.getElementById('modal-historial').style.display = 'block';
    document.getElementById('historial-nombre').innerText = nombre;
    const tbody = document.getElementById('tabla-historial-cliente'); 
    tbody.innerHTML = '<tr><td colspan="3">Cargando...</td></tr>';
    
    try {
        const res = await fetch(`${API_URL}/prestamos/cliente/${id}`);
        const data = await res.json();
        
        tbody.innerHTML = '';
        if(data.length === 0) { tbody.innerHTML = '<tr><td colspan="3">Sin historial.</td></tr>'; return; }
        
        data.forEach(p => {
            const estadoClass = p.estado === 'activo' ? 'status-active' : 'status-returned';
            tbody.innerHTML += `
                <tr>
                    <td>${p.titulo}</td>
                    <td>${new Date(p.fecha_prestamo).toLocaleDateString()}</td>
                    <td><span class="${estadoClass}">${p.estado}</span></td>
                </tr>`;
        });
    } catch(e){ console.error(e); }
}

// --- DETALLE CLIENTE (Para Editar/Eliminar) ---
function verDetalleCliente(id) {
    const c = clientesGlobal.find(x => x.id === id);
    if(!c) return;
    
    document.getElementById('det-nombre').innerText = c.nombre + ' ' + c.apellido;
    document.getElementById('det-dni').innerText = 'DNI: ' + c.dni;
    document.getElementById('det-email').innerText = c.email || '-';
    document.getElementById('det-telefono').innerText = c.telefono || '-';
    
    // Configurar botones del modal detalle
    document.getElementById('btn-editar-alumno').onclick = () => { 
        document.getElementById('modal-detalle-cliente').style.display = 'none';
        abrirModalCliente(id); 
    };
    document.getElementById('btn-eliminar-alumno').onclick = () => eliminarCliente(id);
    
    document.getElementById('modal-detalle-cliente').style.display = 'block';
}

// --- GESTIÓN CLIENTE (Crear/Editar/Eliminar) ---
function abrirModalCliente(id = null) {
    document.getElementById('modal-cliente').style.display = 'block';
    if (id) {
        const c = clientesGlobal.find(x => x.id === id);
        document.getElementById('cli-id').value = id;
        document.getElementById('cli-nombre').value = c.nombre;
        document.getElementById('cli-apellido').value = c.apellido;
        document.getElementById('cli-dni').value = c.dni;
        document.getElementById('cli-email').value = c.email || '';
        document.getElementById('cli-telefono').value = c.telefono || '';
        document.getElementById('titulo-modal-cliente').innerText = '✏️ Editar Alumno';
    } else {
        document.getElementById('cli-id').value = '';
        document.getElementById('form-cliente').reset();
        document.getElementById('titulo-modal-cliente').innerText = '📝 Nuevo Alumno';
    }
}

async function guardarCliente(e) {
    e.preventDefault();
    const id = document.getElementById('cli-id').value;
    const data = {
        nombre: document.getElementById('cli-nombre').value,
        apellido: document.getElementById('cli-apellido').value,
        dni: document.getElementById('cli-dni').value,
        email: document.getElementById('cli-email').value,
        telefono: document.getElementById('cli-telefono').value
    };
    const url = id ? `${API_URL}/clientes/${id}` : `${API_URL}/clientes`;
    const method = id ? 'PUT' : 'POST';
    
    await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(data)});
    document.getElementById('modal-cliente').style.display = 'none';
    cargarClientes();
}

async function eliminarCliente(id) {
    if (!confirm("¿Eliminar alumno y su historial?")) return;
    await fetch(`${API_URL}/clientes/${id}`, { method: 'DELETE' });
    document.getElementById('modal-detalle-cliente').style.display = 'none';
    cargarClientes();
}

async function devolverLibro(id) {
    if(!confirm("¿Confirmar devolución?")) return;
    await fetch(`${API_URL}/prestamos/${id}/devolver`, { method: 'PUT' });
    document.getElementById('modal-mochila').style.display = 'none';
    alert("Libro devuelto");
}

function filtrarClientes() {
    const t = document.getElementById('buscador').value.toLowerCase();
    renderizarClientes(clientesGlobal.filter(c => c.nombre.toLowerCase().includes(t) || c.dni.includes(t)));
}