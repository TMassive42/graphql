import auth from './auth.js';

class API {
    constructor() {
        this.graphqlEndpoint = 'https://learn.zone01kisumu.ke/api/graphql-engine/v1/graphql';
    }
    
    // Execute GraphQL query
    async query(queryStr, variables = {}) {
        try {
            if (!auth.isLoggedIn()) {
                throw new Error('Authentication required');
            }
            
            console.log("Executing GraphQL query:", queryStr);
            
            const response = await fetch(this.graphqlEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...auth.getAuthHeader()
                },
                body: JSON.stringify({
                    query: queryStr,
                    variables: variables
                })
            });
            
            if (!response.ok) {
                throw new Error('GraphQL request failed');
            }
            
            const data = await response.json();
            
            console.log("GraphQL response:", JSON.stringify(data));
            
            if (data.errors) {
                console.error("GraphQL errors:", JSON.stringify(data.errors));
                throw new Error(data.errors[0].message);
            }
            
            return data.data;
        } catch (error) {
            console.error('GraphQL error:', error);
            throw error;
        }
    }
    
    // Get basic user information
    async getUserInfo() {
        const query = `
        {
            user {
                id
                login
                firstName
                lastName
                email
                attrs
            }
        }`;
        
        return this.query(query);
    }
    
    // Get user XP transactions
    async getUserXP() {
        const query = `
        {
            transaction(where: {type: {_eq: "xp"}}, order_by: {createdAt: asc}) {
                id
                type
                amount
                createdAt
                path
                objectId
            }
        }`;
        
        return this.query(query);
    }
    
    // Get project-specific XP data
    async getProjectsXP() {
        const query = `
        {
            transaction(where: {type: {_eq: "xp"}}) {
                id
                amount
                objectId
                path
                createdAt
                object {
                    id
                    name
                    type
                }
            }
        }`;
        
        return this.query(query);
    }
    
    // Get user progress data
    async getUserProgress() {
        const query = `
        {
            progress {
                id
                userId
                objectId
                grade
                createdAt
                updatedAt
                path
            }
        }`;
        
        return this.query(query);
    }
    
    // Get user results with object information
    async getUserResults() {
        const query = `
        {
            result {
                id
                objectId
                userId
                grade
                type
                createdAt
                updatedAt
                path
                object {
                    id
                    name
                    type
                }
            }
        }`;
        
        return this.query(query);
    }
    
    // Get user skills data with amounts
    async getUserSkills() {
        console.log("Fetching user skills data");
        try {
            const query = `
            {
              user {
                transactions_aggregate(
                  distinct_on: type
                  where: { type: { _nin: ["xp", "level", "up", "down"] } }
                  order_by: [{ type: asc }, { amount: desc }]
                ) {
                  nodes {
                    type
                    amount
                  }
                }
              }
            }`;
            
            const result = await this.query(query);
            console.log("Skills query result:", JSON.stringify(result));
            return result;
        } catch (error) {
            console.error("Error in getUserSkills:", error);
            throw error;
        }
    }
    
    // Get audit ratio data
    async getAuditRatio() {
        const query = `
        {
            user {
                id
                login
                totalUp
                totalDown
            }
        }`;
        
        return this.query(query);
    }
    
    // Get information for a specific object by ID
    async getObjectInfo(objectId) {
        const query = `
        {
            object(where: {id: {_eq: ${objectId}}}) {
                id
                name
                type
                attrs
            }
        }`;
        
        return this.query(query);
    }
}

// Create a singleton instance
const api = new API();
export default api;