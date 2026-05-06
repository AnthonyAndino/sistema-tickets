require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorMiddleware');
const { initWebSocket } = require('./websocket');

const app = express();

app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/auth')
app.use('/api/auth', authRoutes);

const ticketRoutes = require('./routes/tickets');
app.use('/api/tickets', ticketRoutes);

const tecnicosRoutes = require('./routes/tecnicos');
const statsRoutes = require('./routes/stats');
const commentsRoutes = require('./routes/comments');
const uploadRoutes = require('./routes/upload');
const historyRoutes = require('./routes/history');
const recoveryRoutes = require('./routes/recovery');

app.use('/api/tecnicos', tecnicosRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/comentarios', commentsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/historial', historyRoutes);
app.use('/api/recovery', recoveryRoutes);

app.use(errorHandler);

const server = app.listen(3000, () => {
    console.log('Servidor corriendo en http://localhost:3000');
});

initWebSocket(server);
