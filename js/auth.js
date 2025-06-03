class Auth {
    constructor() {
        this.JWT = localStorage.getItem('jwt') || null;
        this.baseAuthUrl = 'https://learn.zone01kisumu.ke/api/auth/signin';
        this.userId = null;
        
        // DOM elements
        this.loginForm = null;
        this.loginError = null;
        this.passwordInput = null;
        this.passwordToggle = null;
        
        // Check if token exists and parse user ID
        if (this.JWT) {
            this.parseUserId();
        }
    }
    
    // Initialize DOM elements and event listeners
    initializeLoginForm() {
        this.loginForm = document.getElementById('login-form');
        this.loginError = document.getElementById('login-error');
        this.passwordInput = document.getElementById('password');
        this.passwordToggle = document.getElementById('password-toggle');
        
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }
        
        if (this.passwordToggle) {
            this.passwordToggle.addEventListener('click', this.togglePasswordVisibility.bind(this));
        }
    }
    
    // Handle login form submission
    async handleLogin(event) {
        event.preventDefault();
        this.clearError();
        
        const identifier = document.getElementById('identifier').value;
        const password = document.getElementById('password').value;
        
        if (!identifier || !password) {
            this.showError('Please enter both identifier and password');
            return;
        }
        
        const submitBtn = this.loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        try {
            submitBtn.textContent = 'Logging in...';
            submitBtn.disabled = true;
            
            const success = await this.login(identifier, password);
            
            if (success) {
                this.loginForm.reset();
                // Trigger login success callback
                if (this.onLoginSuccess) {
                    this.onLoginSuccess();
                }
            }
        } catch (error) {
            this.showError('Invalid credentials. Please try again.');
            console.error('Login error:', error);
            
            // Reset button state on error
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }
    
    async login(identifier, password) {
        try {
            // Create base64 encoded credentials
            const credentials = btoa(`${identifier}:${password}`);
            
            const response = await fetch(this.baseAuthUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${credentials}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Invalid credentials');
            }
            
            const data = await response.json();
            this.JWT = data;
            
            localStorage.setItem('jwt', this.JWT);
            
            // Parse user ID from JWT
            this.parseUserId();
            
            return true;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }
    
    // Parse JWT to get user ID
    parseUserId() {
        try {
            if (!this.JWT) return null;
            
            // JWT structure: header.payload.signature
            const payload = this.JWT.split('.')[1];
            const decodedPayload = JSON.parse(atob(payload));
            
            this.userId = decodedPayload.sub || null;
            return this.userId;
        } catch (error) {
            console.error('Error parsing JWT:', error);
            return null;
        }
    }
    
    // Toggle password visibility
    togglePasswordVisibility() {
        if (this.passwordInput.type === 'password') {
            this.passwordInput.type = 'text';
            this.passwordToggle.textContent = 'Hide';
        } else {
            this.passwordInput.type = 'password';
            this.passwordToggle.textContent = 'Show';
        }
    }
    
    resetLoginForm() {
        this.clearError();
        
        // Reset form fields
        if (this.loginForm) {
            this.loginForm.reset();
        }
        
        // Reset password visibility
        if (this.passwordInput && this.passwordToggle) {
            this.passwordInput.type = 'password';
            this.passwordToggle.textContent = 'Show';
        }
        
        // Reset submit button state
        const submitBtn = this.loginForm?.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = 'Login';
            submitBtn.disabled = false;
        }
    }
    
    showError(message) {
        if (this.loginError) {
            this.loginError.textContent = message;
        }
    }
    
    clearError() {
        if (this.loginError) {
            this.loginError.textContent = '';
        }
    }
    
    // Get the authentication header for API requests
    getAuthHeader() {
        return {
            'Authorization': `Bearer ${this.JWT}`
        };
    }
    
    isLoggedIn() {
        return !!this.JWT;
    }
    
    logout() {
        this.JWT = null;
        this.userId = null;
        localStorage.removeItem('jwt');
        
        this.resetLoginForm();
        
        // Trigger logout callback
        if (this.onLogout) {
            this.onLogout();
        }
    }
    
    // Set callback functions
    setCallbacks(onLoginSuccess, onLogout) {
        this.onLoginSuccess = onLoginSuccess;
        this.onLogout = onLogout;
    }
}

// Create a singleton instance
const auth = new Auth();
export default auth;