<script lang="ts" setup>
import type { ToasterProps } from 'vue-sonner';
import { Toaster as Sonner } from 'vue-sonner';


const props = withDefaults(defineProps<ToasterProps>(), {
  position: 'top-right',
  richColors: true,
  closeButton: true,
  duration: 3500,
  expand: false,
  theme: 'light',
})
</script>

<template>
  <Sonner
    class="z-[9999] pointer-events-none [&_*]:pointer-events-auto"
    v-bind="props"
    :style="{
      '--normal-bg': 'var(--popover)',
      '--normal-text': 'var(--popover-foreground)',
      '--normal-border': 'var(--border)',
    }"
  />
</template>
