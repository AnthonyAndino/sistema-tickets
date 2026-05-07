document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = 'login.html'; return; }

    const username = localStorage.getItem('username');
    const rol = localStorage.getItem('rol');
    document.getElementById('usuarioActivo').textContent = `${username} (${rol})`;
    if(document.getElementById('avatarInitials')) {
        document.getElementById('avatarInitials').textContent = username.charAt(0).toUpperCase();
    }

    if (rol === 'admin') {
        const asignarJefe = document.getElementById('asignarJefe');
        const estadoContainer = document.getElementById('estadoContainer');
        if(asignarJefe) asignarJefe.style.display = 'block';
        if(estadoContainer) estadoContainer.style.display = 'block';
    }

    let editandoTicketId = null;

    // --- SPA ROUTER LOGIC ---
    const navItems = document.querySelectorAll('.nav-item');
    const spaViews = document.querySelectorAll('.spa-view');
    const viewTitle = document.getElementById('view-title');
    const headerCreateBtn = document.getElementById('headerCreateBtn');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('data-target');
            
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            spaViews.forEach(view => {
                view.classList.remove('active-view');
                if(view.id === targetId) view.classList.add('active-view');
            });

            const text = item.textContent.trim();
            viewTitle.textContent = text;

            if(targetId === 'view-tickets') {
                headerCreateBtn.style.display = 'block';
                headerCreateBtn.textContent = 'New Ticket';
                headerCreateBtn.onclick = abrirModal;
                obtenerTickets();
            } else {
                headerCreateBtn.style.display = 'none';
                renderMockView(targetId);
            }
        });
    });

    // --- MOCKS FOR OTHER VIEWS ---
    function renderMockView(viewId) {
        if(viewId === 'view-templates') {
            const grid = document.getElementById('templates-grid');
            grid.innerHTML = `
                <div class="mock-card"><h4>Reset Password</h4><p>Instructions for resetting user AD passwords.</p></div>
                <div class="mock-card"><h4>Network Outage</h4><p>Standard response for known VPN or branch outages.</p></div>
                <div class="mock-card"><h4>Hardware Request</h4><p>Form template for new mouse, keyboard or monitors.</p></div>
            `;
        } else if(viewId === 'view-categories') {
            const container = document.getElementById('categories-list');
            container.innerHTML = `
                <div class="mock-card" style="margin-bottom:10px; display:flex; justify-content:space-between;">
                    <div><h4>Software</h4><p>Issues related to apps, OS, licenses.</p></div>
                    <span class="status-badge st-pendiente">23 Active</span>
                </div>
                <div class="mock-card" style="margin-bottom:10px; display:flex; justify-content:space-between;">
                    <div><h4>Hardware</h4><p>Physical devices and peripherals.</p></div>
                    <span class="status-badge st-pendiente">5 Active</span>
                </div>
                <div class="mock-card" style="margin-bottom:10px; display:flex; justify-content:space-between;">
                    <div><h4>Networking</h4><p>Wi-Fi, VPN, internet access.</p></div>
                    <span class="status-badge st-pendiente">12 Active</span>
                </div>
            `;
        } else if(viewId === 'view-knowledgebase') {
            const grid = document.getElementById('kb-grid');
            grid.innerHTML = `
                <div class="mock-card"><h4>How to configure Outlook</h4><p>Step-by-step IMAP/Exchange setup.</p></div>
                <div class="mock-card"><h4>VPN Troubleshooting</h4><p>Common fixes for Cisco AnyConnect errors.</p></div>
                <div class="mock-card"><h4>Printer Setup (Marketing)</h4><p>Drivers and IP addresses for Floor 3.</p></div>
                <div class="mock-card"><h4>Onboarding Guide</h4><p>Day 1 IT setup checklist.</p></div>
            `;
        } else if(viewId === 'view-team') {
            const grid = document.getElementById('team-grid');
            grid.innerHTML = `
                <div class="team-member"><div class="avatar-lg">AR</div><h4>Alex Rivera</h4><p>L2 Tech Support</p></div>
                <div class="team-member"><div class="avatar-lg">SM</div><h4>Sarah Miller</h4><p>Sysadmin</p></div>
                <div class="team-member"><div class="avatar-lg">JW</div><h4>John Wu</h4><p>Network Engineer</p></div>
            `;
        } else if(viewId === 'view-calendar') {
            const grid = document.getElementById('calendar-grid');
            grid.className = 'calendar-view'; // Override generic grid layout
            grid.innerHTML = `
                <div class="calendar-header-row">
                    <div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div><div>Sun</div>
                </div>
                <div class="calendar-grid-body">
                    <div class="calendar-day"><span class="calendar-day-num">1</span></div>
                    <div class="calendar-day"><span class="calendar-day-num">2</span></div>
                    <div class="calendar-day"><span class="calendar-day-num">3</span></div>
                    <div class="calendar-day"><span class="calendar-day-num">4</span>
                        <div class="calendar-event">#TCK-145 Backup MySQL</div>
                    </div>
                    <div class="calendar-day"><span class="calendar-day-num">5</span></div>
                    <div class="calendar-day"><span class="calendar-day-num">6</span></div>
                    <div class="calendar-day"><span class="calendar-day-num">7</span></div>

                    <div class="calendar-day"><span class="calendar-day-num">8</span></div>
                    <div class="calendar-day"><span class="calendar-day-num">9</span></div>
                    <div class="calendar-day today"><span class="calendar-day-num">10</span>
                        <div class="calendar-event ev-high">#TCK-158 Outage ISP</div>
                    </div>
                    <div class="calendar-day"><span class="calendar-day-num">11</span></div>
                    <div class="calendar-day"><span class="calendar-day-num">12</span>
                        <div class="calendar-event ev-med">#TCK-169 Eq Setup</div>
                    </div>
                    <div class="calendar-day"><span class="calendar-day-num">13</span></div>
                    <div class="calendar-day"><span class="calendar-day-num">14</span></div>
                </div>
            `;
        }
    }

    // --- MODALS ---
    window.abrirModal = () => { document.getElementById('ticketModal').style.display = 'flex'; };
    window.cerrarModal = () => { document.getElementById('ticketModal').style.display = 'none'; cancelarEdicion(); };

    // --- TICKETS LOGIC ---
    async function obtenerTickets() {
        try {
            const res = await fetch('http://localhost:3000/api/tickets', { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error('Error al obtener tickets');
            const tickets = await res.json();
            mostrarTickets(tickets);
            calcularStats(tickets);
        } catch (err) {
            console.error(err);
            if(window.mostrarMensaje) mostrarMensaje(err.message, "error");
        }
    }

    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        const options = { day: '2-digit', month: 'short', year: '2-digit' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    function showStatus(estado) {
        let cssClass = estado === 'Resuelto' ? 'st-resuelto' : 'st-pendiente';
        return `<span class="status-badge ${cssClass}">${estado}</span>`;
    }

    function showPriority(prioridad) {
        let dot = `dot-${prioridad}`;
        return `<span class="priority-label"><div class="pri-dot ${dot}"></div>${prioridad}</span>`;
    }

    function calcularStats(tickets) {
        let open = 0, assignedMe = 0, unassigned = 0;
        tickets.forEach(t => {
            if (t.estado === 'Pendiente') open++;
            if (!t.tecnico) unassigned++;
            if (t.tecnico === username || t.username === username) assignedMe++;
        });
        const so = document.getElementById('statOpen');
        const sa = document.getElementById('statAssignedMe');
        const su = document.getElementById('statUnassigned');
        if(so) so.textContent = open;
        if(sa) sa.textContent = assignedMe;
        if(su) su.textContent = unassigned;
    }

    function mostrarTickets(tickets) {
        const tbody = document.getElementById('tickets');
        if (!tbody) return;
        tbody.innerHTML = '';

        if(tickets.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 40px; color: var(--text-muted);">No tickets found.</td></tr>`;
            return;
        }

        tickets.forEach(ticket => {
            const tr = document.createElement('tr');
            
            let htmlAcciones = '';
            if (rol === 'admin') {
                htmlAcciones = `
                    <button class="acciones-btn" title="Edit" onclick='cargarEdicion(${JSON.stringify(ticket).replace(/"/g, '&quot;')})'>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    ${ticket.estado !== 'Resuelto' ? `<button class="acciones-btn" title="Resolve" onclick="resolverTicket(${ticket.id})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </button>` : ''}
                    <button class="acciones-btn" title="Delete" onclick="eliminarTicket(${ticket.id})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                `;
            }

            // Everyone gets comment/view button
            htmlAcciones += `<button class="acciones-btn" title="Thread" onclick="mostrarComentarios(${ticket.id})">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
            </button>`;

            tr.innerHTML = `
                <td style="font-weight:500; font-family:monospace; color:var(--text-muted);">#${ticket.id}</td>
                <td style="font-weight:500;"><a href="#" onclick="mostrarComentarios(${ticket.id})" style="color:var(--text-primary); text-decoration:none;">${ticket.titulo}</a></td>
                <td>${ticket.username || 'System'}</td>
                <td>${showStatus(ticket.estado)}</td>
                <td>${showPriority(ticket.prioridad)}</td>
                <td style="color:var(--text-secondary);">${ticket.tecnico || 'Unassigned'}</td>
                <td style="text-align: right;">${htmlAcciones}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    window.cargarEdicion = (ticket) => {
        editandoTicketId = ticket.id;
        document.getElementById('ticketId').value = ticket.id;
        document.getElementById('titulo').value = ticket.titulo;
        document.getElementById('descripcion').value = ticket.descripcion;
        document.getElementById('prioridad').value = ticket.prioridad;
        if(document.getElementById('estado')) document.getElementById('estado').value = ticket.estado;
        
        cargarTecnicos().then(() => {
            const select = document.getElementById('tecnico');
            if(select) {
                Array.from(select.options).forEach(opt => { if(opt.value == ticket.tecnico_id) opt.selected = true; });
            }
        });

        document.getElementById('formTitle').textContent = 'Edit Ticket';
        document.getElementById('submitBtn').textContent = 'Update Ticket';
        abrirModal();
    };

    window.cancelarEdicion = () => {
        editandoTicketId = null;
        document.getElementById('ticketForm').reset();
        document.getElementById('formTitle').textContent = 'Create New Ticket';
        document.getElementById('submitBtn').textContent = 'Create Ticket';
    };

    window.mostrarComentarios = async (ticketId) => {
        document.getElementById('comentariosModal').style.display = 'flex';
        window.ticketIdComentario = ticketId;

        try {
            const res = await fetch(`http://localhost:3000/api/comentarios/${ticketId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const comentarios = await res.json();
            const lista = document.getElementById('listaComentarios');
            lista.innerHTML = '';

            comentarios.forEach(c => {
                const div = document.createElement('div');
                div.className = 'comment-bubble';
                div.innerHTML = `
                    <strong>${c.username || 'User'}</strong>
                    <p>${c.comentario}</p>
                    <small>${new Date(c.fecha).toLocaleString()}</small>
                `;
                lista.appendChild(div);
            });
        } catch (err) {
            console.error(err);
        }
    };

    window.agregarComentario = async () => {
        const comentario = document.getElementById('nuevoComentario').value;
        if (!comentario) return;

        try {
            const res = await fetch('http://localhost:3000/api/comentarios', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ticket_id: window.ticketIdComentario, comentario })
            });

            if (!res.ok) throw new Error('Error posting comment');
            mostrarComentarios(window.ticketIdComentario);
            document.getElementById('nuevoComentario').value = '';
        } catch (err) {
            if(window.mostrarMensaje) mostrarMensaje(err.message, "error");
        }
    };

    window.cerrarComentarios = () => { document.getElementById('comentariosModal').style.display = 'none'; };

    window.guardarTicket = async (e) => {
        e.preventDefault();
        const titulo = document.getElementById('titulo').value;
        const descripcion = document.getElementById('descripcion').value;
        const prioridad = document.getElementById('prioridad').value;
        const estadoElement = document.getElementById('estado');
        const estado = estadoElement ? estadoElement.value : 'Pendiente';
        const tecElement = document.getElementById('tecnico');
        const tecnico_id = (rol === 'admin' && tecElement) ? tecElement.value : null;

        try {
            if (editandoTicketId) {
                const res = await fetch(`http://localhost:3000/api/tickets/${editandoTicketId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ titulo, descripcion, prioridad, estado, tecnico_id })
                });
                if (!res.ok) throw new Error('Error updating ticket');
                if(window.mostrarMensaje) mostrarMensaje('Ticket updated', 'exito');
            } else {
                const res = await fetch('http://localhost:3000/api/tickets', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ titulo, descripcion, prioridad, tecnico_id })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Error creating ticket');
                if(window.mostrarMensaje) mostrarMensaje('Ticket created successfully', 'exito');
            }
            cerrarModal();
            obtenerTickets();
        } catch (err) {
            if(window.mostrarMensaje) mostrarMensaje(err.message, "error");
        }
    };

    window.resolverTicket = async (id) => {
        try {
            const res = await fetch(`http://localhost:3000/api/tickets/${id}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Error resolving ticket');
            if(window.mostrarMensaje) mostrarMensaje('Ticket marked as resolved', 'exito');
            obtenerTickets();
        } catch (err) {
             if(window.mostrarMensaje) mostrarMensaje(err.message, "error");
        }
    };

    window.eliminarTicket = async (id) => {
        if (!confirm('Delete this ticket permanently?')) return;
        try {
            const res = await fetch(`http://localhost:3000/api/tickets/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Error deleting ticket');
            if(window.mostrarMensaje) mostrarMensaje('Ticket deleted', 'exito');
            obtenerTickets();
        } catch (err) {
            if(window.mostrarMensaje) mostrarMensaje(err.message, "error");
        }
    };

    async function cargarTecnicos() {
        try {
            const res = await fetch('http://localhost:3000/api/tecnicos');
            if (!res.ok) throw new Error('Error loading technicians');
            const tecnicos = await res.json();
            const select = document.getElementById('tecnico');
            if (!select) return;
            select.innerHTML = '<option value="">Auto-assign</option>';
            tecnicos.forEach(t => {
                const option = document.createElement('option');
                option.value = t.id;
                option.textContent = t.nombre;
                select.appendChild(option);
            });
        } catch (err) {
            console.error(err);
        }
    }

    window.logout = () => { localStorage.removeItem('token'); localStorage.removeItem('rol'); window.location.href = 'login.html'; };

    window.aplicarFiltros = async () => {
        const estado = document.getElementById('filtroEstado').value;
        const prioridad = document.getElementById('filtroPrioridad').value;
        const busqueda = document.getElementById('busqueda').value;

        let url = 'http://localhost:3000/api/tickets';
        const params = new URLSearchParams();
        if (estado) params.append('estado', estado);
        if (prioridad) params.append('prioridad', prioridad);
        if (busqueda) params.append('busqueda', busqueda);
        if (params.toString()) url += '?' + params.toString();

        try {
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            const tickets = await res.json();
            mostrarTickets(tickets);
            document.getElementById('btnLimpiar').style.display = 'inline-block';
        } catch (err) {
             if(window.mostrarMensaje) mostrarMensaje(err.message, "error");
        }
    };

    window.limpiarFiltros = () => {
        document.getElementById('busqueda').value = '';
        document.getElementById('filtroEstado').value = '';
        document.getElementById('filtroPrioridad').value = '';
        document.getElementById('btnLimpiar').style.display = 'none';
        obtenerTickets();
    };

    document.getElementById('ticketForm').addEventListener('submit', window.guardarTicket);

    // Init
    obtenerTickets();
    if(rol === 'admin') cargarTecnicos();
});
