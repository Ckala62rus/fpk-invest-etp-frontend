/**
 * Константы URL для API запросов ЭТП (электронной торговой площадки).
 *
 * Все пути централизованы здесь — как в reference-проекте.
 * Префикс `/api` задаётся в baseURL axios (или proxy Vite).
 */
const urls = {
    // --- Служебные ---
    health: '/health',
    serverTime: '/server-time',
    csrfCookie: '/sanctum/csrf-cookie',

    // --- Auth ---
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    me: '/auth/me',
    passwordForgot: '/auth/password/forgot',
    passwordReset: '/auth/password/reset',
    passwordAdminRequest: '/auth/password/admin-request',

    // --- Профиль участника ---
    profile: '/profile',
    profileDocuments: '/profile/documents',
    subscriptions: '/subscriptions',
    notificationSettings: '/notification-settings',

    // --- Публичная витрина ---
    publicProcedures: '/procedures',
    publicProcedure: (id) => `/procedures/${id}`,
    cmsPages: '/cms/pages',
    cmsPage: (slug) => `/cms/pages/${slug}`,
    complaints: '/complaints',
    corruptionReports: '/corruption-reports',

    // --- Опрос качества (публичный токен) ---
    evaluationSurvey: (token) => `/evaluation-surveys/${token}`,

    // --- Аукцион (участник) ---
    procedureLots: (procedureId) => `/procedures/${procedureId}/lots`,
    lotBids: (procedureId, lotId) => `/procedures/${procedureId}/lots/${lotId}/bids`,
    auctionHeartbeat: (procedureId) => `/procedures/${procedureId}/auction/presence/heartbeat`,
    auctionLeave: (procedureId) => `/procedures/${procedureId}/auction/presence/leave`,
    broadcastingAuth: '/broadcasting/auth',

    // --- КП (участник) ---
    submitProposal: (procedureId) => `/procedures/${procedureId}/proposals`,
    proposal: (id) => `/proposals/${id}`,
    proposalDocuments: (proposalId) => `/proposals/${proposalId}/documents`,
    proposalDocument: (proposalId, documentId) => `/proposals/${proposalId}/documents/${documentId}`,
    proposalMessages: (proposalId) => `/proposals/${proposalId}/messages`,

    // --- Админка (фрагмент; дополняем по мере F3) ---
    adminUsers: '/admin/users',
    adminProcedures: '/admin/procedures',
    adminActivityLogs: '/admin/activity-logs',
    adminSettings: '/admin/settings',
};

export default urls;
