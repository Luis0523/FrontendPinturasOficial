/**
 * Controlador de Autenticación
 * Maneja la lógica del formulario de login
 */

const AuthController = {
    /**
     * Inicializar el controlador
     */
    init() {
        this.loginForm = document.getElementById('loginForm');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.rememberMeCheckbox = document.getElementById('rememberMe');
        this.submitButton = document.getElementById('submitButton');

        this.setupEventListeners();
        this.checkExistingSession();
        this.loadRememberedEmail();
    },

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Limpiar errores al escribir
        [this.emailInput, this.passwordInput].forEach(input => {
            if (input) {
                input.addEventListener('input', () => {
                    Validator.clearError(input);
                });
            }
        });
    },

    /**
     * Verificar si ya hay sesión activa
     */
    checkExistingSession() {
        if (AuthService.isAuthenticated() && !AuthService.isTokenExpired()) {
            window.location.href = '/views/dashboard/index.html';
        }
    },

    /**
     * Cargar email guardado si "Recordarme" estaba activado
     */
    loadRememberedEmail() {
        const rememberedEmail = localStorage.getItem('rememberedEmail');
        if (rememberedEmail && this.emailInput) {
            this.emailInput.value = rememberedEmail;
            if (this.rememberMeCheckbox) {
                this.rememberMeCheckbox.checked = true;
            }
        }
    },

    /**
     * Validar formulario
     */
    validateForm() {
        let isValid = true;

        // Validar email
        const emailError = Validator.required(this.emailInput.value, 'Email') || 
                          Validator.email(this.emailInput.value);
        if (emailError) {
            Validator.showError(this.emailInput, emailError);
            isValid = false;
        }

        // Validar password
        const passwordError = Validator.required(this.passwordInput.value, 'Contraseña');
        if (passwordError) {
            Validator.showError(this.passwordInput, passwordError);
            isValid = false;
        }

        return isValid;
    },

    /**
     * Manejar submit del formulario
     */
    async handleLogin(event) {
        event.preventDefault();

        // Limpiar alertas previas
        Alerts.clearInline('alert-container');

        // Validar formulario
        if (!this.validateForm()) {
            return;
        }

        // Obtener valores
        const email = this.emailInput.value.trim();
        const password = this.passwordInput.value;
        const rememberMe = this.rememberMeCheckbox ? this.rememberMeCheckbox.checked : false;

        // Mostrar loader en el botón
        Loader.showInButton(this.submitButton, 'Iniciando sesión...');

        try {
            // Llamar al servicio de login
            const response = await AuthService.login(email, password);

            if (response.success) {
                // Guardar token y usuario
                Storage.setSession(response.token, response.user);

                // Guardar email si "Recordarme" está activo
                if (rememberMe) {
                    localStorage.setItem('rememberedEmail', email);
                } else {
                    localStorage.removeItem('rememberedEmail');
                }

                // Mostrar mensaje de éxito
                Alerts.success('¡Bienvenido! Redirigiendo...');

                // Redirigir al dashboard
                setTimeout(() => {
                    window.location.href = '/views/dashboard/index.html';
                }, 1000);
            } else {
                throw new Error(response.message || 'Error al iniciar sesión');
            }
        } catch (error) {
            // Mostrar error
            Alerts.showInline('alert-container', error.message, 'danger');
            Loader.hideInButton(this.submitButton);
        }
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    AuthController.init();
});