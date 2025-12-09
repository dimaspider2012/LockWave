class ChromeBrowser {
    constructor() {
        this.currentTabId = 1;
        this.tabs = new Map();
        this.history = [];
        this.historyIndex = -1;
        this.isFullscreen = false;
        this.zoomLevel = 100;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupNavigation();
        this.setupTabs();
        this.setupSearch();
        this.setupFullscreen();
        this.setupZoom();
        
        // Ініціалізуємо першу вкладку
        this.tabs.set(1, {
            id: 1,
            title: 'Нова вкладка',
            url: 'about:blank',
            history: [],
            historyIndex: -1
        });
        
        this.updateNavigationButtons();
    }

    setupEventListeners() {
        // Кнопки навігації
        document.getElementById('backBtn').addEventListener('click', () => this.goBack());
        document.getElementById('forwardBtn').addEventListener('click', () => this.goForward());
        document.getElementById('reloadBtn').addEventListener('click', () => this.reload());
        document.getElementById('homeBtn').addEventListener('click', () => this.goHome());

        // Адресний рядок
        document.getElementById('urlInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.navigateToUrl(e.target.value);
            }
        });

        // Вкладки
        document.getElementById('newTabBtn').addEventListener('click', () => this.createNewTab());

        // Керування вікном
        document.querySelector('.window-btn.minimize').addEventListener('click', () => this.minimize());
        document.querySelector('.window-btn.maximize').addEventListener('click', () => this.toggleMaximize());
        document.querySelector('.window-btn.close').addEventListener('click', () => this.close());

        // Закладки
        document.querySelector('.bookmark-btn').addEventListener('click', () => this.toggleBookmark());

        // Обробка iframe
        const iframe = document.getElementById('browserFrame');
        iframe.addEventListener('load', () => this.onFrameLoad());
        iframe.addEventListener('error', () => this.onFrameError());
    }

    setupNavigation() {
        // Історія навігації для поточної вкладки
        this.history = [];
        this.historyIndex = -1;
    }

    setupTabs() {
        const tabsContainer = document.getElementById('tabsContainer');
        tabsContainer.addEventListener('click', (e) => {
            const tab = e.target.closest('.tab');
            if (tab) {
                const tabId = parseInt(tab.dataset.tabId);
                if (e.target.closest('.tab-close')) {
                    this.closeTab(tabId);
                } else {
                    this.switchToTab(tabId);
                }
            }
        });
    }

    setupSearch() {
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');

        searchBtn.addEventListener('click', () => {
            this.navigateToUrl(searchInput.value);
        });

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.navigateToUrl(e.target.value);
            }
        });

        // Швидке посилання
        document.querySelectorAll('.quick-link').forEach(link => {
            link.addEventListener('click', () => {
                const url = link.dataset.url;
                this.navigateToUrl(url);
            });
        });
    }

    setupFullscreen() {
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());

        // Слідкуємо за змінами fullscreen
        document.addEventListener('fullscreenchange', () => {
            this.isFullscreen = !!document.fullscreenElement;
            this.updateFullscreenButton();
        });
    }

    setupZoom() {
        document.getElementById('zoomInBtn').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoomOutBtn').addEventListener('click', () => this.zoomOut());
        
        // Обробка Ctrl + колесо миші для зуму
        document.addEventListener('wheel', (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                if (e.deltaY < 0) {
                    this.zoomIn();
                } else {
                    this.zoomOut();
                }
            }
        });
    }

    navigateToUrl(input) {
        if (!input.trim()) return;

        let url = input.trim();
        
        // Якщо це пошуковий запит, а не URL
        if (!this.isValidUrl(url)) {
            url = this.createSearchUrl(url);
        } else {
            // Додаємо протокол, якщо відсутній
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }
        }

        this.loadUrl(url);
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            // Перевіряємо чи це домен
            return /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/.test(string) ||
                   /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}\/.*/.test(string);
        }
    }

    createSearchUrl(query) {
        // Використовуємо Google для пошуку
        return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    }

    loadUrl(url) {
        const iframe = document.getElementById('browserFrame');
        const startPage = document.getElementById('startPage');
        
        // Показуємо iframe та ховаємо стартову сторінку
        iframe.classList.add('active');
        startPage.style.display = 'none';
        
        // Оновлюємо URL в адресному рядку
        document.getElementById('urlInput').value = url;
        
        // Завантажуємо сторінку в iframe
        iframe.src = url;
        
        // Оновлюємо історію
        this.addToHistory(url);
        
        // Оновлюємо заголовок вкладки
        this.updateTabTitle(url);
        
        // Оновлюємо статус
        this.updateStatus(`Завантаження ${url}...`);
    }

    addToHistory(url) {
        const currentTab = this.tabs.get(this.currentTabId);
        if (currentTab) {
            // Видаляємо історію після поточної позиції
            currentTab.history = currentTab.history.slice(0, currentTab.historyIndex + 1);
            
            // Додаємо новий URL
            currentTab.history.push(url);
            currentTab.historyIndex = currentTab.history.length - 1;
            
            // Обмежуємо історію
            if (currentTab.history.length > 100) {
                currentTab.history.shift();
                currentTab.historyIndex--;
            }
        }
        
        this.updateNavigationButtons();
    }

    updateNavigationButtons() {
        const currentTab = this.tabs.get(this.currentTabId);
        const backBtn = document.getElementById('backBtn');
        const forwardBtn = document.getElementById('forwardBtn');
        
        if (currentTab) {
            backBtn.disabled = currentTab.historyIndex <= 0;
            forwardBtn.disabled = currentTab.historyIndex >= currentTab.history.length - 1;
        }
    }

    goBack() {
        const currentTab = this.tabs.get(this.currentTabId);
        if (currentTab && currentTab.historyIndex > 0) {
            currentTab.historyIndex--;
            const url = currentTab.history[currentTab.historyIndex];
            this.loadUrlWithoutHistory(url);
        }
    }

    goForward() {
        const currentTab = this.tabs.get(this.currentTabId);
        if (currentTab && currentTab.historyIndex < currentTab.history.length - 1) {
            currentTab.historyIndex++;
            const url = currentTab.history[currentTab.historyIndex];
            this.loadUrlWithoutHistory(url);
        }
    }

    loadUrlWithoutHistory(url) {
        const iframe = document.getElementById('browserFrame');
        const startPage = document.getElementById('startPage');
        
        iframe.classList.add('active');
        startPage.style.display = 'none';
        
        document.getElementById('urlInput').value = url;
        iframe.src = url;
        this.updateTabTitle(url);
        this.updateNavigationButtons();
    }

    reload() {
        const iframe = document.getElementById('browserFrame');
        if (iframe.src && iframe.src !== 'about:blank') {
            iframe.src = iframe.src;
            this.updateStatus('Сторінка оновлюється...');
        }
    }

    goHome() {
        const startPage = document.getElementById('startPage');
        const iframe = document.getElementById('browserFrame');
        
        iframe.classList.remove('active');
        startPage.style.display = 'flex';
        document.getElementById('urlInput').value = '';
        this.updateStatus('Готовий');
    }

    onFrameLoad() {
        const iframe = document.getElementById('browserFrame');
        try {
            // Спроба отримати заголовок сторінки
            const title = iframe.contentDocument ? iframe.contentDocument.title : 'Без назви';
            this.updateTabTitle(title);
            this.updateStatus('Сторінка завантажена');
        } catch (e) {
            // Якщо не вдається отримати доступ (CORS), просто оновлюємо статус
            this.updateStatus('Сторінка завантажена');
        }
    }

    onFrameError() {
        this.updateStatus('Помилка завантаження сторінки');
        // Можна додати сторінку помилки
    }

    updateTabTitle(title) {
        const currentTab = document.querySelector(`[data-tab-id="${this.currentTabId}"]`);
        if (currentTab) {
            const titleElement = currentTab.querySelector('.tab-title');
            if (titleElement) {
                titleElement.textContent = title || 'Без назви';
            }
        }
        
        // Оновлюємо дані вкладки
        const tabData = this.tabs.get(this.currentTabId);
        if (tabData) {
            tabData.title = title || 'Без назви';
        }
    }

    updateStatus(text) {
        document.getElementById('statusText').textContent = text;
    }

    createNewTab() {
        const newTabId = Math.max(...Array.from(this.tabs.keys())) + 1;
        
        // Створюємо нову вкладку
        const tabElement = document.createElement('div');
        tabElement.className = 'tab';
        tabElement.dataset.tabId = newTabId;
        tabElement.innerHTML = `
            <span class="tab-title">Нова вкладка</span>
            <button class="tab-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.getElementById('tabsContainer').appendChild(tabElement);
        
        // Додаємо дані вкладки
        this.tabs.set(newTabId, {
            id: newTabId,
            title: 'Нова вкладка',
            url: 'about:blank',
            history: [],
            historyIndex: -1
        });
        
        // Перемикаємося на нову вкладку
        this.switchToTab(newTabId);
        
        // Показуємо стартову сторінку
        this.goHome();
    }

    switchToTab(tabId) {
        // Знімаємо активність з усіх вкладок
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Робимо вибрану вкладку активною
        const targetTab = document.querySelector(`[data-tab-id="${tabId}"]`);
        if (targetTab) {
            targetTab.classList.add('active');
            this.currentTabId = tabId;
            this.updateNavigationButtons();
        }
    }

    closeTab(tabId) {
        if (this.tabs.size <= 1) {
            // Не можна закрити останню вкладку
            return;
        }
        
        // Видаляємо вкладку
        this.tabs.delete(tabId);
        const tabElement = document.querySelector(`[data-tab-id="${tabId}"]`);
        if (tabElement) {
            tabElement.remove();
        }
        
        // Якщо закрита активна вкладка, переходимо на першу доступну
        if (this.currentTabId === tabId) {
            const firstTabId = Array.from(this.tabs.keys())[0];
            this.switchToTab(firstTabId);
        }
    }

    toggleBookmark() {
        const bookmarkBtn = document.querySelector('.bookmark-btn');
        const icon = bookmarkBtn.querySelector('i');
        
        if (icon.classList.contains('far')) {
            icon.classList.remove('far');
            icon.classList.add('fas');
            bookmarkBtn.style.color = '#ff9800';
        } else {
            icon.classList.remove('fas');
            icon.classList.add('far');
            bookmarkBtn.style.color = '#999';
        }
    }

    toggleFullscreen() {
        if (!this.isFullscreen) {
            this.enterFullscreen();
        } else {
            this.exitFullscreen();
        }
    }

    enterFullscreen() {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
        document.body.classList.add('fullscreen');
    }

    exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        document.body.classList.remove('fullscreen');
    }

    updateFullscreenButton() {
        const btn = document.getElementById('fullscreenBtn');
        const icon = btn.querySelector('i');
        
        if (this.isFullscreen) {
            icon.classList.remove('fa-expand');
            icon.classList.add('fa-compress');
        } else {
            icon.classList.remove('fa-compress');
            icon.classList.add('fa-expand');
        }
    }

    zoomIn() {
        if (this.zoomLevel < 300) {
            this.zoomLevel += 10;
            this.applyZoom();
        }
    }

    zoomOut() {
        if (this.zoomLevel > 30) {
            this.zoomLevel -= 10;
            this.applyZoom();
        }
    }

    applyZoom() {
        const iframe = document.getElementById('browserFrame');
        iframe.style.transform = `scale(${this.zoomLevel / 100})`;
        iframe.style.transformOrigin = 'top left';
        document.getElementById('zoomLevel').textContent = `${this.zoomLevel}%`;
    }

    minimize() {
        // Мінімізація вікна (емуляція)
        document.body.style.opacity = '0.5';
        setTimeout(() => {
            document.body.style.opacity = '1';
        }, 300);
    }

    toggleMaximize() {
        // Емуляція розгортання/згортання вікна
        const container = document.querySelector('.browser-container');
        if (container.style.maxWidth === '100%') {
            container.style.maxWidth = '1200px';
            container.style.margin = '20px auto';
        } else {
            container.style.maxWidth = '100%';
            container.style.margin = '0';
        }
    }

    close() {
        // Емуляція закриття вікна
        if (confirm('Закрити браузер?')) {
            document.body.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-size: 24px; color: #666;">Браузер закрито</div>';
        }
    }
}

// Ініціалізація браузера при завантаженні сторінки
document.addEventListener('DOMContentLoaded', () => {
    new ChromeBrowser();
});

// Обробка помилок
document.addEventListener('error', (e) => {
    console.error('Помилка:', e);
}, true);

// Обробка клавіш
window.addEventListener('keydown', (e) => {
    // F11 для fullscreen
    if (e.key === 'F11') {
        e.preventDefault();
        document.getElementById('fullscreenBtn').click();
    }
    
    // Ctrl + R для оновлення
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        document.getElementById('reloadBtn').click();
    }
    
    // Alt + Home для домашньої сторінки
    if (e.altKey && e.key === 'Home') {
        e.preventDefault();
        document.getElementById('homeBtn').click();
    }
});