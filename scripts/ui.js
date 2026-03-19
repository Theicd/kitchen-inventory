/* ===================================================
   ui.js — ניהול ממשק משתמש
   אחראי על: toast, מעברי מסך, רינדור כללי
   שייך ל: כל המסכים — כלי עזר UI
   =================================================== */

const UI = (() => {

    /* ---- Toast — חיווי הצלחה/שגיאה/מידע ---- */
    function toast(message, type = 'info', duration = 2500) {
        const el = document.getElementById('toast');
        el.textContent = message;
        el.className = `toast toast--${type} show`;

        /* הסרה אחרי duration */
        setTimeout(() => {
            el.classList.remove('show');
            el.classList.add('hidden');
        }, duration);
    }

    /* ---- הצגת מסך ספציפי ---- */
    function showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        const target = document.getElementById(`screen-${screenId}`);
        if (target) {
            target.classList.add('active');
        }
    }

    /* ---- עדכון הגדרות תחנה ב-UI ---- */
    function updateStationUI() {
        const mode = Config.getStationMode();
        document.querySelectorAll('.station-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        const deviceName = Config.getDeviceName();
        const nameInput = document.getElementById('device-name');
        if (nameInput) nameInput.value = deviceName;
    }

    /* ---- ייצוא פומבי ---- */
    return {
        toast,
        showScreen,
        updateStationUI
    };
})();
