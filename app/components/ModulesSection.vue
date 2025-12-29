<script setup lang="ts">
interface Formation {
    id: string;
    displayName: string;
    description: string;
    duration: string;
    route: string;
    order: number;
    coverImage?: string;
}

defineProps<{
    formations: Formation[] | null | undefined;
    pending: boolean;
    error: Error | null | undefined;
    title?: string;
    subtitle?: string;
}>();
</script>

<template>
    <div class="space-y-8">
        <!-- Header Section -->
        <div class="mb-12 text-center mt-10">
            <h2 class="text-2xl font-extrabold tracking-tight sm:text-5xl mb-4">
                <span class="bg-gradient-to-r from-green-700 via-green-600 to-green-700 bg-clip-text 
                text-transparent">
                    {{ title || 'Les modules disponibles' }}
                </span>
            </h2>
            <p class="text-sm font-medium text-gray-600 max-w-2xl mx-auto">
                {{ subtitle || 'Développez vos compétences avec nos parcours interactifs.' }}
            </p>
        </div>

        <!-- Loading State -->
        <div v-if="pending" class="flex justify-center items-center py-20">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center py-20">
            <div class="bg-red-50 text-red-600 p-4 rounded-xl inline-block border border-red-200">
                <p>Une erreur est survenue lors du chargement des modules.</p>
            </div>
        </div>

        <!-- Modules -->
        <div v-else-if="formations && formations.length > 0" class="space-y-8">

            <!-- Featured Formation (First one) -->
            <div v-if="formations[0]" class="relative">
                <NuxtLink :to="formations[0].route" class="group relative block w-full aspect-[21/9] rounded-3xl overflow-hidden shadow-xl 
                    hover:shadow-md transition-all duration-500 transform hover:-translate-y-1">

                    <!-- Background Image -->
                    <div class="absolute inset-0">
                        <img v-if="formations[0].coverImage" :src="formations[0].coverImage"
                            :alt="formations[0].displayName"
                            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        <div v-else class="w-full h-full bg-gradient-to-br from-green-200 via-green-100 to-white"></div>
                    </div>

                    <!-- Gradient Overlays avec transition d'opacité -->
                    <div class="absolute inset-0 bg-gradient-to-tr from-white via-white/60 to-transparent transition-opacity duration-300 
                        backdrop-blur-xs">
                    </div>

                    <!-- Featured Badge -->
                    <div class="absolute top-6 left-6 z-10">
                        <span
                            class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold rounded-full shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="currentColor"
                                viewBox="0 0 24 24">
                                <path
                                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                            À la une
                        </span>
                    </div>

                    <!-- Duration Badge -->
                    <div class="absolute top-6 right-6 z-10">
                        <span
                            class="inline-flex items-center gap-2 px-4 py-2 bg-white/95 text-green-700 text-sm font-semibold rounded-full shadow-md">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {{ formations[0].duration }}
                        </span>
                    </div>

                    <!-- Content -->
                    <div class="absolute inset-y-0 left-0 w-3/4 p-8 flex flex-col justify-end z-10">
                        <h3
                            class="text-3xl lg:text-4xl font-extrabold bg-gradient-to-r 
                            from-green-700/85 via-green-600 to-green-500 bg-clip-text text-transparent mb-4 tracking-tight">
                            {{ formations[0].displayName }}
                        </h3>
                        <p class="text-gray-600 font-thin lg:text-sm mb-6 line-clamp-3 w-4/6">
                            {{ formations[0].description }}
                        </p>
                        <div class="flex items-center gap-3">
                            <span
                                class="relative inline-flex items-center justify-center px-6 py-3 overflow-hidden text-white font-semibold rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-500 border border-green-600">
                                <!-- Background Normal -->
                                <span
                                    class="absolute inset-0 bg-gradient-to-r from-green-600/80 via-green-600/70 to-green-600/80 opacity-100 group-hover:opacity-0 transition-opacity duration-500"></span>
                                <!-- Background Hover -->
                                <span
                                    class="absolute inset-0 bg-gradient-to-r from-green-700/95 via-green-600/70 to-green-600/95 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>

                                <!-- Content -->
                                <span class="relative flex items-center gap-2">
                                    Commencer le module
                                    <svg xmlns="http://www.w3.org/2000/svg"
                                        class="h-5 w-5 transform group-hover:translate-x-1 transition-transform duration-300"
                                        fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </span>
                            </span>
                        </div>
                    </div>
                </NuxtLink>
            </div>
            <div class="bg-gradient-to-b from-zinc-100 to-white p-6 rounded-2xl">
                <!-- Other Formations Title -->
                <div v-if="formations.length > 1" class="">
                    <h3 class="text-md font-medium text-gray-500/90 mb-6">Autres modules disponibles</h3>
                </div>

                <!-- Other Formations Grid -->
                <div v-if="formations.length > 1" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <FormationCard v-for="formation in formations.slice(1)" :key="formation.id"
                        :formation="formation" />
                </div>
            </div>
        </div>
        <!-- No Modules State -->
        <div v-else class="text-center py-20">
            <div class="bg-gray-100 p-8 rounded-2xl inline-block border border-gray-200">
                <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <p class="text-gray-500 text-lg">Aucun module n'est disponible pour le moment.</p>
            </div>
        </div>
    </div>
</template>

<style scoped>
.line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.featured-card {
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}

.featured-card:hover {
    box-shadow: 0 25px 50px -12px rgb(34 197 94 / 0.4);
}
</style>
