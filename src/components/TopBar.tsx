import { Box, Container, IconButton, Stack, Typography } from '@mui/material'
import { DarkMode, LightMode } from '@mui/icons-material'
import { useThemeMode } from '../ThemeContext'

export function TopBar() {
  const { mode, toggleMode } = useThemeMode()
  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid',
        borderColor: 'divider',
        background: mode === 'dark' ? 'rgba(15, 20, 25, 0.85)' : 'rgba(244, 246, 251, 0.85)',
      }}
    >
      <Container maxWidth="sm">
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ py: 1.5, px: { xs: 0.5, sm: 0 } }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography sx={{ fontSize: '1.25rem' }}>💸</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
              Splitesh
            </Typography>
          </Stack>
          <IconButton onClick={toggleMode} size="small" sx={{ color: 'text.secondary' }}>
            {mode === 'dark' ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
          </IconButton>
        </Stack>
      </Container>
    </Box>
  )
}
