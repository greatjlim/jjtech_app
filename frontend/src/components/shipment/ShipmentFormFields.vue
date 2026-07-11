<script setup lang="ts">
import { computed, ref } from 'vue'
import LabelWithElement from '@/components/LabelWithElement.vue'
import ShipmentLineAddDialog from './ShipmentLineAddDialog.vue'
import ShipmentLineEditDialog from './ShipmentLineEditDialog.vue'
import type { ShipmentFormLine, ShipmentFormState } from '@/api/shipment'

withDefaults(
  defineProps<{
    readonly?: boolean
  }>(),
  { readonly: false },
)

const form = defineModel<ShipmentFormState>({ required: true })

const showAddDialog = ref(false)
const showEditDialog = ref(false)
const editingIndex = ref(-1)
const editingLine = computed<ShipmentFormLine | null>(() =>
  editingIndex.value >= 0 ? form.value.items[editingIndex.value] : null,
)

const totalWeight = computed(() => form.value.items.reduce((sum, line) => sum + (line.ship_weight || 0), 0))

const addLine = (line: ShipmentFormLine) => {
  form.value.items.push(line)
}

const editLine = (index: number) => {
  editingIndex.value = index
  showEditDialog.value = true
}

const saveLine = (line: ShipmentFormLine) => {
  if (editingIndex.value >= 0) {
    form.value.items.splice(editingIndex.value, 1, line)
  }
}

const removeLine = (index: number) => {
  form.value.items.splice(index, 1)
}
</script>

<template>
  <v-row>
    <v-col cols="12" md="4">
      <LabelWithElement title="출고일자" required>
        <v-text-field v-model="form.shipment_date" type="date" :disabled="readonly" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="4">
      <LabelWithElement title="차량번호">
        <v-text-field v-model="form.vehicle_no" :disabled="readonly" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="4">
      <LabelWithElement title="차량구분">
        <v-text-field v-model="form.vehicle_type" :disabled="readonly" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="4">
      <LabelWithElement title="운반비">
        <v-text-field v-model.number="form.freight_cost" type="number" :disabled="readonly" suffix="원" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="4">
      <LabelWithElement title="출하지">
        <v-text-field v-model="form.dispatch_location" :disabled="readonly" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="4">
      <LabelWithElement title="총출고중량">
        <v-text-field :model-value="totalWeight.toLocaleString()" readonly suffix="kg" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12">
      <LabelWithElement title="비고">
        <v-textarea v-model="form.remark" :disabled="readonly" />
      </LabelWithElement>
    </v-col>
  </v-row>

  <v-divider class="my-4" />
  <div class="d-flex align-center justify-space-between mb-2">
    <h6 class="text-h6">출고상세</h6>
    <v-btn v-if="!readonly" color="primary" variant="text" prepend-icon="mdi-plus" @click="showAddDialog = true">
      라인 추가
    </v-btn>
  </div>
  <v-table density="comfortable">
    <thead>
      <tr>
        <th>거래처</th>
        <th>품명</th>
        <th>형번</th>
        <th>규격</th>
        <th>색상</th>
        <th>재질</th>
        <th>열처리방법</th>
        <th>출고수량</th>
        <th>출고중량</th>
        <th v-if="!readonly" />
      </tr>
    </thead>
    <tbody>
      <tr v-for="(line, index) in form.items" :key="index" style="cursor: pointer" @click="!readonly && editLine(index)">
        <td>{{ line.customer_name }}</td>
        <td>{{ line.item_name }}</td>
        <td>{{ line.mold_model }}</td>
        <td>{{ line.spec }}</td>
        <td>{{ line.color }}</td>
        <td>{{ line.material }}</td>
        <td>{{ line.heat_treatment }}</td>
        <td>{{ line.ship_qty }}</td>
        <td>{{ line.ship_weight }}</td>
        <td v-if="!readonly">
          <v-btn icon size="small" variant="plain" @click.stop="removeLine(index)">
            <v-icon color="error">mdi-delete</v-icon>
          </v-btn>
        </td>
      </tr>
      <tr v-if="form.items.length === 0">
        <td colspan="10" class="text-center text-medium-emphasis">등록된 라인이 없습니다</td>
      </tr>
    </tbody>
  </v-table>

  <ShipmentLineAddDialog v-model="showAddDialog" @add="addLine" />
  <ShipmentLineEditDialog v-model="showEditDialog" :line="editingLine" @save="saveLine" />
</template>
