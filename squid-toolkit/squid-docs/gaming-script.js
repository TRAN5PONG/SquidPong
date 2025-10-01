// SquidPong Gaming API Arena - JavaScript
class SquidPongArena {
    constructor() {
        this.currentService = 'auth';
        this.currentMethod = 'all';
        this.postmanData = null;
        this.searchTerm = '';
        this.endpoints = [];
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.createParticleEffects();
        await this.loadPostmanCollection();
        this.updateServiceDisplay();
        this.loadEndpoints();
        this.startStatsAnimation();
    }

    setupEventListeners() {
        // Character/Service selection
        document.querySelectorAll('.character-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const service = e.currentTarget.dataset.service;
                this.selectService(service);
            });
        });

        // Method filter buttons
        document.querySelectorAll('.method-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const method = e.currentTarget.dataset.method;
                this.selectMethod(method);
            });
        });

        // Search functionality
        const searchInput = document.getElementById('global-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.loadEndpoints();
            });
        }

        // Quick action buttons
        document.getElementById('test-all-btn')?.addEventListener('click', () => {
            this.testAllEndpoints();
        });

        document.getElementById('export-docs-btn')?.addEventListener('click', () => {
            this.exportDocumentation();
        });

        document.getElementById('load-postman-btn')?.addEventListener('click', () => {
            this.loadPostmanCollection();
        });

        // Battle modal
        document.getElementById('close-battle-modal')?.addEventListener('click', () => {
            this.closeBattleModal();
        });

        document.getElementById('start-battle-btn')?.addEventListener('click', () => {
            this.startBattle();
        });

        // Main start button
        document.getElementById('main-start-btn')?.addEventListener('click', () => {
            this.startMainBattle();
        });

        // Game mode cards
        document.querySelectorAll('.game-mode-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                this.selectGameMode(mode);
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'k':
                        e.preventDefault();
                        document.getElementById('global-search')?.focus();
                        break;
                    case 'r':
                        e.preventDefault();
                        this.loadPostmanCollection();
                        break;
                    case 't':
                        e.preventDefault();
                        this.openBattleModal();
                        break;
                }
            }
            if (e.key === 'Escape') {
                this.closeBattleModal();
            }
        });
    }

    createParticleEffects() {
        // Enhanced particle system for gaming feel
        const particlesContainer = document.querySelector('.floating-particles');
        if (!particlesContainer) return;

        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.cssText = `
                position: absolute;
                width: ${Math.random() * 4 + 2}px;
                height: ${Math.random() * 4 + 2}px;
                background: var(--accent-gold);
                border-radius: 50%;
                top: ${Math.random() * 100}%;
                left: ${Math.random() * 100}%;
                animation: floatParticle ${Math.random() * 10 + 10}s linear infinite;
                animation-delay: ${Math.random() * 5}s;
                opacity: ${Math.random() * 0.5 + 0.3};
            `;
            particlesContainer.appendChild(particle);
        }

        // Add CSS animation for particles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes floatParticle {
                0% { transform: translateY(100vh) rotate(0deg); }
                100% { transform: translateY(-100vh) rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }

    async loadPostmanCollection() {
        try {
            const response = await fetch('../SquidPong_Postman_Collection.json');
            if (response.ok) {
                this.postmanData = await response.json();
                this.showNotification('Arena data loaded successfully! 🎮', 'success');
            } else {
                throw new Error('Failed to load collection');
            }
        } catch (error) {
            console.log('Using fallback arena data...');
            this.loadFallbackData();
            this.showNotification('Using demo arena data 🎯', 'info');
        }
        this.updateStats();
    }

    loadFallbackData() {
        this.postmanData = {
            info: { name: "SquidPong API Arena" },
            item: [
                {
                    name: "Auth Service",
                    item: [
                        {
                            name: "Login Battle",
                            request: {
                                method: "POST",
                                url: { raw: "{{baseUrl}}/auth/login" },
                                header: [
                                    { key: "Content-Type", value: "application/json" }
                                ],
                                body: {
                                    raw: JSON.stringify({
                                        email: "player@squidpong.com",
                                        password: "gamemaster123"
                                    })
                                }
                            },
                            description: "Player authentication for arena access"
                        },
                        {
                            name: "Register New Player",
                            request: {
                                method: "POST",
                                url: { raw: "{{baseUrl}}/auth/register" },
                                header: [
                                    { key: "Content-Type", value: "application/json" }
                                ],
                                body: {
                                    raw: JSON.stringify({
                                        username: "newplayer",
                                        email: "newplayer@squidpong.com",
                                        password: "secure123",
                                        firstName: "New",
                                        lastName: "Player"
                                    })
                                }
                            },
                            description: "Register a new player for the arena"
                        },
                        {
                            name: "Verify Arena Access",
                            request: {
                                method: "POST",
                                url: { raw: "{{baseUrl}}/auth/verify" },
                                header: [
                                    { key: "Content-Type", value: "application/json" }
                                ]
                            },
                            description: "Verify player's arena access token"
                        }
                    ]
                },
                {
                    name: "User Service",
                    item: [
                        {
                            name: "Get Player Profile",
                            request: {
                                method: "GET",
                                url: { raw: "{{baseUrl}}/user/profile" },
                                header: [
                                    { key: "Authorization", value: "Bearer {{accessToken}}" }
                                ]
                            },
                            description: "Retrieve player's arena profile"
                        },
                        {
                            name: "Update Player Stats",
                            request: {
                                method: "PUT",
                                url: { raw: "{{baseUrl}}/user/profile" },
                                header: [
                                    { key: "Content-Type", value: "application/json" },
                                    { key: "Authorization", value: "Bearer {{accessToken}}" }
                                ],
                                body: {
                                    raw: JSON.stringify({
                                        bio: "Arena Champion",
                                        favoriteCharacter: "auth-guardian"
                                    })
                                }
                            },
                            description: "Update player's arena profile"
                        }
                    ]
                },
                {
                    name: "Game Service",
                    item: [
                        {
                            name: "Create Battle Session",
                            request: {
                                method: "POST",
                                url: { raw: "{{baseUrl}}/game/create" },
                                header: [
                                    { key: "Content-Type", value: "application/json" },
                                    { key: "Authorization", value: "Bearer {{accessToken}}" }
                                ],
                                body: {
                                    raw: JSON.stringify({
                                        gameMode: "1v1",
                                        arenaType: "classic",
                                        powerUpsEnabled: true
                                    })
                                }
                            },
                            description: "Create a new battle session in the arena"
                        },
                        {
                            name: "Join Battle Arena",
                            request: {
                                method: "POST",
                                url: { raw: "{{baseUrl}}/game/join/{{gameId}}" },
                                header: [
                                    { key: "Authorization", value: "Bearer {{accessToken}}" }
                                ]
                            },
                            description: "Join an existing battle arena"
                        }
                    ]
                },
                {
                    name: "Chat Service",
                    item: [
                        {
                            name: "Send Arena Message",
                            request: {
                                method: "POST",
                                url: { raw: "{{baseUrl}}/chat/send" },
                                header: [
                                    { key: "Content-Type", value: "application/json" },
                                    { key: "Authorization", value: "Bearer {{accessToken}}" }
                                ],
                                body: {
                                    raw: JSON.stringify({
                                        message: "Ready for battle! 🎮",
                                        chatId: "arena_chat_123"
                                    })
                                }
                            },
                            description: "Send message in arena chat"
                        }
                    ]
                },
                {
                    name: "Tournament Service",
                    item: [
                        {
                            name: "Create Tournament",
                            request: {
                                method: "POST",
                                url: { raw: "{{baseUrl}}/tournament/create" },
                                header: [
                                    { key: "Content-Type", value: "application/json" },
                                    { key: "Authorization", value: "Bearer {{accessToken}}" }
                                ],
                                body: {
                                    raw: JSON.stringify({
                                        name: "Weekly Arena Championship",
                                        maxPlayers: 16,
                                        entryFee: 100
                                    })
                                }
                            },
                            description: "Create a new tournament in the arena"
                        }
                    ]
                },
                {
                    name: "Notification Service",
                    item: [
                        {
                            name: "Get Arena Notifications",
                            request: {
                                method: "GET",
                                url: { raw: "{{baseUrl}}/notifications" },
                                header: [
                                    { key: "Authorization", value: "Bearer {{accessToken}}" }
                                ]
                            },
                            description: "Get player's arena notifications"
                        }
                    ]
                }
            ]
        };
    }

    selectService(serviceName) {
        // Update active character card
        document.querySelectorAll('.character-card').forEach(card => {
            card.classList.remove('active');
        });
        
        const selectedCard = document.querySelector(`[data-service="${serviceName}"]`);
        if (selectedCard) {
            selectedCard.classList.add('active');
        }

        this.currentService = serviceName;
        this.updateServiceDisplay();
        this.loadEndpoints();
        
        // Trigger selection animation
        this.triggerSelectionEffect(selectedCard);
    }

    selectMethod(method) {
        // Update active method button
        document.querySelectorAll('.method-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const selectedBtn = document.querySelector(`[data-method="${method}"]`);
        if (selectedBtn) {
            selectedBtn.classList.add('active');
        }

        this.currentMethod = method;
        this.loadEndpoints();
    }

    updateServiceDisplay() {
        const serviceNames = {
            auth: 'AUTH SERVICE',
            user: 'USER SERVICE',
            game: 'GAME SERVICE',
            chat: 'CHAT SERVICE',
            tournament: 'TOURNAMENT SERVICE',
            notify: 'NOTIFICATION SERVICE'
        };

        const serviceDescriptions = {
            auth: 'Authentication & Authorization endpoints for arena access',
            user: 'Player profile and account management systems',
            game: 'Battle session creation and game mechanics',
            chat: 'Arena communication and messaging systems',
            tournament: 'Competitive tournament management',
            notify: 'Real-time notification and alert systems'
        };

        const serviceIcons = {
            auth: 'fas fa-shield-alt',
            user: 'fas fa-user',
            game: 'fas fa-gamepad',
            chat: 'fas fa-comments',
            tournament: 'fas fa-trophy',
            notify: 'fas fa-bell'
        };

        // Update current selection display
        const currentServiceElement = document.getElementById('current-service');
        const currentDescriptionElement = document.getElementById('current-description');
        const selectionIcon = document.querySelector('.selection-icon i');

        if (currentServiceElement) {
            currentServiceElement.textContent = serviceNames[this.currentService] || 'UNKNOWN SERVICE';
        }
        if (currentDescriptionElement) {
            currentDescriptionElement.textContent = serviceDescriptions[this.currentService] || 'Service description not available';
        }
        if (selectionIcon) {
            selectionIcon.className = serviceIcons[this.currentService] || 'fas fa-question';
        }
    }

    loadEndpoints() {
        if (!this.postmanData) return;

        const container = document.getElementById('endpoints-container');
        if (!container) return;

        // Find current service data
        const serviceData = this.postmanData.item.find(service => 
            service.name.toLowerCase().includes(this.currentService) ||
            this.currentService === 'auth' && service.name.toLowerCase().includes('auth') ||
            this.currentService === 'user' && service.name.toLowerCase().includes('user') ||
            this.currentService === 'game' && service.name.toLowerCase().includes('game') ||
            this.currentService === 'chat' && service.name.toLowerCase().includes('chat') ||
            this.currentService === 'tournament' && service.name.toLowerCase().includes('tournament') ||
            this.currentService === 'notify' && service.name.toLowerCase().includes('notif')
        );

        if (!serviceData || !serviceData.item) {
            container.innerHTML = this.createEmptyState();
            return;
        }

        let endpoints = serviceData.item;

        // Apply filters
        if (this.currentMethod !== 'all') {
            endpoints = endpoints.filter(endpoint => 
                endpoint.request?.method?.toLowerCase() === this.currentMethod
            );
        }

        if (this.searchTerm) {
            endpoints = endpoints.filter(endpoint => {
                const searchableText = [
                    endpoint.name,
                    endpoint.request?.method || '',
                    endpoint.request?.url?.raw || '',
                    endpoint.description || ''
                ].join(' ').toLowerCase();
                return searchableText.includes(this.searchTerm);
            });
        }

        // Update battle count
        document.getElementById('battle-count').textContent = endpoints.length;

        if (endpoints.length === 0) {
            container.innerHTML = this.createEmptyState();
            return;
        }

        // Render endpoints
        container.innerHTML = '';
        endpoints.forEach((endpoint, index) => {
            const endpointCard = this.createEndpointBattleCard(endpoint, index);
            container.appendChild(endpointCard);
            
            // Stagger animation
            setTimeout(() => {
                endpointCard.style.opacity = '1';
                endpointCard.style.transform = 'translateX(0)';
            }, index * 100);
        });
    }

    createEndpointBattleCard(endpoint, index) {
        const card = document.createElement('div');
        card.className = 'endpoint-battle-card';
        card.style.opacity = '0';
        card.style.transform = 'translateX(-50px)';
        card.style.transition = 'all 0.4s ease';

        const method = endpoint.request?.method || 'GET';
        const url = endpoint.request?.url?.raw || '';
        const cleanUrl = url.replace(/\{\{[^}]+\}\}/g, 'localhost:4000');
        
        const methodColors = {
            GET: 'var(--accent-green)',
            POST: 'var(--accent-gold)',
            PUT: 'var(--accent-blue)',
            PATCH: 'var(--accent-purple)',
            DELETE: 'var(--accent-red)'
        };

        const methodIcons = {
            GET: '🛡️',
            POST: '⚡',
            PUT: '🔥',
            PATCH: '✨',
            DELETE: '💥'
        };

        card.innerHTML = `
            <div class="battle-card-header">
                <div class="method-indicator" style="background: ${methodColors[method] || 'var(--accent-blue)'}">
                    <span class="method-icon">${methodIcons[method] || '⚔️'}</span>
                    <span class="method-name">${method}</span>
                </div>
                <div class="battle-info">
                    <h4 class="battle-name">${endpoint.name}</h4>
                    <p class="battle-url">${cleanUrl}</p>
                    <p class="battle-description">${endpoint.description || 'No description available'}</p>
                </div>
                <button class="battle-btn" onclick="ArenaApp.openBattleModal('${method}', '${cleanUrl}', '${endpoint.name}')">
                    <i class="fas fa-play"></i>
                    <span>BATTLE</span>
                </button>
            </div>
            <div class="battle-stats">
                <div class="stat-item">
                    <span class="stat-label">Power Level</span>
                    <span class="stat-value">${Math.floor(Math.random() * 900) + 100}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Success Rate</span>
                    <span class="stat-value">${Math.floor(Math.random() * 20) + 80}%</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Avg Time</span>
                    <span class="stat-value">${Math.floor(Math.random() * 100) + 20}ms</span>
                </div>
            </div>
        `;

        // Add battle card styles
        this.addBattleCardStyles();

        return card;
    }

    addBattleCardStyles() {
        if (document.getElementById('battle-card-styles')) return;

        const style = document.createElement('style');
        style.id = 'battle-card-styles';
        style.textContent = `
            .endpoint-battle-card {
                background: rgba(45, 53, 97, 0.8);
                border: 2px solid var(--border-primary);
                border-radius: 16px;
                padding: 20px;
                margin-bottom: 12px;
                transition: all 0.3s ease;
                cursor: pointer;
                position: relative;
                overflow: hidden;
            }

            .endpoint-battle-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: var(--gradient-gold);
                transform: scaleX(0);
                transition: transform 0.3s ease;
            }

            .endpoint-battle-card:hover::before {
                transform: scaleX(1);
            }

            .endpoint-battle-card:hover {
                border-color: var(--accent-gold);
                transform: translateY(-3px);
                box-shadow: 0 8px 25px var(--shadow-gold);
            }

            .battle-card-header {
                display: flex;
                align-items: center;
                gap: 16px;
                margin-bottom: 16px;
            }

            .method-indicator {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
                padding: 12px;
                border-radius: 12px;
                min-width: 80px;
            }

            .method-icon {
                font-size: 1.5rem;
            }

            .method-name {
                font-family: 'Orbitron', monospace;
                font-weight: 700;
                font-size: 0.8rem;
                color: white;
                letter-spacing: 1px;
            }

            .battle-info {
                flex: 1;
            }

            .battle-name {
                font-family: 'Orbitron', monospace;
                font-weight: 700;
                color: var(--text-primary);
                margin-bottom: 6px;
                font-size: 1.1rem;
            }

            .battle-url {
                font-family: 'JetBrains Mono', monospace;
                color: var(--accent-gold);
                font-size: 0.9rem;
                margin-bottom: 6px;
                word-break: break-all;
            }

            .battle-description {
                color: var(--text-muted);
                font-size: 0.85rem;
                line-height: 1.4;
            }

            .battle-btn {
                background: var(--gradient-gold);
                border: none;
                color: var(--bg-primary);
                padding: 12px 20px;
                border-radius: 10px;
                cursor: pointer;
                font-family: 'Orbitron', monospace;
                font-weight: 700;
                font-size: 0.9rem;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: all 0.3s ease;
                text-transform: uppercase;
                letter-spacing: 1px;
            }

            .battle-btn:hover {
                transform: scale(1.05);
                box-shadow: 0 5px 15px var(--shadow-gold);
            }

            .battle-stats {
                display: flex;
                justify-content: space-between;
                padding-top: 16px;
                border-top: 1px solid var(--border-primary);
                gap: 16px;
            }

            .battle-stats .stat-item {
                text-align: center;
                flex: 1;
            }

            .battle-stats .stat-label {
                display: block;
                font-size: 0.75rem;
                color: var(--text-muted);
                text-transform: uppercase;
                font-weight: 600;
                margin-bottom: 4px;
            }

            .battle-stats .stat-value {
                font-family: 'Orbitron', monospace;
                font-weight: 700;
                color: var(--accent-gold);
                font-size: 0.9rem;
            }
        `;
        document.head.appendChild(style);
    }

    createEmptyState() {
        return `
            <div class="empty-arena">
                <div class="empty-icon">
                    <i class="fas fa-ghost"></i>
                </div>
                <h3>No battles available</h3>
                <p>Select a different service or adjust your filters to find battles.</p>
            </div>
        `;
    }

    openBattleModal(method = 'GET', url = '', name = '') {
        const modal = document.getElementById('battle-modal');
        if (!modal) return;

        // Pre-fill battle configuration
        document.getElementById('battle-method').value = method;
        document.getElementById('battle-url').value = url.replace(/\{\{[^}]+\}\}/g, 'http://localhost:4000');
        
        // Set default headers
        const defaultHeaders = {
            "Content-Type": "application/json"
        };
        if (method !== 'GET') {
            defaultHeaders["Authorization"] = "Bearer your_token_here";
        }
        document.getElementById('battle-headers').value = JSON.stringify(defaultHeaders, null, 2);

        // Clear previous results
        document.getElementById('battle-status').innerHTML = `
            <div class="status-indicator waiting">
                <span class="status-text">Ready for battle... ⚔️</span>
            </div>
        `;
        document.getElementById('battle-response').innerHTML = '<code>// Battle results will appear here...</code>';

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeBattleModal() {
        const modal = document.getElementById('battle-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }

    async startBattle() {
        const method = document.getElementById('battle-method').value;
        const url = document.getElementById('battle-url').value;
        const headers = document.getElementById('battle-headers').value;
        const body = document.getElementById('battle-body').value;

        const statusElement = document.getElementById('battle-status');
        const responseElement = document.getElementById('battle-response');

        // Battle start animation
        statusElement.innerHTML = `
            <div class="status-indicator battling">
                <span class="status-text">⚡ BATTLE IN PROGRESS ⚡</span>
            </div>
        `;

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

            const startTime = Date.now();
            const response = await fetch(url, requestOptions);
            const endTime = Date.now();
            const responseTime = endTime - startTime;

            let responseData;
            try {
                responseData = await response.json();
            } catch (e) {
                responseData = await response.text();
            }

            // Battle results
            const isSuccess = response.ok;
            statusElement.innerHTML = `
                <div class="status-indicator ${isSuccess ? 'victory' : 'defeat'}">
                    <span class="status-text">
                        ${isSuccess ? '🏆 VICTORY!' : '💥 DEFEAT!'} 
                        ${response.status} ${response.statusText} 
                        (${responseTime}ms)
                    </span>
                </div>
            `;

            if (typeof responseData === 'object') {
                responseElement.innerHTML = `<code>${JSON.stringify(responseData, null, 2)}</code>`;
            } else {
                responseElement.innerHTML = `<code>${responseData}</code>`;
            }

            // Update live stats
            this.updateLiveStats();

        } catch (error) {
            statusElement.innerHTML = `
                <div class="status-indicator defeat">
                    <span class="status-text">💀 CONNECTION FAILED: ${error.message}</span>
                </div>
            `;
            responseElement.innerHTML = `<code>Error: ${error.message}</code>`;
        }
    }

    updateStats() {
        if (!this.postmanData) return;

        let totalEndpoints = 0;
        this.postmanData.item.forEach(service => {
            if (service.item) {
                totalEndpoints += service.item.length;
            }
        });

        // Update ready count
        document.getElementById('ready-count').textContent = totalEndpoints;
    }

    updateLiveStats() {
        // Simulate live stats updates
        const totalRequests = document.getElementById('total-requests');
        const avgResponse = document.getElementById('avg-response');
        const successRate = document.getElementById('success-rate');

        if (totalRequests) {
            const current = parseInt(totalRequests.textContent.replace(/,/g, '')) || 1337;
            totalRequests.textContent = (current + 1).toLocaleString();
        }

        if (avgResponse) {
            const newTime = Math.floor(Math.random() * 50) + 25;
            avgResponse.textContent = `${newTime}ms`;
        }

        if (successRate) {
            const rate = (Math.random() * 2 + 98).toFixed(1);
            successRate.textContent = `${rate}%`;
        }
    }

    startStatsAnimation() {
        // Animate counters on load
        setTimeout(() => {
            this.animateCounter('total-requests', 1337);
            this.animateCounter('avg-response', 42, 'ms');
            this.animateCounter('success-rate', 99.8, '%');
        }, 1000);
    }

    animateCounter(id, targetValue, suffix = '') {
        const element = document.getElementById(id);
        if (!element) return;

        const startValue = 0;
        const duration = 2000;
        const increment = (targetValue - startValue) / (duration / 16);
        
        let currentValue = startValue;
        const timer = setInterval(() => {
            currentValue += increment;
            if (currentValue >= targetValue) {
                element.textContent = targetValue + suffix;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(currentValue) + suffix;
            }
        }, 16);
    }

    triggerSelectionEffect(element) {
        if (!element) return;
        
        element.style.transform = 'scale(1.05)';
        setTimeout(() => {
            element.style.transform = '';
        }, 200);
    }

    selectGameMode(mode) {
        const modeActions = {
            '1v1': () => this.openBattleModal(),
            'tournament': () => this.testAllEndpoints(),
            'ai': () => this.startStressTest()
        };

        if (modeActions[mode]) {
            modeActions[mode]();
        }
    }

    async testAllEndpoints() {
        this.showNotification('Starting tournament battle! 🏆', 'info');
        // Implementation for testing all endpoints
    }

    startStressTest() {
        this.showNotification('AI stress test initiated! 🤖', 'info');
        // Implementation for stress testing
    }

    startMainBattle() {
        if (this.endpoints.length > 0) {
            this.openBattleModal();
        } else {
            this.showNotification('Select a service first! 🎯', 'warning');
        }
    }

    exportDocumentation() {
        const dataStr = JSON.stringify(this.postmanData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `squidpong-arena-docs-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.showNotification('Arena documentation exported! 📋', 'success');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `arena-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        // Style the notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(30, 39, 73, 0.95);
            border: 2px solid var(--accent-gold);
            border-radius: 12px;
            padding: 16px 20px;
            color: var(--text-primary);
            z-index: 10000;
            transform: translateX(100%);
            transition: all 0.4s ease;
            backdrop-filter: blur(10px);
            font-family: 'Rajdhani', sans-serif;
            font-weight: 600;
        `;

        notification.querySelector('.notification-content').style.cssText = `
            display: flex;
            align-items: center;
            gap: 12px;
        `;

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after delay
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 400);
        }, 4000);
    }
}

// Initialize the arena when DOM is loaded
let ArenaApp;
document.addEventListener('DOMContentLoaded', () => {
    ArenaApp = new SquidPongArena();
});

// Add some extra battle card styles for completion
const battleStyles = document.createElement('style');
battleStyles.textContent = `
    .status-indicator.battling .status-text {
        color: var(--accent-gold);
        animation: pulse 1s ease-in-out infinite;
    }

    .status-indicator.victory .status-text {
        color: var(--accent-green);
    }

    .status-indicator.defeat .status-text {
        color: var(--accent-red);
    }

    .empty-arena {
        text-align: center;
        padding: 60px 20px;
        color: var(--text-muted);
    }

    .empty-icon {
        font-size: 3rem;
        margin-bottom: 20px;
        opacity: 0.5;
    }

    .empty-arena h3 {
        color: var(--text-secondary);
        margin-bottom: 10px;
        font-family: 'Orbitron', monospace;
    }
`;
document.head.appendChild(battleStyles);
