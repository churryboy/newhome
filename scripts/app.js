// ============================================
// D-Day Manager Application - Mobile App
// QANDA DS v4.0
// ============================================

class DDayManager {
    constructor() {
        this.events = [];
        this.currentImageText = '';
        this.currentImageData = ''; // Store current uploaded image
        this.currentTab = 'home';
        this.currentDate = new Date();
        this.isCalendarCollapsed = false;
        this.selectedDate = null;
        this.currentPreviewIndex = 0;
        this.previewImages = [];
        this.energyClickCount = 0; // Track energy button clicks
        this.energyClickTimer = null; // Timer to reset click count
        this.textbookName = localStorage.getItem('textbookName') || '생각하는 황소 중1 상 ESSENCE';
        this.verificationVersion = localStorage.getItem('verificationVersion') || 'default';
        this.ctaVersion = localStorage.getItem('ctaVersion') || 'default';
        this.cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
        // Use relative URL for API calls (works both locally and on Vercel)
        this.apiUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000/api' 
            : '/api';
        this.init();
    }

    init() {
        this.loadEvents();
        this.loadCalendarState();
        this.setupEventListeners();
        this.setupTabNavigation();
        this.setupCalendarNavigation();
        this.setupCameraPreview();
        this.setupKeyboardShortcuts();
        this.updateStatusBar();
        this.renderCalendar();
        this.updateStats();
        this.setYesterdayStudyTime();
        this.checkServerConnection();
        this.animateMinjiStatus();
        this.updateCartBadge(); // Initialize cart badge on page load
    }

    animateMinjiStatus() {
        // After 1 second, change 민지's status from 오프라인 to 접속중
        setTimeout(() => {
            const friendMinji = document.getElementById('friendMinji');
            if (friendMinji) {
                const activity = friendMinji.querySelector('.friend-activity');
                const emoji = friendMinji.querySelector('.friend-emoji');
                
                if (activity) {
                    activity.textContent = '접속중';
                }
                if (emoji) {
                    emoji.textContent = '🟢';
                }
            }
        }, 1000);
    }

    updateStatusBar() {
        // Update time
        const updateTime = () => {
            const now = new Date();
            const hours = now.getHours();
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const timeElement = document.getElementById('statusTime');
            if (timeElement) {
                timeElement.textContent = `${hours}:${minutes}`;
            }
        };
        
        updateTime();
        setInterval(updateTime, 60000); // Update every minute

        // Update event badge
        this.updateEventBadge();
    }

    updateEventBadge() {
        const badgeElement = document.querySelector('.badge-count');
        if (badgeElement) {
            const upcomingEvents = this.events.filter(e => this.calculateDDay(e.date) >= 0).length;
            badgeElement.textContent = upcomingEvents;
        }
    }

    loadCalendarState() {
        const saved = localStorage.getItem('calendarCollapsed');
        if (saved !== null) {
            this.isCalendarCollapsed = saved === 'true';
            const calendarView = document.getElementById('calendarView');
            if (calendarView && this.isCalendarCollapsed) {
                calendarView.classList.add('collapsed');
            }
        }
    }

    setupEventListeners() {
        const uploadButton = document.getElementById('uploadButton');
        const fileInput = document.getElementById('fileInput');
        const saveButton = document.getElementById('saveButton');
        
        // Camera Widget
        const cameraButton = document.getElementById('cameraButton');
        
        // Event Modal
        const closeEventModal = document.getElementById('closeEventModal');
        const eventModalOverlay = document.getElementById('eventModalOverlay');
        const modalUploadButton = document.getElementById('modalUploadButton');
        const modalFileInput = document.getElementById('modalFileInput');
        const modalSaveButton = document.getElementById('modalSaveButton');

        uploadButton.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        saveButton.addEventListener('click', () => this.saveEvent());
        
        if (cameraButton) {
            cameraButton.addEventListener('click', () => this.openCameraWidget());
        }
        
        if (closeEventModal) {
            closeEventModal.addEventListener('click', () => this.closeEventModal());
        }
        if (eventModalOverlay) {
            eventModalOverlay.addEventListener('click', () => this.closeEventModal());
        }
        if (modalUploadButton) {
            modalUploadButton.addEventListener('click', () => modalFileInput.click());
        }
        if (modalFileInput) {
            modalFileInput.addEventListener('change', (e) => this.handleModalFileUpload(e));
        }
        if (modalSaveButton) {
            modalSaveButton.addEventListener('click', () => this.saveEventFromModal());
        }

        // Search Results View
        const searchResultsBack = document.getElementById('searchResultsBack');
        if (searchResultsBack) {
            searchResultsBack.addEventListener('click', () => this.closeSearchResults());
        }

        // Energy Button (Config Modal Trigger)
        const energyButton = document.querySelector('.profile-stat');
        if (energyButton) {
            energyButton.addEventListener('click', () => this.handleEnergyClick());
            energyButton.addEventListener('touchend', (e) => {
                e.preventDefault(); // Prevent double-firing with click
                this.handleEnergyClick();
            });
        }

        // Config Modal
        const configCloseBtn = document.getElementById('configCloseBtn');
        const configApplyBtn = document.getElementById('configApplyBtn');
        const configModalOverlay = document.getElementById('configModalOverlay');

        if (configCloseBtn) {
            configCloseBtn.addEventListener('click', () => this.closeConfigModal());
        }
        if (configApplyBtn) {
            configApplyBtn.addEventListener('click', () => this.applyConfig());
        }
        if (configModalOverlay) {
            configModalOverlay.addEventListener('click', (e) => {
                if (e.target === configModalOverlay) {
                    this.closeConfigModal();
                }
            });
        }

        // Cart View
        const cartButton = document.getElementById('cartButton');
        const cartBackBtn = document.getElementById('cartBackBtn');
        const cartPaymentBtn = document.getElementById('cartPaymentBtn');
        const paymentSuccessBtn = document.getElementById('paymentSuccessBtn');

        if (cartButton) {
            cartButton.addEventListener('click', () => this.openCartView());
        }
        if (cartBackBtn) {
            cartBackBtn.addEventListener('click', () => this.closeCartView());
        }
        if (cartPaymentBtn) {
            cartPaymentBtn.addEventListener('click', () => this.handlePayment());
        }
        if (paymentSuccessBtn) {
            paymentSuccessBtn.addEventListener('click', () => this.closePaymentSuccessModal());
        }
    }

