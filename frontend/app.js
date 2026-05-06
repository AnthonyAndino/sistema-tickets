document.addEventListener('DOMContentLoaded', () => {

    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
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

        tickets.forEach(ticket => {
            const div = document.createElement('div');
            div.className = 'ticket';
            div.style.borderLeft = ticket.estado === 'Resuelto' ? '5px solid green' : '5px solid orange';

            div.innerHTML = `
                <h3>${ticket.titulo}</h3>
                <p>${ticket.descripcion}</p>
                <p>Técnico: ${ticket.tecnico || 'No asignado'}</p>
                <p>Estado: ${ticket.estado}</p>
                <button onclick="resolverTicket(${ticket.id})">Resolver</button>
                <button onclick="eliminarTicket(${ticket.id})">Eliminar</button>
            `;

            lista.appendChild(div);
        });
    }

    window.crearTicket = async (e) => {
        e.preventDefault();

        const titulo = document.getElementById('titulo').value;
        const descripcion = document.getElementById('descripcion').value;
        const tecnico_id = document.getElementById('tecnico').value;

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
