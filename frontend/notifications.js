// Sistema de notificaciones en tiempo real
let socket;

function conectarWebSocket() {
    const token = localStorage.getItem('token');
    if (!token) return;

    socket = io('http://localhost:3000');

    socket.on('connect', () => {
        console.log('Conectado a WebSocket');
        // Obtener user_id del token (simplificado)
        const user = JSON.parse(atob(token.split('.')[1]));
        socket.emit('join', user.id);
    });

    socket.on('notificacion', (data) => {
        mostrarMensaje(data.mensaje, 'info');
    });

    socket.on('disconnect', () => {
        console.log('Desconectado de WebSocket');
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
