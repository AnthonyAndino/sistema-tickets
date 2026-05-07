# AuraDesk - Sistema de Gestión de Tickets

Un sistema moderno de help desk para la gestión de tickets de soporte técnico. Permite crear, asignar, dar seguimiento y resolver incidencias de manera eficiente, con notificaciones en tiempo real y panel de estadísticas.

## Características Principales

- **Autenticación JWT** con roles (admin/usuario)
- **Gestión completa de tickets** (crear, editar, resolver, eliminar)
- **Sistema de prioridades** (Baja, Media, Alta, Urgente)
- **Asignación de técnicos** (automática al jefe, manual por admin)
- **Comentarios en tickets** con notificaciones automáticas
- **Notificaciones en tiempo real** (nuevos tickets, cambios de estado, comentarios)
- **Dashboard interactivo** con KPIs y calendario de actividad
- **Filtros y búsqueda** de tickets
- **Modo oscuro/claro** persistente
- **Interfaz moderna** con Phosphor Icons y diseño responsive
- **Calendario de actividad** mensual con eventos

## Tecnologías Utilizadas

### Backend
- **Node.js** - Entorno de ejecución
- **Express.js 5** - Framework web
- **MySQL** (mysql2) - Base de datos relacional
- **JWT** (jsonwebtoken) - Autenticación basada en tokens
- **bcrypt** - Encriptación de contraseñas
- **dotenv** - Variables de entorno
- **cors** - Manejo de CORS
- **multer** - Subida de archivos
- **socket.io** - WebSockets (preparado para tiempo real)

### Frontend
- **HTML5 / CSS3 / JavaScript (Vanilla)** - Sin frameworks
- **Phosphor Icons** - Iconografía moderna
- **LocalStorage** - Persistencia de sesión y preferencias
- **Inter Font** - Tipografía profesional

## Estructura del Proyecto

```
sistema-tickets/
├── backend/
│   ├── middleware/
│   │   ├── authMiddleware.js    # Verificación de JWT
│   │   └── roleMiddleware.js    # Verificación de roles
│   ├── routes/
│   │   ├── auth.js              # Registro y login
│   │   ├── tickets.js           # CRUD de tickets
│   │   ├── tecnicos.js          # Gestión de técnicos
│   │   ├── comments.js          # Sistema de comentarios
│   │   ├── notifications.js     # Notificaciones DB
│   │   └── stats.js             # Estadísticas (admin)
│   ├── db.js                    # Conexión MySQL
│   └── server.js                # Servidor Express
├── frontend/
│   ├── index.html               # Dashboard principal
│   ├── login.html               # Login/registro
│   ├── app.js                   # Lógica del dashboard
│   ├── login.js                 # Lógica de autenticación
│   ├── authCheck.js             # Verificación de auth
│   ├── messages.js              # Sistema de toasts
│   └── style.css                # Estilos completos
├── .env.example                 # Ejemplo de variables
├── .gitignore
└── package.json
```

## Instalación

### Prerrequisitos
- Node.js (v16 o superior)
- Servidor MySQL en ejecución

### Pasos

1. Clona el repositorio:
```bash
git clone https://github.com/AnthonyAndino/sistema-tickets.git
cd sistema-tickets
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
```bash
cp .env.example .env
```
Edita el archivo `.env` con tus credenciales (ver sección siguiente).

4. Crea la base de datos y tablas en MySQL:
```sql
CREATE DATABASE tickets_db;
USE tickets_db;

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol ENUM('usuario', 'admin') DEFAULT 'usuario'
);

CREATE TABLE tecnicos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    es_jefe BOOLEAN DEFAULT FALSE
);

CREATE TABLE tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    estado ENUM('Pendiente', 'Resuelto') DEFAULT 'Pendiente',
    prioridad ENUM('Baja', 'Media', 'Alta', 'Urgente') DEFAULT 'Media',
    tecnico_id INT,
    user_id INT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tecnico_id) REFERENCES tecnicos(id),
    FOREIGN KEY (user_id) REFERENCES usuarios(id)
);

CREATE TABLE comentarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    user_id INT NOT NULL,
    comentario TEXT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Insertar un técnico jefe (necesario para asignación automática)
INSERT INTO tecnicos (nombre, es_jefe) VALUES ('Técnico Jefe', TRUE);
```

5. Inicia el servidor:
```bash
node backend/server.js
```

El servidor corre en `http://localhost:3000`

## Configuración de Variables de Entorno

