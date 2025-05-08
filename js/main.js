import auth from './auth.js';
import api from './api.js';
import profileManager from './profile.js';
import XPGraph from './graphs/xpGraph.js';
import AuditGraph from './graphs/auditGraph.js';

class App {
    constructor() {
        // DOM Elements
        this.loginSection = document.getElementById('login-section');
        this.profileSection = document.getElementById('profile-section');
        this.loginForm = document.getElementById('login-form');
        this.loginError = document.getElementById('login-error');
        this.logoutBtn = document.getElementById('logout-btn');
        
        // Graph elements
        this.xpTab = document.getElementById('xp-tab');
        this.auditTab = document.getElementById('audit-tab');
        this.xpGraph = document.getElementById('xp-graph');
        this.auditGraph = document.getElementById('audit-graph');
        
        // Graph instances
        this.xpGraphInstance = null;
        this.auditGraphInstance = null;
        
        // Initialize event listeners
        this.initEventListeners();
        
        // Check authentication on load
        this.checkAuth();
    }
    
    // Initialize event listeners
    initEventListeners() {
        // Login form submission
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }
        
        // Logout button
        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', this.handleLogout.bind(this));
        }
        
        // Graph tabs
        if (this.xpTab && this.auditTab) {
            this.xpTab.addEventListener('click', this.switchToXPGraph.bind(this));
            this.auditTab.addEventListener('click', this.switchToAuditGraph.bind(this));
        }
    }
    
    // Check if user is authenticated
    checkAuth() {
        if (auth.isLoggedIn()) {
            this.showProfilePage();
        } else {
            this.showLoginPage();
        }
    }
    
    // Show profile page and load data
    showProfilePage() {
        this.loginSection.classList.add('hidden');
        this.profileSection.classList.remove('hidden');
        this.loadProfileData();
    }
    
    // Show login page
    showLoginPage() {
        this.loginSection.classList.remove('hidden');
        this.profileSection.classList.add('hidden');
    }
    
    // Handle login form submission
    async handleLogin(event) {
        event.preventDefault();
        this.loginError.textContent = '';
        
        const identifier = document.getElementById('identifier').value;
        const password = document.getElementById('password').value;
        
        if (!identifier || !password) {
            this.loginError.textContent = 'Please enter both identifier and password';
            return;
        }
        
        try {
            // Show loading state
            const submitBtn = this.loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Logging in...';
            submitBtn.disabled = true;
            
            // Attempt login
            await auth.login(identifier, password);
            
            // Reset form and show profile
            this.loginForm.reset();
            this.showProfilePage();
        } catch (error) {
            this.loginError.textContent = 'Invalid credentials. Please try again.';
            console.error('Login error:', error);
        } finally {
            // Reset button state
            const submitBtn = this.loginForm.querySelector('button[type="submit"]');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }
    
    // Handle logout
    handleLogout() {
        // Clear all data
        this.clearProfileData();
        
        // Logout and show login page
        auth.logout();
        this.showLoginPage();
    }
    
    // Load profile data
    async loadProfileData() {
        try {
            // Show loading indicators
            document.querySelectorAll('.card-content').forEach(el => {
                el.innerHTML = '<div class="loading">Loading...</div>';
            });
            
            // Load all profile data
            await profileManager.loadAllData();
            
            // Initialize graphs once data is loaded
            this.initializeGraphs();
        } catch (error) {
            console.error('Error loading profile data:', error);
            
            // Show error message
            document.querySelectorAll('.card-content').forEach(el => {
                el.innerHTML = '<div class="error">Error loading data. Please try again later.</div>';
            });
            
            // If error is authentication-related, return to login
            if (error.message.includes('Authentication') || error.message.includes('token')) {
                alert('Your session has expired. Please login again.');
                auth.logout();
                this.showLoginPage();
            }
        }
    }
    
    // Clear profile data when logging out
    clearProfileData() {
        // Clear DOM elements
        if (this.xpGraph) this.xpGraph.innerHTML = '';
        if (this.auditGraph) this.auditGraph.innerHTML = '';
        
        // Reset graph instances
        this.xpGraphInstance = null;
        this.auditGraphInstance = null;
    }
    
    // Initialize SVG graphs
    initializeGraphs() {
        // Initialize XP graph if container exists
        if (this.xpGraph) {
            this.xpGraphInstance = new XPGraph('xp-graph');
            this.xpGraphInstance.init();
        }
        
        // Initialize Audit graph if container exists
        if (this.auditGraph) {
            this.auditGraphInstance = new AuditGraph('audit-graph');
            this.auditGraphInstance.init();
        }
    }
    
    // Switch to XP Graph tab
    switchToXPGraph() {
        this.xpTab.classList.add('active');
        this.auditTab.classList.remove('active');
        this.xpGraph.classList.add('active-graph');
        this.auditGraph.classList.remove('active-graph');
    }
    
    // Switch to Audit Graph tab
    switchToAuditGraph() {
        this.auditTab.classList.add('active');
        this.xpTab.classList.remove('active');
        this.auditGraph.classList.add('active-graph');
        this.xpGraph.classList.remove('active-graph');
    }
    
    // Window resize handler for responsive graphs
    handleResize() {
        // Redraw graphs when window is resized
        if (this.xpGraphInstance && this.xpGraph.classList.contains('active-graph')) {
            this.xpGraphInstance.render();
        }
        
        if (this.auditGraphInstance && this.auditGraph.classList.contains('active-graph')) {
            this.auditGraphInstance.render();
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    
    // Add window resize handler for responsive graphs
    window.addEventListener('resize', app.handleResize.bind(app));
});

// Export app class for potential use in other modules
export default App;