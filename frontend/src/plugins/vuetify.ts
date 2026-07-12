import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify, type ThemeDefinition } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// reference/front-end-main utils/theme/LightTheme.ts BLUE_THEME 색상 이식
const jjtechTheme: ThemeDefinition = {
  dark: false,
  colors: {
    primary: '#1e88e5',
    secondary: '#0cb9c5',
    info: '#539BFF',
    success: '#13DEB9',
    warning: '#FFAE1F',
    error: '#FA896B',
    background: '#eef5f9',
    surface: '#ffffff',
    textSecondary: '#2A3547',
    borderColor: '#e5eaef',
  },
}

// reference/front-end-main utils/theme/DarkTheme.ts DARK_BLUE_THEME 색상 이식
const jjtechDarkTheme: ThemeDefinition = {
  dark: true,
  colors: {
    primary: '#1e88e5',
    secondary: '#0cb9c5',
    info: '#539BFF',
    success: '#13DEB9',
    warning: '#FFAE1F',
    error: '#FA896B',
    background: '#2a3447',
    surface: '#2a3447',
    textSecondary: '#7C8FAC',
    borderColor: '#333F55',
  },
}

// 공장 키오스크(현장 터치스크린) 전용 — 사무실 테마와 별개로, 산업용 MES/HMI에
// 흔한 다크 배경 + 고대비 신호등 색상(초록=진행, 주황=대기, 빨강=중지/오류) 조합.
const jjtechKioskTheme: ThemeDefinition = {
  dark: true,
  colors: {
    primary: '#0ea5e9',
    secondary: '#38bdf8',
    info: '#0ea5e9',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    background: '#0f1419',
    surface: '#1a2332',
    textSecondary: '#94a3b8',
    borderColor: '#2e3b52',
  },
}

export const THEME_LIGHT = 'jjtechTheme'
export const THEME_DARK = 'jjtechDarkTheme'
export const THEME_KIOSK = 'jjtechKioskTheme'

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: THEME_LIGHT,
    themes: {
      jjtechTheme,
      jjtechDarkTheme,
      jjtechKioskTheme,
    },
  },
  defaults: {
    VCard: {
      rounded: 'md',
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary',
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary',
    },
  },
})
