<script setup>
import GenericFormation from '~/components/formation/GenericFormation.vue';

const route = useRoute();
const moduleId = route.params.id;
</script>

<template>
    <GenericFormation :moduleId="moduleId" />
</template>
