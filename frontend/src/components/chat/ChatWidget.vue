<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { newChatId, runChatQuery } from '@/api/chat'
import { ApiError } from '@/api/client'

interface ChatMessage {
  role: 'user' | 'bot' | 'error'
  text: string
  sql?: string
}

const open = ref(false)
const messages = ref<ChatMessage[]>([])
const question = ref('')
const loading = ref(false)
const chatId = newChatId()
const scrollEl = ref<HTMLElement | null>(null)

const toggle = () => {
  open.value = !open.value
}

const scrollToBottom = async () => {
  await nextTick()
  scrollEl.value?.scrollTo({ top: scrollEl.value.scrollHeight, behavior: 'smooth' })
}

const send = async () => {
  const text = question.value.trim()
  if (!text || loading.value) return
  messages.value.push({ role: 'user', text })
  question.value = ''
  loading.value = true
  await scrollToBottom()
  try {
    const result = await runChatQuery(text, chatId)
    messages.value.push({ role: 'bot', text: result.Bot ?? '답변을 받지 못했습니다.', sql: result.SQL })
  } catch (e) {
    messages.value.push({
      role: 'error',
      text: e instanceof ApiError ? e.message : '요청 처리 중 오류가 발생했습니다.',
    })
  } finally {
    loading.value = false
    await scrollToBottom()
  }
}
</script>

<template>
  <v-btn
    v-if="!open"
    class="chat-fab"
    icon
    size="x-large"
    color="primary"
    elevation="8"
    @click="toggle"
  >
    <v-icon size="30">mdi-robot-excited</v-icon>
  </v-btn>

  <v-card v-else class="chat-panel d-flex flex-column" elevation="10">
    <div class="d-flex align-center pa-3" style="gap: 10px; background: rgb(var(--v-theme-primary)); color: #fff">
      <v-avatar size="36" color="white">
        <v-icon color="primary">mdi-robot-excited</v-icon>
      </v-avatar>
      <div class="flex-grow-1">
        <div class="text-subtitle-1 font-weight-bold">AI 어시스턴트</div>
        <div class="text-caption">우리 ERP 데이터로 답변합니다</div>
      </div>
      <v-btn icon variant="text" color="white" size="small" @click="toggle">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </div>

    <div ref="scrollEl" class="chat-messages flex-grow-1 pa-3">
      <div v-if="messages.length === 0" class="text-center text-medium-emphasis text-body-2 pa-6">
        궁금한 걸 물어보세요. 예: "이번달 신규 수주가 몇 건이야?"
      </div>
      <template v-for="(m, i) in messages" :key="i">
        <div v-if="m.role === 'user'" class="d-flex justify-end mb-3">
          <div class="bubble bubble-user">{{ m.text }}</div>
        </div>
        <div v-else class="d-flex align-start mb-3" style="gap: 8px">
          <v-avatar size="28" color="primary">
            <v-icon size="16" color="white">mdi-robot-excited</v-icon>
          </v-avatar>
          <div>
            <div class="bubble" :class="m.role === 'error' ? 'bubble-error' : 'bubble-bot'">{{ m.text }}</div>
            <v-expansion-panels v-if="m.sql" class="mt-1" density="compact">
              <v-expansion-panel>
                <v-expansion-panel-title class="text-caption">조회에 사용된 SQL 보기</v-expansion-panel-title>
                <v-expansion-panel-text>
                  <pre class="text-caption sql-block">{{ m.sql }}</pre>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </div>
        </div>
      </template>
      <div v-if="loading" class="d-flex align-center text-medium-emphasis text-caption" style="gap: 8px">
        <v-progress-circular size="16" width="2" indeterminate color="primary" />
        답변 생성 중...
      </div>
    </div>

    <div class="d-flex align-center pa-2" style="gap: 8px; border-top: 1px solid rgb(var(--v-theme-borderColor))">
      <v-text-field
        v-model="question"
        placeholder="질문을 입력하세요"
        variant="outlined"
        density="comfortable"
        hide-details
        :disabled="loading"
        @keyup.enter="send"
      />
      <v-btn icon color="primary" :loading="loading" :disabled="!question.trim()" @click="send">
        <v-icon>mdi-send</v-icon>
      </v-btn>
    </div>
  </v-card>
</template>

<style scoped>
.chat-fab {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 2000;
}
.chat-panel {
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 380px;
  height: 560px;
  max-height: calc(100vh - 48px);
  z-index: 2000;
  overflow: hidden;
}
.chat-messages {
  overflow-y: auto;
}
.bubble {
  display: inline-block;
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 0.9rem;
  white-space: pre-wrap;
  max-width: 260px;
}
.bubble-user {
  background: rgb(var(--v-theme-primary));
  color: #fff;
  border-bottom-right-radius: 2px;
}
.bubble-bot {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgb(var(--v-theme-borderColor));
  border-bottom-left-radius: 2px;
}
.bubble-error {
  background: rgb(var(--v-theme-error));
  color: #fff;
  border-bottom-left-radius: 2px;
}
.sql-block {
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