Edita el archivo `.env` con tus valores:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=tickets_db
JWT_SECRET=clave_secreta_segura_muy_larga
PORT=3000
```

## API Endpoints

### Autenticación
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Registrar usuario (rol opcional: admin/usuario) | No |
| POST | `/api/auth/login` | Iniciar sesión | No |

### Tickets (Requiere JWT)
| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| GET | `/api/tickets` | Obtener tickets (admin: todos, usuario: propios) | JWT |
| POST | `/api/tickets` | Crear nuevo ticket (asigna automático al jefe) | JWT |
| PUT | `/api/tickets/:id` | Editar ticket (título, descripción, estado, técnico) | Admin |
| DELETE | `/api/tickets/:id` | Eliminar ticket | Admin |

### Técnicos
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/tecnicos` | Obtener lista de técnicos |

### Comentarios (Requiere JWT)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/comentarios/:ticketId` | Obtener comentarios de un ticket |
| POST | `/api/comentarios` | Agregar comentario (notifica automáticamente) |

### Notificaciones (Requiere JWT)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/notificaciones` | Obtener últimas 20 notificaciones |
| GET | `/api/notificaciones/count` | Contar no leídas |
| PUT | `/api/notificaciones/leer` | Marcar todas como leídas |
| PUT | `/api/notificaciones/:id/leer` | Marcar una como leída |

### Estadísticas (Solo Admin)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/stats` | Obtener estadísticas del sistema |

### Autenticación JWT
Incluye el token en el header:
```
Authorization: Bearer <token>
```

## Uso del Sistema

### Panel de Administrador
- Ver todos los tickets del sistema
- Crear, editar y eliminar cualquier ticket
- Cambiar estado (Pendiente/Resuelto)
- Asignar técnicos a tickets
- Ver estadísticas en `/api/stats`
- Recibir notificaciones de nuevos tickets y comentarios

### Panel de Usuario
- Crear nuevos tickets con prioridad
- Ver solo sus propios tickets
- Agregar comentarios a sus tickets
- Recibir notificaciones cuando admin cambia estado o comenta

### Funciones Destacadas
- **Dashboard con KPIs**: Total, Pendientes, Resueltos, Tasa de resolución
- **Calendario mensual**: Visualiza la actividad de tickets por día
- **Actividad reciente**: Últimos tickets con tiempo relativo
- **Búsqueda en tiempo real**: Filtra tickets por título, usuario o ID
- **Filtros rápidos**: Botones para Todos / Pendientes / Resueltos
- **Modo oscuro**: Toggle persistente en localStorage
- **Notificaciones**: Badge con conteo y dropdown con historial

## Vistas del Frontend

| Vista | Descripción |
|-------|-------------|
| Dashboard | KPIs, calendario y actividad reciente |
| Tickets | Lista completa con filtros y creación |
| Clientes | Directorio de clientes (UI estática) |
| Reportes | Métricas de rendimiento (UI estática) |
| Base de Conocimiento | Artículos de ayuda (UI estática) |
| Plantillas | Respuestas rápidas (UI estática) |
| Integraciones | Slack, Gmail (UI estática) |
| Ajustes | Configuración del sistema (UI estática) |

## Scripts Disponibles

```bash
npm start       # Inicia el servidor en producción
npx nodemon backend/server.js  # Modo desarrollo con recarga automática
```

## Mejoras Futuras

- [ ] Implementar Socket.io para notificaciones en tiempo real (ya instalado)
- [ ] Subida de archivos adjuntos a tickets (multer ya instalado)
- [ ] Paginación en la lista de tickets
- [ ] Filtros avanzados por fecha, prioridad y técnico
- [ ] Historial de cambios de estado
- [ ] Panel de estadísticas visual (gráficos)
- [ ] Implementar vistas estáticas (Clientes, Reportes, etc.)
- [ ] Recordatorios automáticos para tickets vencidos
- [ ] Exportar tickets a PDF/Excel

## Contribución

1. Haz un fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Haz commit de tus cambios (`git commit -m 'Agrega nueva funcionalidad'`)
4. Haz push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## Contribución

1. Haz un fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Haz commit de tus cambios (`git commit -m 'Agrega nueva funcionalidad'`)
4. Haz push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## Mejoras Futuras

- [ ] Implementar roles de usuario (admin, técnico, usuario)
- [ ] Agregar paginación a la lista de tickets
- [ ] Filtros avanzados por fecha y estado
- [ ] Notificaciones en tiempo real
- [ ] Historial de cambios de tickets
- [ ] Panel de estadísticas y reportes

## Scripts Disponibles

```bash
npm start       # Inicia el servidor en producción
npm run dev     # Inicia el servidor con nodemon (desarrollo)
```

## Licencia

ISC
