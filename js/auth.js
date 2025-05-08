class Auth {
    constructor() {
        this.JWT = localStorage.getItem('jwt') || null;
        this.baseAuthUrl = 'https://learn.zone01kisumu.ke/api/auth/signin';
        this.userId = null;
        
        // Check if token exists and parse user ID
        if (this.JWT) {
            this.parseUserId();
        }
    }
    
    // Login using either username:password or email:password
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
            
            // Store JWT in localStorage
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
    
    // Get the authentication header for API requests
    getAuthHeader() {
        return {
            'Authorization': `Bearer ${this.JWT}`
        };
    }
    
    // Check if user is logged in
    isLoggedIn() {
        return !!this.JWT;
    }
    
    // Logout user by removing JWT
    logout() {
        this.JWT = null;
        this.userId = null;
        localStorage.removeItem('jwt');
    }
}

// Create a singleton instance
const auth = new Auth();
export default auth;