<script setup>
const route = useRoute();
</script>


<template>
  <div class="flex flex-col min-h-screen">
    <!-- Main content area -->
    <div class="flex-1">
      <NuxtPage />
    </div>

    <!--Footer container-->
    <footer v-if="route.path !== '/administration'"
      class="text-center text-surface bg-green-700 text-white mt-auto transition-all duration-300 z-50 relative">
      <!--Sign-up form section-->
      <div class="px-6 pt-6">
        <form>
          <div class="flex items-center justify-center gap-4 md:grid-cols-3">
            <div class="items-center">
              <p class="text-sm">
                En cas de problème, contactez le support en allant ici : <strong><a
                    href="https://informatique.gbna-sante.fr/">https://informatique.gbna-sante.fr/</a></strong>
              </p>
            </div>
          </div>
        </form>
      </div>

      <!--Copyright section-->
      <div class="bg-green-800/5 p-4 text-center">
        DSIH - GBNA Santé
      </div>
    </footer>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&display=swap');

html,
body {
  font-family: "Google Sans", sans-serif;
  font-optical-sizing: auto;
  font-style: normal;
  font-weight: 400;
  scroll-behavior: smooth;
  height: 100%;
  margin: 0;
  /* Force light mode */
  color-scheme: light only;
  color: #1f2937;
}

/* Désactiver le mode sombre même si le système le préfère */
html.dark {
  color-scheme: light only;
  background-color: #ffffff;
  color: #1f2937;
}

#__nuxt {
  height: 100%;
}

header {
  background: linear-gradient(180deg, #ffffff 0%, rgba(255, 255, 255, 0) 100%);
  border-radius: 10px;
  width: 80%;
  box-shadow: 0px 0px 25.100000381469727px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 20px;
  height: 85px;
}
</style>
