document.addEventListener('DOMContentLoaded', function() {
    const modalOverlay = document.getElementById('modalOverlay');
    const openLogin = document.getElementById('openLogin');
    const openSignup = document.getElementById('openSignup');
    const closeModal = document.getElementById('closeModal');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const switchToSignup = document.getElementById('switchToSignup');
    const switchToLogin = document.getElementById('switchToLogin');

    function showModal(form) {
        modalOverlay.classList.add('active');
        if (form === 'login') {
            loginForm.style.display = '';
            signupForm.style.display = 'none';
        } else {
            loginForm.style.display = 'none';
            signupForm.style.display = '';
        }
        clearMessages();
    }

    openLogin.addEventListener('click', function(e) {
        e.preventDefault();
        showModal('login');
    });
    openSignup.addEventListener('click', function(e) {
        e.preventDefault();
        showModal('signup');
    });
    closeModal.addEventListener('click', function() {
        modalOverlay.classList.remove('active');
    });
    modalOverlay.addEventListener('click', function(e) {
        if (e.target === modalOverlay) {
            modalOverlay.classList.remove('active');
        }
    });
    switchToSignup.addEventListener('click', function(e) {
        e.preventDefault();
        showModal('signup');
    });
    switchToLogin.addEventListener('click', function(e) {
        e.preventDefault();
        showModal('login');
    });

    // --- Backend Connection Logic ---
    // Helper to show messages
    function showMessage(form, msg, isError = true) {
        let msgElem = form.querySelector('.form-message');
        if (!msgElem) {
            msgElem = document.createElement('div');
            msgElem.className = 'form-message';
            form.insertBefore(msgElem, form.querySelector('form'));
        }
        msgElem.textContent = msg;
        msgElem.style.color = isError ? '#c0392b' : '#27ae60';
        msgElem.style.marginBottom = '1rem';
        msgElem.style.fontWeight = '500';
        msgElem.style.fontSize = '1rem';
        msgElem.style.textAlign = 'center';
    }
    function clearMessages() {
        document.querySelectorAll('.form-message').forEach(e => e.remove());
    }

    // Login form submit
    loginForm.querySelector('form').addEventListener('submit', async function(e) {
        e.preventDefault();
        clearMessages();
        const email = this.querySelector('input[type="email"]').value.trim();
        const password = this.querySelector('input[type="password"]').value.trim();
        try {
            const res = await fetch('http://localhost:8000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (res.ok && data.token) {
                localStorage.setItem('jwt_token', data.token);
                showMessage(loginForm, 'Login successful!', false);
                setTimeout(() => {
                    modalOverlay.classList.remove('active');
                    window.location.href = 'home.html';
                }, 1000);
                // TODO: Redirect or update UI
            } else {
                showMessage(loginForm, data.error || 'Login failed.');
            }
        } catch (err) {
            showMessage(loginForm, 'Server error.');
        }
    });

    // Signup form submit
    signupForm.querySelector('form').addEventListener('submit', async function(e) {
        e.preventDefault();
        clearMessages();
        const username = this.querySelector('input[type="text"]').value.trim();
        const email = this.querySelector('input[type="email"]').value.trim();
        const passwords = this.querySelectorAll('input[type="password"]');
        const password = passwords[0].value.trim();
        const confirmPassword = passwords[1].value.trim();
        try {
            const res = await fetch('http://localhost:8000/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password, confirmPassword })
            });
            const data = await res.json();
            if (res.ok) {
                showMessage(signupForm, 'Signup successful! Please login.', false);
                setTimeout(() => { showModal('login'); }, 1200);
            } else {
                showMessage(signupForm, data.error || 'Signup failed.');
            }
        } catch (err) {
            showMessage(signupForm, 'Server error.');
        }
    });
}); 