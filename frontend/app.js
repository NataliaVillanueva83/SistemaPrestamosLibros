const API_URL = 'http://localhost:3000/api';
let librosGlobal = [], clientesGlobal = [], prestamosGlobal = [];

document.addEventListener('DOMContentLoaded', () => { cargarLibros(); cargarClientes(); });

function mostrarSeccion(seccion) {
    document.querySelectorAll('.section-view').forEach(div => div.style.display = 'none');
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`vista-${seccion}`).style.display = 'block';
    document.getElementById(`btn-${seccion}`).classList.add('active');
    if (seccion === 'devoluciones') cargarTodasDevoluciones();
}

// --- LIBROS ---
async function cargarLibros() {
    try {
        const res = await fetch(`${API_URL}/libros`);
        librosGlobal = await res.json();
        renderizarLibros(librosGlobal);
    } catch (e) { console.error(e); }
}

function renderizarLibros(lista) {
    const cont = document.getElementById('contenedor-libros'); cont.innerHTML = '';
    if (!Array.isArray(lista) || lista.length === 0) { cont.innerHTML = '<p>Sin libros.</p>'; return; }
    
    lista.forEach(l => {
        const stock = l.ejemplares_disponibles;
        const badge = stock > 0 ? 'available' : 'unavailable';
            
        const img = l.imagen_url && l.imagen_url.length > 10 ? l.imagen_url : `https://placehold.co/200x300?text=${l.titulo.substring(0,10)}...`;
        
        cont.innerHTML += `
            <div class="book-card">
                <img src="${img}" class="book-cover" onerror="this.src='https://placehold.co/200x300?text=Error'">
                <div class="book-info">
                    <div class="book-title">${l.titulo}</div>
                    <div style="font-size:0.9em; color:#666">${l.autor}</div>
                    <div class="book-footer">
                        <span class="badge ${badge}">${stock} Disp.</span>
                        ${stock>0 ? `<button class="btn-action" onclick="prepararPrestamo(${l.id}, '${l.titulo}')"><span class="material-symbols-outlined">backpack</span></button>`:''}
                    </div>
                </div>
            </div>`;
    });
}

// --- CLIENTES ---
async function cargarClientes() {
    try {
        const res = await fetch(`${API_URL}/clientes`);
        clientesGlobal = await res.json();
        renderizarClientes(clientesGlobal);
    } catch (e) { console.error(e); }
}

function renderizarClientes(lista) {
    const grid = document.getElementById('grid-clientes'); grid.innerHTML = '';
    if (!Array.isArray(lista)) return;

    lista.forEach(c => {
        grid.innerHTML += `
            <div class="school-card">
                <div class="card-content">
                    <span class="student-name">${c.nombre} ${c.apellido}</span>
                    <div><strong>DNI:</strong> ${c.dni}</div>
                </div>
                <div class="card-actions">
                    <button class="btn-action btn-secondary" onclick="verHistorial(${c.id}, '${c.nombre} ${c.apellido}')">
                        <span class="material-symbols-outlined">history</span>
                    </button>
                    <button class="btn-action" onclick="verMochila(${c.id}, '${c.nombre} ${c.apellido}')">
                        <span class="material-symbols-outlined">backpack</span>
                    </button>
                </div>
            </div>`;
    });
}

// --- MOCHILA (Activos) ---
async function verMochila(id, nombre) {
    document.getElementById('modal-mochila').style.display = 'block';
    document.getElementById('mochila-nombre-alumno').innerText = nombre;
    const lista = document.getElementById('lista-mochila'); lista.innerHTML = 'Cargando...';
    try {
        const res = await fetch(`${API_URL}/prestamos/cliente/${id}/activos`);
        const data = await res.json();
        lista.innerHTML = '';
        if(data.prestamos.length === 0) { lista.innerHTML = '<p style="text-align:center;color:#888">Mochila vacía.</p>'; return; }
        data.prestamos.forEach(p => {
            lista.innerHTML += `
                <div style="border-bottom:1px solid #eee; padding:10px 0; display:flex; justify-content:space-between; align-items:center;">
                    <div><strong>${p.titulo}</strong><br><small>Fecha: ${new Date(p.fecha_prestamo).toLocaleDateString()}</small></div>
                    <button class="btn-action" style="color:var(--danger-color)" onclick="confirmarDevolucion(${p.id})">Devolver</button>
                </div>`;
        });
    } catch(e){console.error(e);}
}

