import { createContext, useContext, useState, useMemo, useEffect, type ReactNode } from 'react'
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material'
import { createDarkTheme, createLightTheme } from './theme'

type ThemeMode = 'light' | 'dark'

type ThemeContextType = {
    mode: ThemeMode
    toggleMode: () => void
}

const ThemeContext = createContext<ThemeContextType>({
    mode: 'dark',
    toggleMode: () => { },
})

export function useThemeMode() {
    return useContext(ThemeContext)
}

function getInitialMode(): ThemeMode {
    if (typeof window === 'undefined') return 'dark'
    const stored = localStorage.getItem('splitesh_theme')
    if (stored === 'light' || stored === 'dark') return stored
    return 'dark'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [mode, setMode] = useState<ThemeMode>(getInitialMode)

    const toggleMode = () => {
        setMode((prev) => {
            const next = prev === 'dark' ? 'light' : 'dark'
            localStorage.setItem('splitesh_theme', next)
            return next
        })
    }

    useEffect(() => {
        document.body.setAttribute('data-theme', mode)
    }, [mode])

    const theme = useMemo(
        () => (mode === 'dark' ? createDarkTheme() : createLightTheme()),
        [mode],
    )

    const contextValue = useMemo(() => ({ mode, toggleMode }), [mode])

    return (
        <ThemeContext.Provider value={contextValue}>
            <MuiThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </MuiThemeProvider>
        </ThemeContext.Provider>
    )
}
