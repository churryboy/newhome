/* ==============================================
   Chat Functionality Module
   Follows Separation of Concerns principle
   ============================================== */

// ==============================================
// Configuration
// ==============================================
const CONFIG = {
    API_URL: window.location.origin + '/api/chat',
    CLEAR_URL: window.location.origin + '/api/chat/clear',
    SESSION_ID: null  // Will be set after login
};

// ==============================================
// Authentication & State Management
// ==============================================
const Auth = {
    init() {
        const nickname = localStorage.getItem('userNickname');
        if (nickname) {
            this.login(nickname, false);
        } else {
            this.showLoginModal();
        }
    },
    
    showLoginModal() {
        document.body.classList.add('not-logged-in');
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    },
    
    hideLoginModal() {
        document.body.classList.remove('not-logged-in');
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    },
    
    login(nickname, isNewLogin = true) {
        // Save to localStorage
        localStorage.setItem('userNickname', nickname);
        
        // Set session ID to nickname
        CONFIG.SESSION_ID = nickname;
        
        // Update UI
        this.hideLoginModal();
        document.getElementById('profileNickname').textContent = nickname;
        
        // Load existing conversation if any
        if (isNewLogin) {
            this.loadExistingConversation(nickname);
        }
    },
    
    logout() {
        if (confirm('로그아웃하시겠습니까? 대화 내역은 다시 로그인하면 복구됩니다.')) {
            localStorage.removeItem('userNickname');
            CONFIG.SESSION_ID = null;
            location.reload();
        }
    },
    
    async loadExistingConversation(nickname) {
        try {
            const response = await fetch(`${window.location.origin}/api/archive/${nickname}`);
            const data = await response.json();
            
            if (data.messages && data.messages.length > 0) {
                // Clear welcome message
                DOMElements.messagesContainer.innerHTML = '';
                
                // Load all previous messages
                data.messages.forEach(msg => {
                    if (msg.role === 'user' || msg.role === 'assistant') {
                        MessageHandler.addMessage(
                            msg.content,
                            msg.role === 'user' ? 'user' : 'bot',
                            false  // Don't scroll for each message
                        );
                    }
                });
                
                // Scroll to bottom after all messages loaded
                MessageHandler.scrollToBottom();
                
                // Load profile stats
                ProfileManager.loadProfile();
            }
        } catch (error) {
            console.error('Failed to load conversation:', error);
        }
    }
};

// ==============================================
// State Management
// ==============================================
const ChatState = {
    messages: [],
    isTyping: false
};

// ==============================================
// DOM Elements Cache
// ==============================================
const DOMElements = {
    messageInput: null,
    messagesContainer: null,
    chatForm: null,
    sendButton: null,
    
    init() {
        this.messageInput = document.getElementById('messageInput');
        this.messagesContainer = document.getElementById('messagesContainer');
        this.chatForm = document.getElementById('chatForm');
        this.sendButton = document.getElementById('sendButton');
    }
};

// ==============================================
// Utility Functions
// ==============================================
const Utils = {
    getCurrentTime() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    },
    
    sanitizeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    formatMarkdown(text) {
        // First sanitize the text
        let formatted = this.sanitizeHTML(text);
        
        // Convert **text** to <strong>text</strong>
        formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        
        // Convert numbered lists with proper spacing (single line break)
        formatted = formatted.replace(/\n(\d+)\.\s+/g, '<br>$1. ');
        
        // Convert remaining line breaks to <br>
        formatted = formatted.replace(/\n/g, '<br>');
        
        // Add spacing after emojis for better readability
        formatted = formatted.replace(/([\u{1F300}-\u{1F9FF}])/gu, '$1 ');
        
        return formatted;
    },
    
    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
};

// ==============================================
// Message Handling
// ==============================================
const MessageHandler = {
    createMessageElement(content, type = 'bot') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const messageContainer = document.createElement('div');
        messageContainer.className = 'message-text';
        messageContainer.innerHTML = Utils.formatMarkdown(content);
        
        const messageTime = document.createElement('span');
        messageTime.className = 'message-time';
        messageTime.textContent = Utils.getCurrentTime();
        
        messageContent.appendChild(messageContainer);
        messageDiv.appendChild(messageContent);
        messageDiv.appendChild(messageTime);
        
        return messageDiv;
    },
    
    addMessage(content, type = 'bot', shouldScroll = true) {
        const messageElement = this.createMessageElement(content, type);
        DOMElements.messagesContainer.appendChild(messageElement);
        
        // Store in state
        ChatState.messages.push({
            content,
            type,
            timestamp: new Date().toISOString()
        });
        
        // Smooth scroll to bottom
        if (shouldScroll) {
            this.scrollToBottom();
        }
    },
    
    scrollToBottom() {
        setTimeout(() => {
            DOMElements.messagesContainer.lastElementChild?.scrollIntoView({
                behavior: 'smooth',
                block: 'end'
            });
        }, 100);
    },
    
    async getBotResponse(userMessage) {
        // Show typing indicator
        ChatState.isTyping = true;
        this.updateSendButton();
        this.showTypingIndicator();
        
        try {
            const response = await fetch(CONFIG.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: userMessage,
                    sessionId: CONFIG.SESSION_ID
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '서버 오류가 발생했습니다.');
            }

            const data = await response.json();
            
            // Update query badge
            if (data.queryCount) {
                ProfileManager.updateQueryBadge(data.queryCount);
            }
            
            // Remove typing indicator
            this.removeTypingIndicator();
            
            // Add bot response
            this.addMessage(data.message, 'bot');
            
            // Show notification if summary was generated
            if (data.summaryGenerated) {
                setTimeout(() => {
                    this.addMessage('🎯 새로운 프로필 분석이 생성되었습니다! "내 프로필" 탭을 확인해보세요!', 'bot');
                }, 1000);
            }
            
        } catch (error) {
            console.error('Error:', error);
            this.removeTypingIndicator();
            this.addMessage(
                '죄송합니다. 응답을 생성하는 중 오류가 발생했습니다. 다시 시도해주세요.', 
                'bot'
            );
        } finally {
            ChatState.isTyping = false;
            this.updateSendButton();
        }
    },
    
    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing-indicator';
        typingDiv.id = 'typingIndicator';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
        
        typingDiv.appendChild(messageContent);
        DOMElements.messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
    },
    
    removeTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    },
    
    updateSendButton() {
        DOMElements.sendButton.disabled = ChatState.isTyping;
    }
};

