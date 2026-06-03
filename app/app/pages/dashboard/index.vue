<template>
  <DashboardLayout>
    <MemorialRoomsSection />
  </DashboardLayout>
</template>

<script setup>
import DashboardLayout from '../../components/dashboard/DashboardLayout.vue'
import MemorialRoomsSection from '../../components/dashboard/MemorialRoomsSection.vue'

definePageMeta({
  layout: 'default'
})
</script>
