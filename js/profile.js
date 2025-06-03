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
        this.skillsData = null;
    }
    
    // Load all profile data
    async loadAllData() {
        try {
            await Promise.all([
                this.loadUserInfo(),
                this.loadXPData(),
                this.loadSkillsData()
            ]);
            
            return {
                userData: this.userData,
                xpData: this.xpData,
                skillsData: this.skillsData
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
    
    // Load skills data using the getUserSkills API function
    async loadSkillsData() {
        try {
            const data = await api.getUserSkills();
            
            // Extract skills from the nested structure
            if (data.user && data.user[0] && data.user[0].transactions_aggregate && 
                data.user[0].transactions_aggregate.nodes) {
                this.skillsData = data.user[0].transactions_aggregate.nodes;
            } else {
                this.skillsData = [];
            }
            
            if (this.progressInfoElement) {
                this.renderSkillsInfo();
            }
            
            return this.skillsData;
        } catch (error) {
            console.error('Error loading skills data:', error);
            
            if (this.progressInfoElement) {
                this.progressInfoElement.innerHTML = '<div class="error">Error loading skills data</div>';
            }
            
            return null;
        }
    }
    
    // Render user info to the DOM
    renderUserInfo() {
        if (!this.userData) return;
        
        this.userInfoElement.innerHTML = `
            <div class="info-row"><span>Login:</span> <strong>${this.userData.login || 'N/A'}</strong></div>
            <div class="info-row"><span>Name:</span> <strong>${this.userData.firstName || ''} ${this.userData.lastName || ''}</strong></div>
            <div class="info-row"><span>Email:</span> <strong>${this.userData.email || 'N/A'}</strong></div>
        `;
    }
    
    // Render XP info to the DOM with units (kB, MB)
    renderXPInfo() {
        if (!this.xpData) return;
        
        let totalXP = 0;
        this.xpData.forEach(t => totalXP += t.amount);
        
        // Format XP with appropriate units
        const formatXPWithUnits = (xp) => {
            if (xp >= 1000000) {
                return `${(xp / 1000000).toFixed(2)} MB`;
            } else if (xp >= 1000) {
                return `${(xp / 1000).toFixed(1)} kB`;
            } else {
                return `${xp} B`;
            }
        };
        
        let lastXPDate = 'N/A';
        if (this.xpData.length > 0) {
            const lastTransaction = this.xpData[this.xpData.length - 1];
            lastXPDate = new Date(lastTransaction.createdAt).toLocaleDateString();
        }
        
        // Calculate average XP with proper formatting
        const avgXP = this.xpData.length ? Math.round(totalXP / this.xpData.length) : 0;
        
        this.xpInfoElement.innerHTML = `
            <div class="info-row"><span>Total XP:</span> <strong>${formatXPWithUnits(totalXP)}</strong></div>
            <div class="info-row"><span>Transactions:</span> <strong>${this.xpData.length}</strong></div>
            <div class="info-row"><span>Last XP:</span> <strong>${lastXPDate}</strong></div>
            <div class="info-row"><span>Average XP per Transaction:</span> <strong>${formatXPWithUnits(avgXP)}</strong></div>
        `;
    }
    
    // Render skills info using the API data
    renderSkillsInfo() {
        if (!this.skillsData || this.skillsData.length === 0) {
            this.progressInfoElement.innerHTML = `
                <div class="info-row"><span>No skills data available</span></div>
            `;
            return;
        }
        
        // Process and format skill names
        const processedSkills = this.skillsData.map(skill => {
            let skillName = skill.type;
            if (skillName.startsWith('skill_')) {
                skillName = skillName.substring(6);
            }
            
            // Capitalize first letter
            skillName = skillName.charAt(0).toUpperCase() + skillName.slice(1);
            
            return {
                name: skillName,
                amount: skill.amount,
                originalType: skill.type
            };
        });
        
        // Sort by amount (highest first) and get top 5
        processedSkills.sort((a, b) => b.amount - a.amount);
        const topSkills = processedSkills.slice(0, 5);
        
        // Generate HTML for skills
        let skillsHTML = '';
        topSkills.forEach(skill => {
            skillsHTML += `
                <div class="info-row">
                    <span>${skill.name}:</span> 
                    <strong>${skill.amount}</strong>
                </div>
            `;
        });
        
        this.progressInfoElement.innerHTML = `
            <div class="info-row"><span>Top Skills by Amount:</span></div>
            ${skillsHTML}
        `;
    }
    
}

// Create a singleton instance
const profileManager = new ProfileManager();
export default profileManager;