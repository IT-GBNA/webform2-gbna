<script lang="ts" setup>
import Sidebar from './Sidebar.vue';
import { useSidebar } from '~/composables/useSidebar';

const { contentMargin } = useSidebar();

interface Formation {
    id: string;
    displayName: string;
    description: string;
    duration: string;
    route: string;
    order: number;
    coverImage?: string;
}

// Fetch formations from API
const { data: formations, pending, error } = await useFetch<Formation[]>('/api/formations');

const scrollToModules = () => {
    const modulesSection = document.getElementById('modules');
    if (modulesSection) {
        modulesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};
</script>

<template>
    <!-- Sidebar -->
    <Sidebar />

    <!-- Main Content -->
    <div class="transition-all duration-300 w-full">

        <div class="min-h-screen">
            <!-- Hero Section - Centered Vertically -->
            <div :class="['flex items-center justify-center flex-row-reverse min-h-screen', contentMargin]">
                <div class="w-[30%]">
                    <img class="border-gray-200/50 shadow-xl rounded-xl" src="../img/front.png" />
                </div>
                <div class="relative isolate px-14 lg:px-24">
                    <div class="mx-auto max-w-4xl">
                        <div class="text-center">
                            <h1
                                class="bg-gradient-to-r from-gray-800 via-gray-600 to-gray-800 bg-clip-text text-transparent text-5xl font-bold tracking-tight sm:text-6xl pb-0">
                                Plateforme de E-learning <br> à la cybersécurité
                            </h1>
                            <h1
                                class="bg-gradient-to-r from-green-700 via-green-500 to-green-700 bg-clip-text text-transparent text-6xl font-bold tracking-tight sm:text-7xl pb-20">
                                GBNA Santé
                            </h1>

                            <p class="mt-6 text-lg leading-8 text-gray-800 pb-5">
                                Découvrez le premier parcours Cybersécurité proposé par GBNA Santé.
                            </p>
                            <div class="mt-10 flex items-center justify-center gap-x-6">
                                <button @click="scrollToModules"
                                    class="rounded-md px-6 py-3 text-sm font-medium text-white shadow-sm bg-gradient-to-t from-green-500 to-green-600 cursor-pointer hover:from-green-600 hover:to-green-700 transition-all duration-300">
                                    Commencez
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <hr
                class="h-px border-t-0 bg-transparent bg-gradient-to-r from-transparent via-neutral-400 to-transparent opacity-25" />

            <!-- PARTIE MODULE - Full Screen Section -->
            <section id="modules"
                :class="['bg-gradient-to-b from-gray-50/50 to-gray-100 min-h-screen flex items-center py-20', contentMargin]">
                <div class="max-w-7xl mx-auto px-6 w-full">
                    <ModulesSection :formations="formations" :pending="pending" :error="error"
                        title="Les modules disponibles"
                        subtitle="Parcourez nos formations interactives pour renforcer vos compétences en cybersécurité ou autre sujets." />
                </div>
            </section>

        </div>
    </div>
</template>