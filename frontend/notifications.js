// Sistema de notificaciones en tiempo real
let socket;

function conectarWebSocket() {
    const token = localStorage.getItem('token');
    if (!token || typeof io === 'undefined') return;

    socket = io('http://localhost:3000', {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
    });

    socket.on('connect', () => {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload && payload.id) {
                socket.emit('join', payload.id);
            }
        } catch (e) {
            console.error('Error al decodificar token para WebSocket');
        }
    });

    socket.on('notificacion', (data) => {
        mostrarMensaje(data.mensaje, 'info');
    });
}

// Notificar nuevo ticket
function notificarNuevoTicket(titulo, ticketId) {
    if (socket && socket.connected) {
        socket.emit('nuevo-ticket', { titulo, ticketId });
    }
}

// Notificar ticket resuelto
function notificarTicketResuelto(user_id, ticketId) {
    if (socket && socket.connected) {
        socket.emit('ticket-resuelto', { user_id, ticketId });
    }
}

// Conectar al cargar
document.addEventListener('DOMContentLoaded', () => {
    conectarWebSocket();
});
