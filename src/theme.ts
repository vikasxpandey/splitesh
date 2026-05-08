import { createTheme, alpha } from '@mui/material'

const sharedTypography = {
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    h5: { fontWeight: 700, letterSpacing: '-0.02em' },
    h6: { fontWeight: 600, letterSpacing: '-0.01em' },
    subtitle2: {
        fontWeight: 500,
        letterSpacing: '0.02em',
        textTransform: 'uppercase' as const,
        fontSize: '0.7rem',
    },
}

const sharedShape = { borderRadius: 16 }

const sharedComponentBase = {
    MuiButton: {
        styleOverrides: {
            root: {
                textTransform: 'none' as const,
                fontWeight: 600,
                borderRadius: 12,
                padding: '8px 20px',
                transition: 'all 0.2s ease',
            },
            contained: {
                background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
                color: '#fff',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                '&:hover': {
                    background: 'linear-gradient(135deg, #3b82f6, #38bdf8)',
                    boxShadow: '0 6px 20px rgba(37, 99, 235, 0.45)',
                    transform: 'translateY(-1px)',
                },
            },
        },
    },
    MuiAvatar: {
        styleOverrides: {
            root: {
                background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
                fontWeight: 600,
                fontSize: '0.875rem',
            },
        },
    },
    MuiChip: {
        styleOverrides: {
            root: { borderRadius: 8, fontWeight: 500 },
        },
    },
    MuiIconButton: {
        styleOverrides: {
            root: {
                transition: 'all 0.2s ease',
                '&:hover': { transform: 'scale(1.1)' },
            },
        },
    },
    MuiListItemButton: {
        styleOverrides: {
            root: {
                borderRadius: 12,
                transition: 'all 0.2s ease',
                '&.Mui-selected': {
                    background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(14, 165, 233, 0.1))',
                    borderLeft: '3px solid #2563eb',
                    '&:hover': {
                        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.2), rgba(14, 165, 233, 0.15))',
                    },
                },
            },
        },
    },
    MuiSelect: {
        styleOverrides: {
            outlined: { borderRadius: 12 },
        },
    },
}

// ==================== DARK THEME ====================
export function createDarkTheme() {
    return createTheme({
        palette: {
            mode: 'dark',
            primary: { main: '#2563eb', light: '#60a5fa', dark: '#1d4ed8' },
            secondary: { main: '#14b8a6', light: '#2dd4bf', dark: '#0d9488' },
            background: { default: '#0f1419', paper: '#1a2332' },
            error: { main: '#f43f5e' },
            success: { main: '#10b981' },
            warning: { main: '#f59e0b' },
            text: { primary: '#f1f5f9', secondary: '#94a3b8' },
            divider: 'rgba(148, 163, 184, 0.08)',
        },
        shape: sharedShape,
        typography: {
            ...sharedTypography,
            body2: { color: '#94a3b8' },
        },
        components: {
            ...sharedComponentBase,
            MuiCssBaseline: {
                styleOverrides: {
                    body: { backgroundImage: 'none' },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        background: 'rgba(26, 35, 50, 0.6)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(148, 163, 184, 0.08)',
                        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2)',
                        transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                        '&:hover': { borderColor: 'rgba(37, 99, 235, 0.15)' },
                    },
                },
            },
            MuiButton: {
                styleOverrides: {
                    ...sharedComponentBase.MuiButton.styleOverrides,
                    outlined: {
                        borderColor: 'rgba(37, 99, 235, 0.3)',
                        color: '#60a5fa',
                        '&:hover': {
                            borderColor: 'rgba(37, 99, 235, 0.6)',
                            background: 'rgba(37, 99, 235, 0.08)',
                        },
                    },
                },
            },
            MuiDialog: {
                styleOverrides: {
                    paper: {
                        background: 'rgba(26, 35, 50, 0.95)',
                        backdropFilter: 'blur(24px)',
                        WebkitBackdropFilter: 'blur(24px)',
                        border: '1px solid rgba(148, 163, 184, 0.1)',
                        boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4)',
                    },
                },
            },
            MuiTextField: {
                styleOverrides: {
                    root: {
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 12,
                            '& fieldset': { borderColor: 'rgba(148, 163, 184, 0.15)' },
                            '&:hover fieldset': { borderColor: 'rgba(37, 99, 235, 0.4)' },
                            '&.Mui-focused fieldset': {
                                borderColor: '#2563eb',
                                boxShadow: `0 0 0 3px ${alpha('#2563eb', 0.15)}`,
                            },
                        },
                    },
                },
            },
            MuiAppBar: {
                styleOverrides: {
                    root: {
                        background: 'rgba(15, 20, 25, 0.9)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
                        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)',
                    },
                },
            },
            MuiDivider: {
                styleOverrides: {
                    root: { borderColor: 'rgba(148, 163, 184, 0.08)' },
                },
            },
            MuiTooltip: {
                styleOverrides: {
                    tooltip: {
                        background: 'rgba(26, 35, 50, 0.95)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(148, 163, 184, 0.1)',
                        borderRadius: 8,
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                    },
                },
            },
        },
    })
}

