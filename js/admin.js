window.currentUser = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM загружен, ищем элементы админа...');
    
    // Проверяем наличие ключевых элементов админ-панели
    const usersTab = document.getElementById('usersTab');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (!usersTab && !logoutBtn) {
        console.log('Не на странице админа - элементы не найдены');
        return;
    }
    
    console.log('Страница админа загружена');
    
    // Проверяем авторизацию
    const user = checkAuth(['admin']);
    if (!user) {
        console.log('Пользователь не авторизован как админ');
        return;
    }
    
    window.currentUser = user;
    console.log('Админ авторизован:', user);
    
    // Кнопка выхода
    if (logoutBtn) {
        logoutBtn.onclick = function(e) {
            e.preventDefault();
            logout();
        };
        console.log('Обработчик выхода добавлен');
    }
    
    // Инициализация вкладок
    initAdminTabs();
    
    // Загружаем данные для активной вкладки
    loadUsers();
    loadAdminSlots();
    loadSystemStats();
    
    // Кнопка добавления пользователя
    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) {
        addUserBtn.onclick = function(e) {
            e.preventDefault();
            openUserModal();
        };
        console.log('Обработчик добавления пользователя добавлен');
    }
    
    // Форма редактирования пользователя
    const userEditForm = document.getElementById('userEditForm');
    if (userEditForm) {
        userEditForm.onsubmit = function(e) {
            e.preventDefault();
            saveUser();
        };
        console.log('Обработчик формы добавлен');
    }
    
    // Кнопка отмены
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        cancelBtn.onclick = function(e) {
            e.preventDefault();
            closeModal();
        };
    }
    
    // Кнопка закрытия модального окна
    const closeModalBtn = document.querySelector('.close-modal');
    if (closeModalBtn) {
        closeModalBtn.onclick = function(e) {
            e.preventDefault();
            closeModal();
        };
    }
    
    // Поиск пользователей
    const searchInput = document.getElementById('userSearch');
    if (searchInput) {
        searchInput.oninput = loadUsers;
    }
    
    console.log('Инициализация админ-панели завершена');
});

function initAdminTabs() {
    const tabs = document.querySelectorAll('.nav-tab');
    console.log('Вкладок админа найдено:', tabs.length);
    
    if (tabs.length === 0) {
        console.error('Вкладки не найдены!');
        return;
    }
    
    tabs.forEach((tab, index) => {
        console.log(`Вкладка ${index}:`, tab.getAttribute('data-tab'));
        
        tab.onclick = function(e) {
            e.preventDefault();
            console.log('Клик по вкладке:', this.getAttribute('data-tab'));
            
            // Убираем active у всех табов
            tabs.forEach(t => {
                t.classList.remove('active');
                t.style.color = '#a0aec0';
                t.style.borderBottomColor = 'transparent';
            });
            
            // Добавляем active текущему
            this.classList.add('active');
            this.style.color = '#ffd700';
            this.style.borderBottomColor = '#ffd700';
            
            // Скрываем все вкладки
            const allTabs = document.querySelectorAll('.tab-content');
            console.log('Всего секций:', allTabs.length);
            
            allTabs.forEach(c => {
                c.classList.remove('active');
                c.style.display = 'none';
            });
            
            // Показываем нужную вкладку
            const tabName = this.getAttribute('data-tab');
            const tabContent = document.getElementById(tabName + 'Tab');
            
            if (tabContent) {
                tabContent.classList.add('active');
                tabContent.style.display = 'block';
                console.log('Вкладка активирована:', tabName);
                
                // Загружаем данные для вкладки
                if (tabName === 'users') loadUsers();
                if (tabName === 'slots-management') loadAdminSlots();
                if (tabName === 'system-stats') loadSystemStats();
            } else {
                console.error('Не найдена секция:', tabName + 'Tab');
            }
        };
    });
}