// --- HISTORIAL (Todos) ---
async function verHistorial(id, nombre) {
    document.getElementById('modal-historial').style.display = 'block';
    document.getElementById('historial-nombre').innerText = nombre;
    const tbody = document.getElementById('tabla-historial-cliente'); tbody.innerHTML = '<tr><td>Cargando...</td></tr>';
    
    try {
        
        const res = await fetch(`${API_URL}/prestamos/cliente/${id}`);
        const data = await res.json();
        tbody.innerHTML = '';
        
        if(data.length === 0) { tbody.innerHTML = '<tr><td colspan="4">Sin historial.</td></tr>'; return; }
        
        data.forEach(p => {
            const fPrestamo = new Date(p.fecha_prestamo).toLocaleDateString();
            const fDevolucion = p.fecha_devolucion_real ? new Date(p.fecha_devolucion_real).toLocaleDateString() : '-';
            const claseEstado = p.estado === 'activo' ? 'status-active' : 'status-returned';
            const textoEstado = p.estado === 'activo' ? 'En Curso' : 'Devuelto';
            
            tbody.innerHTML += `
                <tr>
                    <td>${p.titulo}</td>
                    <td>${fPrestamo}</td>
                    <td>${fDevolucion}</td>
                    <td><span class="${claseEstado}">${textoEstado}</span></td>
                </tr>`;
        });
    } catch(e) { console.error(e); }
}

// --- DEVOLUCIONES GENERAL ---
async function cargarTodasDevoluciones() {
    const tbody = document.getElementById('tabla-devoluciones'); tbody.innerHTML = 'Cargando...';
    try {
        const res = await fetch(`${API_URL}/prestamos`);
        const data = await res.json();
        const activos = data.filter(p => p.estado === 'activo');
        tbody.innerHTML = '';
        if(activos.length === 0) { tbody.innerHTML = '<tr><td colspan="5">No hay préstamos activos.</td></tr>'; return; }
        activos.forEach(p => {
            tbody.innerHTML += `
                <tr>
                    <td>${p.cliente_nombre} ${p.cliente_apellido}</td>
                    <td>${p.libro_titulo}</td>
                    <td>${new Date(p.fecha_prestamo).toLocaleDateString()}</td>
                    <td><span class="status-active">En curso</span></td>
                    <td><button class="btn-action" style="color:var(--danger-color)" onclick="confirmarDevolucion(${p.id})">Devolver</button></td>
                </tr>`;
        });
    } catch(e){console.error(e);}
}

// --- CONFIRMACIÓN Y ACCIONES ---
let prestamoIdTemp = null;
function confirmarDevolucion(id) {
    prestamoIdTemp = id;
    document.getElementById('modal-confirmacion').style.display = 'block';
    document.getElementById('btn-confirmar-accion').onclick = async () => {
        await fetch(`${API_URL}/prestamos/${prestamoIdTemp}/devolver`, { method: 'PUT' });
        cerrarModal('modal-confirmacion'); cerrarModal('modal-mochila');
        cargarLibros(); if(document.getElementById('vista-devoluciones').style.display==='block') cargarTodasDevoluciones();
    };
}

// --- FORMULARIOS ---
function cerrarModal(id){ document.getElementById(id).style.display='none'; }
function abrirModalCliente(){ document.getElementById('modal-cliente').style.display='block'; }

async function guardarCliente(e){
    e.preventDefault();
    const c = { nombre:document.getElementById('cli-nombre').value, apellido:document.getElementById('cli-apellido').value, dni:document.getElementById('cli-dni').value, email:document.getElementById('cli-email').value, telefono:document.getElementById('cli-telefono').value };
    await fetch(`${API_URL}/clientes`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(c)});
    cerrarModal('modal-cliente'); cargarClientes(); document.getElementById('form-cliente').reset();
}

function prepararPrestamo(id, titulo){
    document.getElementById('modal-prestamo').style.display='block';
    document.getElementById('prestamo-titulo-libro').innerText=titulo;
    document.getElementById('prestamo-libro-id').value=id;
    document.getElementById('prestamo-fecha').valueAsDate=new Date();
    const sel=document.getElementById('prestamo-cliente-id'); sel.innerHTML='<option>Elegir...</option>';
    clientesGlobal.forEach(c=>{ let o=document.createElement('option'); o.value=c.id; o.text=`${c.nombre} ${c.apellido}`; sel.appendChild(o); });
}

async function guardarPrestamo(e){
    e.preventDefault();
    const d = { id_libro:document.getElementById('prestamo-libro-id').value, id_cliente:document.getElementById('prestamo-cliente-id').value, fecha_prestamo:document.getElementById('prestamo-fecha').value };
    const res = await fetch(`${API_URL}/prestamos`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(d)});
    if(res.ok){ cerrarModal('modal-prestamo'); cargarLibros(); } else { let err=await res.json(); alert(err.error); }
}

function filtrarContenido(){
    const t = document.getElementById('buscador').value.toLowerCase();
    if(document.getElementById('vista-clientes').style.display!=='none') renderizarClientes(clientesGlobal.filter(c=>c.nombre.toLowerCase().includes(t)||c.dni.includes(t)));
    else if(document.getElementById('vista-libros').style.display!=='none') renderizarLibros(librosGlobal.filter(l=>l.titulo.toLowerCase().includes(t)));
}