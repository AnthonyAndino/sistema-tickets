// Sistema de notificaciones en tiempo real
let socket;

function conectarWebSocket() {
    const token = localStorage.getItem('token');
    if (!token) return;

    socket = io('http://localhost:3000', {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
    });

    socket.on('connect', () => {
        console.log('Conectado a WebSocket');
        try {
            const payload = token.split('.')[1];
            const user = JSON.parse(atob(payload));
            socket.emit('join', user.id);
        } catch (e) {
            console.error('Error al decodificar token:', e);
        }
    });

    socket.on('connect_error', (err) => {
        console.error('Error de conexión WebSocket:', err.message);
    });

    socket.on('notificacion', (data) => {
        mostrarMensaje(data.mensaje, 'info');
    });

    socket.on('disconnect', (reason) => {
        console.log('Desconectado de WebSocket:', reason);
    });
}

// Notificar nuevo ticket
function notificarNuevoTicket(titulo, ticketId) {
    if (socket) {
        socket.emit('nuevo-ticket', { titulo, ticketId });
    }
}

// Notificar ticket resuelto
function notificarTicketResuelto(user_id, ticketId) {
    if (socket) {
        socket.emit('ticket-resuelto', { user_id, ticketId });
    }
}

// Conectar al cargar
document.addEventListener('DOMContentLoaded', () => {
    if (typeof io !== 'undefined') {
        conectarWebSocket();
    }
});
