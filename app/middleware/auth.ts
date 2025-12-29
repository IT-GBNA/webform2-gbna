import { useAuth } from '~/composables/useAuth';

export default defineNuxtRouteMiddleware(async (to, from) => {
    const { status, data, fetchUser } = useAuth();

    // Si l'utilisateur n'est pas encore chargé, on le récupère
    // Cela gère le cas du rafraîchissement de page (F5)
    if (!data.value) {
        await fetchUser();
    }

    // Après le fetch, on vérifie si l'utilisateur est authentifié
    if (status.value === 'unauthenticated') {
        return navigateTo({
            name: 'login',
            query: {
                reason: 'unauthorized'
            }
        });
    }
});
