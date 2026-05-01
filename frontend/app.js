const API_URL = 'http://localhost:3000/api/tickets';

const token = localStorage.getItem('token')
const form = document.getElementById('ticketForm');
const ticketDiv = document.getElementById('tickets');


let ticketsGlobal = [];
let filtroActual = 'todos';

//logout
function logout() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

//OBetener usuario
function obetenerUsuario() {
    const token = localStorage.getItem('token');

    if (!token) return null;

    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));

    return decoded;
}

//Obtener tickets
async function obtenerTickets() {
    const res = await fetch(API_URL, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    const data = await res.json();

    ticketsGlobal = data;
    mostrarTickets();
}

function mostrarUsuario() {
    const user = obetenerUsuario();

    if (user) {
        document.getElementById('usuarioActivo').innerText = `Usuario: ${user.username}`;
    }
}

function mostrarTickets() {
    ticketDiv.innerHTML = '';

    let ticketsFiltrados = ticketsGlobal;

    if (filtroActual !== 'todos') {
        ticketsFiltrados = ticketsGlobal.filter(t => t.estado === filtroActual);
    }

    ticketsFiltrados.forEach(ticket => {
        const estadoClase = ticket.estado === "Pendiente" ? "pendiente" : "resuelto";

        ticketDiv.innerHTML += `
            <div class="ticket ${estadoClase}">
                <h3>${ticket.titulo}</h3>
                <p>${ticket.descripcion}</p>
                <p><strong>Técnico:</strong> ${ticket.tecnico || "Sin asignar"}</p>
                <strong>${ticket.estado}</strong>

                ${ticket.estado === "Pendiente" ?
                `<button onclick="resolverTicket(${ticket.id})">Resolver</button>`
                : ""}

                <button onclick="eliminarTicket(${ticket.id})">Eliminar</button>
            </div>
        `;
    });
}

//cargar tecnicos
async function cargarTecnicos() {
    const res = await fetch('http://localhost:3000/api/tecnicos', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    const data = await res.json();

    const select = document.getElementById('tecnico');

    data.forEach(t => {
        select.innerHTML += `<option value="${t.id}">${t.nombre}</option>`;
    });
}



//funcion filtar
function filtrar(tipo) {
    filtroActual = tipo;
    mostrarTickets();
}

//Crear tickets
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const titulo = document.getElementById('titulo').value;
    const descripcion = document.getElementById('descripcion').value;
    const tecnico_id = document.getElementById('tecnico').value;

    await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ titulo, descripcion, tecnico_id })
    });

    form.reset();
    obtenerTickets();
})

//funcion para resolver
async function resolverTicket(id) {
    await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    obtenerTickets();
}

//funcion eliminar
async function eliminarTicket(id) {
    await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    obtenerTickets();
}

function bloquearAtras() {
    window.history.pushState(null, null, window.location.href);

    window.onpopstate = function () {
        window.location.href = 'login.html';
    };
}


//cargar al inicio
cargarTecnicos();
mostrarUsuario();
obtenerTickets();
bloquearAtras();
