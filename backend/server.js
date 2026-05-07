require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend')));

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const ticketRoutes = require('./routes/tickets');
app.use('/api/tickets', ticketRoutes);

const tecnicosRoutes = require('./routes/tecnicos');
const statsRoutes = require('./routes/stats');
const commentsRoutes = require('./routes/comments');

app.use('/api/tecnicos', tecnicosRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/comentarios', commentsRoutes);

const PORT = 3000;
app.listen(PORT, function() {
    console.log('Servidor corriendo en http://localhost:' + PORT);
});
