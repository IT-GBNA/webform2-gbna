import { useAuth } from '~/composables/useAuth';

export default defineNuxtPlugin({
    name: 'auth',
    enforce: 'pre', // S'exécute avant les autres plugins
    parallel: false, // Bloque le rendu jusqu'à ce que ce plugin soit terminé
    async setup(nuxtApp) {
        // Récupère l'utilisateur au démarrage de l'application
        // Cela permet de restaurer la session depuis le cookie HTTP-only
        // après un rafraîchissement de page (F5)
        const { fetchUser, data } = useAuth();

        // Ne fetch que si l'utilisateur n'est pas déjà chargé
        // Important: On attend que l'auth soit chargée AVANT les middlewares
        if (!data.value) {
            await fetchUser();
        }
    }
});
