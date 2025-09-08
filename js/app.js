class PWAApp {
    constructor() {
        this.deferredPrompt = null;
        this.isOnline = navigator.onLine;
        this.init();
    }

    init() {
        this.registerServiceWorker();
        this.setupInstallPrompt();
        this.setupOfflineHandling();
        this.setupNotifications();
        this.setupAutomaticCalculations();
        this.loadAppData();
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered successfully:', registration);
                
                registration.addEventListener('updatefound', () => {
                    console.log('New service worker version available');
                });

                if (registration.waiting) {
                    this.showUpdateAvailable();
                }
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }

    setupInstallPrompt() {
        const installBanner = document.getElementById('install-prompt');
        const installBtn = document.getElementById('install-btn');
        const dismissBtn = document.getElementById('dismiss-btn');

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            installBanner.style.display = 'flex';
        });

        installBtn.addEventListener('click', async () => {
            if (this.deferredPrompt) {
                this.deferredPrompt.prompt();
                const { outcome } = await this.deferredPrompt.userChoice;
                console.log('PWA install prompt outcome:', outcome);
                this.deferredPrompt = null;
                installBanner.style.display = 'none';
            }
        });

        dismissBtn.addEventListener('click', () => {
            installBanner.style.display = 'none';
            this.deferredPrompt = null;
        });

        window.addEventListener('appinstalled', () => {
            console.log('PWA was installed');
            installBanner.style.display = 'none';
        });
    }

    setupOfflineHandling() {
        const statusElement = document.getElementById('connection-status');
        const updateConnectionStatus = () => {
            this.isOnline = navigator.onLine;
            statusElement.textContent = this.isOnline ? 'Online' : 'Offline';
            document.body.classList.toggle('offline', !this.isOnline);
        };

        window.addEventListener('online', updateConnectionStatus);
        window.addEventListener('offline', updateConnectionStatus);
        updateConnectionStatus();
    }

    async setupNotifications() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            console.log('Notification permission:', permission);
        }
    }

    setupAutomaticCalculations() {
        // Delay execution to ensure DOM elements are available
        setTimeout(() => {
            const pfInput = document.getElementById('particella');
            const spfInput = document.getElementById('sottoparticella');
            const chiaveDbInput = document.getElementById('chiave-db');

            console.log('PF Input:', pfInput);
            console.log('SPF Input:', spfInput);
            console.log('Chiave DB Input:', chiaveDbInput);

            const calculateChiaveDb = () => {
                const pfValue = pfInput.value.trim();
                const spfValue = spfInput.value.trim();
                const concatenated = pfValue + spfValue;
                console.log('Calculating:', pfValue, '+', spfValue, '=', concatenated);
                chiaveDbInput.value = concatenated;
            };

            if (pfInput && spfInput && chiaveDbInput) {
                pfInput.addEventListener('input', calculateChiaveDb);
                spfInput.addEventListener('input', calculateChiaveDb);
                
                calculateChiaveDb();
                console.log('Event listeners added successfully');
            } else {
                console.error('Could not find required input elements');
            }
        }, 100);
    }

    showUpdateAvailable() {
        const updateBanner = document.createElement('div');
        updateBanner.className = 'install-banner';
        updateBanner.innerHTML = `
            <p>A new version is available!</p>
            <button id="update-btn">Update</button>
            <button id="dismiss-update-btn">Later</button>
        `;
        
        document.querySelector('main').prepend(updateBanner);
        
        document.getElementById('update-btn').addEventListener('click', () => {
            window.location.reload();
        });
        
        document.getElementById('dismiss-update-btn').addEventListener('click', () => {
            updateBanner.remove();
        });
    }

    async loadAppData() {
        try {
            this.showLoading(true);
            
            const data = this.getLocalData() || {
                lastVisit: new Date().toISOString(),
                visitCount: 1
            };
            
            data.visitCount = (data.visitCount || 0) + 1;
            data.lastVisit = new Date().toISOString();
            
            this.saveLocalData(data);
            this.updateUI(data);
            
        } catch (error) {
            console.error('Error loading app data:', error);
        } finally {
            this.showLoading(false);
        }
    }

    getLocalData() {
        try {
            const data = localStorage.getItem('dbforestale-data');
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error reading local data:', error);
            return null;
        }
    }

    saveLocalData(data) {
        try {
            localStorage.setItem('dbforestale-data', JSON.stringify(data));
        } catch (error) {
            console.error('Error saving local data:', error);
        }
    }

    updateUI(data) {
        const contentSection = document.getElementById('content');
        const statsHtml = `
            <div class="app-stats">
                <h3>App Statistics</h3>
                <p><strong>Visit Count:</strong> ${data.visitCount}</p>
                <p><strong>Last Visit:</strong> ${new Date(data.lastVisit).toLocaleString()}</p>
            </div>
        `;
        
        contentSection.innerHTML += statsHtml;
    }

    showLoading(show) {
        document.body.classList.toggle('loading', show);
    }

    async syncData() {
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            try {
                const registration = await navigator.serviceWorker.ready;
                await registration.sync.register('background-sync');
                console.log('Background sync registered');
            } catch (error) {
                console.error('Background sync registration failed:', error);
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new PWAApp();
    
    if (document.readyState === 'complete') {
        app.syncData();
    } else {
        window.addEventListener('load', () => {
            app.syncData();
        });
    }
});

window.addEventListener('beforeunload', (e) => {
    const app = new PWAApp();
    const data = app.getLocalData();
    if (data) {
        data.lastExit = new Date().toISOString();
        app.saveLocalData(data);
    }
});