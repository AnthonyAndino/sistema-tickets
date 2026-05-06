document.addEventListener('DOMContentLoaded', () => {

    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const username = localStorage.getItem('username');
    const rol = localStorage.getItem('rol');
    document.getElementById('usuarioActivo').textContent = `Usuario: ${username} (${rol})`;

    // Mostrar asignación de tecnico solo para admin
    if (rol === 'admin') {
        document.getElementById('asignarJefe').style.display = 'block';
    }

    async function obtenerTickets() {
        mostrarLoading(true);
        try {
            const res = await fetch('http://localhost:3000/api/tickets', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Error al obtener tickets');

            const tickets = await res.json();
            mostrarTickets(tickets);
        } catch (err) {
            mostrarMensaje(err.message, "error");
        } finally {
            mostrarLoading(false);
        }
    }

    function mostrarTickets(tickets) {
        const lista = document.getElementById('tickets');
        if (!lista) return;
        lista.innerHTML = '';

        const rol = localStorage.getItem('rol');

        tickets.forEach(ticket => {
            const div = document.createElement('div');
            div.className = 'ticket';
            div.style.borderLeft = ticket.estado === 'Resuelto' ? '5px solid green' : '5px solid orange';
            div.style.cursor = rol === 'admin' ? 'pointer' : 'default';
            
            // Click en ticket para admin
            if (rol === 'admin') {
                div.onclick = () => mostrarDetalleTicket(ticket);
            }

            let acciones = '';
            if (rol === 'admin') {
                acciones = `
                    <button onclick="event.stopPropagation(); resolverTicket(${ticket.id})">Resolver</button>
                    <button onclick="event.stopPropagation(); eliminarTicket(${ticket.id})">Eliminar</button>
                    <button onclick="event.stopPropagation(); editarTicket(${JSON.stringify(ticket).replace(/"/g, '&quot;')})">Editar</button>
                `;
            }

            div.innerHTML = `
                <h3>${ticket.titulo}</h3>
                <p>${ticket.descripcion}</p>
                <p>Usuario: ${ticket.username || 'No asignado'}</p>
                <p>Técnico: ${ticket.tecnico || 'No asignado'}</p>
                <p>Estado: ${ticket.estado}</p>
                ${acciones}
            `;

            lista.appendChild(div);
        });
    }

    window.mostrarDetalleTicket = (ticket) => {
        const detalle = document.getElementById('ticketDetalle');
        if (!detalle) return;

        detalle.innerHTML = `
            <div class="detalle-contenido">
                <h3>${ticket.titulo}</h3>
                <p><strong>Descripción:</strong> ${ticket.descripcion}</p>
                <p><strong>Usuario:</strong> ${ticket.username || 'No asignado'}</p>
                <p><strong>Estado:</strong> ${ticket.estado}</p>
                <label>Asignar Técnico:</label>
                <select id="tecnicoAsignar">
                    <option value="">Seleccionar tecnico</option>
                </select>
                <button onclick="asignarTecnico(${ticket.id})">Asignar</button>
                <button onclick="cerrarDetalle()">Cerrar</button>
            </div>
        `;
        detalle.style.display = 'block';
        document.getElementById('overlay').style.display = 'block';
        
        // Cargar técnicos y seleccionar el actual
        fetch('http://localhost:3000/api/tecnicos')
            .then(res => res.json())
            .then(tecnicos => {
                const select = document.getElementById('tecnicoAsignar');
                tecnicos.forEach(t => {
                    const option = document.createElement('option');
                    option.value = t.id;
                    option.textContent = t.nombre;
                    if (t.id == ticket.tecnico_id) option.selected = true;
                    select.appendChild(option);
                });
            });
    };

    window.editarTicket = (ticket) => {
        const editForm = document.getElementById('editarTicket');
        if (!editForm) return;

        document.getElementById('editTitulo').value = ticket.titulo;
        document.getElementById('editDescripcion').value = ticket.descripcion;
        document.getElementById('editEstado').value = ticket.estado;

        // Cargar técnicos
        fetch('http://localhost:3000/api/tecnicos')
            .then(res => res.json())
            .then(tecnicos => {
                const select = document.getElementById('editTecnico');
                select.innerHTML = '<option value="">Seleccionar tecnico</option>';
                tecnicos.forEach(t => {
                    const option = document.createElement('option');
                    option.value = t.id;
                    option.textContent = t.nombre;
                    if (t.id == ticket.tecnico_id) option.selected = true;
                    select.appendChild(option);
                });
            });

        editForm.style.display = 'block';
        document.getElementById('overlay').style.display = 'block';

        // Guardar cambios
        document.getElementById('editForm').onsubmit = async (e) => {
            e.preventDefault();
            
            const titulo = document.getElementById('editTitulo').value;
            const descripcion = document.getElementById('editDescripcion').value;
            const estado = document.getElementById('editEstado').value;
            const tecnico_id = document.getElementById('editTecnico').value;

            try {
                const res = await fetch(`http://localhost:3000/api/tickets/${ticket.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ titulo, descripcion, estado, tecnico_id })
                });

                if (!res.ok) throw new Error('Error al editar ticket');
                
                cerrarEdicion();
                obtenerTickets();
            } catch (err) {
                mostrarMensaje(err.message, "error");
            }
        };
    };

    window.cerrarEdicion = () => {
        document.getElementById('editarTicket').style.display = 'none';
        document.getElementById('overlay').style.display = 'none';
    };

    window.asignarTecnico = async (ticketId) => {
        const tecnico_id = document.getElementById('tecnicoAsignar').value;
        if (!tecnico_id) {
            mostrarMensaje('Selecciona un técnico', "error");
            return;
        }

        try {
            const res = await fetch(`http://localhost:3000/api/tickets/${ticketId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ tecnico_id })
            });

            if (!res.ok) throw new Error('Error al asignar técnico');
            
            cerrarDetalle();
            obtenerTickets();
        } catch (err) {
            mostrarMensaje(err.message, "error");
        }
    };

    window.cerrarDetalle = () => {
        document.getElementById('ticketDetalle').style.display = 'none';
        document.getElementById('overlay').style.display = 'none';
    };

    window.crearTicket = async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        mostrarLoading(true, btn);

        const titulo = document.getElementById('titulo').value;
        const descripcion = document.getElementById('descripcion').value;
        const tecnico_id = rol === 'admin' ? document.getElementById('tecnico').value : null;

        try {
            const res = await fetch('http://localhost:3000/api/tickets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ titulo, descripcion, tecnico_id })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al crear ticket');

            mostrarMensaje('Ticket creado correctamente', 'exito');
            obtenerTickets();
            e.target.reset();
        } catch (err) {
            mostrarMensaje(err.message, "error");
        } finally {
            mostrarLoading(false, btn);
        }
    };

    window.resolverTicket = async (id) => {
        mostrarLoading(true);
        try {
            const res = await fetch(`http://localhost:3000/api/tickets/${id}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Error al resolver ticket');
            mostrarMensaje('Ticket resuelto', 'exito');
            obtenerTickets();
        } catch (err) {
            mostrarMensaje(err.message, "error");
        } finally {
            mostrarLoading(false);
        }
    };

    window.eliminarTicket = async (id) => {
        if (!confirm('¿Seguro que deseas eliminar este ticket?')) return;
        mostrarLoading(true);
        try {
            const res = await fetch(`http://localhost:3000/api/tickets/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Error al eliminar ticket');
            mostrarMensaje('Ticket eliminado', 'exito');
            obtenerTickets();
        } catch (err) {
            mostrarMensaje(err.message, "error");
        } finally {
            mostrarLoading(false);
        }
    };

    async function cargarTecnicos() {
        try {
            const res = await fetch('http://localhost:3000/api/tecnicos');
            if (!res.ok) throw new Error('Error al cargar técnicos');

            const tecnicos = await res.json();
            const select = document.getElementById('tecnico');
            if (!select) return;

            tecnicos.forEach(t => {
                const option = document.createElement('option');
                option.value = t.id;
                option.textContent = t.nombre;
                select.appendChild(option);
            });
        } catch (err) {
            mostrarMensaje(err.message, "error");
        }
    }

    window.logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('rol');
        window.location.href = 'login.html';
    };

    window.filtrar = (estado) => {
        document.getElementById('filtroEstado').value = estado === 'todos' ? '' : estado;
        aplicarFiltros();
    };

    window.aplicarFiltros = async () => {
        const token = localStorage.getItem('token');
        mostrarLoading(true);
        
        const estado = document.getElementById('filtroEstado').value;
        const prioridad = document.getElementById('filtroPrioridad').value;
        const busqueda = document.getElementById('busqueda').value;
        
        let url = 'http://localhost:3000/api/tickets';
        const params = new URLSearchParams();
        if (estado) params.append('estado', estado);
        if (prioridad) params.append('prioridad', prioridad);
        if (busqueda) params.append('busqueda', busqueda);
        if (params.toString()) url += '?' + params.toString();
        
        try {
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const tickets = await res.json();
            mostrarTickets(tickets);
        } catch (err) {
            mostrarMensaje(err.message, "error");
        } finally {
            mostrarLoading(false);
        }
    };

    window.limpiarFiltros = () => {
        document.getElementById('busqueda').value = '';
        document.getElementById('filtroEstado').value = '';
        document.getElementById('filtroPrioridad').value = '';
        obtenerTickets();
    };

    document.getElementById('ticketForm')?.addEventListener('submit', crearTicket);

    obtenerTickets();
    cargarTecnicos();
});
