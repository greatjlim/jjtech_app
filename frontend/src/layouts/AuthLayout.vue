<template>
  <v-app>
    <v-row no-gutters class="auth-bg">
      <v-col cols="12" lg="7" class="d-none d-lg-flex align-center justify-center auth-visual">
        <div class="text-center px-8">
          <div class="text-h3 font-weight-bold font-italic text-white">JJTech</div>
          <div class="text-subtitle-1 text-white mt-2" style="opacity: 0.85">
            업무를 더 스마트하게
          </div>
        </div>
      </v-col>
      <v-col cols="12" lg="5" class="d-flex align-center justify-center bg-surface">
        <div class="pa-8" style="width: 100%; max-width: 420px">
          <slot />
        </div>
      </v-col>
    </v-row>
  </v-app>
</template>

<style scoped>
.auth-bg {
  min-height: 100vh;
}
.auth-visual {
  background: radial-gradient(circle at 30% 30%, #1e88e5, #123a63 75%);
}
</style>
