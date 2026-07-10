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
  },
}

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'jjtechTheme',
    themes: {
      jjtechTheme,
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
