interface User {
    id: string;
    username: string;
    email: string;
    role: 'superadmin' | 'admin' | 'export';
}

export const useAuth = () => {
    // On utilise useState pour que l'état de l'utilisateur soit partagé dans toute l'app
    const user = useState<User | null>('user', () => null);

    // Fonction pour se déconnecter
    const signOut = async () => {
        try {
            // Appel optionnel à l'API si tu as besoin de supprimer un cookie côté serveur
            await $fetch('/api/auth/logout', { method: 'POST' })

            user.value = null;

            // Redirection vers le login
            await navigateTo('/login');
        } catch (error) {
            console.error('Erreur lors de la déconnexion', error);
        }
    };

    // Fonction pour récupérer l'utilisateur (à appeler au chargement de l'app si besoin)
    const fetchUser = async () => {
        try {
            // En SSR, on doit transmettre les cookies manuellement
            const headers = import.meta.server ? useRequestHeaders(['cookie']) : {};

            const data = await $fetch<User>('/api/auth/me', {
                headers,
                credentials: 'include'
            });
            user.value = data;
        } catch (_) {
            user.value = null;
        }
    };

    const signIn = async ({ username, password }: { username: string; password: string }) => {
        try {
            const data = await $fetch<{ user: User }>('/api/auth/login', {
                method: 'POST',
                body: { username, password }
            });
            user.value = data.user;
            return data;
        } catch (error) {
            throw error;
        }
    };

    const status = computed(() => {
        if (user.value) {
            return 'authenticated';
        }
        return 'unauthenticated';
    });

    return {
        data: user, // On renomme 'user' en 'data' pour coller à ton code
        status,
        signOut,
        fetchUser,
        signIn
    };
};