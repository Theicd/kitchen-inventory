/* ===================================================
   router.js — ניווט בין מסכים
   אחראי על: מעברי מסכים, היסטוריה, hash-based routing
   שייך ל: כל המסכים — ניהול navigation
   =================================================== */

const Router = (() => {

    let history = ['home'];     /* מחסנית היסטוריה */
    let currentScreen = 'home'; /* מסך נוכחי */
    let currentParams = null;   /* פרמטרים נוכחיים (לדוגמה: product ID) */

    /* מיפוי מסכים — שם => פעולות כניסה/יציאה */
    const SCREENS = {
        'home': {
            onEnter: () => {
                Shortages.refresh();
            },
            onLeave: () => {}
        },
        'stock-in': {
            onEnter: () => {
                Scanner.start('in');
            },
            onLeave: () => {
                Scanner.stop();
            }
        },
        'stock-out': {
            onEnter: () => {
                Scanner.start('out');
            },
            onLeave: () => {
                Scanner.stop();
            }
        },
        'register': {
            onEnter: (params) => {
                Products.prepareRegister(params);
            },
            onLeave: () => {}
        },
        'shortages': {
            onEnter: () => {
                Shortages.refresh();
            },
            onLeave: () => {}
        },
        'product': {
            onEnter: (params) => {
                if (params) Products.loadDetail(params);
            },
            onLeave: () => {}
        },
        'all-products': {
            onEnter: () => {
                Products.loadAllProducts();
            },
            onLeave: () => {}
        },
        'settings': {
            onEnter: () => {
                UI.updateStationUI();
            },
            onLeave: () => {}
        }
    };

    /* ---- ניווט למסך ---- */
    function navigate(screenName, params = null) {
        if (!SCREENS[screenName]) {
            console.warn(`[Router] מסך לא ידוע: ${screenName}`);
            return;
        }

        /* מניעת ניווט כפול לאותו מסך עם אותם פרמטרים */
        if (screenName === currentScreen && params == currentParams) return;

        /* יציאה מהמסך הנוכחי */
        const current = SCREENS[currentScreen];
        if (current && current.onLeave) {
            current.onLeave();
        }

        /* עדכון היסטוריה */
        if (screenName !== currentScreen) {
            history.push(currentScreen);
        }

        /* מעבר למסך חדש */
        currentScreen = screenName;
        currentParams = params;

        UI.showScreen(screenName);

        /* כניסה למסך */
        const target = SCREENS[screenName];
        if (target && target.onEnter) {
            target.onEnter(params);
        }

        /* עדכון hash */
        window.location.hash = params ? `${screenName}/${params}` : screenName;
    }

    /* ---- חזרה אחורה ---- */
    function back() {
        if (history.length > 0) {
            const prev = history.pop();
            navigate(prev);
            /* הסרת הכפילות שנוצרה מהניווט */
            if (history.length > 0 && history[history.length - 1] === prev) {
                history.pop();
            }
        } else {
            navigate('home');
        }
    }

    /* ---- אתחול — טיפול ב-hash בטעינה ---- */
    function init() {
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.replace('#', '');
            if (!hash) return;
            const parts = hash.split('/');
            const screen = parts[0];
            const params = parts[1] || null;
            /* מניעת כפילות — אם כבר באותו מסך עם אותם פרמטרים, לא לנווט שוב */
            if (screen === currentScreen && params === currentParams) return;
            if (SCREENS[screen]) {
                navigate(screen, params);
            }
        });

        /* טעינת מסך מ-hash קיים */
        const hash = window.location.hash.replace('#', '');
        if (hash) {
            const parts = hash.split('/');
            if (SCREENS[parts[0]]) {
                navigate(parts[0], parts[1] || null);
                return;
            }
        }

        /* ברירת מחדל — מסך בית */
        navigate('home');
    }

    /* ---- ייצוא פומבי ---- */
    return {
        navigate,
        back,
        init,
        get currentScreen() { return currentScreen; },
        get currentParams() { return currentParams; }
    };
})();
