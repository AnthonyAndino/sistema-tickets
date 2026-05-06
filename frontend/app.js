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
        try {
            const res = await fetch('http://localhost:3000/api/tickets', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Error al obtener tickets');

            const tickets = await res.json();
            mostrarTickets(tickets);
        } catch (err) {
            mostrarMensaje(err.message, "error");
        }
    }

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

    document.getElementById('ticketForm')?.addEventListener('submit', crearTicket);

    obtenerTickets();
    cargarTecnicos();
});
