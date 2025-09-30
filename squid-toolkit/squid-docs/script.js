// SquidPong API Documentation - Enhanced Squid Game Edition
class SquidPongAPI {
    constructor() {
        this.currentService = 'chat';
        this.currentTag = null;
        this.swaggerData = {};
        this.isDarkTheme = true;
        this.searchTerm = '';
        this.methodFilter = 'all';
        this.serviceEndpoints = {
            chat: 'http://localhost:4000/api/chat/docs',
            auth: 'http://localhost:4001/api/auth/docs',
            game: 'http://localhost:4002/api/game/docs',
            user: 'http://localhost:4003/api/user/docs',
            tournament: 'http://localhost:4004/api/tournament/docs',
            notify: 'http://localhost:4005/api/notify/docs'
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeTheme();
        this.loadServiceData();
        this.startStatsUpdate();
        this.initializeAnimations();
    }

    setupEventListeners() {
        // Service cards
        document.querySelectorAll('.service-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const service = e.currentTarget.dataset.service;
                this.selectService(service);
            });
        });

        // Action buttons
        document.getElementById('refresh-btn').addEventListener('click', () => {
            this.loadServiceData();
        });

        document.getElementById('test-btn').addEventListener('click', () => {
            this.openTestModal();
        });

        document.getElementById('export-btn').addEventListener('click', () => {
            this.exportDocumentation();
        });

        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Search functionality
        const searchInput = document.getElementById('search-input');
        searchInput.addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.filterEndpoints();
        });

        document.getElementById('clear-search').addEventListener('click', () => {
            searchInput.value = '';
            this.searchTerm = '';
            this.filterEndpoints();
        });

        // Method filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.methodFilter = e.target.dataset.method;
                this.filterEndpoints();
            });
        });

        // Test modal
        document.getElementById('close-test-modal').addEventListener('click', () => {
            this.closeTestModal();
        });

        document.getElementById('test-send').addEventListener('click', () => {
            this.sendTestRequest();
        });

        // Modal backdrop click
        document.getElementById('test-modal').addEventListener('click', (e) => {
            if (e.target.id === 'test-modal') {
                this.closeTestModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'k':
                        e.preventDefault();
                        document.getElementById('search-input').focus();
                        break;
                    case 'r':
                        e.preventDefault();
                        this.loadServiceData();
                        break;
                    case 't':
                        e.preventDefault();
                        this.openTestModal();
                        break;
                }
            }
            if (e.key === 'Escape') {
                this.closeTestModal();
            }
        });
    }

    initializeTheme() {
        const savedTheme = localStorage.getItem('squidpong-theme');
        if (savedTheme) {
            this.isDarkTheme = savedTheme === 'dark';
            this.applyTheme();
        }
    }

    toggleTheme() {
        this.isDarkTheme = !this.isDarkTheme;
        this.applyTheme();
        localStorage.setItem('squidpong-theme', this.isDarkTheme ? 'dark' : 'light');
    }

    applyTheme() {
        document.body.setAttribute('data-theme', this.isDarkTheme ? 'dark' : 'light');
        const themeIcon = document.querySelector('#theme-toggle i');
        themeIcon.className = this.isDarkTheme ? 'fas fa-sun' : 'fas fa-moon';
    }

    selectService(service) {
        this.currentService = service;
        
        // Update active service card
        document.querySelectorAll('.service-card').forEach(card => {
            card.classList.remove('active');
        });
        document.querySelector(`[data-service="${service}"]`).classList.add('active');

        this.loadServiceData();
    }

    async loadServiceData() {
        this.showLoader();
        const startTime = Date.now();
        
        try {
            const endpoint = this.serviceEndpoints[this.currentService];
            
            // Simulate network delay for better UX
            await new Promise(resolve => setTimeout(resolve, 800));
            
            const response = await fetch(endpoint);
            
            if (!response.ok) {
                throw new Error(`Service ${this.currentService} is currently offline`);
            }
            
            this.swaggerData = await response.json();
            const responseTime = Date.now() - startTime;
            
            this.updateServiceStatus(this.currentService, true);
            this.updateStats(responseTime);
            this.renderNavTabs();
            this.renderEndpoints();
            this.hideLoader();
            
            // Success animation
            this.showSuccessNotification(`${this.currentService} service loaded successfully!`);
            
        } catch (error) {
            console.error('Error loading API documentation:', error);
            this.updateServiceStatus(this.currentService, false);
            this.showError(error.message);
            
            // Error animation
            this.shakeServiceCard(this.currentService);
        }
    }

    updateServiceStatus(service, isOnline) {
        const serviceCard = document.querySelector(`[data-service="${service}"]`);
        const statusIndicator = serviceCard.querySelector('.service-status');
        
        statusIndicator.className = `service-status ${isOnline ? 'online' : 'offline'}`;
    }

    updateStats(responseTime) {
        const endpointsCount = this.countEndpoints();
        const tagsCount = this.extractTags().length;
        
        this.animateCounter('endpoints-count', endpointsCount);
        this.animateCounter('tags-count', tagsCount);
        
        document.getElementById('response-time').textContent = `${responseTime}ms`;
    }

    countEndpoints() {
        if (!this.swaggerData.paths) return 0;
        
        let count = 0;
        Object.values(this.swaggerData.paths).forEach(pathMethods => {
            count += Object.keys(pathMethods).length;
        });
        return count;
    }

    animateCounter(elementId, targetValue) {
        const element = document.getElementById(elementId);
        const startValue = parseInt(element.textContent) || 0;
        const duration = 1000;
        const increment = (targetValue - startValue) / (duration / 16);
        
        let currentValue = startValue;
        const timer = setInterval(() => {
            currentValue += increment;
            if (currentValue >= targetValue) {
                element.textContent = targetValue;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(currentValue);
            }
        }, 16);
    }

    startStatsUpdate() {
        // Update stats periodically
        setInterval(() => {
            this.updateOnlineServices();
        }, 30000); // Every 30 seconds
    }

    updateOnlineServices() {
        // Check service status
        Object.keys(this.serviceEndpoints).forEach(async (service) => {
            try {
                const response = await fetch(this.serviceEndpoints[service], {
                    method: 'HEAD',
                    timeout: 5000
                });
                this.updateServiceStatus(service, response.ok);
            } catch {
                this.updateServiceStatus(service, false);
            }
        });
    }

    renderNavTabs() {
        const navTabs = document.getElementById('nav-tabs');
        const tags = this.extractTags();
        
        navTabs.innerHTML = '';
        
        if (tags.length === 0) {
            navTabs.innerHTML = '<div class="no-tags">No endpoints found</div>';
            return;
        }

        tags.forEach((tag, index) => {
            const button = document.createElement('button');
            button.className = `nav-tab ${index === 0 ? 'active' : ''}`;
            button.textContent = this.capitalize(tag);
            button.dataset.tab = tag;
            
            button.addEventListener('click', () => {
                this.setActiveTab(tag);
                this.renderEndpoints(tag);
            });
            
            navTabs.appendChild(button);
        });

        // Set first tag as active
        if (tags.length > 0) {
            this.currentTag = tags[0];
        }
    }

    setActiveTab(tag) {
        this.currentTag = tag;
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tag}"]`).classList.add('active');
    }

    extractTags() {
        if (!this.swaggerData.paths) return [];
        
        const tags = new Set();
        Object.values(this.swaggerData.paths).forEach(pathMethods => {
            Object.values(pathMethods).forEach(method => {
                if (method.tags) {
                    method.tags.forEach(tag => tags.add(tag));
                }
            });
        });
        
        return Array.from(tags).sort();
    }

    renderEndpoints(filterTag = null) {
        const container = document.getElementById('endpoints-container');
        const paths = this.swaggerData.paths || {};
        
        container.innerHTML = '';
        
        let hasEndpoints = false;
        let endpointIndex = 0;

        Object.entries(paths).forEach(([path, methods]) => {
            Object.entries(methods).forEach(([method, details]) => {
                if (filterTag && (!details.tags || !details.tags.includes(filterTag))) {
                    return;
                }
                
                if (!this.matchesFilters(path, method, details)) {
                    return;
                }
                
                hasEndpoints = true;
                const endpointCard = this.createEndpointCard(path, method, details, endpointIndex);
                container.appendChild(endpointCard);
                
                // Stagger animation
                setTimeout(() => {
                    endpointCard.style.opacity = '1';
                    endpointCard.style.transform = 'translateY(0)';
                }, endpointIndex * 100);
                
                endpointIndex++;
            });
        });

        if (!hasEndpoints) {
            container.innerHTML = `
                <div class="no-endpoints">
                    <div class="no-results-illustration">
                        <div class="empty-doll">
                            <div class="doll-outline"></div>
                        </div>
                    </div>
                    <h3>🎯 No matches found</h3>
                    <p>Try adjusting your search terms or filters.</p>
                </div>
            `;
        }
    }

    matchesFilters(path, method, details) {
        // Method filter
        if (this.methodFilter !== 'all' && method.toLowerCase() !== this.methodFilter) {
            return false;
        }

        // Search filter
        if (this.searchTerm) {
            const searchableText = [
                path,
                method,
                details.summary || '',
                details.description || '',
                (details.tags || []).join(' ')
            ].join(' ').toLowerCase();
            
            return searchableText.includes(this.searchTerm);
        }

        return true;
    }

    filterEndpoints() {
        this.renderEndpoints(this.currentTag);
    }

    createEndpointCard(path, method, details, index) {
        const card = document.createElement('div');
        card.className = 'endpoint-card';
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'all 0.3s ease';
        
        const methodClass = `method-${method.toLowerCase()}`;
        const summary = details.summary || details.description || 'No description available';
        
        card.innerHTML = `
            <div class="endpoint-header" onclick="this.parentElement.classList.toggle('expanded')">
                <span class="method-badge ${methodClass}">${method.toUpperCase()}</span>
                <span class="endpoint-path">${path}</span>
                <span class="endpoint-summary">${summary}</span>
                <span class="expand-icon">
                    <i class="fas fa-chevron-right"></i>
                </span>
            </div>
            <div class="endpoint-details">
                ${this.generateEndpointDetails(details, path, method)}
            </div>
        `;
        
        return card;
    }

    generateEndpointDetails(details, path, method) {
        let html = '<div class="endpoint-detail-content">';
        
        // Description
        if (details.description && details.description !== details.summary) {
            html += `<div class="detail-section description">
                <h4><i class="fas fa-info-circle"></i> Description</h4>
                <p>${details.description}</p>
            </div>`;
        }
        
        // Parameters
        if (details.parameters && details.parameters.length > 0) {
            html += '<div class="detail-section parameters">';
            html += '<h4><i class="fas fa-sliders-h"></i> Parameters</h4>';
            html += '<div class="params-grid">';
            
            details.parameters.forEach(param => {
                const isRequired = param.required ? 'required' : 'optional';
                html += `
                    <div class="parameter-item ${isRequired}">
                        <div class="param-header">
                            <span class="param-name">${param.name}</span>
                            <span class="param-location">${param.in}</span>
                            ${param.required ? '<span class="required-badge">Required</span>' : ''}
                        </div>
                        <div class="param-type">${param.schema?.type || 'string'}</div>
                        <div class="param-description">${param.description || 'No description'}</div>
                    </div>
                `;
            });
            
            html += '</div></div>';
        }
        
        // Request Body
        if (details.requestBody) {
            html += '<div class="detail-section request-body">';
            html += '<h4><i class="fas fa-upload"></i> Request Body</h4>';
            const content = details.requestBody.content;
            if (content && content['application/json']) {
                const schema = content['application/json'].schema;
                html += `<div class="code-block">${this.formatJson(schema)}</div>`;
            }
            html += '</div>';
        }
        
        // Responses
        if (details.responses) {
            html += '<div class="detail-section responses">';
            html += '<h4><i class="fas fa-download"></i> Responses</h4>';
            
            Object.entries(details.responses).forEach(([code, response]) => {
                const statusClass = this.getStatusClass(code);
                html += `
                    <div class="response-item">
                        <div class="response-header">
                            <span class="response-code ${statusClass}">${code}</span>
                            <span class="response-description">${response.description || 'No description'}</span>
                        </div>
                        ${this.generateResponseExample(response)}
                    </div>
                `;
            });
            
            html += '</div>';
        }

        // Test button
        html += `
            <div class="detail-section test-section">
                <button class="test-endpoint-btn" onclick="SquidPongApp.testEndpoint('${method}', '${path}')">
                    <i class="fas fa-play"></i>
                    Test Endpoint
                </button>
            </div>
        `;
        
        html += '</div>';
        return html;
    }

    getStatusClass(code) {
        if (code.startsWith('2')) return 'success';
        if (code.startsWith('4')) return 'error';
        if (code.startsWith('5')) return 'error';
        return 'info';
    }

    generateResponseExample(response) {
        if (!response.content) return '';
        
        const jsonContent = response.content['application/json'];
        if (!jsonContent || !jsonContent.schema) return '';
        
        const example = this.generateExampleFromSchema(jsonContent.schema);
        return `<div class="code-block">${this.formatJson(example)}</div>`;
    }

    generateExampleFromSchema(schema) {
        if (!schema) return {};
        
        switch (schema.type) {
            case 'object':
                const obj = {};
                if (schema.properties) {
                    Object.entries(schema.properties).forEach(([key, prop]) => {
                        obj[key] = this.generateExampleFromSchema(prop);
                    });
                }
                return obj;
            
            case 'array':
                return [this.generateExampleFromSchema(schema.items || {})];
            
            case 'string':
                return schema.example || schema.format === 'date-time' ? '2023-12-01T10:00:00Z' : 'string';
            
            case 'number':
            case 'integer':
                return schema.example || 123;
            
            case 'boolean':
                return schema.example !== undefined ? schema.example : true;
            
            default:
                return schema.example || null;
        }
    }

    formatJson(obj) {
        return JSON.stringify(obj, null, 2);
    }

    // Test Modal Functions
    openTestModal() {
        document.getElementById('test-modal').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeTestModal() {
        document.getElementById('test-modal').classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    testEndpoint(method, path) {
        document.getElementById('test-method').value = method.toUpperCase();
        document.getElementById('test-url').value = `http://localhost:4000/api${path}`;
        this.openTestModal();
    }

    async sendTestRequest() {
        const method = document.getElementById('test-method').value;
        const url = document.getElementById('test-url').value;
        const headers = document.getElementById('test-headers').value;
        const body = document.getElementById('test-body').value;

        const statusElement = document.getElementById('response-status');
        const bodyElement = document.getElementById('response-body');

        statusElement.textContent = 'Sending request...';
        bodyElement.textContent = '';

        try {
            const requestOptions = {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    ...(headers ? JSON.parse(headers) : {})
                }
            };

            if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
                requestOptions.body = body;
            }

            const response = await fetch(url, requestOptions);
            const responseData = await response.text();

            statusElement.textContent = `${response.status} ${response.statusText}`;
            statusElement.className = `response-status ${response.ok ? 'success' : 'error'}`;
            
            try {
                bodyElement.textContent = JSON.stringify(JSON.parse(responseData), null, 2);
            } catch {
                bodyElement.textContent = responseData;
            }

        } catch (error) {
            statusElement.textContent = 'Request failed';
            statusElement.className = 'response-status error';
            bodyElement.textContent = error.message;
        }
    }

    exportDocumentation() {
        const dataStr = JSON.stringify(this.swaggerData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `${this.currentService}-api-docs.json`;
        link.click();
        
        this.showSuccessNotification('Documentation exported successfully!');
    }

    // Animation and UI Functions
    initializeAnimations() {
        // Initialize any complex animations
        this.startBackgroundAnimations();
    }

    startBackgroundAnimations() {
        // Animate floating shapes with random movements
        const shapes = document.querySelectorAll('.shape');
        shapes.forEach((shape, index) => {
            this.animateShape(shape, index);
        });
    }

    animateShape(shape, index) {
        const randomX = Math.random() * 100;
        const randomY = Math.random() * 100;
        const randomRotation = Math.random() * 360;
        const duration = 15000 + (Math.random() * 10000);

        shape.style.animation = `
            floatRandom${index} ${duration}ms ease-in-out infinite
        `;

        // Create dynamic keyframes
        const keyframes = `
            @keyframes floatRandom${index} {
                0% { transform: translate(0, 0) rotate(0deg); }
                25% { transform: translate(${randomX}px, ${randomY}px) rotate(${randomRotation}deg); }
                50% { transform: translate(${-randomX}px, ${randomY * 0.5}px) rotate(${randomRotation * 0.5}deg); }
                75% { transform: translate(${randomX * 0.3}px, ${-randomY}px) rotate(${-randomRotation}deg); }
                100% { transform: translate(0, 0) rotate(0deg); }
            }
        `;

        const style = document.createElement('style');
        style.textContent = keyframes;
        document.head.appendChild(style);
    }

    shakeServiceCard(service) {
        const card = document.querySelector(`[data-service="${service}"]`);
        card.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            card.style.animation = '';
        }, 500);
    }

    showSuccessNotification(message) {
        this.showNotification(message, 'success');
    }

    showErrorNotification(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}-circle"></i>
            <span>${message}</span>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);

        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    showLoader() {
        document.getElementById('loader').style.display = 'flex';
        document.getElementById('endpoints-container').style.display = 'none';
        document.getElementById('error-container').style.display = 'none';
    }

    hideLoader() {
        document.getElementById('loader').style.display = 'none';
        document.getElementById('endpoints-container').style.display = 'block';
        document.getElementById('error-container').style.display = 'none';
    }

    showError(message) {
        document.getElementById('loader').style.display = 'none';
        document.getElementById('endpoints-container').style.display = 'none';
        document.getElementById('error-container').style.display = 'flex';
        document.getElementById('error-message').textContent = message;
    }
}