// ==============================================
// Input Handling
// ==============================================
const InputHandler = {
    handleSubmit(event) {
        event.preventDefault();
        
        const message = DOMElements.messageInput.value.trim();
        
        if (message && !ChatState.isTyping) {
            // Add user message
            MessageHandler.addMessage(message, 'user');
            
            // Clear input
            DOMElements.messageInput.value = '';
            DOMElements.messageInput.style.height = 'auto';
            
            // Focus back on input
            DOMElements.messageInput.focus();
            
            // Get bot response from OpenAI
            MessageHandler.getBotResponse(message);
        }
    },
    
    handleKeyPress(event) {
        // Submit on Enter (without Shift)
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.handleSubmit(event);
        }
    },
    
    handleInput(event) {
        Utils.autoResizeTextarea(event.target);
    }
};

// ==============================================
// Initialization
// ==============================================
const ChatApp = {
    init() {
        // Initialize Authentication first
        Auth.init();
        
        // Initialize DOM elements
        DOMElements.init();
        
        // Add event listeners
        this.attachEventListeners();
        
        // Initial focus
        DOMElements.messageInput?.focus();
        
        console.log('채팅 애플리케이션이 성공적으로 초기화되었습니다');
    },
    
    attachEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const nicknameInput = document.getElementById('nicknameInput');
                const nickname = nicknameInput.value.trim();
                if (nickname) {
                    Auth.login(nickname, true);
                }
            });
        }
        
        // Logout button
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', () => Auth.logout());
        }
        
        // Form submission
        DOMElements.chatForm?.addEventListener('submit', (e) => InputHandler.handleSubmit(e));
        
        // Textarea auto-resize and keyboard shortcuts
        DOMElements.messageInput?.addEventListener('input', (e) => InputHandler.handleInput(e));
        DOMElements.messageInput?.addEventListener('keypress', (e) => InputHandler.handleKeyPress(e));
        
        // Prevent textarea from being too small on mobile
        DOMElements.messageInput?.addEventListener('focus', function() {
            this.style.fontSize = '16px'; // Prevents zoom on iOS
        });
    }
};

// ==============================================
// Initialize when DOM is ready
// ==============================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ChatApp.init());
} else {
    ChatApp.init();
}

// ==============================================
// Export for potential module usage
// ==============================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ChatApp, MessageHandler, Utils };
}


// ==============================================
// Tab Management & Profile System
// ==============================================
const TabManager = {
    init() {
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
    },
    
    switchTab(tabName) {
        // Update buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            }
        });
        
        // Update content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        if (tabName === 'chat') {
            document.getElementById('chatTab').classList.add('active');
        } else if (tabName === 'profile') {
            document.getElementById('profileTab').classList.add('active');
            ProfileManager.loadProfile();
        }
    }
};

const ProfileManager = {
    async loadProfile() {
        try {
            const sessionId = CONFIG.SESSION_ID;
            
            // Fetch stats
            const statsResponse = await fetch(`${window.location.origin}/api/stats/${sessionId}`);
            const stats = await statsResponse.json();
            
            const totalQueriesEl = document.getElementById('totalQueries');
            const nextSummaryEl = document.getElementById('nextSummary');
            const queryBadgeEl = document.getElementById('queryBadge');
            
            if (totalQueriesEl) totalQueriesEl.textContent = stats.queryCount;
            if (nextSummaryEl) nextSummaryEl.textContent = stats.nextSummaryAt;
            if (queryBadgeEl) queryBadgeEl.textContent = stats.queryCount;
            
            // Fetch profile
            const profileResponse = await fetch(`${window.location.origin}/api/profile/${sessionId}`);
            const profile = await profileResponse.json();
            
            const summaryTextEl = document.getElementById('summaryText');
            const summaryMetaEl = document.getElementById('summaryMeta');
            
            if (profile.exists) {
                if (summaryTextEl) {
                    summaryTextEl.innerHTML = Utils.formatMarkdown(profile.summary);
                }
                if (summaryMetaEl) {
                    summaryMetaEl.textContent = 
                        `📅 마지막 업데이트: ${new Date(profile.lastUpdated).toLocaleString('ko-KR')} | 💬 총 대화: ${profile.messageCount}개`;
                }
            } else {
                if (summaryTextEl) {
                    summaryTextEl.textContent = profile.message;
                }
                if (summaryMetaEl) {
                    summaryMetaEl.textContent = '';
                }
            }
            
        } catch (error) {
            console.error('Profile load error:', error);
            const summaryTextEl = document.getElementById('summaryText');
            if (summaryTextEl) {
                summaryTextEl.textContent = '프로필을 불러오는 중 오류가 발생했습니다.';
            }
        }
    },
    
    updateQueryBadge(count) {
        const badge = document.getElementById('queryBadge');
        if (badge) {
            badge.textContent = count;
            // Animate badge
            badge.style.transform = 'scale(1.3)';
            setTimeout(() => {
                badge.style.transform = 'scale(1)';
            }, 200);
        }
    }
};

// Initialize tab system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    TabManager.init();
});

