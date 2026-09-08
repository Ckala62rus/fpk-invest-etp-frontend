import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { ADMIN_ROLES, ROLES } from '@/constants/roles';

/**
 * Маршруты SPA ЭТП (фаза F0 — каркас).
 *
 * meta: guestOnly | requiresAuth | roles | layout
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
