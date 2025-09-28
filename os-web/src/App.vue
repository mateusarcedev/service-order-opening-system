<template>
   <Navbar />
  <RouterView />
  <Sonner />
</template>

<script setup lang="ts">
import Navbar from '@/components/layout/Navbar.vue';
import Sonner from '@/components/ui/sonner/Sonner.vue';
</script>
