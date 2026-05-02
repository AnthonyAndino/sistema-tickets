async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const error = document.getElementById('error');

    error.innerHTML = "";

    const res = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (data.token) {
        localStorage.setItem('token', data.token);
        window.location.href = 'index.html';
    } else {
        error.innerHTML = "Usuario o contraseña incorrectos";
    }
}