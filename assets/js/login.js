document.addEventListener('DOMContentLoaded', function() {
    const loginBtn = document.getElementById('login-btn');
    const loginModal = document.getElementById('login-modal');
    const loginModalClose = document.querySelector('.login-modal-close');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    // Open modal on login button click
    if (loginBtn) {
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            loginModal.classList.add('show');
            emailInput.focus();
        });
    }

    // Close modal on close button click
    if (loginModalClose) {
        loginModalClose.addEventListener('click', function() {
            loginModal.classList.remove('show');
            loginError.textContent = '';
            loginForm.reset();
        });
    }

    // Close modal on outside click
    window.addEventListener('click', function(e) {
        if (e.target === loginModal) {
            loginModal.classList.remove('show');
            loginError.textContent = '';
            loginForm.reset();
        }
    });

    // Handle form submission
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();

            // Clear previous error message
            loginError.textContent = '';

            // Validate inputs
            if (!email || !password) {
                loginError.textContent = 'Wrong Email or Password';
                return;
            }

            // Show error message (as requested in the task)
            loginError.textContent = 'Wrong Email or Password';
            
            // Clear form
            loginForm.reset();
            emailInput.focus();
        });
    }
});
