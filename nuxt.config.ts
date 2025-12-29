// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2024-11-01',
    devtools: { enabled: true },
    srcDir: 'app/',

    css: ['~/assets/css/main.css'],

    modules: ['@nuxt/ui'],

    colorMode: {
        preference: 'light',
        fallback: 'light',
        classSuffix: '',
    },

    runtimeConfig: {
        mongodbUri: process.env.MONGODB_URI,
        jwtSecret: process.env.AUTH_SECRET,
    },

    app: {
        head: {
            title: 'GBNA Santé - Formation Cybersécurité',
            meta: [
                { charset: 'utf-8' },
                { name: 'viewport', content: 'width=device-width, initial-scale=1' },
                { name: 'description', content: 'Plateforme de formation à la cybersécurité pour les professionnels de santé' }
            ],
            link: [
                { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
                { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
                { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
                { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap' }
            ]
        }
    }
})
