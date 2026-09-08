/**
 * Константы URL для API запросов ЭТП (электронной торговой площадки).
 * Префикс `/api` задаётся в baseURL axios (или proxy Vite).
 */
const urls = {
    health: '/health',
    serverTime: '/server-time',
    csrfCookie: '/sanctum/csrf-cookie',
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    me: '/auth/me',
    passwordForgot: '/auth/password/forgot',
    passwordReset: '/auth/password/reset',
    passwordAdminRequest: '/auth/password/admin-request',
    profile: '/profile',
    profileDocuments: '/profile/documents',
    subscriptions: '/subscriptions',
    notificationSettings: '/notification-settings',
};

export default urls;
