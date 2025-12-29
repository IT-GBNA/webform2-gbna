<script lang="ts" setup>
import Sidebar from './Sidebar.vue';

const { contentMargin } = useSidebar();

definePageMeta({
    middleware: "guest",
});

const form = ref({
    email: "",
    username: "",
    password: "",
});

const isLoading = ref(false)

async function handleFormSubmit() {
    try {
        isLoading.value = true
        await useFetch('/api/auth/register', {
            method: 'POST',
            body: form.value
        });

        useRouter().push({
            name: "login",
        });

    } finally {
        isLoading.value = false;
    }
}

</script>

<template>
    <!-- Sidebar -->
    <Sidebar />

    <!-- Main Content with left padding to accommodate sidebar -->
    <div :class="['transition-all duration-300', contentMargin]">
        <div class="flex justify-center p-14">
            <div class="bg-gradient-to-t from-white to-gray-100 shadow-x flex-col w-6/12 rounded-xl ">
                <div style="display: flex; justify-content: center; flex-direction: column; align-items: center;">
                    <h1 class="bg-gradient-to-r from-gray-800 via-gray-600 to-gray-800 bg-clip-text text-transparent font-bold tracking-tight
    border-2 border-transparent  sm:text-4xl pb-16 pt-16">Inscrivez-vous </h1>

                    <!-- Bloc -->

                    <div class="flex justify-center" style="display: flex;
  flex-direction: column;
  align-items: center;">
                        <form @submit.prevent="handleFormSubmit" class="w-8/12 pb-40">
                            <input v-model="form.email" class="w-full border p-2 rounded-lg mb-4" type="email"
                                placeholder="Adresse e-mail" />
                            <input v-model="form.username" class="w-full border p-2 rounded-lg mb-4" type="text"
                                placeholder="Nom d'utilisateur" />
                            <input v-model="form.password" class="w-full border p-2 rounded-lg mb-4" type="password"
                                placeholder="Mot de passe" />
                            <button :disabled="isLoading" type="submit"
                                class="bg-gray-600 hover:bg-gray-700 transition-all duration-200 w-full text-blue-50 rounded-lg p-2">
                                S'inscrire
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>