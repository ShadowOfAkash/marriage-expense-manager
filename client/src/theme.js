import { extendTheme } from '@chakra-ui/react'

const theme = extendTheme({
  fonts: {
    heading: "'Inter', 'Segoe UI', system-ui, sans-serif",
    body:    "'Inter', 'Segoe UI', system-ui, sans-serif",
  },

  // ── Elegant Wedding Palette ─────────────────────────────────────────────
  colors: {
    brand: {
      50:  '#FDF4F9',
      100: '#FAE3F2',
      200: '#F5C0E3',
      300: '#EF90CC',
      400: '#E55EAF',
      500: '#D63A92',
      600: '#BE185D',   // primary action
      700: '#9B1249',
      800: '#7A0E38',
      900: '#5C0A2A',
    },
    gold: {
      50:  '#FFFBF0',
      100: '#FEF3D0',
      200: '#FCE49E',
      300: '#F9CE6A',
      400: '#F5B533',
      500: '#E09913',   // champagne gold
      600: '#C07D0A',
      700: '#9B6208',
      800: '#7A4C07',
      900: '#5C3805',
    },
    plum: {
      50:  '#F7F3FA',
      100: '#EDE5F5',
      200: '#D8C8EB',
      300: '#BFA4DC',
      400: '#A07CC8',
      500: '#7F55B0',
      600: '#643994',   // deep plum accent
      700: '#4E2A76',
      800: '#3A1E58',
      900: '#27143B',
    },
    surface: {
      bg:     '#FDFAF7',   // warm cream background
      card:   '#FFFFFF',
      border: '#F0E8F0',
    },
  },

  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },

  styles: {
    global: {
      body: {
        bg:    '#FDFAF7',
        color: '#1C1125',
      },
      '*': { boxSizing: 'border-box' },
    },
  },

  shadows: {
    card:  '0 2px 12px rgba(190,24,93,0.07)',
    hover: '0 8px 30px rgba(190,24,93,0.13)',
  },

  components: {
    Card: {
      baseStyle: {
        container: {
          borderRadius: '18px',
          overflow: 'hidden',
          bg: 'white',
        },
      },
    },
    Button: {
      defaultProps: { colorScheme: 'brand' },
      baseStyle: { fontWeight: 600, borderRadius: '10px' },
    },
    Badge: {
      baseStyle: { borderRadius: '6px', fontWeight: 600 },
    },
  },
})

export default theme
