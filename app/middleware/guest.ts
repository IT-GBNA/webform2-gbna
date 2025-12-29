import { useAuth } from '~/composables/useAuth';

export default defineNuxtRouteMiddleware(async (to, from) => {
    const { status, data, fetchUser } = useAuth();

    // Si l'utilisateur n'est pas encore chargé, on le récupère
    if (!data.value) {
        await fetchUser();
    }

    // Si l'utilisateur est authentifié, on le redirige
    if (status.value === 'authenticated') {
        // Si on venait d'une page (par exemple admin -> login -> redirect)
        // On retourne à la page d'origine si possible
        if (from && from.path && from.path !== '/login') {
            return navigateTo(from.path);
        }
        return navigateTo({
            name: "index",
        });
    }
});