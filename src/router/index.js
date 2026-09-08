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
