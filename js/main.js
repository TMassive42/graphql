import auth from './auth.js';
import profileManager from './profile.js';
import XPGraph from './graphs/xpGraph.js';
import AuditGraph from './graphs/auditGraph.js';

class App {
    constructor() {
        // DOM Elements
        this.loginSection = document.getElementById('login-section');
        this.profileSection = document.getElementById('profile-section');
        this.logoutBtn = document.getElementById('logout-btn');
        
        // Graph elements
        this.xpTab = document.getElementById('xp-tab');
        this.auditTab = document.getElementById('audit-tab');
        this.xpGraph = document.getElementById('xp-graph');
        this.auditGraph = document.getElementById('audit-graph');
        
        // Graph instances
        this.xpGraphInstance = null;
        this.auditGraphInstance = null;
        
        // Set up authentication callbacks
        auth.setCallbacks(
            this.onLoginSuccess.bind(this),
            this.onLogout.bind(this)
        );
        
        auth.initializeLoginForm();
        this.initEventListeners();
        this.checkAuth();
    }
    
    // Initialize event listeners
    initEventListeners() {

        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', () => auth.logout());
        }
        
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
    
    onLoginSuccess() {
        this.showProfilePage();
    }
    
    onLogout() {
        this.clearProfileData();
        this.showLoginPage();
    }
    
    showProfilePage() {
        this.loginSection.classList.add('hidden');
        this.profileSection.classList.remove('hidden');
        this.loadProfileData();
    }

    showLoginPage() {
        this.loginSection.classList.remove('hidden');
        this.profileSection.classList.add('hidden');
    }
    
    // Load profile data
    async loadProfileData() {
        try {
            // Show loading indicators
            document.querySelectorAll('.card-content').forEach(el => {
                el.innerHTML = '<div class="loading">Loading...</div>';
            });
            
            await profileManager.loadAllData();
            
            // Initialize graphs once data is loaded
            this.initializeGraphs();
        } catch (error) {
            console.error('Error loading profile data:', error);
            
            document.querySelectorAll('.card-content').forEach(el => {
                el.innerHTML = '<div class="error">Error loading data. Please try again later.</div>';
            });
            
            if (error.message.includes('Authentication') || error.message.includes('token')) {
                alert('Your session has expired. Please login again.');
                auth.logout();
            }
        }
    }
    
    clearProfileData() {
        // Clear DOM elements
        if (this.xpGraph) this.xpGraph.innerHTML = '';
        if (this.auditGraph) this.auditGraph.innerHTML = '';
        
        // Reset graph instances
        this.xpGraphInstance = null;
        this.auditGraphInstance = null;
    }
    
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

    window.addEventListener('resize', app.handleResize.bind(app));
});

export default App;