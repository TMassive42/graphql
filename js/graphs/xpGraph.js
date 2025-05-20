import api from '../api.js';

class XPGraph {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.width = 800;
        this.height = 400;
        this.margin = { top: 40, right: 60, bottom: 70, left: 80 }; // Increased margins for better label spacing
        this.data = [];
    }
    
    async loadData() {
        try {
            const result = await api.getUserXP();
            this.data = result.transaction;
            
            // Calculate cumulative XP over time
            let cumulativeXP = 0;
            this.processedData = this.data.map(item => {
                cumulativeXP += item.amount;
                return {
                    date: new Date(item.createdAt),
                    amount: item.amount,
                    cumulativeXP: cumulativeXP,
                    path: item.path
                };
            });
            
            return this.processedData;
        } catch (error) {
            console.error('Error loading XP data:', error);
            throw error;
        }
    }
    
    // Helper to format XP values with appropriate units
    formatXPValue(xp) {
        if (xp >= 1000000) {
            return `${(xp / 1000000).toFixed(2)} MB`;
        } else if (xp >= 1000) {
            return `${(xp / 1000).toFixed(1)} kB`;
        } else {
            return `${xp} B`;
        }
    }
    
    // Return raw value in kB for numerical calculations
    getXPValueInKB(xp) {
        return xp / 1000;
    }
    
    render() {
        if (!this.processedData || this.processedData.length === 0) {
            console.error('No data available for graph');
            return;
        }
        
        const width = this.width - this.margin.left - this.margin.right;
        const height = this.height - this.margin.top - this.margin.bottom;
        
        // Clear previous graph
        this.container.innerHTML = '';
        
        // Create SVG element
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', this.width);
        svg.setAttribute('height', this.height);
        svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
        
        // Create graph group and translate it
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('transform', `translate(${this.margin.left},${this.margin.top})`);
        svg.appendChild(g);
        
        // Calculate scales
        const xDomain = [
            this.processedData[0].date,
            this.processedData[this.processedData.length - 1].date
        ];
        
        // Get max value for Y domain in kB - find the actual max value
        const maxXP = Math.max(...this.processedData.map(d => d.cumulativeXP));
        const maxXPInKB = maxXP / 1000;
        // Round up to a nice number for the y-axis scale
        const yMaxValue = Math.ceil(maxXPInKB / 500) * 500; // Round to nearest 500 kB
        
        const yDomain = [0, yMaxValue]; // Dynamic scale based on actual data
        
        // X scale (time)
        const xScale = value => {
            const domainRange = xDomain[1].getTime() - xDomain[0].getTime();
            const percent = (value.getTime() - xDomain[0].getTime()) / domainRange;
            return percent * width;
        };
        
        // Y scale (XP in kB)
        const yScale = value => {
            const percent = value / yDomain[1];
            return height - (percent * height);
        };
        
        // Draw X axis
        const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        xAxis.setAttribute('class', 'x-axis');
        xAxis.setAttribute('transform', `translate(0,${height})`);
        
        // X axis line
        const xAxisLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        xAxisLine.setAttribute('x1', 0);
        xAxisLine.setAttribute('y1', 0);
        xAxisLine.setAttribute('x2', width);
        xAxisLine.setAttribute('y2', 0);
        xAxisLine.setAttribute('stroke', '#333');
        xAxisLine.setAttribute('stroke-width', 2);
        xAxis.appendChild(xAxisLine);
        
        // X axis label
        const xLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        xLabel.setAttribute('x', width / 2);
        xLabel.setAttribute('y', 50); // Increased from 40 to provide more space
        xLabel.setAttribute('text-anchor', 'middle');
        xLabel.setAttribute('font-weight', 'bold');
        xLabel.textContent = 'Time';
        xAxis.appendChild(xLabel);
        
        // X axis ticks - distribute evenly
        const numTimePoints = 6; // Number of time points to show
        const timeDelta = (xDomain[1].getTime() - xDomain[0].getTime()) / (numTimePoints - 1);
        
        for (let i = 0; i < numTimePoints; i++) {
            const tickDate = new Date(xDomain[0].getTime() + (timeDelta * i));
            const x = xScale(tickDate);
            
            // Tick line
            const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            tick.setAttribute('x1', x);
            tick.setAttribute('y1', 0);
            tick.setAttribute('x2', x);
            tick.setAttribute('y2', 5);
            tick.setAttribute('stroke', '#333');
            xAxis.appendChild(tick);
            
            // Tick label
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', x);
            label.setAttribute('y', 25);
            label.setAttribute('text-anchor', 'middle');
            label.setAttribute('font-size', '12px');
            // Format date for better readability
            label.textContent = tickDate.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
            xAxis.appendChild(label);
        }
        
        g.appendChild(xAxis);
        
        // Draw Y axis
        const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        yAxis.setAttribute('class', 'y-axis');
        
        // Y axis line
        const yAxisLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        yAxisLine.setAttribute('x1', 0);
        yAxisLine.setAttribute('y1', 0);
        yAxisLine.setAttribute('x2', 0);
        yAxisLine.setAttribute('y2', height);
        yAxisLine.setAttribute('stroke', '#333');
        yAxisLine.setAttribute('stroke-width', 2);
        yAxis.appendChild(yAxisLine);
        
        // Y axis label
        const yLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        yLabel.setAttribute('transform', 'rotate(-90)');
        yLabel.setAttribute('x', -height / 2);
        yLabel.setAttribute('y', -60); // Increased from -50 to reduce overlap
        yLabel.setAttribute('text-anchor', 'middle');
        yLabel.setAttribute('font-weight', 'bold');
        yLabel.textContent = 'Cumulative XP (kB)';
        yAxis.appendChild(yLabel);
        
        // Y axis ticks with improved spacing
        // Reduce number of ticks to prevent overlapping
        const numTicks = 5; 
        
        // Create a reasonable tick interval based on the max value
        const tickInterval = Math.ceil(yDomain[1] / numTicks / 100) * 100;
        
        // Generate ticks at regular intervals
        for (let tickValue = 0; tickValue <= yDomain[1]; tickValue += tickInterval) {
            const y = yScale(tickValue);
            
            // Tick line
            const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            tick.setAttribute('x1', -5);
            tick.setAttribute('y1', y);
            tick.setAttribute('x2', 0);
            tick.setAttribute('y2', y);
            tick.setAttribute('stroke', '#333');
            yAxis.appendChild(tick);
            
            // Tick label with kB unit - simplified to avoid overlap
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', -10);
            label.setAttribute('y', y + 4);
            label.setAttribute('text-anchor', 'end');
            label.setAttribute('font-size', '12px');
            // Just show the number, the unit is already in the axis label
            label.textContent = `${tickValue}`;
            yAxis.appendChild(label);
            
            // Grid line
            const gridLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            gridLine.setAttribute('x1', 0);
            gridLine.setAttribute('y1', y);
            gridLine.setAttribute('x2', width);
            gridLine.setAttribute('y2', y);
            gridLine.setAttribute('stroke', '#ddd');
            gridLine.setAttribute('stroke-dasharray', '4,4');
            g.appendChild(gridLine);
        }
        
        g.appendChild(yAxis);
        
        // Create line path for XP graph
        const linePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        let pathD = '';
        
        this.processedData.forEach((d, i) => {
            // Convert cumulative XP to kB for graph
            const kbValue = this.getXPValueInKB(d.cumulativeXP);
            const x = xScale(d.date);
            const y = yScale(Math.min(kbValue, yDomain[1]));
            
            if (i === 0) {
                pathD += `M ${x},${y}`;
            } else {
                pathD += ` L ${x},${y}`;
            }
        });
        
        linePath.setAttribute('d', pathD);
        linePath.setAttribute('fill', 'none');
        linePath.setAttribute('stroke', '#4285F4');
        linePath.setAttribute('stroke-width', 3);
        g.appendChild(linePath);
        
        // Add title
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        title.setAttribute('x', this.width / 2);
        title.setAttribute('y', 20);
        title.setAttribute('text-anchor', 'middle');
        title.setAttribute('font-weight', 'bold');
        title.setAttribute('font-size', '18px');
        title.textContent = 'XP Progress Over Time';
        svg.appendChild(title);
        
        // Add the SVG to the container
        this.container.appendChild(svg);
        
        // Create tooltip div (outside SVG for better positioning)
        const tooltipDiv = document.createElement('div');
        tooltipDiv.className = 'xp-graph-tooltip';
        tooltipDiv.style.position = 'absolute';
        tooltipDiv.style.display = 'none';
        tooltipDiv.style.background = 'white';
        tooltipDiv.style.border = '1px solid #333';
        tooltipDiv.style.borderRadius = '5px';
        tooltipDiv.style.padding = '10px';
        tooltipDiv.style.pointerEvents = 'none';
        tooltipDiv.style.zIndex = '100';
        this.container.appendChild(tooltipDiv);
        
        // Add hover effect for the entire graph using a transparent overlay
        const hoverArea = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        hoverArea.setAttribute('width', width);
        hoverArea.setAttribute('height', height);
        hoverArea.setAttribute('fill', 'transparent');
        hoverArea.setAttribute('pointer-events', 'all');
        g.appendChild(hoverArea);
        
        // Add mouse move handler for the hover area to show tooltip at nearest point
        hoverArea.addEventListener('mousemove', (event) => {
            // Get mouse position
            const svgRect = svg.getBoundingClientRect();
            const mouseX = event.clientX - svgRect.left - this.margin.left;
            
            // Find closest data point
            let closestPoint = null;
            let closestDistance = Number.MAX_VALUE;
            
            this.processedData.forEach(d => {
                const x = xScale(d.date);
                const distance = Math.abs(x - mouseX);
                
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestPoint = d;
                }
            });
            
            if (closestPoint && closestDistance < 50) { // Only show if within reasonable distance
                const kbValue = this.getXPValueInKB(closestPoint.cumulativeXP);
                const x = xScale(closestPoint.date);
                const y = yScale(Math.min(kbValue, yDomain[1]));
                
                // Update tooltip content
                tooltipDiv.innerHTML = `
                    <div>Date: ${closestPoint.date.toLocaleDateString()}</div>
                    <div>Cumulative XP: ${this.formatXPValue(closestPoint.cumulativeXP)}</div>
                    <div>Transaction: ${this.formatXPValue(closestPoint.amount)}</div>
                `;
                
                // Position tooltip
                const containerRect = this.container.getBoundingClientRect();
                const tooltipX = event.clientX - containerRect.left + 10;
                const tooltipY = event.clientY - containerRect.top - 40;
                
                tooltipDiv.style.left = `${tooltipX}px`;
                tooltipDiv.style.top = `${tooltipY}px`;
                tooltipDiv.style.display = 'block';
                
                // Show a temporary indicator dot at the closest point
                const indicator = document.getElementById('xp-hover-indicator');
                if (indicator) {
                    indicator.setAttribute('cx', x);
                    indicator.setAttribute('cy', y);
                    indicator.setAttribute('visibility', 'visible');
                } else {
                    const newIndicator = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    newIndicator.setAttribute('id', 'xp-hover-indicator');
                    newIndicator.setAttribute('cx', x);
                    newIndicator.setAttribute('cy', y);
                    newIndicator.setAttribute('r', 5);
                    newIndicator.setAttribute('fill', '#FF5722');
                    g.appendChild(newIndicator);
                }
            }
        });
        
        // Hide tooltip when mouse leaves the graph
        hoverArea.addEventListener('mouseleave', () => {
            tooltipDiv.style.display = 'none';
            const indicator = document.getElementById('xp-hover-indicator');
            if (indicator) {
                indicator.setAttribute('visibility', 'hidden');
            }
        });
    }
    
    async init() {
        await this.loadData();
        this.render();
    }
}

export default XPGraph;