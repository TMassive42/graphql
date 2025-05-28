import api from '../api.js';

class AuditGraph {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.margin = 60; // Increased margin for better spacing
        this.data = null;
        this.updateDimensions();
    }
    
    updateDimensions() {
        // Get container width and calculate responsive dimensions
        const containerWidth = this.container.offsetWidth || 500;
        const size = Math.min(containerWidth, 500);
        this.width = size;
        this.height = size;
        
        // Adjust margin for smaller screens
        if (this.width < 400) {
            this.margin = 40;
        }
    }
    
    async loadData() {
        try {
            const result = await api.getAuditRatio();
            this.data = result.user[0];
            return this.data;
        } catch (error) {
            console.error('Error loading audit data:', error);
            throw error;
        }
    }
    
    render() {
        if (!this.data) {
            console.error('No data available for graph');
            return;
        }
        
        // Clear previous graph
        this.container.innerHTML = '';
        
        // Calculate audit values in MB
        const totalUp = this.data.totalUp / 1000000 || 0; // Convert to MB
        const totalDown = this.data.totalDown / 1000000 || 0; // Convert to MB
        const total = totalUp + totalDown;
        const ratio = totalDown > 0 ? +(totalUp / totalDown).toFixed(1) : 0; // Calculate actual ratio
        
        // Data for pie chart
        const pieData = [
            { label: 'Audits Done (Up)', value: totalUp, color: '#4CAF50' },
            { label: 'Audits Received (Down)', value: totalDown, color: '#2196F3' }
        ];
        
        // Create SVG element
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', this.width);
        svg.setAttribute('height', this.height);
        svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
        
        // Add title
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        title.setAttribute('x', this.width / 2);
        title.setAttribute('y', 30);
        title.setAttribute('text-anchor', 'middle');
        title.setAttribute('font-weight', 'bold');
        title.setAttribute('font-size', '18px');
        title.textContent = 'Audit Ratio';
        svg.appendChild(title);
        
        // Add username
        const username = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        username.setAttribute('x', this.width / 2);
        username.setAttribute('y', 55);
        username.setAttribute('text-anchor', 'middle');
        username.setAttribute('font-size', '14px');
        username.textContent = `User: ${this.data.login}`;
        svg.appendChild(username);
        
        // Create pie chart group and center it
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('transform', `translate(${this.width / 2},${this.height / 2})`);
        svg.appendChild(g);
        
        // Calculate radius (slightly reduced to prevent label overlap)
        const radius = Math.min(this.width, this.height) / 2 - this.margin;
        
        // Create arcs for pie chart
        let startAngle = 0;
        
        pieData.forEach((slice, i) => {
            if (slice.value === 0) return; // Skip zero values
            
            // Calculate angles
            const sliceAngle = (slice.value / total) * 2 * Math.PI;
            const endAngle = startAngle + sliceAngle;
            
            // Calculate arc path
            const x1 = radius * Math.sin(startAngle);
            const y1 = -radius * Math.cos(startAngle);
            const x2 = radius * Math.sin(endAngle);
            const y2 = -radius * Math.cos(endAngle);
            
            // Determine arc type (large or small)
            const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;
            
            // Create path for slice
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', `M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`);
            path.setAttribute('fill', slice.color);
            path.setAttribute('stroke', 'white');
            path.setAttribute('stroke-width', 2);
            
            // Hover effect with animation
            path.addEventListener('mouseover', () => {
                // Push slice outward slightly
                const midAngle = startAngle + sliceAngle / 2;
                const pushDistance = 15;
                const translateX = Math.sin(midAngle) * pushDistance;
                const translateY = -Math.cos(midAngle) * pushDistance;
                
                path.setAttribute('transform', `translate(${translateX} ${translateY})`);
                path.setAttribute('stroke-width', 3);
                
                // Show percentage in center
                const percentage = Math.round((slice.value / total) * 100);
                percentageText.textContent = `${percentage}%`;
                percentageLabelText.textContent = slice.label;
            });
            
            path.addEventListener('mouseout', () => {
                path.setAttribute('transform', '');
                path.setAttribute('stroke-width', 2);
                percentageText.textContent = ratio.toFixed(1);
                percentageLabelText.textContent = 'Audit Ratio';
            });
            
            g.appendChild(path);
            
            // We're removing the labels that were previously added outside the pie chart
            // This was done at the request of the user to only use the legend
            
            startAngle = endAngle;
        });
        
        // Add ratio in center
        const percentageText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        percentageText.setAttribute('x', 0);
        percentageText.setAttribute('y', 5);
        percentageText.setAttribute('text-anchor', 'middle');
        percentageText.setAttribute('font-weight', 'bold');
        percentageText.setAttribute('font-size', '30px'); // Increased size for visibility
        percentageText.textContent = ratio.toFixed(1); // Display ratio as 1.3
        g.appendChild(percentageText);
        
        // Add ratio label
        const percentageLabelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        percentageLabelText.setAttribute('x', 0);
        percentageLabelText.setAttribute('y', 30);
        percentageLabelText.setAttribute('text-anchor', 'middle');
        percentageLabelText.setAttribute('font-size', '14px');
        percentageLabelText.textContent = 'Audit Ratio';
        g.appendChild(percentageLabelText);
        
        // Add legend positioned at bottom-left corner, pushed further down
        const legendG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        legendG.setAttribute('transform', `translate(${30},${this.height - 40})`); // Pushed much further down
        
        pieData.forEach((item, i) => {
            const legendRow = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            legendRow.setAttribute('transform', `translate(0, ${i * 25})`);
            
            const legendColor = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            legendColor.setAttribute('width', 20);
            legendColor.setAttribute('height', 20);
            legendColor.setAttribute('fill', item.color);
            legendRow.appendChild(legendColor);
            
            const legendText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            legendText.setAttribute('x', 30);
            legendText.setAttribute('y', 15);
            legendText.textContent = `${item.label}: ${item.value.toFixed(2)} MB`;
            legendRow.appendChild(legendText);
            
            legendG.appendChild(legendRow);
        });
        
        svg.appendChild(legendG);
        
        // Add animation for initial render
        pieData.forEach((slice, i) => {
            const paths = g.getElementsByTagName('path');
            if (paths[i]) {
                // Add simple fade-in animation
                paths[i].style.opacity = 0;
                setTimeout(() => {
                    paths[i].style.transition = 'opacity 0.5s ease-in';
                    paths[i].style.opacity = 1;
                }, i * 200);
            }
        });
        
        // Add the SVG to the container
        this.container.appendChild(svg);
    }
    
    async init() {
        await this.loadData();
        this.render();
    }
}

export default AuditGraph;