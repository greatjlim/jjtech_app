<script setup lang="ts">
import { ref, watch } from 'vue'
import { ITEM_GROUP_ROOT, getItemGroupAncestors, listItemGroupChildren, type ItemGroupNode } from '@/api/itemGroup'

const props = defineProps<{
  initialValue?: string
}>()

const show = defineModel<boolean>({ default: false })
const emit = defineEmits<{ select: [value: string, label: string] }>()

const majorOptions = ref<ItemGroupNode[]>([])
const middleOptions = ref<ItemGroupNode[]>([])
const minorOptions = ref<ItemGroupNode[]>([])

const selectedMajor = ref<ItemGroupNode | null>(null)
const selectedMiddle = ref<ItemGroupNode | null>(null)
const selectedMinor = ref<ItemGroupNode | null>(null)

const reset = async () => {
  majorOptions.value = await listItemGroupChildren(ITEM_GROUP_ROOT)
  middleOptions.value = []
  minorOptions.value = []
  selectedMajor.value = null
  selectedMiddle.value = null
  selectedMinor.value = null

  if (props.initialValue) {
    const path = await getItemGroupAncestors(props.initialValue)
    if (path[0]) {
      selectedMajor.value = path[0]
      middleOptions.value = await listItemGroupChildren(path[0].name)
    }
    if (path[1]) {
      selectedMiddle.value = path[1]
      minorOptions.value = await listItemGroupChildren(path[1].name)
    }
    if (path[2]) {
      selectedMinor.value = path[2]
    }
  }
}

watch(show, (v) => {
  if (v) reset()
})

const pickLabel = (path: (ItemGroupNode | null)[]) =>
  path
    .filter((n): n is ItemGroupNode => !!n)
    .map((n) => n.item_group_name)
    .join(' > ')

const chooseMajor = async (node: ItemGroupNode) => {
  selectedMajor.value = node
  selectedMiddle.value = null
  selectedMinor.value = null
  minorOptions.value = []
  if (node.is_group) {
    middleOptions.value = await listItemGroupChildren(node.name)
  } else {
    middleOptions.value = []
    emit('select', node.name, pickLabel([node]))
    show.value = false
  }
}

const chooseMiddle = async (node: ItemGroupNode) => {
  selectedMiddle.value = node
  selectedMinor.value = null
  if (node.is_group) {
    minorOptions.value = await listItemGroupChildren(node.name)
  } else {
    minorOptions.value = []
    emit('select', node.name, pickLabel([selectedMajor.value, node]))
    show.value = false
  }
}

const chooseMinor = (node: ItemGroupNode) => {
  selectedMinor.value = node
  emit('select', node.name, pickLabel([selectedMajor.value, selectedMiddle.value, node]))
  show.value = false
}
</script>

<template>
  <v-dialog v-model="show" max-width="800">
    <v-card class="pa-4">
      <v-card-title class="text-h6">분류 선택</v-card-title>
      <v-card-text>
        <v-row dense>
          <v-col cols="4">
            <div class="text-caption text-medium-emphasis mb-1">대분류</div>
            <v-list density="compact" class="classification-list">
              <v-list-item
                v-for="node in majorOptions"
                :key="node.name"
                :active="selectedMajor?.name === node.name"
                color="primary"
                @click="chooseMajor(node)"
              >
                {{ node.item_group_name }}
              </v-list-item>
            </v-list>
          </v-col>
          <v-col cols="4">
            <div class="text-caption text-medium-emphasis mb-1">중분류</div>
            <v-list density="compact" class="classification-list">
              <v-list-item
                v-for="node in middleOptions"
                :key="node.name"
                :active="selectedMiddle?.name === node.name"
                color="primary"
                @click="chooseMiddle(node)"
              >
                {{ node.item_group_name }}
              </v-list-item>
            </v-list>
          </v-col>
          <v-col cols="4">
            <div class="text-caption text-medium-emphasis mb-1">소분류</div>
            <v-list density="compact" class="classification-list">
              <v-list-item
                v-for="node in minorOptions"
                :key="node.name"
                :active="selectedMinor?.name === node.name"
                color="primary"
                @click="chooseMinor(node)"
              >
                {{ node.item_group_name }}
              </v-list-item>
            </v-list>
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="show = false">닫기</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.classification-list {
  max-height: 320px;
  overflow-y: auto;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
}
</style>
