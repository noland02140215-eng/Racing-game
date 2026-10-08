// Mobile Controls Overlay & Touch Listener System

(function () {
    // 1. Inject UI Styles for Mobile Controls
    const style = document.createElement('style');
    style.innerHTML = `
        .mobile-btn {
            position: absolute;
            background: rgba(255, 255, 255, 0.25);
            border: 2px solid rgba(255, 255, 255, 0.5);
            border-radius: 50%;
            color: #fff;
            font-family: sans-serif;
            font-weight: bold;
            font-size: 18px;
            user-select: none;
            -webkit-user-select: none;
            touch-action: manipulation;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(4px);
        }
        .mobile-btn:active {
            background: rgba(255, 255, 255, 0.5);
        }
        #btn-left { bottom: 30px; left: 20px; width: 70px; height: 70px; }
        #btn-right { bottom: 30px; left: 105px; width: 70px; height: 70px; }
        #btn-brake { bottom: 30px; right: 105px; width: 70px; height: 70px; background: rgba(239, 68, 68, 0.3); }
        #btn-gas { bottom: 20px; right: 20px; width: 85px; height: 85px; background: rgba(34, 197, 94, 0.3); }
        #btn-cam { top: 20px; right: 20px; width: 55px; height: 55px; font-size: 14px; border-radius: 12px; }
    `;
    document.head.appendChild(style);

    // 2. Create Touch Overlay Container
    const overlay = document.createElement('div');
    overlay.id = 'mobile-controls-overlay';
    overlay.innerHTML = `
        <div id="btn-left" class="mobile-btn">◄</div>
        <div id="btn-right" class="mobile-btn">►</div>
        <div id="btn-brake" class="mobile-btn">BRAKE</div>
        <div id="btn-gas" class="mobile-btn">GAS</div>
        <div id="btn-cam" class="mobile-btn">CAM</div>
    `;
    document.body.appendChild(overlay);

    // Helper function to bind multi-touch button state
    function bindTouchButton(elementId, keyName, isToggleAction = false) {
        const btn = document.getElementById(elementId);
        if (!btn) return;

        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (isToggleAction) {
                // Dispatch keydown event for single-trigger actions like Camera
                window.dispatchEvent(new KeyboardEvent('keydown', { key: keyName }));
            } else if (typeof keys !== 'undefined') {
                keys[keyName] = true;
            }
        }, { passive: false });

        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (!isToggleAction && typeof keys !== 'undefined') {
                keys[keyName] = false;
            }
        }, { passive: false });

        btn.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            if (!isToggleAction && typeof keys !== 'undefined') {
                keys[keyName] = false;
            }
        }, { passive: false });
    }

    // 3. Bind Touch Controls to Game Input System
    window.addEventListener('DOMContentLoaded', () => {
        bindTouchButton('btn-left', 'a');
        bindTouchButton('btn-right', 'd');
        bindTouchButton('btn-gas', 'w');
        bindTouchButton('btn-brake', 's');
        bindTouchButton('btn-cam', 'c', true);
    });
})();
