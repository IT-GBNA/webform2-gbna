<script setup>
import { ref } from 'vue';
import institutionsData from '../../../../public/etab.json';
import servicesData from '../../../../public/services.json';

const props = defineProps({
    formationTitle: {
        type: String,
        default: ''
    }
});

const emit = defineEmits(['submit']);

const formData = ref({
    firstName: '',
    lastName: '',
    institution: '',
    service: ''
});

const errors = ref({
    firstName: '',
    lastName: '',
    institution: ''
});

const showErrors = ref(false);

const validateInput = (field) => {
    const regex = /[^a-zA-ZÀ-ÿ\s-]/g;
    if (regex.test(formData.value[field])) {
        errors.value[field] = 'Les caractères spéciaux ne sont pas autorisés.';
    } else {
        errors.value[field] = '';
    }
};

const validateForm = () => {
    const { firstName, lastName, institution, service } = formData.value;
    return firstName && lastName && institution && service;
};

const handleSubmit = () => {
    if (validateForm()) {
        showErrors.value = false;
        emit('submit', formData.value);
    } else {
        showErrors.value = true;
    }
};
</script>

<template>
    <div class="min-h-screen flex items-center justify-center p-8">
        <div class="w-5/12 px-5 bg-gradient-to-tr from-zinc-200/50 via-zinc-50/25 to-zinc-200/50 
            rounded-2xl mb-4 pb-1.5 border-1 border-slate-200 shadow-md">
            <h2 class="text-3xl font-bold text-gray-800 mt-6 p-2 text-center">
                <p class="pb-2 bg-gradient-to-r from-green-700 via-green-500 to-green-700 
                    bg-clip-text text-transparent">
                    {{
                        formationTitle ? ` ${formationTitle}` : "Formulaire d'inscription" }}</p>

            </h2>
            <div class="flex flex-col space-y-4 p-6 items-center justify-center">
                <!-- Prénom -->
                <input v-model="formData.firstName" @input="validateInput('firstName')" type="text" placeholder="Prénom"
                    class="px-4 py-3 bg-white border border-gray-300 rounded-lg w-8/12">
                <div v-if="errors.firstName" class="text-red-500">{{ errors.firstName }}</div>

                <!-- Nom -->
                <input v-model="formData.lastName" @input="validateInput('lastName')" type="text" placeholder="Nom"
                    class="px-4 py-3 bg-white border border-gray-300 rounded-lg w-8/12">
                <div v-if="errors.lastName" class="text-red-500">{{ errors.lastName }}</div>

                <!-- Établissement -->
                <select v-model="formData.institution"
                    class="px-4 py-3 bg-white border border-gray-300 rounded-lg w-8/12">
                    <option value="" disabled selected>Choisissez votre établissement</option>
                    <option v-for="institution in institutionsData" :key="institution.name" :value="institution.name">
                        {{ institution.name }}
                    </option>
                </select>

                <!-- Services -->
                <select v-model="formData.service"
                    class="px-4 py-3 mb-6 bg-white border border-gray-300 rounded-lg w-8/12">
                    <option value="" disabled selected>Choisissez votre service</option>
                    <option v-for="service in servicesData" :key="service.name" :value="service.name">
                        {{ service.name }}
                    </option>
                </select>

                <button @click="handleSubmit" class="p-4 bg-gradient-to-r from-green-700/75 via-green-600/90 to-green-700/75 text-white font-semibold transition-all 
                    duration-200 rounded-lg hover:bg-green-700 w-5/12 cursor-pointer border-1 border-green-600">
                    Commencer le module
                </button>

                <div v-if="showErrors" class="text-red-500">
                    Veuillez remplir tous les champs obligatoires
                </div>
            </div>
        </div>
    </div>
</template>
