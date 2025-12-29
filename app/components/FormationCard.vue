<script setup lang="ts">
interface Formation {
    id: string;
    displayName: string;
    description: string;
    duration: string;
    route: string;
    coverImage?: string;
}

defineProps<{
    formation: Formation;
}>();
</script>

<template>
    <NuxtLink :to="formation.route"
        class="group relative aspect-[16/10] rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1 border border-gray-100 block bg-white">

        <!-- Background Image -->
        <div class="absolute inset-0">
            <img v-if="formation.coverImage" :src="formation.coverImage" :alt="formation.displayName"
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div v-else class="w-full h-full bg-gradient-to-br from-green-100 via-green-50 to-white"></div>
        </div>

        <!-- Gradient Overlays -->
        <div class="absolute inset-0 bg-gradient-to-tr from-white via-white/80 to-transparent 
            transition-opacity duration-300 backdrop-blur-[1px]"></div>

        <!-- Duration Badge -->
        <div class="absolute top-4 right-4 z-10">
            <span
                class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-sm text-green-700 text-xs font-semibold rounded-full shadow-sm border border-green-100">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ formation.duration }}
            </span>
        </div>

        <!-- Content -->
        <div class="absolute inset-0 p-6 flex flex-col justify-end z-10">
            <h3 class="text-xl font-extrabold tracking-tight bg-gradient-to-r from-green-700/85 via-green-600 to-green-500 
                bg-clip-text text-transparent mb-2  transition-colors duration-300">
                {{ formation.displayName }}
            </h3>
            <p class="text-gray-600 text-sm line-clamp-2 mb-4 font-medium group-hover:text-gray-700 transition-colors">
                {{ formation.description }}
            </p>
        </div>
    </NuxtLink>
</template>

<style scoped>
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>
