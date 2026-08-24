import { extendTheme } from '@chakra-ui/react'

const theme = extendTheme({
  fonts: {
    heading: "'Inter', 'Segoe UI', system-ui, sans-serif",
    body:    "'Inter', 'Segoe UI', system-ui, sans-serif",
  },

  // ── Professional Fintech Palette ─────────────────────────────────────────────
  colors: {
    brand: {
      50:  '#f0f5ff',
      100: '#abd2fa', // Light Blue
      200: '#8ebaff',
      300: '#7692ff', // Soft Blue
      400: '#4a6cf8',
      500: '#1b2cc1', // Vibrant Blue (Primary)
      600: '#1524a8',
      700: '#101a85',
      800: '#0c1566',
      900: '#091540', // Dark Navy
    },
    surface: {
      bg:     '#F8FAFC',   // clean light gray/blue background
      card:   '#FFFFFF',
      border: '#E2E8F0',
    },
  },

  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },

  styles: {
    global: {
      body: {
        bg:    '#F8FAFC',
        color: '#0F172A',
      },
      '*': { boxSizing: 'border-box' },
    },
  },

  shadows: {
    card:  '0 2px 12px rgba(9, 21, 64, 0.05)',
    hover: '0 8px 30px rgba(27, 44, 193, 0.12)',
  },

  components: {
    Card: {
      baseStyle: {
        container: {
          borderRadius: '16px',
          overflow: 'hidden',
          bg: 'white',
          border: '1px solid',
          borderColor: 'gray.100',
          shadow: '0 2px 12px rgba(9, 21, 64, 0.05)',
        },
      },
    },
    Button: {
      defaultProps: { colorScheme: 'brand' },
      baseStyle: { fontWeight: 600, borderRadius: '8px' },
    },
    Badge: {
      baseStyle: { borderRadius: '6px', fontWeight: 600 },
    },
  },
})

export default theme
