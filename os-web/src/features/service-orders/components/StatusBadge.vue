<script setup lang="ts">
const props = defineProps<{ status: 'OPEN' | 'IN_PROGRESS' | 'DONE' }>()
const map = {
  OPEN: { text: 'OPEN', cls: 'bg-gray-100 text-gray-800 border-gray-200' },
  IN_PROGRESS: { text: 'IN_PROGRESS', cls: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  DONE: { text: 'DONE', cls: 'bg-green-100 text-green-800 border-green-200' },
} as const
</script>

<template>
    <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border" :class="map[props.status].cls">
      {{ map[props.status].text }}
  </span>
</template>
