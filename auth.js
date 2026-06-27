// Authentication Management (Supabase)

class AuthManager {
    constructor() {
        this.user = null;
        this.init();
    }

    init() {
        // Check if Supabase client is loaded
        if (typeof supabaseClient === 'undefined') {
            console.error('Supabase not loaded. Check supabase-config.js');
            this.showMessage('error', 'loginError', 'Supabase configuration missing. Please setup Supabase first.');
            return;
        }

        this.setupEventListeners();
        this.checkAuthState();
    }

    setupEventListeners() {
        // Login
        document.getElementById('loginBtn')?.addEventListener('click', () => this.login());
        document.getElementById('loginEmail')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });
        document.getElementById('loginPassword')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });

        // Register
        document.getElementById('registerBtn')?.addEventListener('click', () => this.register());
        document.getElementById('registerConfirmPassword')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.register();
        });
    }

    async login() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            this.showMessage('error', 'loginError', 'Please fill in all fields');
            return;
        }

        this.setLoading(true);

        try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;

            this.user = data.user;
            this.showMessage('success', 'loginForm', 'Login successful! Redirecting...');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } catch (error) {
            this.handleAuthError(error, 'loginError');
        } finally {
            this.setLoading(false);
        }
    }

    async register() {
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;

        // Validation
        if (!name || !email || !password || !confirmPassword) {
            this.showMessage('error', 'registerError', 'Please fill in all fields');
            return;
        }

        if (password.length < 6) {
            this.showMessage('error', 'registerError', 'Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            this.showMessage('error', 'registerError', 'Passwords do not match');
            return;
        }

        this.setLoading(true);

        try {
            // Create user - name disimpan dalam user_metadata
            // (akan disalin ke table 'profiles' secara automatik oleh DB trigger - lihat supabase-schema.sql)
            const { data, error } = await supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: name
                    }
                }
            });

            if (error) throw error;

            this.user = data.user;

            // Kalau email confirmation dimatikan di Supabase, session terus wujud & redirect terus.
            // Kalau email confirmation diaktifkan, data.session akan null - user perlu sahkan email dulu.
            if (data.session) {
                this.showMessage('success', 'registerForm', 'Account created successfully! Redirecting...');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } else {
                this.showMessage('success', 'registerForm', 'Account created! Please check your email to confirm before logging in.');
            }
        } catch (error) {
            this.handleAuthError(error, 'registerError');
        } finally {
            this.setLoading(false);
        }
    }

    checkAuthState() {
        // Dapatkan session semasa (kalau ada)
        supabaseClient.auth.getSession().then(({ data: { session } }) => {
            this.handleSessionChange(session);
        });

        // Dengar perubahan auth state (login/logout/token refresh)
        supabaseClient.auth.onAuthStateChange((event, session) => {
            this.handleSessionChange(session);
        });
    }

    handleSessionChange(session) {
        if (session) {
            this.user = session.user;
            // User sudah login, redirect ke app utama kalau masih di auth.html
            if (window.location.pathname.includes('auth.html')) {
                window.location.href = 'index.html';
            }
        } else {
            this.user = null;
        }
    }

    async logout() {
        try {
            const { error } = await supabaseClient.auth.signOut();
            if (error) throw error;
            this.user = null;
            window.location.href = 'auth.html';
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    handleAuthError(error, elementId) {
        let message = error.message || 'An error occurred';

        // Mesej yang lebih mesra untuk error code Supabase yang biasa
        if (message.includes('Invalid login credentials')) {
            message = 'Email atau password salah';
        } else if (message.includes('User already registered')) {
            message = 'Email sudah didaftarkan';
        } else if (message.includes('Password should be at least')) {
            message = 'Password terlalu lemah / pendek';
        } else if (message.includes('Unable to validate email address')) {
            message = 'Format email tidak sah';
        }

        this.showMessage('error', elementId, message);
    }

    showMessage(type, elementId, message) {
        const element = document.getElementById(elementId);
        if (!element) return;

        if (type === 'error') {
            element.textContent = message;
            element.classList.add('show');
            setTimeout(() => {
                element.classList.remove('show');
            }, 5000);
        } else if (type === 'success') {
            const successDiv = document.createElement('div');
            successDiv.className = 'success-message show';
            successDiv.textContent = message;
            element.parentElement.appendChild(successDiv);
        }
    }

    setLoading(loading) {
        const loadingState = document.getElementById('loadingState');
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');

        if (loading) {
            loadingState?.classList.add('show');
            if (loginBtn) loginBtn.disabled = true;
            if (registerBtn) registerBtn.disabled = true;
        } else {
            loadingState?.classList.remove('show');
            if (loginBtn) loginBtn.disabled = false;
            if (registerBtn) registerBtn.disabled = false;
        }
    }
}

// Global function to switch forms
function switchForm(formName) {
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    document.getElementById(formName + 'Form').classList.add('active');
}

// Initialize Auth Manager
const authManager = new AuthManager();
