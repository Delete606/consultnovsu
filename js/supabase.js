// Конфигурация Supabase
const SUPABASE_URL = 'https://bimdjjmdxoygeucdzlmu.supabase.co/rest/v1/';
const SUPABASE_KEY = 'sb_publishable_NPy8IPzsq37ts76xKbsCDQ_hZNIwUje';

// Подключаем Supabase (добавьте этот скрипт в HTML)
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// API для работы с базой данных
const API = {
    // Авторизация
    async login(email, password, role) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .eq('password', password)
            .eq('role', role)
            .eq('active', true)
            .single();
        
        if (error || !data) {
            throw new Error('Неверный логин, пароль или роль');
        }
        
        // Сохраняем сессию
        sessionStorage.setItem('currentUser', JSON.stringify(data));
        return data;
    },
    
    logout() {
        sessionStorage.removeItem('currentUser');
    },
    
    getCurrentUser() {
        const saved = sessionStorage.getItem('currentUser');
        return saved ? JSON.parse(saved) : null;
    },
    
    // Консультации
    async getActiveSlots() {
        const { data, error } = await supabase
            .from('slots')
            .select('*, users!slots_teacher_id_fkey(name, surname, email)')
            .eq('status', 'active')
            .gte('date', new Date().toISOString().split('T')[0])
            .order('date')
            .order('time_start');
        
        if (error) throw error;
        
        // Преобразуем формат
        return data.map(slot => ({
            id: slot.id,
            teacherId: slot.teacher_id,
            subject: slot.subject,
            date: slot.date,
            timeStart: slot.time_start,
            timeEnd: slot.time_end,
            format: slot.format,
            room: slot.room,
            limit: slot.max_students,
            status: slot.status,
            description: slot.description,
            topics: slot.topics || [],
            teacher: slot.users ? {
                name: slot.users.name,
                surname: slot.users.surname,
                email: slot.users.email
            } : null
        }));
    },
    
    async getTeacherSlots(teacherId) {
        const { data, error } = await supabase
            .from('slots')
            .select('*')
            .eq('teacher_id', teacherId)
            .order('date', { ascending: false });
        
        if (error) throw error;
        return data;
    },
    
    async createSlot(slotData) {
        const { data, error } = await supabase
            .from('slots')
            .insert({
                id: slotData.id,
                teacher_id: slotData.teacherId,
                subject: slotData.subject,
                date: slotData.date,
                time_start: slotData.timeStart,
                time_end: slotData.timeEnd,
                format: slotData.format,
                room: slotData.room,
                max_students: slotData.limit,
                status: 'active',
                description: slotData.description,
                topics: slotData.topics || []
            })
            .select();
        
        if (error) throw error;
        return data;
    },
    
    async updateSlot(slotId, updates) {
        const { data, error } = await supabase
            .from('slots')
            .update(updates)
            .eq('id', slotId);
        
        if (error) throw error;
        return data;
    },
    
    // Записи
    async getBookings(slotId) {
        const { data, error } = await supabase
            .from('bookings')
            .select('*, users!bookings_student_id_fkey(name, surname)')
            .eq('slot_id', slotId)
            .eq('status', 'active');
        
        if (error) throw error;
        return data;
    },
    
    async getStudentBookings(studentId) {
        const { data, error } = await supabase
            .from('bookings')
            .select('*, slots(*)')
            .eq('student_id', studentId);
        
        if (error) throw error;
        return data;
    },
    
    async createBooking(bookingData) {
        const { data, error } = await supabase
            .from('bookings')
            .insert({
                id: bookingData.id,
                slot_id: bookingData.slotId,
                student_id: bookingData.studentId,
                topic: bookingData.topic,
                status: 'active'
            })
            .select();
        
        if (error) throw error;
        return data;
    },
    
    async cancelBooking(bookingId, cancelledBy) {
        const { data, error } = await supabase
            .from('bookings')
            .update({ status: 'cancelled', cancelled_by: cancelledBy })
            .eq('id', bookingId);
        
        if (error) throw error;
        return data;
    },
    
    // Уведомления
    async getNotifications(userId) {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);
        
        if (error) throw error;
        return data;
    },
    
    async createNotification(notifData) {
        const { data, error } = await supabase
            .from('notifications')
            .insert({
                id: notifData.id,
                user_id: notifData.userId,
                related_slot_id: notifData.relatedSlotId,
                message: notifData.message,
                type: notifData.type,
                is_read: false
            });
        
        if (error) throw error;
        return data;
    },
    
    async markNotificationRead(notifId) {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notifId);
        
        if (error) throw error;
    },
    
    // Предметы
    async getSubjects() {
        const { data, error } = await supabase
            .from('subjects')
            .select('name')
            .order('name');
        
        if (error) throw error;
        return data.map(s => s.name);
    },
    
    // Глобальные темы
    async getGlobalTopics() {
        const { data, error } = await supabase
            .from('global_topics')
            .select('*');
        
        if (error) throw error;
        return data;
    },
    
    async addGlobalTopic(topic) {
        const { data, error } = await supabase
            .from('global_topics')
            .insert(topic);
        
        if (error) throw error;
        return data;
    }
};

// Экспортируем
window.API = API;
console.log('Supabase API готов');