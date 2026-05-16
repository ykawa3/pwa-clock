import { useRegisterSW } from 'virtual:pwa-register/react'
import { Box, Button, Typography, Slide } from '@mui/material'
import SystemUpdateIcon from '@mui/icons-material/SystemUpdate'

export default function UpdateBanner() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <Slide direction="down" in={needRefresh} mountOnEnter unmountOnExit>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1.5,
          px: 2,
          py: 1,
          bgcolor: 'primary.dark',
          boxShadow: 3,
        }}
      >
        <SystemUpdateIcon fontSize="small" sx={{ color: 'primary.contrastText' }} />
        <Typography variant="body2" sx={{ color: 'primary.contrastText', flex: 1 }}>
          新しいバージョンがあります
        </Typography>
        <Button
          size="small"
          variant="contained"
          color="primary"
          onClick={() => updateServiceWorker(true)}
          sx={{ whiteSpace: 'nowrap' }}
        >
          今すぐ更新
        </Button>
      </Box>
    </Slide>
  )
}
