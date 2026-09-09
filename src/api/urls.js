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
    profileDocumentDownload: (documentId) => `/profile/documents/${documentId}/download`,
    subscriptions: '/subscriptions',
    notificationSettings: '/notification-settings',
    catalogCategories: '/catalog/categories',
    catalogCompanyGroups: '/catalog/company-groups',

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
    myProposals: '/proposals',
    submitProposal: (procedureId) => `/procedures/${procedureId}/proposals`,
    proposal: (id) => `/proposals/${id}`,
    proposalDocuments: (proposalId) => `/proposals/${proposalId}/documents`,
    proposalDocument: (proposalId, documentId) => `/proposals/${proposalId}/documents/${documentId}`,
    proposalDocumentDownload: (proposalId, documentId) => `/proposals/${proposalId}/documents/${documentId}/download`,
    proposalMessages: (proposalId) => `/proposals/${proposalId}/messages`,

    // --- Админка ---
    adminUsers: '/admin/users',
    adminUserApprove: (id) => `/admin/users/${id}/approve`,
    adminUserBlock: (id) => `/admin/users/${id}/block`,
    adminUserUnblock: (id) => `/admin/users/${id}/unblock`,
    adminUserRoles: (id) => `/admin/users/${id}/roles`,
    adminUserDocuments: (userId) => `/admin/users/${userId}/documents`,
    adminUserDocumentDownload: (userId, documentId) => `/admin/users/${userId}/documents/${documentId}/download`,

    adminCompanyGroups: '/admin/company-groups',
    adminCompanyGroup: (id) => `/admin/company-groups/${id}`,
    adminClassifierCategories: '/admin/classifier-categories',
    adminClassifierCategory: (id) => `/admin/classifier-categories/${id}`,
    adminCompanies: '/admin/companies',
    adminCompany: (id) => `/admin/companies/${id}`,

    adminProcedures: '/admin/procedures',
    adminProcedure: (id) => `/admin/procedures/${id}`,
    adminProcedurePublish: (id) => `/admin/procedures/${id}/publish`,
    adminProcedureRestore: (id) => `/admin/procedures/${id}/restore`,

    adminProcedureProposals: (procedureId) => `/admin/procedures/${procedureId}/proposals`,
    adminProcedureProposal: (procedureId, proposalId) => `/admin/procedures/${procedureId}/proposals/${proposalId}`,
    adminProposalDocumentDownload: (procedureId, proposalId, documentId) => `/admin/procedures/${procedureId}/proposals/${proposalId}/documents/${documentId}/download`,
    adminProposalAdmission: (procedureId, proposalId) => `/admin/procedures/${procedureId}/proposals/${proposalId}/admission-decision`,
    adminProposalMessages: (procedureId, proposalId) => `/admin/procedures/${procedureId}/proposals/${proposalId}/messages`,

    adminProcedureLots: (procedureId) => `/admin/procedures/${procedureId}/lots`,
    adminProcedureLot: (procedureId, lotId) => `/admin/procedures/${procedureId}/lots/${lotId}`,
    adminAuctionSettings: (procedureId) => `/admin/procedures/${procedureId}/auction-settings`,
    adminAuctionStart: (procedureId) => `/admin/procedures/${procedureId}/auction/start`,
    adminAuctionPause: (procedureId) => `/admin/procedures/${procedureId}/auction/pause`,
    adminAuctionResume: (procedureId) => `/admin/procedures/${procedureId}/auction/resume`,
    adminAuctionFinish: (procedureId) => `/admin/procedures/${procedureId}/auction/finish`,
    adminLotBids: (procedureId, lotId) => `/admin/procedures/${procedureId}/lots/${lotId}/bids`,
    adminCancelBid: (procedureId, bidId) => `/admin/procedures/${procedureId}/bids/${bidId}/cancel`,
    adminAuctionPresence: (procedureId) => `/admin/procedures/${procedureId}/auction/presence`,
    adminAuctionProtocols: (procedureId) => `/admin/procedures/${procedureId}/auction/protocols`,

    adminChangeLogs: (procedureId) => `/admin/procedures/${procedureId}/change-logs`,
    adminChangeLogApprove: (procedureId, changeLogId) => `/admin/procedures/${procedureId}/change-logs/${changeLogId}/approve`,
    adminChangeLogReject: (procedureId, changeLogId) => `/admin/procedures/${procedureId}/change-logs/${changeLogId}/reject`,

    adminCustomFields: (procedureId) => `/admin/procedures/${procedureId}/custom-fields`,
    adminCustomField: (procedureId, fieldId) => `/admin/procedures/${procedureId}/custom-fields/${fieldId}`,
    adminExternalInvites: (procedureId) => `/admin/procedures/${procedureId}/external-invites`,
    adminProcedureExtraConditions: (procedureId) => `/admin/procedures/${procedureId}/extra-conditions`,
    adminExtraConditionTemplates: '/admin/extra-condition-templates',
    adminExtraConditionTemplate: (id) => `/admin/extra-condition-templates/${id}`,

    adminCmsPages: '/admin/cms-pages',
    adminCmsPage: (id) => `/admin/cms-pages/${id}`,

    adminNotificationTemplates: '/admin/notification-templates',
    adminNotificationTemplate: (id) => `/admin/notification-templates/${id}`,

    adminEvaluationSurveyTemplates: '/admin/evaluation-survey-templates',
    adminEvaluationSurveyTemplate: (id) => `/admin/evaluation-survey-templates/${id}`,

    adminReportTemplates: '/admin/report-templates',
    adminReportTemplate: (id) => `/admin/report-templates/${id}`,
    adminReportTemplateRuns: (id) => `/admin/report-templates/${id}/runs`,
    adminReportRunDownload: (runId) => `/admin/report-runs/${runId}/download`,

    adminActivityLogs: '/admin/activity-logs',
    adminActivityLogsExport: '/admin/activity-logs/export',
    adminActivityLog: (id) => `/admin/activity-logs/${id}`,
    adminSettings: '/admin/settings',
};

export default urls;
