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

export const THEME_LIGHT = 'jjtechTheme'
export const THEME_DARK = 'jjtechDarkTheme'

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: THEME_LIGHT,
    themes: {
      jjtechTheme,
      jjtechDarkTheme,
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
