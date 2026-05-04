// Убираем глобальное объявление currentUser из auth.js
// let currentUser = JSON.parse(sessionStorage.getItem('currentUser')); // Удаляем эту строку

// Функция проверки, находимся ли мы на странице входа
function isLoginPage() {
    return window.location.pathname.includes('index.html') || 
           window.location.pathname.endsWith('/') ||
           window.location.pathname.endsWith('/site/');
}

// Проверка при загрузке auth.js
(function() {
    const saved = sessionStorage.getItem('currentUser');
    if (saved) {
        try {
            const user = JSON.parse(saved);
            if (user && user.role && isLoginPage()) {
                redirectByRole(user.role);
            }
        } catch(e) {
            console.error('Ошибка проверки сессии:', e);
        }
    }
})();

// Функция перенаправления
function redirectByRole(role) {
    let basePath = window.location.pathname;
    basePath = basePath.substring(0, basePath.lastIndexOf('/') + 1);
    
    switch(role) {
        case 'student':
            window.location.href = basePath + 'student.html';
            break;
        case 'teacher':
            window.location.href = basePath + 'teacher.html';
            break;
        case 'admin':
            window.location.href = basePath + 'admin.html';
            break;
        default:
            window.location.href = basePath + 'index.html';
    }
}

// Функция выхода
function logout() {
    sessionStorage.removeItem('currentUser');
    let basePath = window.location.pathname;
    basePath = basePath.substring(0, basePath.lastIndexOf('/') + 1);
    window.location.href = basePath + 'index.html';
}

// Проверка авторизации
function checkAuth(allowedRoles) {
    const saved = sessionStorage.getItem('currentUser');
    if (!saved) {
        let basePath = window.location.pathname;
        basePath = basePath.substring(0, basePath.lastIndexOf('/') + 1);
        window.location.href = basePath + 'index.html';
        return null;
    }
    
    try {
        const user = JSON.parse(saved);
        if (!user || !allowedRoles.includes(user.role)) {
            let basePath = window.location.pathname;
            basePath = basePath.substring(0, basePath.lastIndexOf('/') + 1);
            window.location.href = basePath + 'index.html';
            return null;
        }
        return user;
    } catch(e) {
        console.error('Ошибка парсинга сессии:', e);
        let basePath = window.location.pathname;
        basePath = basePath.substring(0, basePath.lastIndexOf('/') + 1);
        window.location.href = basePath + 'index.html';
        return null;
    }
}

console.log('auth.js загружен');