    async checkServerConnection() {
        try {
            const response = await fetch(`${this.apiUrl}/health`);
            if (response.ok) {
                console.log('✅ Server connected');
            }
        } catch (error) {
            console.warn('⚠️ Server not running. Please start the server with "npm start"');
        }
    }

    setupTabNavigation() {
        // Tab navigation disabled - tabs are currently unresponsive
        // const navItems = document.querySelectorAll('.nav-item');
        // 
        // navItems.forEach(item => {
        //     item.addEventListener('click', () => {
        //         const tab = item.getAttribute('data-tab');
        //         this.switchTab(tab);
        //     });
        // });
    }

    setupCalendarNavigation() {
        const collapseBtn = document.getElementById('collapseBtn');
        const closeSelectedDate = document.getElementById('closeSelectedDate');
        const closeImageModal = document.getElementById('closeImageModal');
        const imageModalOverlay = document.getElementById('imageModalOverlay');

        if (collapseBtn) {
            collapseBtn.addEventListener('click', () => this.toggleCalendarCollapse());
        }
        if (closeSelectedDate) {
            closeSelectedDate.addEventListener('click', () => this.closeSelectedDatePanel());
        }
        if (closeImageModal) {
            closeImageModal.addEventListener('click', () => this.closeImageModal());
        }
        if (imageModalOverlay) {
            imageModalOverlay.addEventListener('click', () => this.closeImageModal());
        }
    }

    toggleCalendarCollapse() {
        this.isCalendarCollapsed = !this.isCalendarCollapsed;
        const calendarView = document.getElementById('calendarView');
        
        if (this.isCalendarCollapsed) {
            calendarView.classList.add('collapsed');
        } else {
            calendarView.classList.remove('collapsed');
        }
        
        this.renderCalendar();
        
        // Save preference
        localStorage.setItem('calendarCollapsed', this.isCalendarCollapsed);
    }

    setupCameraPreview() {
        // Get all preview images
        this.previewImages = document.querySelectorAll('.preview-image');
        const cameraPreview = document.getElementById('cameraPreview');
        const paginationDots = document.querySelectorAll('.pagination-dot');
        
        // Add scroll listener to update pagination
        if (cameraPreview) {
            cameraPreview.addEventListener('scroll', () => {
                const scrollLeft = cameraPreview.scrollLeft;
                const containerWidth = cameraPreview.offsetWidth;
                const currentIndex = Math.round(scrollLeft / containerWidth);
                this.currentPreviewIndex = currentIndex;
                
                // Update pagination dots
                paginationDots.forEach((dot, index) => {
                    if (index === currentIndex) {
                        dot.classList.add('active');
                    } else {
                        dot.classList.remove('active');
                    }
                });
            });
        }
        
        paginationDots.forEach((dot, index) => {
            dot.addEventListener('click', () => this.goToPreviewImage(index));
        });
    }

    changePreviewImage(direction) {
        const totalImages = this.previewImages.length;
        this.currentPreviewIndex = (this.currentPreviewIndex + direction + totalImages) % totalImages;
        this.updatePreviewDisplay();
    }

    goToPreviewImage(index) {
        this.currentPreviewIndex = index;
        const cameraPreview = document.getElementById('cameraPreview');
        if (cameraPreview && this.previewImages[index]) {
            const containerWidth = cameraPreview.offsetWidth;
            cameraPreview.scrollTo({
                left: containerWidth * index,
                behavior: 'smooth'
            });
        }
    }

    updatePreviewDisplay() {
        // This method is no longer needed with scroll-based pagination
        // but keeping it for compatibility
    }

    changeMonth(delta) {
        this.currentDate.setMonth(this.currentDate.getMonth() + delta);
        this.renderCalendar();
        this.closeSelectedDatePanel();
    }

    closeSelectedDatePanel() {
        const panel = document.getElementById('selectedDateEvents');
        panel.style.display = 'none';
    }

    openImageModal(event) {
        if (!event.image) {
            this.showToast('이 이벤트에는 이미지가 없습니다');
            return;
        }

        const modal = document.getElementById('imageModal');
        const modalImage = document.getElementById('modalImage');
        const modalTitle = document.getElementById('imageModalTitle');

        modalImage.src = event.image;
        modalTitle.textContent = event.title;
        modal.style.display = 'flex';

        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
    }

    closeImageModal() {
        const modal = document.getElementById('imageModal');
        modal.style.display = 'none';

        // Restore body scroll
        document.body.style.overflow = '';
    }

