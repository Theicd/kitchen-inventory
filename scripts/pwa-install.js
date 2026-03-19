/* ===================================================
   pwa-install.js — התקנת PWA אוטומטית
   אחראי על: beforeinstallprompt, באנר התקנה, iOS detection
   שייך ל: index.html — באנר התקנה
   =================================================== */

const PWAInstall = (() => {

    let deferredPrompt = null;   /* אירוע beforeinstallprompt שנשמר */
    let dismissed = false;       /* האם המשתמש סגר את הבאנר */

    /* ---- אתחול — האזנה לאירוע beforeinstallprompt ---- */
    function init() {
        /* Chrome / Edge / Samsung — אירוע התקנה */
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            console.log('[PWA] beforeinstallprompt זמין');

            /* הצגת באנר אם לא נסגר */
            if (!dismissed && !_isStandalone()) {
                _showBanner();
            }
        });

        /* כשהאפליקציה כבר מותקנת */
        window.addEventListener('appinstalled', () => {
            console.log('[PWA] האפליקציה הותקנה!');
            deferredPrompt = null;
            _hideBanner();
            UI.toast('האפליקציה הותקנה בהצלחה!', 'success');
        });

        /* בדיקת iOS — אין beforeinstallprompt */
        if (_isIOS() && !_isStandalone()) {
            setTimeout(() => _showIOSBanner(), 2000);
        }

        /* בדיקה אם כבר ב-standalone */
        if (_isStandalone()) {
            console.log('[PWA] כבר רץ כ-standalone');
        }
    }

    /* ---- התקנה — הפעלת prompt ---- */
    async function install() {
        if (!deferredPrompt) {
            /* אם אין prompt — iOS או כבר מותקן */
            if (_isIOS()) {
                UI.toast('לחץ על "שתף" ← "הוסף למסך הבית"', 'info');
            } else {
                UI.toast('לא ניתן להתקין כרגע — נסה שוב מאוחר יותר', 'info');
            }
            return;
        }

        /* הצגת prompt */
        deferredPrompt.prompt();
        const result = await deferredPrompt.userChoice;
        console.log('[PWA] תוצאת התקנה:', result.outcome);

        if (result.outcome === 'accepted') {
            UI.toast('מתקין...', 'success');
        }
        deferredPrompt = null;
        _hideBanner();
    }

    /* ---- סגירת באנר ---- */
    function dismiss() {
        dismissed = true;
        _hideBanner();
    }

    /* ---- הצגת באנר ---- */
    function _showBanner() {
        const banner = document.getElementById('pwa-install-banner');
        if (banner) {
            banner.classList.remove('hidden');
        }
    }

    /* ---- הסתרת באנר ---- */
    function _hideBanner() {
        const banner = document.getElementById('pwa-install-banner');
        if (banner) {
            banner.classList.add('hidden');
        }
    }

    /* ---- הצגת הוראות iOS ---- */
    function _showIOSBanner() {
        if (dismissed) return;
        const banner = document.getElementById('pwa-install-banner');
        if (!banner) return;

        /* שינוי טקסט ל-iOS */
        const text = banner.querySelector('.pwa-install-banner__text');
        if (text) {
            text.innerHTML = `
                <strong>התקן את מלאי המטבח</strong>
                <p>לחץ על <strong>⬆️ שתף</strong> ← <strong>"הוסף למסך הבית"</strong></p>
            `;
        }

        /* הסתרת כפתור התקן (iOS לא תומך בזה) */
        const installBtn = document.getElementById('btn-pwa-install');
        if (installBtn) installBtn.style.display = 'none';

        banner.classList.remove('hidden');
    }

    /* ---- בדיקה אם iOS ---- */
    function _isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
            (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    }

    /* ---- בדיקה אם standalone (כבר מותקן) ---- */
    function _isStandalone() {
        return window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true;
    }

    /* ---- ייצוא פומבי ---- */
    return {
        init,
        install,
        dismiss
    };
})();