function loadUsers() {
    console.log('Загрузка пользователей...');
    
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) {
        console.error('Не найдена таблица пользователей');
        return;
    }
    
    const searchInput = document.getElementById('userSearch');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    
    const users = DB.users.filter(u => 
        !searchTerm || 
        (u.name && u.name.toLowerCase().includes(searchTerm)) ||
        (u.surname && u.surname.toLowerCase().includes(searchTerm)) ||
        (u.email && u.email.toLowerCase().includes(searchTerm))
    );
    
    console.log('Найдено пользователей:', users.length);
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">Пользователи не найдены</td></tr>';
        return;
    }
    
    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.id || ''}</td>
            <td>${user.surname || ''} ${user.name || ''}</td>
            <td>${user.email || ''}</td>
            <td>${getRoleName(user.role)}</td>
            <td>${user.active ? '✅' : '❌'}</td>
            <td>
                <button class="btn-sm btn-primary" onclick="window.editUser('${user.id}')" type="button" style="margin: 2px;">✏️</button>
                <button class="btn-sm btn-danger" onclick="window.deleteUser('${user.id}')" type="button" style="margin: 2px;">🗑️</button>
            </td>
        </tr>
    `).join('');
    
    console.log('Таблица пользователей обновлена');
}

// Глобальные функции
window.editUser = function(userId) {
    console.log('Редактирование пользователя:', userId);
    const user = DB.getUser(userId);
    if (!user) {
        alert('Пользователь не найден!');
        return;
    }
    
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) modalTitle.textContent = 'Редактировать пользователя';
    
    const editUserId = document.getElementById('editUserId');
    const editUserName = document.getElementById('editUserName');
    const editUserSurname = document.getElementById('editUserSurname');
    const editUserEmail = document.getElementById('editUserEmail');
    const editUserRole = document.getElementById('editUserRole');
    const editUserPassword = document.getElementById('editUserPassword');
    
    if (editUserId) editUserId.value = user.id;
    if (editUserName) editUserName.value = user.name || '';
    if (editUserSurname) editUserSurname.value = user.surname || '';
    if (editUserEmail) editUserEmail.value = user.email || '';
    if (editUserRole) editUserRole.value = user.role || 'student';
    if (editUserPassword) editUserPassword.value = '';
    
    const modal = document.getElementById('userEditModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        console.log('Модальное окно открыто');
    } else {
        console.error('Модальное окно не найдено');
    }
};

window.deleteUser = function(userId) {
    console.log('Удаление пользователя:', userId);
    if (confirm('Вы уверены, что хотите удалить этого пользователя? Все его записи также будут удалены.')) {
        DB.users = DB.users.filter(u => u.id !== userId);
        DB.bookings = DB.bookings.filter(b => b.studentId !== userId);
        DB.slots = DB.slots.filter(s => s.teacherId !== userId);
        saveDB();
        loadUsers();
        loadAdminSlots();
        loadSystemStats();
        alert('Пользователь удалён');
    }
};

window.adminCancelSlot = function(slotId) {
    console.log('Отмена слота:', slotId);
    if (confirm('Отменить эту консультацию? Все записи студентов будут отменены.')) {
        const slot = DB.getSlot(slotId);
        if (slot) {
            slot.status = 'cancelled';
            DB.bookings.forEach(b => {
                if (b.slotId === slotId) b.status = 'cancelled';
            });
            saveDB();
            loadAdminSlots();
            loadSystemStats();
            alert('Консультация отменена');
        }
    }
};

window.adminDeleteSlot = function(slotId) {
    console.log('Удаление слота:', slotId);
    if (confirm('Полностью удалить консультацию? Это действие нельзя отменить.')) {
        DB.slots = DB.slots.filter(s => s.id !== slotId);
        DB.bookings = DB.bookings.filter(b => b.slotId !== slotId);
        saveDB();
        loadAdminSlots();
        loadSystemStats();
        alert('Консультация удалена');
    }
};

function openUserModal() {
    console.log('Открытие модального окна создания...');
    
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) modalTitle.textContent = 'Добавить пользователя';
    
    const form = document.getElementById('userEditForm');
    if (form) form.reset();
    
    const editUserId = document.getElementById('editUserId');
    if (editUserId) editUserId.value = '';
    
    const modal = document.getElementById('userEditModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        console.log('Модальное окно создания открыто');
    }
}

function closeModal() {
    console.log('Закрытие модального окна');
    const modal = document.getElementById('userEditModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
}

function saveUser() {
    console.log('Сохранение пользователя...');
    
    const userId = document.getElementById('editUserId')?.value;
    const userName = document.getElementById('editUserName')?.value;
    const userSurname = document.getElementById('editUserSurname')?.value;
    const userEmail = document.getElementById('editUserEmail')?.value;
    const userRole = document.getElementById('editUserRole')?.value;
    const userPassword = document.getElementById('editUserPassword')?.value;
    
    if (!userName || !userSurname || !userEmail || !userRole) {
        alert('Заполните все обязательные поля!');
        return;
    }
    
    if (userId) {
        // Редактирование существующего
        const user = DB.getUser(userId);
        if (user) {
            user.name = userName;
            user.surname = userSurname;
            user.email = userEmail;
            user.role = userRole;
            if (userPassword) user.password = userPassword;
            console.log('Пользователь обновлён:', user);
        }
    } else {
        // Создание нового
        const newUser = {
            id: 'u' + Date.now(),
            name: userName,
            surname: userSurname,
            email: userEmail,
            password: userPassword || '123',
            role: userRole,
            active: true
        };
        DB.users.push(newUser);
        console.log('Пользователь создан:', newUser);
    }
    
    saveDB();
    closeModal();
    loadUsers();
    loadSystemStats();
    
    alert(userId ? 'Пользователь обновлён!' : 'Пользователь создан!');
}

function loadAdminSlots() {
    console.log('Загрузка всех слотов...');
    
    const container = document.getElementById('adminSlotsList');
    if (!container) {
        console.error('Не найден adminSlotsList');
        return;
    }
    
    const slots = DB.slots;
    console.log('Всего слотов в системе:', slots.length);
    
    if (slots.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;"><p>Нет консультаций в системе</p></div>';
        return;
    }
    
    container.innerHTML = slots.map(slot => {
        const teacher = DB.getUser(slot.teacherId);
        const bookings = DB.getSlotBookings(slot.id);
        
        let statusBadge = '';
        let statusColor = '';
        switch(slot.status) {
            case 'active': 
                statusBadge = 'Активна'; 
                statusColor = '#0f6e3f'; 
                break;
            case 'cancelled': 
                statusBadge = 'Отменена'; 
                statusColor = '#b22234'; 
                break;
            case 'completed': 
                statusBadge = 'Завершена'; 
                statusColor = '#0056a7'; 
                break;
        }
        
        return `
            <div style="background: white; border-radius: 12px; padding: 20px; margin-bottom: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border-left: 4px solid ${statusColor}; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h3 style="margin: 0 0 10px 0;">${slot.subject} - <span style="color: ${statusColor};">${statusBadge}</span></h3>
                    <p style="margin: 5px 0;"><strong>Преподаватель:</strong> ${teacher ? teacher.surname + ' ' + teacher.name : 'Неизвестный'}</p>
                    <p style="margin: 5px 0;"><strong>Дата:</strong> ${slot.date} | <strong>Время:</strong> ${slot.timeStart}-${slot.timeEnd}</p>
                    <p style="margin: 5px 0;"><strong>Формат:</strong> ${slot.format} ${slot.room ? '| Ауд. ' + slot.room : ''}</p>
                    <p style="margin: 5px 0;"><strong>Записано:</strong> ${bookings.length}/${slot.limit}</p>
                </div>
                <div style="display: flex; gap: 10px; flex-direction: column;">
                    ${slot.status === 'active' ? 
                        '<button class="btn-danger btn-sm" onclick="window.adminCancelSlot(\'' + slot.id + '\')" type="button" style="white-space: nowrap;">Отменить</button>' : 
                        ''}
                    <button class="btn-danger btn-sm" onclick="window.adminDeleteSlot(\'' + slot.id + '\')" type="button" style="white-space: nowrap;">Удалить</button>
                </div>
            </div>
        `;
    }).join('');
    
    console.log('Слоты загружены');
}

function loadSystemStats() {
    console.log('Загрузка статистики...');
    
    const totalUsersEl = document.getElementById('totalUsers');
    const adminTotalSlotsEl = document.getElementById('adminTotalSlots');
    const adminTotalBookingsEl = document.getElementById('adminTotalBookings');
    
    if (totalUsersEl) totalUsersEl.textContent = DB.users.length;
    if (adminTotalSlotsEl) adminTotalSlotsEl.textContent = DB.slots.length;
    if (adminTotalBookingsEl) adminTotalBookingsEl.textContent = DB.bookings.length;
    
    // Распределение по ролям
    const roles = {};
    DB.users.forEach(u => {
        if (u.role) {
            roles[u.role] = (roles[u.role] || 0) + 1;
        }
    });
    
    const roleDistribution = document.getElementById('roleDistribution');
    if (roleDistribution) {
        if (Object.keys(roles).length > 0) {
            roleDistribution.innerHTML = 
                Object.entries(roles).map(([role, count]) => 
                    '<div style="display: flex; justify-content: space-between; padding: 12px; border-bottom: 1px solid #eee;">' +
                    '<span style="font-weight: 500;">' + getRoleName(role) + '</span>' +
                    '<span style="font-weight: 700; color: #0056a7;">' + count + '</span>' +
                    '</div>'
                ).join('');
        } else {
            roleDistribution.innerHTML = '<p style="text-align: center; color: #666;">Нет данных</p>';
        }
    }
    
    console.log('Статистика обновлена');
}

function getRoleName(role) {
    switch(role) {
        case 'student': return '🎓 Студенты';
        case 'teacher': return '👨‍🏫 Преподаватели';
        case 'admin': return '⚙️ Администраторы';
        default: return role;
    }
}