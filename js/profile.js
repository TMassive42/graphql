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
        this.skillsData = null;
    }
    
    // Load all profile data
    async loadAllData() {
        try {
            await Promise.all([
                this.loadUserInfo(),
                this.loadXPData(),
                this.loadProgressData(),
                this.loadResultsData(),
                this.loadSkillsData() // Add loading skills data
            ]);
            
            return {
                userData: this.userData,
                xpData: this.xpData,
                progressData: this.progressData,
                resultsData: this.resultsData,
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
    
    // Load progress data
    async loadProgressData() {
        try {
            const data = await api.getUserProgress();
            this.progressData = data.progress;
            return this.progressData;
        } catch (error) {
            console.error('Error loading progress data:', error);
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
    
    // NEW: Load skills data from GraphQL endpoint
    async loadSkillsData() {
        try {
            // Query for predefined skills from the platform
            const query = `
            {
              skill {
                id
                name
                type
                createdAt
                user {
                  id
                  login
                }
                transactions {
                  id
                  amount
                  createdAt
                }
              }
            }`;
            
            const data = await api.query(query);
            this.skillsData = data.skill;
            
            if (this.progressInfoElement) {
                this.renderSkillsInfo();
            }
            
            return this.skillsData;
        } catch (error) {
            console.error('Error loading skills data:', error);
            
            // If skills query fails, fall back to calculated skills
            if (this.resultsData && this.progressInfoElement) {
                this.renderCalculatedSkills();
            } else if (this.progressInfoElement) {
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
            <div class="info-row"><span>ID:</span> <strong>${this.userData.id}</strong></div>
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
    
    // Render skills info using predefined platform skills
    renderSkillsInfo() {
        if (!this.skillsData || this.skillsData.length === 0) {
            // Fall back to calculated skills if no predefined skills
            this.renderCalculatedSkills();
            return;
        }
        
        // Calculate total skill amount
        let totalSkillAmount = 0;
        const skillAmounts = {};
        
        this.skillsData.forEach(skill => {
            let skillAmount = 0;
            
            // Sum up all transaction amounts for this skill
            if (skill.transactions && skill.transactions.length > 0) {
                skill.transactions.forEach(transaction => {
                    skillAmount += transaction.amount || 0;
                });
            }
            
            skillAmounts[skill.id] = skillAmount;
            totalSkillAmount += skillAmount;
        });
        
        // Convert to array with percentages and sort by amount (highest first)
        const skillsArray = this.skillsData.map(skill => ({
            id: skill.id,
            name: skill.name,
            amount: skillAmounts[skill.id] || 0,
            percentage: totalSkillAmount > 0 ? 
                ((skillAmounts[skill.id] || 0) / totalSkillAmount * 100) : 0
        }));
        
        skillsArray.sort((a, b) => b.amount - a.amount);
        
        // Get top 5 skills
        const topSkills = skillsArray.slice(0, 5);
        
        // Generate HTML for skills
        let skillsHTML = '';
        topSkills.forEach(skill => {
            // Format the skill amount with appropriate units
            const formattedAmount = this.formatXPWithUnits(skill.amount);
            
            skillsHTML += `
                <div class="info-row">
                    <span>${skill.name}:</span> 
                    <strong>${skill.percentage.toFixed(1)}% (${formattedAmount})</strong>
                </div>
            `;
        });
        
        // If no skills found
        if (topSkills.length === 0) {
            skillsHTML = `
                <div class="info-row"><span>No skills data available</span></div>
            `;
        }
        
        this.progressInfoElement.innerHTML = `
            <div class="info-row"><span>Top Skills by Percentage:</span></div>
            ${skillsHTML}
        `;
    }
    

    
    // Helper to format XP values with appropriate units
    formatXPWithUnits(xp) {
        if (xp >= 1000000) {
            return `${(xp / 1000000).toFixed(2)} MB`;
        } else if (xp >= 1000) {
            return `${(xp / 1000).toFixed(1)} kB`;
        } else {
            return `${xp} B`;
        }
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