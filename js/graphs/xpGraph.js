import api from '../api.js';

class XPGraph {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.width = 800;
        this.height = 400;
        this.margin = { top: 40, right: 40, bottom: 60, left: 70 };
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
        
        const yDomain = [0, this.processedData[this.processedData.length - 1].cumulativeXP];
        
        // X scale (time)
        const xScale = value => {
            const domainRange = xDomain[1].getTime() - xDomain[0].getTime();
            const percent = (value.getTime() - xDomain[0].getTime()) / domainRange;
            return percent * width;
        };
        
        // Y scale (XP)
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
        xLabel.setAttribute('y', 40);
        xLabel.setAttribute('text-anchor', 'middle');
        xLabel.textContent = 'Time';
        xAxis.appendChild(xLabel);
        
        // X axis ticks (month intervals)
        const monthInterval = Math.ceil(this.processedData.length / 6); // Approx 6 ticks
        const uniqueDates = [];
        this.processedData.forEach((d, i) => {
            if (i % monthInterval === 0) {
                uniqueDates.push(d.date);
            }
        });
        
        uniqueDates.forEach(date => {
            const x = xScale(date);
            
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
            label.setAttribute('y', 20);
            label.setAttribute('text-anchor', 'middle');
            label.textContent = date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
            xAxis.appendChild(label);
        });
        
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
        yLabel.setAttribute('y', -40);
        yLabel.setAttribute('text-anchor', 'middle');
        yLabel.textContent = 'Cumulative XP';
        yAxis.appendChild(yLabel);
        
        // Y axis ticks (5 equal intervals)
        const numTicks = 5;
        for (let i = 0; i <= numTicks; i++) {
            const yValue = (yDomain[1] / numTicks) * i;
            const y = yScale(yValue);
            
            // Tick line
            const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            tick.setAttribute('x1', -5);
            tick.setAttribute('y1', y);
            tick.setAttribute('x2', 0);
            tick.setAttribute('y2', y);
            tick.setAttribute('stroke', '#333');
            yAxis.appendChild(tick);
            
            // Tick label
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', -10);
            label.setAttribute('y', y + 5);
            label.setAttribute('text-anchor', 'end');
            label.textContent = Math.round(yValue).toLocaleString();
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
            const x = xScale(d.date);
            const y = yScale(d.cumulativeXP);
            
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
        
        // Add interactive tooltip for data points
        const tooltip = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        tooltip.setAttribute('visibility', 'hidden');
        
        const tooltipRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        tooltipRect.setAttribute('rx', 5);
        tooltipRect.setAttribute('ry', 5);
        tooltipRect.setAttribute('width', 150);
        tooltipRect.setAttribute('height', 70);
        tooltipRect.setAttribute('fill', 'white');
        tooltipRect.setAttribute('stroke', '#333');
        tooltip.appendChild(tooltipRect);
        
        const tooltipDate = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        tooltipDate.setAttribute('x', 10);
        tooltipDate.setAttribute('y', 20);
        tooltipDate.setAttribute('font-size', '12px');
        tooltip.appendChild(tooltipDate);
        
        const tooltipXP = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        tooltipXP.setAttribute('x', 10);
        tooltipXP.setAttribute('y', 40);
        tooltipXP.setAttribute('font-size', '12px');
        tooltip.appendChild(tooltipXP);
        
        const tooltipPath = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        tooltipPath.setAttribute('x', 10);
        tooltipPath.setAttribute('y', 60);
        tooltipPath.setAttribute('font-size', '12px');
        tooltip.appendChild(tooltipPath);
        
        svg.appendChild(tooltip);
        
        // Add data points with hover effect
        this.processedData.forEach((d, i) => {
            if (i % 5 === 0 || i === this.processedData.length - 1) { // Add points at intervals
                const x = xScale(d.date) + this.margin.left;
                const y = yScale(d.cumulativeXP) + this.margin.top;
                
                const dataPoint = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                dataPoint.setAttribute('cx', xScale(d.date));
                dataPoint.setAttribute('cy', yScale(d.cumulativeXP));
                dataPoint.setAttribute('r', 5);
                dataPoint.setAttribute('fill', '#4285F4');
                
                // Hover events for tooltip
                dataPoint.addEventListener('mouseover', () => {
                    dataPoint.setAttribute('r', 7);
                    dataPoint.setAttribute('fill', '#FF5722');
                    
                    // Update tooltip content
                    tooltipDate.textContent = `Date: ${d.date.toLocaleDateString()}`;
                    tooltipXP.textContent = `XP: ${d.amount.toLocaleString()}`;
                    tooltipPath.textContent = `Path: ${d.path.split('/').pop()}`;
                    
                    // Position tooltip
                    tooltip.setAttribute('transform', `translate(${x + 10},${y - 80})`);
                    tooltip.setAttribute('visibility', 'visible');
                });
                
                dataPoint.addEventListener('mouseout', () => {
                    dataPoint.setAttribute('r', 5);
                    dataPoint.setAttribute('fill', '#4285F4');
                    tooltip.setAttribute('visibility', 'hidden');
                });
                
                g.appendChild(dataPoint);
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

export default XPGraph;