    setupKeyboardShortcuts() {
        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const imageModal = document.getElementById('imageModal');
                if (imageModal && imageModal.style.display === 'flex') {
                    this.closeImageModal();
                }
            }
        });
    }

    switchTab(tabName) {
        // Update nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            if (item.getAttribute('data-tab') === tabName) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        const targetTab = document.getElementById(`${tabName}Tab`);
        if (targetTab) {
            targetTab.classList.add('active');
        }

        this.currentTab = tabName;

        // Render appropriate content
        if (tabName === 'home') {
            this.renderCalendar();
        } else if (tabName === 'stats') {
            this.updateStats();
        }

        // Scroll to top
        document.querySelector('.main-container').scrollTop = 0;
    }

    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('이미지 파일을 업로드해 주세요');
            return;
        }

        // Show processing indicator
        this.showProcessing(true);

        try {
            // Convert file to base64
            const base64Image = await this.fileToBase64(file);
            
            // Store the image data for later use
            this.currentImageData = base64Image;
            
            // Call backend API
            const response = await fetch(`${this.apiUrl}/extract-text`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: base64Image
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Server error');
            }

            const result = await response.json();
            
            // Show debug panel with extracted text
            const debugPanel = document.getElementById('ocrDebugPanel');
            const debugText = document.getElementById('ocrDebugText');
            debugPanel.style.display = 'block';
            debugText.textContent = `AI 응답:\n${result.rawText}\n\n추출된 정보:\n제목: ${result.title}\n날짜: ${result.date}`;

            // Fill form with extracted data
            document.getElementById('titleInput').value = result.title || '';
            document.getElementById('dateInput').value = result.date || '';

            // Focus on first empty field
            if (!result.title) {
                document.getElementById('titleInput').focus();
            } else if (!result.date) {
                document.getElementById('dateInput').focus();
            }

            this.showToast('텍스트 추출 완료! 확인 후 저장해주세요');
        } catch (error) {
            console.error('OCR 오류:', error);
            if (error.message.includes('not configured') || error.message.includes('API key')) {
                alert('서버의 API 키가 설정되지 않았습니다.\n.env 파일에 OPENAI_API_KEY를 추가해주세요.');
            } else if (error.message.includes('Failed to fetch')) {
                alert('서버에 연결할 수 없습니다.\n터미널에서 "npm start"로 서버를 실행해주세요.');
            } else {
                alert('이미지 처리에 실패했습니다. 직접 입력해 주세요.\n\n오류: ' + error.message);
            }
        } finally {
            this.showProcessing(false);
            event.target.value = ''; // Reset file input
        }
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }


    showProcessing(show) {
        const indicator = document.getElementById('processingIndicator');
        indicator.style.display = show ? 'block' : 'none';
    }

    saveEvent() {
        const titleInput = document.getElementById('titleInput');
        const dateInput = document.getElementById('dateInput');

        const title = titleInput.value.trim();
        const date = dateInput.value;

        if (!title) {
            alert('제목을 입력해 주세요');
            titleInput.focus();
            return;
        }

        if (!date) {
            alert('날짜를 선택해 주세요');
            dateInput.focus();
            return;
        }

        const event = {
            id: Date.now(),
            title,
            date,
            image: this.currentImageData, // Store the uploaded image
            createdAt: new Date().toISOString()
        };

        this.events.push(event);
        this.saveEvents();
        this.updateStats();
        this.updateEventBadge();

        // Reset form
        titleInput.value = '';
        dateInput.value = '';
        
        // Clear the current image data
        this.currentImageData = '';

        // Switch to home tab to show the new event
        this.switchTab('home');
        
        this.showToast('이벤트가 추가되었습니다! 🎉');
    }

    calculateDDay(targetDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const target = new Date(targetDate);
        target.setHours(0, 0, 0, 0);
        
        const diffTime = target - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays;
    }

    formatDDay(days) {
        if (days === 0) {
            return 'D-Day';
        } else if (days > 0) {
            return `D-${days}`;
        } else {
            return `D+${Math.abs(days)}`;
        }
    }

    renderCalendar() {
        // If collapsed, show week view
        if (this.isCalendarCollapsed) {
            this.renderWeekView();
            return;
        }

        const calendarTitle = document.getElementById('calendarTitle');
        const calendarGrid = document.getElementById('calendarGrid');

        // Update title
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        calendarTitle.textContent = `${month + 1}월`;

        // Get first and last day of month
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDay = firstDay.getDay(); // 0 = Sunday
        const daysInMonth = lastDay.getDate();

        // Get previous month's last days
        const prevMonthLastDay = new Date(year, month, 0).getDate();

        // Get events grouped by date
        const eventsByDate = this.groupEventsByDate();

        // Get today's date for comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let html = '';
        let dayCount = 0;

        // Previous month days
        for (let i = startDay - 1; i >= 0; i--) {
            const day = prevMonthLastDay - i;
            html += `<div class="calendar-day other-month">
                <span class="calendar-day-number">${day}</span>
            </div>`;
            dayCount++;
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayDate = new Date(year, month, day);
            const dayOfWeek = dayDate.getDay();
            const isToday = dayDate.getTime() === today.getTime();
            const events = eventsByDate[dateStr] || [];
            const hasEvents = events.length > 0;

            let dayClass = 'calendar-day';
            if (dayOfWeek === 0) dayClass += ' sunday';
            if (dayOfWeek === 6) dayClass += ' saturday';
            if (isToday) dayClass += ' today';
            if (hasEvents) dayClass += ' has-events';

            html += `
                <div class="${dayClass}" data-date="${dateStr}" onclick="window.ddayManager.selectDate('${dateStr}')">
                    <span class="calendar-day-number">${day}</span>
                </div>
            `;
            dayCount++;
        }

        // Next month days to fill the grid
        const remainingDays = 42 - dayCount; // 6 rows * 7 days
        for (let day = 1; day <= remainingDays; day++) {
            html += `<div class="calendar-day other-month">
                <span class="calendar-day-number">${day}</span>
            </div>`;
        }

        calendarGrid.innerHTML = html;
        
        // Render upcoming events
        this.renderUpcomingEvents();
    }

    renderUpcomingEvents() {
        const upcomingEventsList = document.getElementById('upcomingEventsList');
        if (!upcomingEventsList) return;
        
        // Always show these two placeholder events
        const permanentEvents = [
            { title: '음악 수행 보고서 제출' },
            { title: '체육 실기 - 윗몸일으키기' }
        ];
        
        const maxEvents = this.isCalendarCollapsed ? 1 : 2;
        const displayEvents = permanentEvents.slice(0, maxEvents);
        
        const colors = ['color-purple', 'color-yellow', 'color-blue'];
        
        const html = displayEvents.map((event, index) => {
            const colorClass = colors[index % colors.length];
            
            return `
                <div class="upcoming-event-card ${colorClass}">
                    <div class="upcoming-event-title">${event.title}</div>
                </div>
            `;
        }).join('');
        
        upcomingEventsList.innerHTML = html;
    }

    renderWeekView() {
        const calendarTitle = document.getElementById('calendarTitle');
        const calendarGrid = document.getElementById('calendarGrid');

        // Get today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Get the start of the week (Sunday)
        const currentDayOfWeek = today.getDay();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - currentDayOfWeek);
        
        // Update title to show only month
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        calendarTitle.textContent = `${month + 1}월`;

        // Get events grouped by date
        const eventsByDate = this.groupEventsByDate();

        // Render only current week (7 days)
        let html = '';
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);
            
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            const dayOfWeek = date.getDay();
            const isToday = date.getTime() === today.getTime();
            const events = eventsByDate[dateStr] || [];
            const hasEvents = events.length > 0;

            let dayClass = 'calendar-day';
            if (dayOfWeek === 0) dayClass += ' sunday';
            if (dayOfWeek === 6) dayClass += ' saturday';
            if (isToday) dayClass += ' today';
            if (hasEvents) dayClass += ' has-events';

            html += `
                <div class="${dayClass}" data-date="${dateStr}" onclick="ddayManager.selectDate('${dateStr}')">
                    <span class="calendar-day-number">${date.getDate()}</span>
                </div>
            `;
        }

        calendarGrid.innerHTML = html;
        
        // Render upcoming events
        this.renderUpcomingEvents();
    }

    groupEventsByDate() {
        const grouped = {};
        this.events.forEach(event => {
            if (!grouped[event.date]) {
                grouped[event.date] = [];
            }
            grouped[event.date].push(event);
        });
        return grouped;
    }

    showDateEvents(dateStr) {
        const eventsByDate = this.groupEventsByDate();
        const events = eventsByDate[dateStr] || [];

        if (events.length === 0) return;

        const panel = document.getElementById('selectedDateEvents');
        const title = document.getElementById('selectedDateTitle');
        const list = document.getElementById('selectedDateList');

        // Format date
        const date = new Date(dateStr);
        const formattedDate = date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });

        title.textContent = formattedDate;

        list.innerHTML = events.map(event => {
            const dday = this.calculateDDay(event.date);
            const ddayText = this.formatDDay(dday);
            const hasImage = event.image && event.image.length > 0;

            return `
                <div class="selected-event-item ${hasImage ? 'has-image' : ''}" data-event-id="${event.id}">
                    <div class="selected-event-info">
                        <div class="selected-event-title type-body">
                            ${hasImage ? '🖼️ ' : ''}${this.escapeHtml(event.title)}
                        </div>
                        <div class="selected-event-dday type-caption1">${ddayText}</div>
                    </div>
                    <button class="delete-button" onclick="ddayManager.deleteEvent(${event.id})" aria-label="이벤트 삭제">
                        ✕
                    </button>
                </div>
            `;
        }).join('');

        // Add click listeners to event items with images
        setTimeout(() => {
            const eventItems = list.querySelectorAll('.selected-event-item.has-image');
            eventItems.forEach(item => {
                const eventId = parseInt(item.getAttribute('data-event-id'));
                const event = this.events.find(e => e.id === eventId);
                
                // Make the info section clickable
                const infoSection = item.querySelector('.selected-event-info');
                infoSection.style.cursor = 'pointer';
                infoSection.addEventListener('click', () => {
                    this.openImageModal(event);
                });
            });
        }, 0);

        panel.style.display = 'block';
    }

    updateStats() {
        const total = this.events.length;
        const upcoming = this.events.filter(e => this.calculateDDay(e.date) > 0).length;
        const passed = this.events.filter(e => this.calculateDDay(e.date) < 0).length;

        const totalEl = document.getElementById('totalEvents');
        const upcomingEl = document.getElementById('upcomingEvents');
        const passedEl = document.getElementById('passedEvents');
        
        if (totalEl) totalEl.textContent = total;
        if (upcomingEl) upcomingEl.textContent = upcoming;
        if (passedEl) passedEl.textContent = passed;

        // Show next upcoming event
        const nextEventCard = document.getElementById('nextEventCard');
        if (!nextEventCard) return;
        const upcomingEvents = this.events
            .filter(e => this.calculateDDay(e.date) >= 0)
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        if (upcomingEvents.length > 0) {
            const event = upcomingEvents[0];
            const dday = this.calculateDDay(event.date);
            const ddayText = this.formatDDay(dday);
            const isToday = dday === 0;

            const eventDate = new Date(event.date);
            const formattedDate = eventDate.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
            });

            nextEventCard.innerHTML = `
                <div class="event-card" style="margin: 0;">
                    <div class="card-header">
                        <h3 class="card-title">${this.escapeHtml(event.title)}</h3>
                    </div>
                    <p class="card-date type-caption1">📅 ${formattedDate}</p>
                    <div class="dday-container ${isToday ? 'today' : ''}">
                        <div class="dday-label">${isToday ? '오늘이 바로 그날!' : '남은 날'}</div>
                        <div class="dday-value">${ddayText}</div>
                    </div>
                </div>
            `;
        } else {
            nextEventCard.innerHTML = `
                <p class="type-body" style="color: var(--color-neutral-50);">
                    등록된 이벤트가 없습니다
                </p>
            `;
        }
    }

    setYesterdayStudyTime() {
        const element = document.getElementById('yesterdayStudyTime');
        if (!element) return;
        
        // Generate random time below 7 hours
        const totalMinutes = Math.floor(Math.random() * (7 * 60)); // Random minutes below 7 hours
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        
        element.textContent = `${hours}h ${minutes}m`;
    }

    deleteEvent(id) {
        if (confirm('정말 이 이벤트를 삭제하시겠습니까?')) {
            this.events = this.events.filter(event => event.id !== id);
            this.saveEvents();
            this.renderCalendar();
            this.updateStats();
            this.updateEventBadge();
            this.closeSelectedDatePanel();
            this.showToast('이벤트가 삭제되었습니다');
        }
    }

    clearAllEvents() {
        if (confirm('모든 이벤트를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
            this.events = [];
            this.saveEvents();
            this.renderCalendar();
            this.updateStats();
            this.updateEventBadge();
            this.closeSelectedDatePanel();
            this.showToast('모든 이벤트가 삭제되었습니다');
        }
    }

    saveEvents() {
        localStorage.setItem('ddayEvents', JSON.stringify(this.events));
    }

    loadEvents() {
        const saved = localStorage.getItem('ddayEvents');
        if (saved) {
            try {
                this.events = JSON.parse(saved);
            } catch (e) {
                console.error('이벤트 불러오기 실패:', e);
                this.events = [];
            }
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showToast(message) {
        const existing = document.querySelector('.toast-notification');
        if (existing) {
            existing.remove();
        }

        const toast = document.createElement('div');
        toast.className = 'toast-notification type-body';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: calc(var(--bottom-nav-height) + 16px);
            left: 50%;
            transform: translateX(-50%);
            background: var(--color-neutral-10);
            color: var(--color-neutral-100);
            padding: 12px 24px;
            border-radius: var(--radius-base);
            box-shadow: var(--shadow-lg);
            z-index: 1000;
            animation: slideUpToast 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            max-width: 80%;
            text-align: center;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideDownToast 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    selectDate(dateStr) {
        // Calendar date selection disabled
        // Remove previous selection
        // document.querySelectorAll('.calendar-day.selected').forEach(day => {
        //     day.classList.remove('selected');
        // });
        
        // // Add selection to clicked date
        // const clickedDay = document.querySelector(`[data-date="${dateStr}"]`);
        // if (clickedDay) {
        //     clickedDay.classList.add('selected');
        // }
        
        // this.selectedDate = dateStr;
        // this.openEventModal(dateStr);
    }

    openEventModal(dateStr) {
        const modal = document.getElementById('eventModal');
        const modalDateInput = document.getElementById('modalDateInput');
        const modalTitleInput = document.getElementById('modalTitleInput');
        const modalDetailInput = document.getElementById('modalDetailInput');
        
        if (modal) {
            modal.style.display = 'flex';
            
            // Pre-fill the date
            if (modalDateInput) {
                modalDateInput.value = dateStr;
            }
            
            // Clear other fields
            if (modalTitleInput) modalTitleInput.value = '';
            if (modalDetailInput) modalDetailInput.value = '';
            this.currentImageData = '';
            this.currentImageText = '';
        }
    }

    closeEventModal() {
        const modal = document.getElementById('eventModal');
        if (modal) {
            modal.style.display = 'none';
        }
        
        // Clear selection
        document.querySelectorAll('.calendar-day.selected').forEach(day => {
            day.classList.remove('selected');
        });
        this.selectedDate = null;
    }

    async handleModalFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            this.currentImageData = event.target.result;
            await this.performOCR(event.target.result);
        };
        reader.readAsDataURL(file);
    }

    saveEventFromModal() {
        const titleInput = document.getElementById('modalTitleInput');
        const dateInput = document.getElementById('modalDateInput');
        const detailInput = document.getElementById('modalDetailInput');
        
        const title = titleInput.value.trim();
        const date = dateInput.value;
        const detail = detailInput.value.trim();
        
        if (!title) {
            this.showToast('제목을 입력하세요');
            return;
        }
        
        if (!date) {
            this.showToast('날짜를 선택하세요');
            return;
        }
        
        const event = {
            id: Date.now(),
            title,
            date,
            detail: detail || '',
            imageData: this.currentImageData || '',
            createdAt: new Date().toISOString()
        };
        
        this.events.push(event);
        this.saveEvents();
        this.renderCalendar();
        this.updateStats();
        this.closeEventModal();
        
        this.showToast('이벤트가 추가되었습니다! 🎉');
        
        // Clear data
        this.currentImageData = '';
        this.currentImageText = '';
    }

    openCameraWidget() {
        // Create a file input for camera/image upload
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment'; // Use camera on mobile devices
        
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                // Store the image data
                this.currentImageData = event.target.result;
                // Show search results view with the captured photo
                this.showSearchResults(event.target.result);
            };
            reader.readAsDataURL(file);
        });
        
        input.click();
    }

    async showSearchResults(imageData) {
        const searchResultsView = document.getElementById('searchResultsView');
        const capturedPhotoImage = document.getElementById('capturedPhotoImage');
        
        if (searchResultsView && capturedPhotoImage) {
            // Set the captured photo
            capturedPhotoImage.src = imageData;
            
            // Update verification section with random content
            this.updateVerificationSection();
            
            // Update CTA section
            this.updateCtaSection();
            
            // Show the search results view
            searchResultsView.style.display = 'block';
            
            // Prevent body scroll
            document.body.style.overflow = 'hidden';

            // Generate and display solution for the uploaded image
            await this.generateAndDisplaySolution(imageData);
        }
    }

    async generateAndDisplaySolution(imageData) {
        const loadingDiv = document.getElementById('solutionPanelLoading');
        const contentDiv = document.getElementById('solutionPanelContent');
        
        if (!loadingDiv || !contentDiv) return;
        
        // Show loading state
        loadingDiv.style.display = 'flex';
        contentDiv.style.display = 'none';
        
        console.log('Starting solution generation...');
        
        try {
            // Get solution from LLM
            const solution = await this.getSolutionFromLLM(imageData);
            
            console.log('Solution received from LLM:', solution);
            
            // Hide loading, show content
            loadingDiv.style.display = 'none';
            contentDiv.style.display = 'block';
            
            // Render solution steps
            this.renderSolutionSteps(solution, contentDiv);
        } catch (error) {
            console.error('❌ Failed to generate solution:', error);
            console.error('Error details:', error.message);
            
            // Show error message to user
            loadingDiv.style.display = 'none';
            contentDiv.style.display = 'block';
            
            // Show error in the panel
            contentDiv.innerHTML = `
                <div style="padding: var(--space-base); background: #FEE; border-radius: var(--radius-base); color: #C00;">
                    <strong>오류 발생:</strong> ${error.message}
                    <br><br>
                    서버가 실행 중인지, API 키가 설정되었는지 확인해주세요.
                </div>
            `;
        }
    }

    renderSolutionSteps(solution, container) {
        if (!solution || !solution.steps) return;
        
        container.innerHTML = solution.steps.map(step => `
            <div class="solution-panel-step">
                <div class="solution-panel-step-number">Step ${step.number}</div>
                <div class="solution-panel-step-content">${step.content}</div>
            </div>
        `).join('');
        
        // Render LaTeX math expressions
        if (window.renderMathInElement) {
            window.renderMathInElement(container, {
                delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false},
                    {left: '\\(', right: '\\)', display: false},
                    {left: '\\[', right: '\\]', display: true}
                ],
                throwOnError: false
            });
        }
    }

    async getSolutionFromLLM(imageData) {
        console.log('Calling solve-problem API...');
        console.log('Image data length:', imageData.length);
        
        try {
            const response = await fetch(`${this.apiUrl}/solve-problem`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: imageData
                })
            });

            console.log('API response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || `Server error: ${response.status}`;
                console.error('API error response:', errorData);
                throw new Error(errorMessage);
            }

            const result = await response.json();
            console.log('API result:', result);
            
            if (!result.solution || !result.solution.steps) {
                throw new Error('Invalid solution format from server');
            }
            
            return result.solution;
        } catch (error) {
            console.error('❌ Error calling LLM API:', error);
            throw error;
        }
    }


    closeSearchResults() {
        const searchResultsView = document.getElementById('searchResultsView');
        
        if (searchResultsView) {
            searchResultsView.style.display = 'none';
            
            // Restore body scroll
            document.body.style.overflow = '';
            
            // Update camera preview with the latest uploaded image
            if (this.currentImageData) {
                this.updateCameraPreview(this.currentImageData);
            }
        }
    }

    updateCameraPreview(imageData) {
        // Update the first preview image with the newly captured image
        const firstPreviewImage = document.querySelector('.preview-image');
        if (firstPreviewImage) {
            firstPreviewImage.src = imageData;
        }
        
        // Scroll back to the first image
        const cameraPreview = document.getElementById('cameraPreview');
        if (cameraPreview) {
            cameraPreview.scrollTo({
                left: 0,
                behavior: 'smooth'
            });
        }
        
        // Update pagination to show first dot as active
        const dots = document.querySelectorAll('.pagination-dot');
        dots.forEach((dot, index) => {
            if (index === 0) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
        
        this.currentPreviewIndex = 0;
    }

    // ==================== Config Modal Methods ====================
    
    handleEnergyClick() {
        this.energyClickCount++;
        
        // Clear existing timer
        if (this.energyClickTimer) {
            clearTimeout(this.energyClickTimer);
        }
        
        // Reset count after 2 seconds of no clicks
        this.energyClickTimer = setTimeout(() => {
            this.energyClickCount = 0;
        }, 2000);
        
        // Open config modal after 4 clicks
        if (this.energyClickCount >= 4) {
            this.openConfigModal();
            this.energyClickCount = 0;
        }
    }

    openConfigModal() {
        const modal = document.getElementById('configModalOverlay');
        const input = document.getElementById('textbookNameInput');
        
        if (modal) {
            modal.classList.add('active');
            
            // Pre-fill with current textbook name
            if (input) {
                input.value = this.textbookName;
                setTimeout(() => input.focus(), 100);
            }
            
            // Pre-select the current verification version
            const versionRadio = document.querySelector(`input[name="verificationVersion"][value="${this.verificationVersion}"]`);
            if (versionRadio) {
                versionRadio.checked = true;
            }
            
            // Pre-select the current CTA version
            const ctaRadio = document.querySelector(`input[name="ctaVersion"][value="${this.ctaVersion}"]`);
            if (ctaRadio) {
                ctaRadio.checked = true;
            }
        }
    }

    closeConfigModal() {
        const modal = document.getElementById('configModalOverlay');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    applyConfig() {
        const input = document.getElementById('textbookNameInput');
        const selectedVersion = document.querySelector('input[name="verificationVersion"]:checked');
        const selectedCta = document.querySelector('input[name="ctaVersion"]:checked');
        
        if (input && input.value.trim()) {
            this.textbookName = input.value.trim();
            localStorage.setItem('textbookName', this.textbookName);
            
            console.log('✅ 문제집 이름 저장:', this.textbookName);
        }
        
        if (selectedVersion) {
            this.verificationVersion = selectedVersion.value;
            localStorage.setItem('verificationVersion', this.verificationVersion);
            
            console.log('✅ 검증 버전 저장:', this.verificationVersion);
        }
        
        if (selectedCta) {
            this.ctaVersion = selectedCta.value;
            localStorage.setItem('ctaVersion', this.ctaVersion);
            
            console.log('✅ CTA 버전 저장:', this.ctaVersion);
        }
        
        this.closeConfigModal();
    }

    getVerificationContent() {
        // Get the selected version (v1, v2, v3, v4, or default)
        // Conditional words based on textbook name
        const examType = this.textbookName.includes('생각하는 황소') ? '단원평가' : '내신대비';
        const difficultyLevel = this.textbookName.includes('생각하는 황소') ? 'High Level 단계로' : '고난도 문항으로';
        
        const versions = {
            default: {
                icon: '',
                header: '',
                content: '',
                hide: true
            },
            v1: {
                icon: '🏆',
                header: `${this.textbookName} 인증 풀이`,
                content: `이 문항은 ${this.textbookName} 교재의 핵심 문항으로 파악됩니다. 콴다의 방대한 풀이 데이터 중, 실제 ${this.textbookName}을 푸는 학생들이 가장 많이 참고하고 '이해돼요'라 응답한 검증된 풀이를 확인해 보세요.`
            },
            v2: {
                icon: '🚨',
                header: `${this.textbookName} 심화 오답 주의 문항`,
                content: `최근 일주일간 현재 검색한 문항의 검색량이 급상승하고 있습니다. ${examType} 기간, 많은 학생들이 어려워하는 구간으로 분석돼요.`
            },
            v3: {
                icon: '🏆',
                header: `${this.textbookName} 인증 풀이`,
                content: `이 문항은 ${this.textbookName} 교재의 핵심 문항으로 파악됩니다. ${this.textbookName}를 학습 중인 2만 2134명의 데이터 중, 가장 이해도가 높았던 베스트 풀이를 확인해 보세요.`
            },
            v4: {
                icon: '🔥',
                header: '상위권 도약을 위한 필수 유형',
                content: `이 문제는 ${this.textbookName}의 ${difficultyLevel} 확인되며, 상위권 진입을 위해 반드시 거쳐야 할 관문입니다. 최근 한 달간 검색량이 꾸준히 상승 중인 '학생들이 자주 막히는' 유형입니다.`
            }
        };
        
        // Return the selected version
        return versions[this.verificationVersion] || versions.default;
    }

    updateVerificationSection() {
        const verificationSection = document.querySelector('.textbook-verification');
        const verificationHeader = document.querySelector('.verification-header');
        const verificationTitle = document.querySelector('.verification-title');
        const verificationContentDiv = document.querySelector('.verification-content');
        
        if (!verificationSection || !verificationHeader || !verificationTitle || !verificationContentDiv) {
            return;
        }
        
        const content = this.getVerificationContent();
        const ctaContent = this.getCtaContent();
        
        // Hide verification section if default is selected
        if (content.hide) {
            verificationSection.style.display = 'none';
            return;
        }
        
        // Show verification section
        verificationSection.style.display = 'block';
        
        // Update icon
        const iconSvg = verificationHeader.querySelector('svg');
        if (iconSvg && content.icon === '🚨') {
            // Replace star icon with alert icon for v2
            iconSvg.innerHTML = `<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>`;
        } else if (iconSvg && content.icon === '🔥') {
            // Replace with fire/trending icon for v4
            iconSvg.innerHTML = `<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline>`;
        } else if (iconSvg) {
            // Star icon for v1 and v3
            iconSvg.innerHTML = `<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>`;
        }
        
        // Update text content
        verificationTitle.innerHTML = content.header;
        
        // Clear and rebuild verification content
        verificationContentDiv.innerHTML = '';
        
        // Add verification text
        const verificationText = document.createElement('p');
        verificationText.className = 'type-body';
        verificationText.textContent = content.content;
        verificationContentDiv.appendChild(verificationText);
        
        // Add CTA content if not default
        if (!ctaContent.hide) {
            const ctaDescription = document.createElement('p');
            ctaDescription.className = 'type-body verification-cta-description';
            ctaDescription.textContent = ctaContent.description;
            verificationContentDiv.appendChild(ctaDescription);
            
            const ctaButton = document.createElement('button');
            ctaButton.className = 'verification-cta-button type-subheadline';
            ctaButton.textContent = ctaContent.button;
            ctaButton.addEventListener('click', () => this.addToCart());
            verificationContentDiv.appendChild(ctaButton);
        }
    }

    getCtaContent() {
        // Get the selected CTA version
        const ctas = {
            default: {
                description: '',
                button: '',
                hide: true
            },
            cta1: {
                description: '이 문제를 틀렸다면 개념이 완전히 잡히지 않았을 수 있습니다. 동일한 유형의 유사 문항(정답률 55%)으로 확실하게 복습해 보세요.',
                button: '📝 유사 문항 풀어볼래요'
            },
            cta2: {
                description: '이 문제와 논리 구조가 같은 쌍둥이 문제를 통해 실력을 점검해 보세요.',
                button: '🧩 쌍둥이 문제 풀어볼래요'
            }
        };
        
        return ctas[this.ctaVersion] || ctas.default;
    }

    updateCtaSection() {
        // CTA is now integrated into verification section
        // This method is kept for backwards compatibility but does nothing
        // All CTA logic is handled in updateVerificationSection()
    }

    // ==================== Cart Functions ====================

    openCartView() {
        const cartView = document.getElementById('cartView');
        if (cartView) {
            cartView.classList.add('active');
            this.renderCartItems();
        }
    }

    closeCartView() {
        const cartView = document.getElementById('cartView');
        if (cartView) {
            cartView.classList.remove('active');
        }
    }

    addToCart() {
        if (!this.currentImageData) {
            console.warn('⚠️ No image data to add to cart');
            return;
        }

        const timestamp = Date.now();
        const cartItem = {
            id: timestamp,
            imageData: this.currentImageData,
            timestamp: timestamp,
            selected: true,
            textbookName: this.textbookName,
            price: 50 // ₩50 per item
        };

        this.cartItems.push(cartItem);
        this.saveCart();
        this.updateCartBadge();

        console.log('✅ Item added to cart:', cartItem.id);
        
        // Show immediate feedback
        this.showToast('장바구니에 추가되었습니다', 'success');

        // Show feedback to user
        this.showToast('장바구니에 추가되었습니다', 'success');
    }

    removeFromCart(itemId) {
        this.cartItems = this.cartItems.filter(item => item.id !== itemId);
        this.saveCart();
        this.updateCartBadge();
        this.renderCartItems();

        console.log('✅ Item removed from cart:', itemId);
    }

    toggleCartItemSelection(itemId) {
        const item = this.cartItems.find(item => item.id === itemId);
        if (item) {
            item.selected = !item.selected;
            this.saveCart();
            this.renderCartItems();
        }
    }

    renderCartItems() {
        const cartItemsList = document.getElementById('cartItemsList');
        const cartEmptyState = document.getElementById('cartEmptyState');
        const cartItemsSection = document.getElementById('cartItemsSection');
        const cartFooter = document.getElementById('cartFooter');

        if (!cartItemsList || !cartEmptyState) return;

        if (this.cartItems.length === 0) {
            cartEmptyState.style.display = 'flex';
            if (cartItemsSection) cartItemsSection.style.display = 'none';
            if (cartFooter) cartFooter.style.display = 'none';
            cartItemsList.innerHTML = '';
            return;
        }

        cartEmptyState.style.display = 'none';
        if (cartItemsSection) cartItemsSection.style.display = 'block';
        if (cartFooter) cartFooter.style.display = 'flex';
        
        cartItemsList.innerHTML = this.cartItems.map(item => {
            const date = new Date(item.timestamp);
            const formattedDate = `${date.getMonth() + 1}월 ${date.getDate()}일 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
            const price = item.price || 50;
            const formattedPrice = `₩${price.toLocaleString()}`;
            
            return `
                <div class="cart-item ${item.selected ? 'selected' : ''}">
                    <input 
                        type="checkbox" 
                        class="cart-item-checkbox" 
                        ${item.selected ? 'checked' : ''}
                        data-item-id="${item.id}"
                    >
                    <img src="${item.imageData}" alt="문제 이미지" class="cart-item-image">
                    <div class="cart-item-info">
                        <div class="cart-item-title">${item.textbookName}</div>
                        <div class="cart-item-date">${formattedDate}</div>
                    </div>
                    <div class="cart-item-price">${formattedPrice}</div>
                    <button class="cart-item-remove" data-item-id="${item.id}">×</button>
                </div>
            `;
        }).join('');

        // Add event listeners for checkboxes and remove buttons
        const checkboxes = cartItemsList.querySelectorAll('.cart-item-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const itemId = parseInt(e.target.getAttribute('data-item-id'));
                this.toggleCartItemSelection(itemId);
            });
        });

        const removeButtons = cartItemsList.querySelectorAll('.cart-item-remove');
        removeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const itemId = parseInt(e.target.getAttribute('data-item-id'));
                this.removeFromCart(itemId);
            });
        });

        // Update price summary
        this.updatePriceSummary();
    }

    updateCartBadge() {
        const cartBadge = document.getElementById('cartBadge');
        if (cartBadge) {
            const count = this.cartItems.length;
            cartBadge.textContent = count;
            
            if (count === 0) {
                cartBadge.style.display = 'none';
                cartBadge.style.visibility = 'hidden';
            } else {
                cartBadge.style.display = 'inline-block';
                cartBadge.style.visibility = 'visible';
                cartBadge.style.opacity = '1';
            }
            
            console.log('✅ Cart badge updated:', {
                count: count,
                display: cartBadge.style.display,
                visibility: cartBadge.style.visibility,
                textContent: cartBadge.textContent
            });
        } else {
            console.error('❌ Cart badge element not found');
        }
    }

    saveCart() {
        localStorage.setItem('cartItems', JSON.stringify(this.cartItems));
    }

    updatePriceSummary() {
        const selectedItems = this.cartItems.filter(item => item.selected);
        const subtotal = selectedItems.reduce((sum, item) => sum + (item.price || 50), 0);
        const discount = 0; // Can be customized later
        const total = subtotal - discount;

        // Update subtotal
        const subtotalElement = document.getElementById('cartSubtotal');
        if (subtotalElement) {
            subtotalElement.textContent = `₩${subtotal.toLocaleString()}`;
        }

        // Update discount
        const discountElement = document.getElementById('cartDiscount');
        if (discountElement) {
            discountElement.textContent = `-₩${discount.toLocaleString()}`;
        }

        // Update total
        const totalElement = document.getElementById('cartTotal');
        if (totalElement) {
            totalElement.textContent = `₩${total.toLocaleString()}`;
        }

        // Update payment button
        const paymentBtnText = document.getElementById('cartPaymentBtnText');
        if (paymentBtnText) {
            paymentBtnText.textContent = `₩${total.toLocaleString()} 결제하기`;
        }

        // Disable payment button if no items selected
        const paymentBtn = document.getElementById('cartPaymentBtn');
        if (paymentBtn) {
            paymentBtn.disabled = selectedItems.length === 0;
        }
    }

    async handlePayment() {
        const selectedItems = this.cartItems.filter(item => item.selected);
        const emailInput = document.getElementById('cartEmailInput');
        const selectedPaymentMethod = document.querySelector('input[name="paymentMethod"]:checked');

        if (selectedItems.length === 0) {
            this.showToast('선택된 상품이 없습니다', 'error');
            return;
        }

        if (!emailInput || !emailInput.value.trim()) {
            this.showToast('이메일을 입력해주세요', 'error');
            return;
        }

        if (!selectedPaymentMethod) {
            this.showToast('결제 수단을 선택해주세요', 'error');
            return;
        }

        const total = selectedItems.reduce((sum, item) => sum + (item.price || 50), 0);
        const email = emailInput.value.trim();
        const paymentMethod = selectedPaymentMethod.value;

        console.log('💳 Processing payment:', {
            items: selectedItems.length,
            total: total,
            email: email,
            paymentMethod: paymentMethod
        });

        // Save data to Google Sheets
        try {
            await this.sendDataToGoogleSheets(email, selectedItems.length, total);
        } catch (error) {
            console.error('❌ Failed to save to Google Sheets:', error);
            // Continue with payment even if Google Sheets fails
        }

        // Show payment success modal
        this.showPaymentSuccessModal();
    }

    async sendDataToGoogleSheets(userEmail, itemCount, total) {
        try {
            const response = await fetch('/api/google-sheets-webhook', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userEmail: userEmail,
                    itemCount: itemCount,
                    total: total
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save data to Google Sheets');
            }

            const result = await response.json();
            console.log('✅ Data saved to Google Sheets successfully:', result);
        } catch (error) {
            console.error('❌ Error saving data to Google Sheets:', error);
            throw error;
        }
    }

    showPaymentSuccessModal() {
        const modal = document.getElementById('paymentSuccessModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    closePaymentSuccessModal() {
        const modal = document.getElementById('paymentSuccessModal');
        if (modal) {
            modal.style.display = 'none';
        }

        // Clear selected items from cart after successful payment
        this.cartItems = this.cartItems.filter(item => !item.selected);
        this.saveCart();
        this.updateCartBadge();
        this.closeCartView();
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 2000);
    }
}

// Toast animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideUpToast {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
    @keyframes slideDownToast {
        from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        to {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
        }
    }
`;
document.head.appendChild(style);

// Initialize
window.ddayManager = null;
document.addEventListener('DOMContentLoaded', () => {
    window.ddayManager = new DDayManager();
    window.ddayManager.updateCartBadge();
    
    // Splash screen handling
    const splashScreen = document.getElementById('splashScreen');
    if (splashScreen) {
        // Wait for logo animation to complete, then fade out
        setTimeout(() => {
            splashScreen.classList.add('fade-out');
            // Remove from DOM after fade animation
            setTimeout(() => {
                splashScreen.style.display = 'none';
            }, 500);
        }, 1500); // Show splash for 1.5 seconds
    }
});
