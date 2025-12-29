<script lang="ts" setup>
definePageMeta({
    middleware: "guest",
});

import { useAuth } from '~/composables/useAuth';

const form = ref({
    username: "",
    password: "",
});

const { signIn } = useAuth();
const route = useRoute();
const errorMessage = ref('');

onMounted(() => {
    if (route.query.reason === 'unauthorized') {
        errorMessage.value = "Votre session a expiré ou vous devez être connecté pour accéder à cette page.";
    }
});

async function handleLogin() {
    try {
        await signIn(form.value);
        useRouter().push({
            name: "administration",
        });
    } catch (e) { }
}
</script>
<template>
    <div class="flex flex-col justify-center py-20 p-12 bg-white w-full">

        <div class="bg-white mx-auto p-16 rounded-xl shadow-xl">
            <div class="sm:mx-auto sm:w-full sm:max-w-sm">
                <img class="mx-auto h-10 w-auto mb-4" src="../img/gbnasante.png" alt="GBNA SANTE">
            </div>

            <div class=" sm:mx-auto sm:w-full sm:max-w-sm ">
                <!-- Error Message Alert -->
                <div v-if="errorMessage" class="mb-6 p-4 rounded-md bg-red-50 border border-red-200">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                    clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm font-medium text-red-800">{{ errorMessage }}</p>
                        </div>
                    </div>
                </div>

                <form class="space-y-6" action="#" method="POST" @submit.prevent="handleLogin">
                    <div>
                        <label for="username" class="block text-sm font-medium leading-6 text-gray-900">Nom
                            d'utilisateur</label>
                        <div class="mt-2">
                            <input id="username" name="username" type="username" autocomplete="username" required class="block p-4 w-full rounded-md border-0 py-1.5 text-gray-900 
              shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 
              focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" v-model="form.username">
                        </div>
                    </div>

                    <div>
                        <div class="flex items-center justify-between">
                            <label for="password" class="block text-sm font-medium leading-6 text-gray-900">Mot de
                                passe</label>
                        </div>
                        <div class="mt-2">
                            <input id="password" name="password" type="password" v-model="form.password"
                                autocomplete="current-password" required
                                class="block w-full p-4 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6">
                        </div>
                    </div>

                    <div>
                        <button type="submit" class="flex w-full justify-center rounded-md bg-green-700 px-3 py-2 text-sm font-semibold leading-6 transition text-white shadow-sm hover:bg-green-800 focus-visible:outline focus-visible:outline-2 
            focus-visible:outline-offset-2 focus-visible:outline-green-600">Se connecter</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

</template>
