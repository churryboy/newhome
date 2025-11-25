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
        this.setupKeyboardShortcuts();
        this.updateStatusBar();
        this.renderCalendar();
        this.updateStats();
        this.setYesterdayStudyTime();
        this.checkServerConnection();
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
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const tab = item.getAttribute('data-tab');
                this.switchTab(tab);
            });
        });
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
        
        // Get upcoming events (max 2, or 1 if collapsed)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const maxEvents = this.isCalendarCollapsed ? 1 : 2;
        const upcomingEvents = this.events
            .filter(e => new Date(e.date) >= today)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, maxEvents);
        
        if (upcomingEvents.length === 0) {
            upcomingEventsList.innerHTML = `
                <div style="color: var(--color-neutral-50); font-size: 12px; text-align: center; padding: var(--space-lg) 0;">
                    예정된 이벤트가 없습니다
                </div>
            `;
            return;
        }
        
        const colors = ['color-purple', 'color-yellow', 'color-blue'];
        
        const html = upcomingEvents.map((event, index) => {
            const eventDate = new Date(event.date);
            const dateStr = eventDate.toLocaleDateString('ko-KR', {
                month: 'long',
                day: 'numeric'
            });
            const timeStr = event.detail || '';
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
        
        // Generate random time less than 24 hours
        const totalMinutes = Math.floor(Math.random() * (24 * 60)); // Random minutes in a day
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
        
        // Add placeholder events if no events exist
        if (this.events.length === 0) {
            this.events.push({
                id: 'placeholder-1',
                title: '지구과학 수행 제출',
                date: '2025-11-26',
                detail: '',
                image: '',
                createdAt: new Date().toISOString()
            });
            this.events.push({
                id: 'placeholder-2',
                title: '체육 실기 - 윗몸일으키기',
                date: '2025-11-28',
                detail: '',
                image: '',
                createdAt: new Date().toISOString()
            });
            this.saveEvents();
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
        // Remove previous selection
        document.querySelectorAll('.calendar-day.selected').forEach(day => {
            day.classList.remove('selected');
        });
        
        // Add selection to clicked date
        const clickedDay = document.querySelector(`[data-date="${dateStr}"]`);
        if (clickedDay) {
            clickedDay.classList.add('selected');
        }
        
        this.selectedDate = dateStr;
        this.openEventModal(dateStr);
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
                const previewImage = document.getElementById('previewImage');
                const previewPlaceholder = document.querySelector('.preview-placeholder');
                
                if (previewImage && previewPlaceholder) {
                    previewImage.src = event.target.result;
                    previewImage.style.display = 'block';
                    previewPlaceholder.style.display = 'none';
                    
                    // Store the image data
                    this.currentImageData = event.target.result;
                }
            };
            reader.readAsDataURL(file);
        });
        
        input.click();
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
