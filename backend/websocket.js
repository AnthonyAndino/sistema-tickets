const socketIo = require('socket.io');

let io;

function initWebSocket(server) {
    io = socketIo(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        console.log('Cliente conectado:', socket.id);

        // Unirse a sala por usuario
        socket.on('join', (userId) => {
            socket.join(`user_${userId}`);
            console.log(`Usuario ${userId} se unió a su sala`);
        });

        // Notificar nuevo ticket
        socket.on('nuevo-ticket', (data) => {
            // Notificar al admin
            io.to('user_1').emit('notificacion', {
                mensaje: `Nuevo ticket creado: ${data.titulo}`,
                ticketId: data.ticketId
            });
        });

        // Notificar ticket resuelto
        socket.on('ticket-resuelto', (data) => {
            io.to(`user_${data.user_id}`).emit('notificacion', {
                mensaje: `Tu ticket #${data.ticketId} ha sido resuelto`,
                ticketId: data.ticketId
            });
        });

        socket.on('disconnect', () => {
            console.log('Cliente desconectado:', socket.id);
        });
    });
}

function getIo() {
    return io;
}

module.exports = { initWebSocket, getIo };