// ==================== LIGHT THEME ====================
export function createLightTheme() {
    return createTheme({
        palette: {
            mode: 'light',
            primary: { main: '#2563eb', light: '#60a5fa', dark: '#1d4ed8' },
            secondary: { main: '#14b8a6', light: '#2dd4bf', dark: '#0d9488' },
            background: { default: '#f4f6fb', paper: '#ffffff' },
            error: { main: '#ef4444' },
            success: { main: '#10b981' },
            warning: { main: '#f59e0b' },
            text: { primary: '#1e293b', secondary: '#64748b' },
            divider: 'rgba(100, 116, 139, 0.12)',
        },
        shape: sharedShape,
        typography: {
            ...sharedTypography,
            body2: { color: '#64748b' },
        },
        components: {
            ...sharedComponentBase,
            MuiCssBaseline: {
                styleOverrides: {
                    body: { backgroundImage: 'none' },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        background: 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(100, 116, 139, 0.1)',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0, 0, 0, 0.04)',
                        transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                        '&:hover': {
                            borderColor: 'rgba(37, 99, 235, 0.2)',
                            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06), 0 8px 24px rgba(37, 99, 235, 0.08)',
                        },
                    },
                },
            },
            MuiButton: {
                styleOverrides: {
                    ...sharedComponentBase.MuiButton.styleOverrides,
                    outlined: {
                        borderColor: 'rgba(37, 99, 235, 0.3)',
                        color: '#2563eb',
                        '&:hover': {
                            borderColor: 'rgba(37, 99, 235, 0.6)',
                            background: 'rgba(37, 99, 235, 0.05)',
                        },
                    },
                },
            },
            MuiDialog: {
                styleOverrides: {
                    paper: {
                        background: 'rgba(255, 255, 255, 0.98)',
                        backdropFilter: 'blur(24px)',
                        WebkitBackdropFilter: 'blur(24px)',
                        border: '1px solid rgba(100, 116, 139, 0.1)',
                        boxShadow: '0 24px 48px rgba(0, 0, 0, 0.12)',
                    },
                },
            },
            MuiTextField: {
                styleOverrides: {
                    root: {
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 12,
                            '& fieldset': { borderColor: 'rgba(100, 116, 139, 0.2)' },
                            '&:hover fieldset': { borderColor: 'rgba(37, 99, 235, 0.4)' },
                            '&.Mui-focused fieldset': {
                                borderColor: '#2563eb',
                                boxShadow: `0 0 0 3px ${alpha('#2563eb', 0.1)}`,
                            },
                        },
                    },
                },
            },
            MuiAppBar: {
                styleOverrides: {
                    root: {
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(244, 246, 251, 0.9))',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        borderBottom: '1px solid rgba(100, 116, 139, 0.1)',
                        boxShadow: '0 1px 8px rgba(0, 0, 0, 0.05)',
                        color: '#1e293b',
                    },
                },
            },
            MuiListItemButton: {
                styleOverrides: {
                    ...sharedComponentBase.MuiListItemButton.styleOverrides,
                    root: {
                        ...sharedComponentBase.MuiListItemButton.styleOverrides.root,
                        '&:hover': {
                            background: 'rgba(99, 102, 241, 0.04)',
                        },
                    },
                },
            },
            MuiDivider: {
                styleOverrides: {
                    root: { borderColor: 'rgba(100, 116, 139, 0.1)' },
                },
            },
            MuiTooltip: {
                styleOverrides: {
                    tooltip: {
                        background: 'rgba(30, 41, 59, 0.95)',
                        borderRadius: 8,
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                    },
                },
            },
        },
    })
}
