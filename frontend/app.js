document.addEventListener('DOMContentLoaded', () => {

    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const username = localStorage.getItem('username');
    const rol = localStorage.getItem('rol');
    document.getElementById('usuarioActivo').textContent = `Usuario: ${username} (${rol})`;

    // Ocultar selección de técnico para usuarios regulares
    if (rol !== 'admin') {
        document.getElementById('tecnico').style.display = 'none';
        document.querySelector('label[for="tecnico"]')?.style.setProperty('display', 'none');
    }

    async function obtenerTickets() {
        try {
            const res = await fetch('http://localhost:3000/api/tickets', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Error al obtener tickets');

            const tickets = await res.json();
            mostrarTickets(tickets);
        } catch (err) {
            alert(err.message);
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

        const selectTecnico = document.getElementById('tecnicoAsignar')?.innerHTML || '';
        
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

    window.asignarTecnico = async (ticketId) => {
        const tecnico_id = document.getElementById('tecnicoAsignar').value;
        if (!tecnico_id) {
            alert('Selecciona un técnico');
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
            alert(err.message);
        }
    };

    window.cerrarDetalle = () => {
        const detalle = document.getElementById('ticketDetalle');
        if (detalle) detalle.style.display = 'none';
    };

    window.crearTicket = async (e) => {
        e.preventDefault();

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

            obtenerTickets();
            e.target.reset();
        } catch (err) {
            alert(err.message);
        }
    };

    window.resolverTicket = async (id) => {
        try {
            const res = await fetch(`http://localhost:3000/api/tickets/${id}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Error al resolver ticket');
            obtenerTickets();
        } catch (err) {
            alert(err.message);
        }
    };

    window.eliminarTicket = async (id) => {
        if (!confirm('¿Seguro que deseas eliminar este ticket?')) return;

        try {
            const res = await fetch(`http://localhost:3000/api/tickets/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Error al eliminar ticket');
            obtenerTickets();
        } catch (err) {
            alert(err.message);
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
            alert(err.message);
        }
    }

    window.logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('rol');
        window.location.href = 'login.html';
    };

    document.getElementById('ticketForm')?.addEventListener('submit', crearTicket);

    obtenerTickets();
    cargarTecnicos();
});
