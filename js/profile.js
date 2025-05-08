import api from './api.js';

class ProfileManager {
    constructor() {
        // DOM elements
        this.userInfoElement = document.getElementById('user-info');
        this.xpInfoElement = document.getElementById('xp-info');
        this.progressInfoElement = document.getElementById('progress-info');
        
        // Data storage
        this.userData = null;
        this.xpData = null;
        this.progressData = null;
        this.resultsData = null;
    }
    
    // Load all profile data
    async loadAllData() {
        try {
            await Promise.all([
                this.loadUserInfo(),
                this.loadXPData(),
                this.loadProgressData(),
                this.loadResultsData()
            ]);
            
            return {
                userData: this.userData,
                xpData: this.xpData,
                progressData: this.progressData,
                resultsData: this.resultsData
            };
        } catch (error) {
            console.error('Error loading profile data:', error);
            throw error;
        }
    }
    
    // Load and render user info
    async loadUserInfo() {
        try {
            const data = await api.getUserInfo();
            this.userData = data.user[0];
            
            if (this.userInfoElement) {
                this.renderUserInfo();
            }
            
            return this.userData;
        } catch (error) {
            console.error('Error loading user info:', error);
            if (this.userInfoElement) {
                this.userInfoElement.innerHTML = '<div class="error">Error loading user data</div>';
            }
            throw error;
        }
    }
    
    // Load and render XP data
    async loadXPData() {
        try {
            const data = await api.getUserXP();
            this.xpData = data.transaction;
            
            if (this.xpInfoElement) {
                this.renderXPInfo();
            }
            
            return this.xpData;
        } catch (error) {
            console.error('Error loading XP data:', error);
            if (this.xpInfoElement) {
                this.xpInfoElement.innerHTML = '<div class="error">Error loading XP data</div>';
            }
            throw error;
        }
    }
    
    // Load progress data
    async loadProgressData() {
        try {
            const data = await api.getUserProgress();
            this.progressData = data.progress;
            
            if (this.progressInfoElement) {
                this.renderProgressInfo();
            }
            
            return this.progressData;
        } catch (error) {
            console.error('Error loading progress data:', error);
            if (this.progressInfoElement) {
                this.progressInfoElement.innerHTML = '<div class="error">Error loading progress data</div>';
            }
            throw error;
        }
    }
    
    // Load results data (with nested object info)
    async loadResultsData() {
        try {
            const data = await api.getUserResults();
            this.resultsData = data.result;
            return this.resultsData;
        } catch (error) {
            console.error('Error loading results data:', error);
            throw error;
        }
    }
    
    // Render user info to the DOM
    renderUserInfo() {
        if (!this.userData) return;
        
        this.userInfoElement.innerHTML = `
            <div class="info-row"><span>Login:</span> <strong>${this.userData.login || 'N/A'}</strong></div>
            <div class="info-row"><span>Name:</span> <strong>${this.userData.firstName || ''} ${this.userData.lastName || ''}</strong></div>
            <div class="info-row"><span>Email:</span> <strong>${this.userData.email || 'N/A'}</strong></div>
            <div class="info-row"><span>ID:</span> <strong>${this.userData.id}</strong></div>
        `;
    }
    
    // Render XP info to the DOM
    renderXPInfo() {
        if (!this.xpData) return;
        
        let totalXP = 0;
        this.xpData.forEach(t => totalXP += t.amount);
        
        let lastXPDate = 'N/A';
        if (this.xpData.length > 0) {
            const lastTransaction = this.xpData[this.xpData.length - 1];
            lastXPDate = new Date(lastTransaction.createdAt).toLocaleDateString();
        }
        
        this.xpInfoElement.innerHTML = `
            <div class="info-row"><span>Total XP:</span> <strong>${totalXP.toLocaleString()}</strong></div>
            <div class="info-row"><span>Transactions:</span> <strong>${this.xpData.length}</strong></div>
            <div class="info-row"><span>Last XP:</span> <strong>${lastXPDate}</strong></div>
            <div class="info-row"><span>Average XP per Transaction:</span> <strong>${this.xpData.length ? Math.round(totalXP / this.xpData.length).toLocaleString() : 0}</strong></div>
        `;
    }
    
    // Render progress info to the DOM
    renderProgressInfo() {
        if (!this.progressData) return;
        
        const passCount = this.progressData.filter(p => p.grade > 0).length;
        const failCount = this.progressData.filter(p => p.grade === 0).length;
        const passRatio = (passCount / (passCount + failCount) * 100) || 0;
        
        // Group progress by path to show distribution
        const pathCount = {};
        this.progressData.forEach(item => {
            const path = item.path.split('/')[1] || 'unknown'; // Get category from path
            pathCount[path] = (pathCount[path] || 0) + 1;
        });
        
        // Get top 2 paths
        const topPaths = Object.entries(pathCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2)
            .map(([path, count]) => `${path} (${count})`);
        
        this.progressInfoElement.innerHTML = `
            <div class="info-row"><span>Projects Attempted:</span> <strong>${this.progressData.length}</strong></div>
            <div class="info-row"><span>Projects Passed:</span> <strong>${passCount}</strong></div>
            <div class="info-row"><span>Projects Failed:</span> <strong>${failCount}</strong></div>
            <div class="info-row"><span>Pass Rate:</span> <strong>${passRatio.toFixed(1)}%</strong></div>
            <div class="info-row"><span>Top Categories:</span> <strong>${topPaths.join(', ') || 'N/A'}</strong></div>
        `;
    }
    
    // Calculate XP by project category
    getXPByCategory() {
        if (!this.xpData) return {};
        
        const categoryXP = {};
        
        this.xpData.forEach(transaction => {
            const pathParts = transaction.path.split('/');
            if (pathParts.length >= 2) {
                const category = pathParts[1]; // Get second part of path as category
                categoryXP[category] = (categoryXP[category] || 0) + transaction.amount;
            }
        });
        
        return categoryXP;
    }
    
    // Get pass/fail ratio for projects
    getProjectRatio() {
        if (!this.resultsData) return { pass: 0, fail: 0 };
        
        // Filter for just project results (not exercises)
        const projectResults = this.resultsData.filter(r => 
            r.object && r.object.type === 'project'
        );
        
        const pass = projectResults.filter(r => r.grade > 0).length;
        const fail = projectResults.filter(r => r.grade === 0).length;
        
        return { pass, fail, total: pass + fail };
    }
}

// Create a singleton instance
const profileManager = new ProfileManager();
export default profileManager;