import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { ADMIN_ROLES, ROLES } from '@/constants/roles';

/**
 * Маршруты SPA ЭТП.
 *
 * meta:
 * - guestOnly — только для неавторизованных (login/register)
 * - requiresAuth — нужна сессия Sanctum
 * - roles — список slug ролей (достаточно одной)
 * - layout — подсказка layout’у (public | cabinet | admin)
 */
const routes = [
    {
        path: '/',
        name: 'home',
        component: () => import('@/pages/public/HomePage.vue'),
        meta: { layout: 'public', title: 'Главная' },
    },
    {
        path: '/login',
        name: 'login',
        component: () => import('@/pages/auth/LoginPage.vue'),
        meta: { layout: 'public', guestOnly: true, title: 'Вход' },
    },
    {
        path: '/register',
        name: 'register',
        component: () => import('@/pages/auth/RegisterPage.vue'),
        meta: { layout: 'public', guestOnly: true, title: 'Регистрация' },
    },
    {
        path: '/password/forgot',
        name: 'password.forgot',
        component: () => import('@/pages/auth/ForgotPasswordPage.vue'),
        meta: { layout: 'public', guestOnly: true, title: 'Восстановление пароля' },
    },
    {
        path: '/password/reset',
        name: 'password.reset',
        component: () => import('@/pages/auth/ResetPasswordPage.vue'),
        meta: { layout: 'public', title: 'Новый пароль' },
    },
    {
        path: '/password/admin-request',
        name: 'password.admin-request',
        component: () => import('@/pages/auth/AdminPasswordRequestPage.vue'),
        meta: { layout: 'public', guestOnly: true, title: 'Обращение к администратору' },
    },
    {
        path: '/procedures',
        name: 'procedures.index',
        component: () => import('@/pages/public/ProceduresIndexPage.vue'),
        meta: { layout: 'public', title: 'Процедуры' },
    },
    {
        path: '/procedures/:id',
        name: 'procedures.show',
        component: () => import('@/pages/public/ProcedureShowPage.vue'),
        meta: { layout: 'public', title: 'Процедура' },
    },
    {
        path: '/pages/:slug',
        name: 'cms.show',
        component: () => import('@/pages/public/CmsPage.vue'),
        meta: { layout: 'public', title: 'Страница' },
    },
    {
        path: '/complaint',
        name: 'complaint',
        component: () => import('@/pages/public/ComplaintPage.vue'),
        meta: { layout: 'public', title: 'Жалоба' },
    },
    {
        path: '/corruption',
        name: 'corruption',
        component: () => import('@/pages/public/CorruptionPage.vue'),
        meta: { layout: 'public', title: 'Антикоррупция' },
    },
    {
        path: '/evaluation/:token',
        name: 'evaluation',
        component: () => import('@/pages/public/EvaluationPage.vue'),
        meta: { layout: 'public', title: 'Опрос качества' },
    },
    {
        path: '/cabinet',
        name: 'cabinet',
        component: () => import('@/pages/cabinet/CabinetHomePage.vue'),
        meta: {
            layout: 'cabinet',
            requiresAuth: true,
            roles: [ROLES.PARTICIPANT, ...ADMIN_ROLES],
            title: 'Кабинет',
        },
    },
    {
        path: '/cabinet/profile',
        name: 'cabinet.profile',
        component: () => import('@/pages/cabinet/ProfilePage.vue'),
        meta: {
            layout: 'cabinet',
            requiresAuth: true,
            roles: [ROLES.PARTICIPANT, ...ADMIN_ROLES],
            title: 'Профиль',
        },
    },
    {
        path: '/cabinet/subscriptions',
        name: 'cabinet.subscriptions',
        component: () => import('@/pages/cabinet/SubscriptionsPage.vue'),
        meta: {
            layout: 'cabinet',
            requiresAuth: true,
            roles: [ROLES.PARTICIPANT, ...ADMIN_ROLES],
            title: 'Подписки',
        },
    },
    {
        path: '/cabinet/notifications',
        name: 'cabinet.notifications',
        component: () => import('@/pages/cabinet/NotificationSettingsPage.vue'),
        meta: {
            layout: 'cabinet',
            requiresAuth: true,
            roles: [ROLES.PARTICIPANT, ...ADMIN_ROLES],
            title: 'Уведомления',
        },
    },
    {
        path: '/cabinet/proposals',
        name: 'cabinet.proposals',
        component: () => import('@/pages/cabinet/ProposalsIndexPage.vue'),
        meta: {
            layout: 'cabinet',
            requiresAuth: true,
            roles: [ROLES.PARTICIPANT, ...ADMIN_ROLES],
            title: 'Мои КП',
        },
    },
    {
        path: '/cabinet/proposals/:id',
        name: 'cabinet.proposals.show',
        component: () => import('@/pages/cabinet/ProposalShowPage.vue'),
        meta: {
            layout: 'cabinet',
            requiresAuth: true,
            roles: [ROLES.PARTICIPANT, ...ADMIN_ROLES],
            title: 'КП',
        },
    },
    {
        path: '/cabinet/procedures/:id/propose',
        name: 'cabinet.propose',
        component: () => import('@/pages/cabinet/SubmitProposalPage.vue'),
        meta: {
            layout: 'cabinet',
            requiresAuth: true,
            roles: [ROLES.PARTICIPANT],
            title: 'Подача КП',
        },
    },
    {
        path: '/cabinet/procedures/:id/auction',
        name: 'cabinet.auction',
        component: () => import('@/pages/cabinet/AuctionPage.vue'),
        meta: {
            layout: 'cabinet',
            requiresAuth: true,
            roles: [ROLES.PARTICIPANT, ...ADMIN_ROLES],
            title: 'Аукцион',
        },
    },
    {
        path: '/admin',
        name: 'admin.dashboard',
        component: () => import('@/pages/admin/AdminDashboardPage.vue'),
        meta: {
            layout: 'admin',
            requiresAuth: true,
            roles: [...ADMIN_ROLES],
            title: 'Админка',
        },
    },
    {
        path: '/admin/users',
        name: 'admin.users',
        component: () => import('@/pages/admin/AdminUsersPage.vue'),
        meta: {
            layout: 'admin',
            requiresAuth: true,
            roles: [...ADMIN_ROLES],
            title: 'Пользователи',
        },
    },
    {
        path: '/admin/classifier',
        name: 'admin.classifier',
        component: () => import('@/pages/admin/AdminClassifierPage.vue'),
        meta: {
            layout: 'admin',
            requiresAuth: true,
            roles: [ROLES.SUPER_ADMIN],
            title: 'Классификатор',
        },
    },
    {
        path: '/admin/procedures',
        name: 'admin.procedures',
        component: () => import('@/pages/admin/AdminProceduresPage.vue'),
        meta: {
            layout: 'admin',
            requiresAuth: true,
            roles: [...ADMIN_ROLES],
            title: 'ТЗП',
        },
    },
    {
        path: '/admin/procedures/:id',
        name: 'admin.procedures.show',
        component: () => import('@/pages/admin/AdminProcedureShowPage.vue'),
        meta: {
            layout: 'admin',
            requiresAuth: true,
            roles: [...ADMIN_ROLES],
            title: 'ТЗП',
        },
    },
    {
        path: '/admin/procedures/:id/proposals',
        name: 'admin.proposals',
        component: () => import('@/pages/admin/AdminProposalsPage.vue'),
        meta: {
            layout: 'admin',
            requiresAuth: true,
            roles: [...ADMIN_ROLES],
            title: 'КП процедуры',
        },
    },
    {
        path: '/admin/procedures/:id/proposals/:proposalId',
        name: 'admin.proposals.show',
        component: () => import('@/pages/admin/AdminProposalShowPage.vue'),
        meta: {
            layout: 'admin',
            requiresAuth: true,
            roles: [...ADMIN_ROLES],
            title: 'КП',
        },
    },
    {
        path: '/admin/procedures/:id/auction',
        name: 'admin.auction',
        component: () => import('@/pages/admin/AdminAuctionPage.vue'),
        meta: {
            layout: 'admin',
            requiresAuth: true,
            roles: [...ADMIN_ROLES],
            title: 'Аукцион',
        },
    },
    {
        path: '/admin/cms',
        name: 'admin.cms',
        component: () => import('@/pages/admin/AdminCmsPage.vue'),
        meta: {
            layout: 'admin',
            requiresAuth: true,
            roles: [ROLES.SUPER_ADMIN],
            title: 'CMS',
        },
    },
    {
        path: '/admin/activity',
        name: 'admin.activity',
        component: () => import('@/pages/admin/AdminActivityPage.vue'),
        meta: {
            layout: 'admin',
            requiresAuth: true,
            roles: [...ADMIN_ROLES],
            title: 'Аудит',
        },
    },
    {
        path: '/admin/notifications',
        name: 'admin.notifications',
        component: () => import('@/pages/admin/AdminNotificationsPage.vue'),
        meta: {
            layout: 'admin',
            requiresAuth: true,
            roles: [ROLES.SUPER_ADMIN],
            title: 'Шаблоны писем',
        },
    },
    {
        path: '/admin/reports',
        name: 'admin.reports',
        component: () => import('@/pages/admin/AdminReportsPage.vue'),
        meta: {
            layout: 'admin',
            requiresAuth: true,
            roles: [...ADMIN_ROLES],
            title: 'Отчёты',
        },
    },
    {
        path: '/admin/surveys',
        name: 'admin.surveys',
        component: () => import('@/pages/admin/AdminSurveysPage.vue'),
        meta: {
            layout: 'admin',
            requiresAuth: true,
            roles: [ROLES.SUPER_ADMIN],
            title: 'Опросы',
        },
    },
    {
        path: '/admin/procedures/:id/lots',
        name: 'admin.lots',
        component: () => import('@/pages/admin/AdminLotsPage.vue'),
        meta: {
            layout: 'admin',
            requiresAuth: true,
            roles: [...ADMIN_ROLES],
            title: 'Лоты',
        },
    },
    {
        path: '/admin/procedures/:id/custom-fields',
        name: 'admin.customFields',
        component: () => import('@/pages/admin/AdminCustomFieldsPage.vue'),
        meta: {
            layout: 'admin',
            requiresAuth: true,
            roles: [...ADMIN_ROLES],
            title: 'Настраиваемые поля',
        },
    },
    {
        path: '/admin/procedures/:id/change-logs',
        name: 'admin.changeLogs',
        component: () => import('@/pages/admin/AdminChangeLogsPage.vue'),
        meta: {
            layout: 'admin',
            requiresAuth: true,
            roles: [...ADMIN_ROLES],
            title: 'Согласование',
        },
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'not-found',
        component: () => import('@/pages/public/NotFoundPage.vue'),
        meta: { layout: 'public', title: 'Не найдено' },
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior() {
        return { top: 0 };
    },
});

/**
 * Navigation guard: сессия + RBAC.
 */
router.beforeEach(async (to) => {
    const auth = useAuthStore();

    if (!auth.bootstrapped) {
        await auth.bootstrap();
    }

    document.title = to.meta.title
        ? `${to.meta.title} — ЭТП ФПК «Инвест»`
        : 'ЭТП ФПК «Инвест»';

    if (to.meta.guestOnly && auth.isAuth) {
        return auth.isAdminArea ? { name: 'admin.dashboard' } : { name: 'cabinet' };
    }

    if (to.meta.requiresAuth && !auth.isAuth) {
        return { name: 'login', query: { redirect: to.fullPath } };
    }

    const neededRoles = to.meta.roles;
    if (neededRoles?.length && !auth.hasRole(neededRoles)) {
        return { name: 'home' };
    }

    return true;
});

export default router;
