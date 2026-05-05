require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorMiddleware');

const app = express();

app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/auth')
app.use('/api/auth', authRoutes);

const ticketRoutes = require('./routes/tickets');
app.use('/api/tickets', ticketRoutes);

const tecnicosRoutes = require('./routes/tecnicos');
app.use('/api/tecnicos', tecnicosRoutes);

app.use(errorHandler);

app.listen(3000, () => {
    console.log('Servidor corriendo en http://localhost:3000');
});