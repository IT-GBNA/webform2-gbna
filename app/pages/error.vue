<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps({
    error: Object as () => NuxtError
})

const handleError = () => clearError({ redirect: '/' })
</script>

<template>
    <div class="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
        <div class="max-w-md w-full space-y-8 text-center">
            <div>
                <h1 class="text-9xl font-extrabold text-green-600">{{ error?.statusCode }}</h1>
                <h2 class="mt-6 text-3xl font-bold text-gray-900">
                    {{ error?.statusCode === 404 ? 'Page non trouvée' : 'Une erreur est survenue' }}
                </h2>
                <p class="mt-2 text-sm text-gray-600">
                    {{ error?.message || "Désolé, une erreur inattendue s'est produite." }}
                </p>
            </div>
            <div class="mt-8">
                <button @click="handleError"
                    class="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out shadow-md">
                    Retour à l'accueil
                </button>
            </div>
        </div>
    </div>
</template>