// Global instance
let SquidPongApp;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    SquidPongApp = new SquidPongAPI();
});

// Add CSS for notifications
const notificationStyles = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--bg-modal);
        border: 2px solid var(--border-color);
        border-radius: 12px;
        padding: 15px 20px;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 10000;
        transform: translateX(100%);
        opacity: 0;
        transition: all 0.3s ease;
        min-width: 300px;
    }

    .notification.show {
        transform: translateX(0);
        opacity: 1;
    }

    .notification.success {
        border-color: var(--success-green);
        color: var(--success-green);
    }

    .notification.error {
        border-color: var(--error-red);
        color: var(--error-red);
    }

    .notification i {
        font-size: 1.2rem;
    }

    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }

    .no-endpoints {
        text-align: center;
        padding: 60px 20px;
    }

    .no-results-illustration {
        margin-bottom: 30px;
    }

    .empty-doll {
        width: 80px;
        height: 80px;
        margin: 0 auto;
        position: relative;
    }

    .doll-outline {
        width: 100%;
        height: 100%;
        border: 3px dashed var(--text-muted);
        border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
        opacity: 0.5;
        animation: pulse 2s ease-in-out infinite;
    }

    .detail-section {
        margin-bottom: 25px;
        padding: 20px;
        background: var(--bg-tertiary);
        border-radius: 12px;
        border: 1px solid var(--border-color);
    }

    .detail-section h4 {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 15px;
        color: var(--text-accent);
        font-size: 1.1rem;
    }

    .params-grid {
        display: grid;
        gap: 15px;
    }

    .parameter-item {
        background: var(--bg-modal);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 15px;
    }

    .parameter-item.required {
        border-left: 4px solid var(--error-red);
    }

    .param-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
    }

    .param-name {
        font-family: 'Roboto Mono', monospace;
        font-weight: 600;
        color: var(--text-primary);
    }

    .param-location {
        background: var(--bg-tertiary);
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.8rem;
        color: var(--text-secondary);
    }

    .required-badge {
        background: var(--error-red);
        color: var(--text-primary);
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 0.7rem;
        font-weight: 600;
    }

    .param-type {
        font-family: 'Roboto Mono', monospace;
        color: var(--secondary-teal);
        font-size: 0.9rem;
        margin-bottom: 5px;
    }

    .param-description {
        color: var(--text-secondary);
        font-size: 0.9rem;
    }

    .response-item {
        margin-bottom: 15px;
    }

    .response-header {
        display: flex;
        align-items: center;
        gap: 15px;
        margin-bottom: 10px;
    }

    .response-description {
        color: var(--text-secondary);
    }

    .test-endpoint-btn {
        background: var(--gradient-primary);
        border: none;
        color: var(--text-primary);
        padding: 12px 24px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.3s ease;
    }

    .test-endpoint-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px var(--shadow-primary);
    }

    .test-section {
        text-align: center;
        border-top: 2px solid var(--border-color);
        margin-top: 20px;
        padding-top: 20px;
    }
`;

// Inject notification styles
const style = document.createElement('style');
style.textContent = notificationStyles;
document.head.appendChild(style);
