document.addEventListener('DOMContentLoaded', () => {

    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const username = localStorage.getItem('username');
    const rol = localStorage.getItem('rol');
    document.getElementById('usuarioActivo').textContent = username || 'Usuario';
    const avatarEl = document.getElementById('avatarLetra');
    if(avatarEl) avatarEl.textContent = username ? username.charAt(0).toUpperCase() : 'U';

    // Mostrar badge de rol
    const rolBadge = document.getElementById('rolBadge');
    if (rolBadge) {
        rolBadge.textContent = rol === 'admin' ? 'Admin' : 'Usuario';
        rolBadge.classList.add(rol === 'admin' ? 'rol-admin' : 'rol-usuario');
    }

    // Mostrar asignación de tecnico solo para admin
    if (rol === 'admin') {
        document.getElementById('asignarJefe').style.display = 'block';
    }

    // Saludo dinámico
    function actualizarSaludo() {
        const hora = new Date().getHours();
        let saludo;
        if (hora >= 5 && hora < 12) saludo = 'Buenos días';
        else if (hora >= 12 && hora < 18) saludo = 'Buenas tardes';
        else saludo = 'Buenas noches';

        const greetEl = document.getElementById('greetingText');
        if (greetEl) greetEl.textContent = `${saludo}, ${username || 'Usuario'} 👋`;

        const subEl = document.getElementById('greetingSubtext');
        if (subEl) {
            subEl.textContent = rol === 'admin' 
                ? 'Aquí tienes un resumen general del sistema' 
                : 'Aquí tienes un resumen de tus tickets';
        }
    }
    actualizarSaludo();

    function getPrioridadClass(prioridad) {
        switch(prioridad) {
            case 'Urgente': return 'pri-urgente';
            case 'Alta': return 'pri-alta';
            case 'Baja': return 'pri-baja';
            default: return 'pri-media';
        }
    }

    window.allTickets = [];

    async function obtenerTickets() {
        mostrarLoading(true);
        try {
            const res = await fetch('http://localhost:3000/api/tickets', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Error al obtener tickets');

            const tickets = await res.json();
            window.allTickets = tickets;
            mostrarTickets(tickets);
            actualizarDashboardKPIs(tickets);
        } catch (err) {
            mostrarMensaje(err.message, "error");
        } finally {
            mostrarLoading(false);
        }
    }

    function mostrarTickets(tickets) {
        const lista = document.getElementById('tickets');
        if (!lista) return;
        lista.innerHTML = '';

        const rol = localStorage.getItem('rol');
        let estadoFiltro = window.estadoFiltroActual || '';

        let ticketsMostrados = tickets;
        if (estadoFiltro && estadoFiltro !== 'todos') {
            ticketsMostrados = tickets.filter(t => t.estado === estadoFiltro);
        }

        // Estado vacío cuando no hay tickets
        if (ticketsMostrados.length === 0) {
            lista.innerHTML = `
                <div style="text-align:center; padding:60px 20px; color:var(--text-secondary);">
                    <i class="ph ph-ticket" style="font-size:3rem; display:block; margin-bottom:12px; color:#d1d5db;"></i>
                    <p style="margin:0 0 4px 0; font-size:1rem; font-weight:500;">No hay tickets ${estadoFiltro ? 'con estado "' + estadoFiltro + '"' : 'aún'}</p>
                    <p style="margin:0; font-size:0.85rem;">Los tickets que crees aparecerán aquí</p>
                </div>
            `;
            return;
        }

        ticketsMostrados.forEach(ticket => {
            const div = document.createElement('div');
            div.className = 'ticket-row';
            
            // Click en ticket para detalle
            div.onclick = (e) => {
                if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') {
                    mostrarDetalleTicket(ticket);
                }
            };
            div.style.cursor = 'pointer';

            let acciones = '';
            if (rol === 'admin') {
                acciones = `
                    <button class="btn-action-icon success" onclick="event.stopPropagation(); resolverTicket(${ticket.id})" title="Resolver">
                        <i class="ph ph-check"></i>
                    </button>
                    <button class="btn-action-icon danger" onclick="event.stopPropagation(); confirmarEliminar(${ticket.id})" title="Eliminar">
                        <i class="ph ph-trash"></i>
                    </button>
                    <button class="btn-action-icon" onclick="event.stopPropagation(); editarTicket(${JSON.stringify(ticket).replace(/"/g, '&quot;')})" title="Editar">
                        <i class="ph ph-pencil-simple"></i>
                    </button>
                    <button class="btn-action-icon" onclick="event.stopPropagation(); mostrarComentarios(${ticket.id})" title="Notas">
                        <i class="ph ph-note-pencil"></i>
                    </button>
                `;
            } else {
                acciones = '';
            }

            const fechaFormat = ticket.fecha_creacion ? new Date(ticket.fecha_creacion).toLocaleDateString() : 'N/A';
            const estadoClase = ticket.estado === 'Pendiente' ? 'status-pendiente' : ticket.estado === 'Resuelto' ? 'status-resuelto' : 'status-nuevo';

            div.innerHTML = `
                <div class="col-checkbox"><input type="checkbox"></div>
                <div class="col-id t-id">#${ticket.id}</div>
                <div class="col-date">${fechaFormat}</div>
                <div class="col-name">${ticket.username || 'N/A'}</div>
                <div class="col-subject t-subject"><i class="ph-fill ph-user"></i> ${ticket.titulo}</div>
                <div class="col-status t-status ${estadoClase}">${ticket.estado}</div>
                <div class="col-replier">${ticket.tecnico || '-'}</div>
                <div class="col-priority t-priority ${getPrioridadClass(ticket.prioridad)}">
                    <i class="ph-fill ph-flag"></i> ${ticket.prioridad}
                </div>
                <div class="ticket-actions">${acciones}</div>
            `;

            lista.appendChild(div);
        });
    }

    window.mostrarDetalleTicket = (ticket) => {
        const detalle = document.getElementById('ticketDetalle');
        if (!detalle) return;

        const prioClass = getPrioridadClass(ticket.prioridad);
        const estadoClass = ticket.estado === 'Pendiente' ? 'status-pendiente' : ticket.estado === 'Resuelto' ? 'status-resuelto' : 'status-nuevo';

        // Para usuarios normales: mostrar comentarios integrados en el detalle
        const comentariosHTML = rol !== 'admin' ? `
            <div style="margin-top:24px; border-top:1px solid var(--border-color); padding-top:24px;">
                <h4 style="margin:0 0 16px 0; font-size:1rem; font-weight:600; display:flex; align-items:center; gap:8px;">
                    <i class="ph ph-chat-dots" style="color:var(--text-secondary);"></i> Comentarios y Notas
                </h4>
                <div id="detalleComentarios" style="max-height:200px; overflow-y:auto; margin-bottom:16px; display:flex; flex-direction:column; gap:8px;">
                    <p style="color:var(--text-secondary); font-size:0.85rem; text-align:center;">Cargando comentarios...</p>
                </div>
                <div style="display:flex; gap:8px;">
                    <textarea id="detalleNuevoComentario" placeholder="Escribe un comentario..." style="flex:1; padding:10px 14px; border:1px solid var(--border-color); border-radius:8px; font-family:inherit; font-size:0.9rem; resize:none; height:44px; box-sizing:border-box; background:#f9fafb;"></textarea>
                    <button class="btn-primary" onclick="agregarComentarioDesdeDetalle(${ticket.id})" style="white-space:nowrap; height:44px;">
                        <i class="ph ph-paper-plane-right"></i>
                    </button>
                </div>
            </div>
        ` : '';

        detalle.innerHTML = `
            <div class="detalle-contenido" style="padding: 10px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px;">
                    <h3 style="margin: 0; font-size: 1.5rem; font-weight: 600;">${ticket.titulo}</h3>
                    <button class="close-btn" onclick="cerrarDetalle()" style="background:none; border:none; font-size:1.25rem; cursor:pointer; color:var(--text-secondary); padding:4px;"><i class="ph ph-x"></i></button>
                </div>
                <div style="display:flex; gap:12px; margin-bottom: 24px; flex-wrap: wrap;">
                    <span class="t-priority ${prioClass}" style="display:inline-flex; align-items:center; gap:6px; padding:4px 8px; border-radius:6px; font-size:0.8rem; font-weight:500;">
                        <i class="ph-fill ph-flag"></i> ${ticket.prioridad}
                    </span>
                    <span class="t-status ${estadoClass}" style="display:inline-flex; align-items:center; padding:4px 8px; border-radius:6px; font-size:0.8rem; font-weight:500;">
                        ${ticket.estado}
                    </span>
                    <span style="display:inline-flex; align-items:center; gap:6px; padding:4px 8px; border-radius:6px; background:var(--bg-surface-hover); color:var(--text-secondary); font-size:0.8rem;">
                        <i class="ph-fill ph-user"></i> ${ticket.username || 'Usuario'}
                    </span>
                </div>
                
                <div style="background:var(--bg-main); padding:16px; border-radius:8px; border:1px solid var(--border-color); min-height:80px;">
                    <p style="margin:0; font-size:0.95rem; color:var(--text-primary); line-height:1.5;">
                        ${ticket.descripcion || '<em style="color:var(--text-secondary);">Sin descripción</em>'}
                    </p>
                </div>

                ${comentariosHTML}
            
                <div style="display:flex; justify-content:${rol === 'admin' ? 'space-between' : 'flex-end'}; align-items:flex-end; margin-top:24px; border-top:1px solid var(--border-color); padding-top:24px;">
                    ${rol === 'admin' ? `
                    <div>
                        <label style="display:block; font-size:0.8rem; font-weight:500; color:var(--text-secondary); margin-bottom:8px;">Asignar Técnico</label>
                        <select id="tecnicoAsignar" class="modal-input" style="min-width:200px; margin:0;">
                            <option value="">Seleccionar técnico</option>
                        </select>
                    </div>` : ''}
                    <div style="display:flex; gap:12px;">
                        ${rol === 'admin' ? `<button class="btn-primary" onclick="asignarTecnico(${ticket.id})">Asignar</button>` : ''}
                        <button class="btn-small" onclick="cerrarDetalle()">Cerrar</button>
                    </div>
                </div>
            </div>
        `;
        detalle.style.display = 'block';
        document.getElementById('overlay').style.display = 'block';
        
        // Cargar técnicos y seleccionar el actual (admin)
        if (rol === 'admin') {
            fetch('http://localhost:3000/api/tecnicos')
                .then(res => res.json())
                .then(tecnicos => {
                    const select = document.getElementById('tecnicoAsignar');
                    if (!select) return;
                    tecnicos.forEach(t => {
                        const option = document.createElement('option');
                        option.value = t.id;
                        option.textContent = t.nombre;
                        if (t.id == ticket.tecnico_id) option.selected = true;
                        select.appendChild(option);
                    });
                });
        }

        // Cargar comentarios en el detalle (para usuarios)
        if (rol !== 'admin') {
            cargarComentariosDetalle(ticket.id);
        }
    };

    // Cargar comentarios directamente en el panel de detalle del ticket
    async function cargarComentariosDetalle(ticketId) {
        try {
            const res = await fetch(`http://localhost:3000/api/comentarios/${ticketId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const comentarios = await res.json();
            const lista = document.getElementById('detalleComentarios');
            if (!lista) return;
            lista.innerHTML = '';

            if (comentarios.length === 0) {
                lista.innerHTML = '<p style="color:var(--text-secondary); font-size:0.85rem; text-align:center; padding:16px 0;">No hay comentarios aún</p>';
                return;
            }

            comentarios.forEach(c => {
                const div = document.createElement('div');
                div.style.cssText = 'padding:10px 12px; background:var(--bg-main); border:1px solid var(--border-color); border-radius:8px;';
                div.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                        <span style="font-weight:600; font-size:0.85rem; color:var(--text-primary);">${c.username || 'Usuario'}</span>
                        <small style="color:var(--text-secondary); font-size:0.75rem;">${new Date(c.fecha).toLocaleString()}</small>
                    </div>
                    <p style="margin:0; font-size:0.9rem; color:var(--text-primary); line-height:1.4;">${c.comentario}</p>
                `;
                lista.appendChild(div);
            });
            // Scroll al último comentario
            lista.scrollTop = lista.scrollHeight;
        } catch (err) {
            // Silenciar error de carga de comentarios
        }
    }

    // Agregar comentario desde el panel de detalle
    window.agregarComentarioDesdeDetalle = async (ticketId) => {
        const input = document.getElementById('detalleNuevoComentario');
        const comentario = input?.value?.trim();
        if (!comentario) return;

        try {
            const res = await fetch('http://localhost:3000/api/comentarios', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ticket_id: ticketId, comentario })
            });

            if (!res.ok) throw new Error('Error al agregar comentario');

            input.value = '';
            cargarComentariosDetalle(ticketId);
        } catch (err) {
            mostrarMensaje(err.message, 'error');
        }
    };

    window.editarTicket = (ticket) => {
        const editForm = document.getElementById('editarTicket');
        if (!editForm) return;

        document.getElementById('editTitulo').value = ticket.titulo;
        document.getElementById('editDescripcion').value = ticket.descripcion;
        document.getElementById('editEstado').value = ticket.estado;

        // Cargar técnicos
        fetch('http://localhost:3000/api/tecnicos')
            .then(res => res.json())
            .then(tecnicos => {
                const select = document.getElementById('editTecnico');
                select.innerHTML = '<option value="">Seleccionar tecnico</option>';
                tecnicos.forEach(t => {
                    const option = document.createElement('option');
                    option.value = t.id;
                    option.textContent = t.nombre;
                    if (t.id == ticket.tecnico_id) option.selected = true;
                    select.appendChild(option);
                });
            });

        editForm.style.display = 'block';
        document.getElementById('overlay').style.display = 'block';

        // Guardar cambios
        document.getElementById('editForm').onsubmit = async (e) => {
            e.preventDefault();
            
            const titulo = document.getElementById('editTitulo').value;
            const descripcion = document.getElementById('editDescripcion').value;
            const estado = document.getElementById('editEstado').value;
            const tecnico_id = document.getElementById('editTecnico').value;

            try {
                const res = await fetch(`http://localhost:3000/api/tickets/${ticket.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ titulo, descripcion, estado, tecnico_id })
                });

                if (!res.ok) throw new Error('Error al editar ticket');
                
                cerrarEdicion();
                obtenerTickets();
            } catch (err) {
                mostrarMensaje(err.message, "error");
            }
        };
    };

    window.cerrarEdicion = () => {
        document.getElementById('editarTicket').style.display = 'none';
        document.getElementById('overlay').style.display = 'none';
    };

    window.asignarTecnico = async (ticketId) => {
        const tecnico_id = document.getElementById('tecnicoAsignar').value;
        if (!tecnico_id) {
            mostrarMensaje('Selecciona un técnico', "error");
            return;
        }

        try {
            const res = await fetch(`http://localhost:3000/api/tickets/${ticketId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ tecnico_id })
            });

            if (!res.ok) throw new Error('Error al asignar técnico');
            
            cerrarDetalle();
            obtenerTickets();
        } catch (err) {
            mostrarMensaje(err.message, "error");
        }
    };

    window.mostrarComentarios = async (ticketId) => {
        const section = document.getElementById('comentariosSection');
        section.style.display = 'block';
        document.getElementById('overlay').style.display = 'block';
        
        window.ticketIdComentario = ticketId;
        
        // Cargar comentarios
        const res = await fetch(`http://localhost:3000/api/comentarios/${ticketId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const comentarios = await res.json();
        const lista = document.getElementById('listaComentarios');
        lista.innerHTML = '';
        
        comentarios.forEach(c => {
            const div = document.createElement('div');
            div.style.cssText = 'border-bottom:1px solid #eee; padding:10px 0;';
            div.innerHTML = `
                <p><strong>${c.username || 'Usuario'}:</strong> ${c.comentario}</p>
                <small>${new Date(c.fecha).toLocaleString()}</small>
            `;
            lista.appendChild(div);
        });
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
            
            if (!res.ok) throw new Error('Error al agregar comentario');
            
            mostrarComentarios(window.ticketIdComentario);
            document.getElementById('nuevoComentario').value = '';
        } catch (err) {
            mostrarMensaje(err.message, "error");
        }
    };
    
    window.cerrarComentarios = () => {
        document.getElementById('comentariosSection').style.display = 'none';
        document.getElementById('overlay').style.display = 'none';
    };

    window.cerrarDetalle = () => {
        document.getElementById('ticketDetalle').style.display = 'none';
        document.getElementById('overlay').style.display = 'none';
    };

    window.crearTicket = async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        mostrarLoading(true, btn);

        const titulo = document.getElementById('titulo').value;
        const descripcion = document.getElementById('descripcion').value;
        const prioridad = document.getElementById('prioridad').value;
        const tecnico_id = rol === 'admin' ? document.getElementById('tecnico').value : null;

        try {
            const res = await fetch('http://localhost:3000/api/tickets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ titulo, descripcion, prioridad, tecnico_id })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al crear ticket');

            mostrarMensaje('Ticket creado correctamente', 'exito');
            obtenerTickets();
            e.target.reset();
        } catch (err) {
            mostrarMensaje(err.message, "error");
        } finally {
            mostrarLoading(false, btn);
        }
    };

    window.resolverTicket = async (id) => {
        mostrarLoading(true);
        try {
            const res = await fetch(`http://localhost:3000/api/tickets/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ estado: 'Resuelto' })
            });

            if (!res.ok) throw new Error('Error al resolver ticket');
            mostrarMensaje('Ticket resuelto correctamente', 'exito');
            obtenerTickets();
            cargarNotificaciones();
        } catch (err) {
            mostrarMensaje(err.message, "error");
        } finally {
            mostrarLoading(false);
        }
    };

    // Modal de confirmación elegante (reemplaza confirm())
    window.confirmarEliminar = (id) => {
        const modal = document.getElementById('confirmModal');
        const overlay = document.getElementById('overlay');
        if (!modal) return;
        modal.style.display = 'block';
        overlay.style.display = 'block';

        document.getElementById('confirmAceptar').onclick = async () => {
            modal.style.display = 'none';
            overlay.style.display = 'none';
            await eliminarTicket(id);
        };
        document.getElementById('confirmCancelar').onclick = () => {
            modal.style.display = 'none';
            overlay.style.display = 'none';
        };
    };

    window.eliminarTicket = async (id) => {
        mostrarLoading(true);
        try {
            const res = await fetch(`http://localhost:3000/api/tickets/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Error al eliminar ticket');
            mostrarMensaje('Ticket eliminado correctamente', 'exito');
            obtenerTickets();
        } catch (err) {
            mostrarMensaje(err.message, "error");
        } finally {
            mostrarLoading(false);
        }
    };

    async function cargarTecnicos() {
        try {
            const res = await fetch('http://localhost:3000/api/tecnicos');
            if (!res.ok) throw new Error('Error al cargar técnicos');

            const tecnicos = await res.json();
            const select = document.getElementById('tecnico');
            if (!select) return;

            tecnicos.forEach(t => {
                const option = document.createElement('option');
                option.value = t.id;
                option.textContent = t.nombre;
                select.appendChild(option);
            });
        } catch (err) {
            mostrarMensaje(err.message, "error");
        }
    }

    window.logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('rol');
        window.location.href = 'login.html';
    };

    window.estadoFiltroActual = '';

    window.filtrar = (estado) => {
        window.estadoFiltroActual = estado === 'todos' ? '' : estado;
        
        if(event && event.currentTarget) {
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            event.currentTarget.classList.add('active');
        }
        
        aplicarFiltros();
    };

    window.aplicarFiltros = async () => {
        const token = localStorage.getItem('token');
        mostrarLoading(true);
        
        const estado = window.estadoFiltroActual;
        
        let url = 'http://localhost:3000/api/tickets';
        const params = new URLSearchParams();
        if (estado) params.append('estado', estado);
        if (params.toString()) url += '?' + params.toString();
        
        try {
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const tickets = await res.json();
            mostrarTickets(tickets);
        } catch (err) {
            mostrarMensaje(err.message, "error");
        } finally {
            mostrarLoading(false);
        }
    };

    window.limpiarFiltros = () => {
        window.estadoFiltroActual = '';
        obtenerTickets();
    };

    document.getElementById('ticketForm')?.addEventListener('submit', crearTicket);

    // SPA Routing Logic
    window.cambiarVista = (viewId) => {
        document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
        
        const targetView = document.getElementById(`view-${viewId}`);
        if(targetView) {
            targetView.classList.add('active');
        } else {
            const placeholder = document.getElementById('view-placeholder');
            if(placeholder) placeholder.classList.add('active');
        }
        
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        const navItem = document.querySelector(`.nav-item[data-view="${viewId}"]`);
        if(navItem) navItem.classList.add('active');
    };

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const viewId = item.getAttribute('data-view');
            cambiarVista(viewId);
        });
    });

    // Search Logic
    const searchInput = document.getElementById('searchInput');
    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = window.allTickets.filter(t => 
                (t.titulo && t.titulo.toLowerCase().includes(query)) || 
                (t.username && t.username.toLowerCase().includes(query)) ||
                (t.id && t.id.toString().includes(query))
            );
            mostrarTickets(filtered);
            
            if(query.length > 0) {
                cambiarVista('tickets');
            }
        });
    }

    // Dark mode logic
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        if (localStorage.getItem('theme') === 'dark') {
            document.body.classList.add('dark-mode');
            darkModeToggle.innerHTML = '<i class="ph-fill ph-sun"></i>';
        }
        
        darkModeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            if (document.body.classList.contains('dark-mode')) {
                localStorage.setItem('theme', 'dark');
                darkModeToggle.innerHTML = '<i class="ph-fill ph-sun"></i>';
            } else {
                localStorage.setItem('theme', 'light');
                darkModeToggle.innerHTML = '<i class="ph ph-moon"></i>';
            }
        });
    }

    // KPIs & Calendar
    function actualizarDashboardKPIs(tickets) {
        const kpiTotal = document.getElementById('kpi-total');
        if(kpiTotal) kpiTotal.textContent = tickets.length;
        
        const pendientes = tickets.filter(t => t.estado !== 'Resuelto').length;
        const resueltos = tickets.filter(t => t.estado === 'Resuelto').length;
        
        const kpiPendientes = document.getElementById('kpi-pendientes');
        if(kpiPendientes) kpiPendientes.textContent = pendientes;
        
        const kpiResueltos = document.getElementById('kpi-resueltos');
        if(kpiResueltos) kpiResueltos.textContent = resueltos;

        // Tasa de resolución
        const kpiTasa = document.getElementById('kpi-tasa');
        if(kpiTasa) {
            const tasa = tickets.length > 0 ? Math.round((resueltos / tickets.length) * 100) : 0;
            kpiTasa.textContent = tasa + '%';
        }
        
        const cTodos = document.getElementById('count-todos');
        if(cTodos) cTodos.textContent = tickets.length;
        
        const cPendientes = document.getElementById('count-pendientes');
        if(cPendientes) cPendientes.textContent = pendientes;
        
        const cResueltos = document.getElementById('count-resueltos');
        if(cResueltos) cResueltos.textContent = resueltos;
        
        generarCalendario(tickets);
        generarActividadReciente(tickets);
    }

    // Actividad reciente con datos reales
    function generarActividadReciente(tickets) {
        const lista = document.getElementById('recentActivityList');
        if (!lista) return;

        // Ordenar por fecha más reciente
        const recientes = [...tickets]
            .filter(t => t.fecha_creacion)
            .sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion))
            .slice(0, 6);

        if (recientes.length === 0) {
            lista.innerHTML = `
                <div style="text-align:center; padding:32px 16px; color:var(--text-secondary);">
                    <i class="ph ph-clipboard-text" style="font-size:2rem; display:block; margin-bottom:8px; color:#d1d5db;"></i>
                    <p style="margin:0; font-size:0.9rem;">No hay actividad reciente</p>
                </div>
            `;
            return;
        }

        lista.innerHTML = '';
        recientes.forEach(t => {
            const ahora = new Date();
            const fecha = new Date(t.fecha_creacion);
            const diffMin = Math.round((ahora - fecha) / 60000);
            let tiempoTexto;
            if (diffMin < 1) tiempoTexto = 'Ahora';
            else if (diffMin < 60) tiempoTexto = `Hace ${diffMin} min`;
            else if (diffMin < 1440) {
                const h = Math.round(diffMin / 60);
                tiempoTexto = `Hace ${h} hora${h > 1 ? 's' : ''}`;
            } else {
                const d = Math.round(diffMin / 1440);
                tiempoTexto = `Hace ${d} día${d > 1 ? 's' : ''}`;
            }

            const iconMap = {
                'Pendiente': { icon: 'ph-clock', color: '#d97706', bg: '#fef3c7' },
                'Resuelto': { icon: 'ph-check-circle', color: '#16a34a', bg: '#dcfce7' }
            };
            const style = iconMap[t.estado] || { icon: 'ph-ticket', color: '#0284c7', bg: '#e0f2fe' };

            const item = document.createElement('div');
            item.style.cssText = 'display:flex; align-items:center; gap:12px; padding:12px 0; border-bottom:1px solid var(--border-color); cursor:pointer;';
            item.innerHTML = `
                <div style="width:36px; height:36px; border-radius:8px; background:${style.bg}; color:${style.color}; display:flex; align-items:center; justify-content:center; font-size:1.1rem; flex-shrink:0;">
                    <i class="ph-fill ${style.icon}"></i>
                </div>
                <div style="flex:1; min-width:0;">
                    <p style="margin:0; font-size:0.85rem; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                        <span style="color:var(--text-secondary);">#${t.id}</span> ${t.titulo}
                    </p>
                    <small style="color:var(--text-secondary); font-size:0.75rem;">${t.username || 'Usuario'} · ${tiempoTexto}</small>
                </div>
                <span class="t-status ${t.estado === 'Pendiente' ? 'status-pendiente' : 'status-resuelto'}" style="font-size:0.75rem; white-space:nowrap;">${t.estado}</span>
            `;
            item.onclick = () => mostrarDetalleTicket(t);
            lista.appendChild(item);
        });
    }

    function generarCalendario(tickets) {
        const grid = document.querySelector('.calendar-grid');
        if(!grid) return;
        
        const headers = Array.from(grid.querySelectorAll('.cal-day-header'));
        grid.innerHTML = '';
        headers.forEach(h => grid.appendChild(h));
        
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        
        const display = document.getElementById('monthDisplay');
        if(display) {
            const monthName = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(now);
            display.textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1);
        }
        
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        for(let i=0; i<firstDay; i++) {
            const div = document.createElement('div');
            div.className = 'cal-day';
            div.style.color = 'transparent';
            grid.appendChild(div);
        }
        
        for(let i=1; i<=daysInMonth; i++) {
            const div = document.createElement('div');
            div.className = 'cal-day';
            div.textContent = i;
            
            if(i === now.getDate()) div.classList.add('today');
            
            const dayTickets = tickets.filter(t => {
                if(!t.fecha_creacion) return false;
                const d = new Date(t.fecha_creacion);
                return d.getDate() === i && d.getMonth() === month && d.getFullYear() === year;
            });
            
            if(dayTickets.length > 0) {
                div.classList.add('has-event');
                div.title = dayTickets.map(t => `#${t.id}: ${t.titulo}`).join('\n');
                const badge = document.createElement('span');
                badge.style.cssText = 'display:block; font-size:0.65rem; background:var(--action-primary); color:white; border-radius:4px; padding:2px; margin-top:4px; font-weight:600;';
                badge.textContent = `${dayTickets.length} ticket(s)`;
                div.appendChild(badge);
            }
            
            grid.appendChild(div);
        }
    }

    // --- Sistema de Notificaciones Universal (DB) ---
    async function cargarNotificaciones() {
        try {
            // Obtener conteo de no leídas
            const countRes = await fetch('http://localhost:3000/api/notificaciones/count', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!countRes.ok) return;
            const { count } = await countRes.json();

            const badge = document.getElementById('notifBadge');
            if (badge) {
                badge.textContent = count;
                badge.style.display = count > 0 ? 'flex' : 'none';
                // Animación de pulso si hay nuevas
                if (count > 0) badge.classList.add('badge-pulse');
                else badge.classList.remove('badge-pulse');
            }

            // Obtener lista de notificaciones
            const res = await fetch('http://localhost:3000/api/notificaciones', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) return;
            const notificaciones = await res.json();

            const content = document.getElementById('notifContent');
            if (!content) return;
            content.innerHTML = '';

            if (notificaciones.length === 0) {
                content.innerHTML = `
                    <div style="padding:32px 16px; text-align:center; color:var(--text-secondary);">
                        <i class="ph ph-bell-slash" style="font-size:1.5rem; display:block; margin-bottom:8px;"></i>
                        <p style="margin:0; font-size:0.85rem;">Sin notificaciones</p>
                    </div>
                `;
                return;
            }

            notificaciones.forEach(n => {
                const fecha = new Date(n.fecha);
                const ahora = new Date();
                const diffMin = Math.round((ahora - fecha) / 60000);
                let tiempoTexto;
                if (diffMin < 1) tiempoTexto = 'Ahora';
                else if (diffMin < 60) tiempoTexto = `Hace ${diffMin} min`;
                else if (diffMin < 1440) {
                    const h = Math.round(diffMin / 60);
                    tiempoTexto = `Hace ${h}h`;
                } else {
                    const d = Math.round(diffMin / 1440);
                    tiempoTexto = `Hace ${d}d`;
                }

                // Icono según tipo
                let icon, iconColor;
                switch(n.tipo) {
                    case 'nuevo_ticket': icon = 'ph-ticket'; iconColor = '#0284c7'; break;
                    case 'estado_cambio': icon = 'ph-arrow-circle-right'; iconColor = '#16a34a'; break;
                    case 'nuevo_comentario': icon = 'ph-chat-circle-dots'; iconColor = '#9333ea'; break;
                    default: icon = 'ph-bell'; iconColor = '#6b7280'; break;
                }

                const item = document.createElement('div');
                item.className = 'notif-item' + (n.leida ? '' : ' notif-unread');
                item.innerHTML = `
                    <div style="display:flex; gap:10px; align-items:flex-start;">
                        <i class="ph-fill ${icon}" style="color:${iconColor}; font-size:1.1rem; margin-top:2px; flex-shrink:0;"></i>
                        <div style="flex:1; min-width:0;">
                            <p style="margin:0; font-size:0.83rem; line-height:1.3;">${n.mensaje}</p>
                            <small style="color:var(--text-secondary);">${tiempoTexto}</small>
                        </div>
                    </div>
                `;

                // Click en la notificación → abrir el ticket
                if (n.ticket_id) {
                    item.onclick = (e) => {
                        e.stopPropagation();
                        document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
                        // Buscar ticket en allTickets
                        const ticket = window.allTickets.find(t => t.id === n.ticket_id);
                        if (ticket) {
                            mostrarDetalleTicket(ticket);
                        } else {
                            // Si no está en allTickets (puede ser de otro usuario), ir a tickets
                            cambiarVista('tickets');
                        }
                        // Marcar como leída
                        fetch(`http://localhost:3000/api/notificaciones/${n.id}/leer`, {
                            method: 'PUT',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                    };
                }
                content.appendChild(item);
            });
        } catch (err) {
            // Silenciar error de notificaciones
        }
    }

    // Marcar todas como leídas
    const btnLeer = document.getElementById('btnMarcarLeidas');
    if (btnLeer) {
        btnLeer.addEventListener('click', async (e) => {
            e.stopPropagation();
            try {
                await fetch('http://localhost:3000/api/notificaciones/leer', {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                cargarNotificaciones();
            } catch (err) {
                // Silenciar
            }
        });
    }

    obtenerTickets();
    cargarTecnicos();
    cargarNotificaciones();

    // Refrescar notificaciones cada 30 segundos
    setInterval(cargarNotificaciones, 30000);
});
