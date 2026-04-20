// テーマ切り替え機能（早期に定義）
function toggleTheme() {
    const body = document.body;
    const isLight = body.classList.contains('light-theme');
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');

    if (isLight) {
        body.classList.remove('light-theme');
        localStorage.setItem('theme', 'dark');
        if (themeIcon && typeof lucide !== 'undefined') {
            themeIcon.setAttribute('data-lucide', 'sun');
            lucide.createIcons();
        }
        if (themeText) themeText.textContent = 'ライト';
    } else {
        body.classList.add('light-theme');
        localStorage.setItem('theme', 'light');
        if (themeIcon && typeof lucide !== 'undefined') {
            themeIcon.setAttribute('data-lucide', 'moon');
            lucide.createIcons();
        }
        if (themeText) themeText.textContent = 'ダーク';
    }

    // グラフを再描画（app.jsが読み込まれている場合）
    if (typeof updateChart === 'function' && typeof pyodide !== 'undefined' && dataPoints && dataPoints.length >= 2) {
        updateChart();
    }
}

// ページ読み込み時に保存されたテーマを適用
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');

    if (savedTheme === 'light') {
        body.classList.add('light-theme');
        if (themeIcon && typeof lucide !== 'undefined') {
            themeIcon.setAttribute('data-lucide', 'moon');
        }
        if (themeText) themeText.textContent = 'ダーク';
    } else {
        body.classList.remove('light-theme');
        if (themeIcon && typeof lucide !== 'undefined') {
            themeIcon.setAttribute('data-lucide', 'sun');
        }
        if (themeText) themeText.textContent = 'ライト';
    }
}

// ページ読み込み時にテーマを適用し、アイコンを初期化
function initIcons() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    } else {
        // Lucideが読み込まれるまで待つ
        setTimeout(initIcons, 100);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initTheme();
        initIcons();
    });
} else {
    initTheme();
    initIcons();
}
