document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('error');

    if (errorDiv) errorDiv.textContent = '';

    try {
        const res = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Error al iniciar sesión');
        }

        localStorage.setItem('token', data.token);
        localStorage.setItem('rol', data.rol);
        window.location.href = 'index.html';
    } catch (err) {
        if (errorDiv) {
            errorDiv.textContent = err.message;
        } else {
            alert(err.message);
        }
    }
});
