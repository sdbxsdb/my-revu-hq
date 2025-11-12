import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import App from './App';
import './index.css';

// Configure Mantine theme for dark, modern design
const theme = createTheme({
  defaultRadius: 'md',
  primaryColor: 'teal',
  colorScheme: 'dark',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  headings: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    sizes: {
      h1: { fontSize: '2rem', lineHeight: '1.2', fontWeight: '700' },
      h2: { fontSize: '1.75rem', lineHeight: '1.3', fontWeight: '700' },
      h3: { fontSize: '1.5rem', lineHeight: '1.4', fontWeight: '600' },
    },
  },
  breakpoints: {
    xs: '30em', // 480px
    sm: '36em', // 576px
    md: '48em', // 768px
    lg: '62em', // 992px
    xl: '75em', // 1200px
  },
  shadows: {
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.5)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.6), 0 1px 2px -1px rgb(0 0 0 / 0.6)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.7), 0 2px 4px -2px rgb(0 0 0 / 0.7)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.8), 0 4px 6px -4px rgb(0 0 0 / 0.8)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.9), 0 8px 10px -6px rgb(0 0 0 / 0.9)',
  },
  colors: {
    dark: [
      '#C1C2C5',
      '#A6A7AB',
      '#909296',
      '#5c5f66',
      '#373A40',
      '#2C2E33',
      '#25262b',
      '#1A1B1E',
      '#141517',
      '#101113',
    ],
  },
  components: {
    Button: {
      defaultProps: {
        size: 'md',
        radius: 'md',
      },
      styles: {
        root: {
          fontWeight: 600,
          transition: 'all 0.2s ease',
        },
      },
    },
    Paper: {
      defaultProps: {
        p: 'md',
        radius: 'md',
        shadow: 'md',
        withBorder: true,
      },
      styles: {
        root: {
          backgroundColor: 'rgb(30 30 30)',
          border: '1px solid rgb(55 55 55)',
        },
      },
    },
    Title: {
      defaultProps: {
        order: 2,
      },
      styles: {
        root: {
          fontWeight: 700,
          color: 'rgb(255 255 255)',
        },
      },
    },
    TextInput: {
      defaultProps: {
        radius: 'md',
        size: 'md',
      },
      styles: {
        input: {
          backgroundColor: 'rgb(20 20 20)',
          borderColor: 'rgb(55 55 55)',
          color: 'rgb(255 255 255)',
          '&:focus': {
            borderColor: 'rgb(20 184 166)',
          },
        },
        label: {
          color: 'rgb(200 200 200)',
          fontWeight: 500,
          marginBottom: '0.5rem',
        },
      },
    },
    Select: {
      defaultProps: {
        radius: 'md',
        size: 'md',
      },
      styles: {
        input: {
          backgroundColor: 'rgb(20 20 20)',
          borderColor: 'rgb(55 55 55)',
          color: 'rgb(255 255 255)',
        },
        label: {
          color: 'rgb(200 200 200)',
          fontWeight: 500,
          marginBottom: '0.5rem',
        },
        dropdown: {
          backgroundColor: 'rgb(30 30 30)',
          border: '1px solid rgb(55 55 55)',
        },
        option: {
          backgroundColor: 'transparent',
          color: 'rgb(255 255 255)',
          '&:hover': {
            backgroundColor: 'rgb(40 40 40)',
          },
          '&[data-selected="true"]': {
            backgroundColor: 'rgb(20 184 166)',
            color: 'rgb(255 255 255)',
            '&:hover': {
              backgroundColor: 'rgb(20 184 166)',
            },
          },
        },
      },
    },
    Textarea: {
      defaultProps: {
        radius: 'md',
        size: 'md',
      },
      styles: {
        input: {
          backgroundColor: 'rgb(20 20 20)',
          borderColor: 'rgb(55 55 55)',
          color: 'rgb(255 255 255)',
          '&:focus': {
            borderColor: 'rgb(20 184 166)',
          },
        },
        label: {
          color: 'rgb(200 200 200)',
          fontWeight: 500,
          marginBottom: '0.5rem',
        },
      },
    },
    Badge: {
      defaultProps: {
        radius: 'md',
        size: 'md',
      },
    },
    Table: {
      styles: {
        root: {
          backgroundColor: 'transparent',
          '& thead tr th': {
            fontWeight: 600,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'rgb(156 163 175)',
            borderBottom: '1px solid rgb(55 55 55)',
            paddingBottom: '0.75rem',
            backgroundColor: 'transparent !important',
          },
          '& tbody tr': {
            backgroundColor: 'rgb(20 20 20) !important',
          },
          '& tbody tr:nth-of-type(even)': {
            backgroundColor: 'rgb(23 23 23) !important',
          },
          '& tbody tr td': {
            borderBottom: '1px solid rgb(40 40 40)',
            paddingTop: '1rem',
            paddingBottom: '1rem',
            backgroundColor: 'transparent !important',
          },
          '& tbody tr:hover': {
            backgroundColor: 'rgb(40 40 40) !important',
          },
        },
      },
    },
    Modal: {
      defaultProps: {
        radius: 'md',
        padding: 0,
        centered: true,
      },
      styles: {
        root: {
          // Mobile styles handled in CSS
        },
        header: {
          backgroundColor: 'rgb(30 30 30)',
          borderBottom: '1px solid rgb(55 55 55)',
          padding: '0.75rem 1rem',
        },
        title: {
          color: 'rgb(255 255 255)',
          fontWeight: 600,
          fontSize: '1rem',
        },
        body: {
          padding: '0.75rem',
        },
        content: {
          backgroundColor: 'rgb(30 30 30)',
          border: '1px solid rgb(55 55 55)',
          padding: 0,
        },
        close: {
          color: 'rgb(255 255 255)',
          '&:hover': {
            backgroundColor: 'rgb(40 40 40)',
          },
        },
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider theme={theme}>
      <Notifications position="top-center" />
      <App />
    </MantineProvider>
  </React.StrictMode>
);
