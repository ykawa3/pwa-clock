import { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  FormControlLabel,
  Switch,
  TextField,
  Button,
  Divider,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import RefreshIcon from '@mui/icons-material/Refresh'
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import type { DisplaySize } from '../context/SettingsContext'
import { usePwaUpdate } from '../hooks/usePwaUpdate'
import type { UpdateCheckResult } from '../hooks/usePwaUpdate'

export default function Settings() {
  const navigate = useNavigate()
  const { settings, updateSetting } = useSettings()
  const { checking, checkForUpdate, clearCacheAndReload } = usePwaUpdate()

  // キャッシュクリア確認ダイアログ
  const [clearDialogOpen, setClearDialogOpen] = useState(false)
  // スナックバー
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'info' | 'error' }>({
    open: false, message: '', severity: 'info',
  })

  const handleCheckUpdate = async () => {
    const result: UpdateCheckResult = await checkForUpdate()
    switch (result) {
      case 'update-found':
        setSnackbar({ open: true, message: '新しいバージョンが見つかりました。ページをリロードして更新してください。', severity: 'info' })
        break
      case 'up-to-date':
        setSnackbar({ open: true, message: '最新バージョンです ✓', severity: 'success' })
        break
      case 'no-sw':
        setSnackbar({ open: true, message: 'Service Worker が登録されていません（開発環境では無効です）', severity: 'info' })
        break
      case 'error':
        setSnackbar({ open: true, message: '更新チェックに失敗しました', severity: 'error' })
        break
    }
  }

  const handleClearCache = async () => {
    setClearDialogOpen(false)
    await clearCacheAndReload()
  }

  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', p: 2, gap: 1 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')}>
          ダッシュボード
        </Button>
        <Typography variant="h6" sx={{ ml: 1 }}>
          設定
        </Typography>
      </Box>

      <Box sx={{ flex: 1, px: 2, pb: 4, maxWidth: 480, width: '100%', mx: 'auto' }}>
        <Stack spacing={2}>
          {/* 時計設定 */}
          <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
              時計
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.show24Hour}
                  onChange={e => updateSetting('show24Hour', e.target.checked)}
                />
              }
              label="24時間表記"
            />
            <Divider sx={{ my: 1 }} />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.showSeconds}
                  onChange={e => updateSetting('showSeconds', e.target.checked)}
                />
              }
              label="秒を表示"
            />
          </Paper>

          {/* 表示サイズ */}
          <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
              表示サイズ
            </Typography>
            <ToggleButtonGroup
              value={settings.displaySize}
              exclusive
              onChange={(_, v: DisplaySize | null) => v && updateSetting('displaySize', v)}
              size="small"
            >
              <ToggleButton value="small">小</ToggleButton>
              <ToggleButton value="medium">中</ToggleButton>
              <ToggleButton value="large">大</ToggleButton>
            </ToggleButtonGroup>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              フォント・アイコン・間隔のサイズを変更します
            </Typography>
          </Paper>

          {/* ウィジェット表示 */}
          <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
              ウィジェット表示
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.showCalendar}
                  onChange={e => updateSetting('showCalendar', e.target.checked)}
                />
              }
              label="カレンダー"
            />
            <Divider sx={{ my: 1 }} />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.showWeather}
                  onChange={e => updateSetting('showWeather', e.target.checked)}
                />
              }
              label="天気予報"
            />
          </Paper>

          {/* ディスプレイ設定 */}
          <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
              ディスプレイ
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.keepAwake}
                  onChange={e => updateSetting('keepAwake', e.target.checked)}
                />
              }
              label="スリープを無効にする"
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              画面を常時点灯させます（対応ブラウザのみ）
            </Typography>
          </Paper>

          {/* 天気 API 設定 */}
          <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 0.5, fontWeight: 600 }}>
              天気 API 設定
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.useApiKey}
                  onChange={e => updateSetting('useApiKey', e.target.checked)}
                />
              }
              label="OpenWeatherMap API キーを使用する"
            />
            {settings.useApiKey && (
              <>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                  天気予報の表示に必要です。openweathermap.org で無料取得できます。
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="password"
                  placeholder="APIキーを入力"
                  value={settings.weatherApiKey}
                  onChange={e => updateSetting('weatherApiKey', e.target.value)}
                />
              </>
            )}
          </Paper>

          {/* アプリ情報 */}
          <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
              アプリ情報
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              バージョン: {__APP_VERSION__}
            </Typography>
            <Stack direction="row" spacing={1.5}>
              <Button
                variant="outlined"
                size="small"
                startIcon={checking ? <CircularProgress size={16} /> : <RefreshIcon />}
                onClick={handleCheckUpdate}
                disabled={checking}
              >
                {checking ? '確認中…' : '最新版を確認'}
              </Button>
              <Button
                variant="outlined"
                size="small"
                color="warning"
                startIcon={<DeleteSweepIcon />}
                onClick={() => setClearDialogOpen(true)}
              >
                キャッシュクリア
              </Button>
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              キャッシュクリアするとアプリが再読み込みされます（設定は保持されます）
            </Typography>
          </Paper>
        </Stack>
      </Box>

      {/* キャッシュクリア確認ダイアログ */}
      <Dialog open={clearDialogOpen} onClose={() => setClearDialogOpen(false)}>
        <DialogTitle>キャッシュをクリアしますか？</DialogTitle>
        <DialogContent>
          <DialogContentText>
            すべてのキャッシュデータを削除し、アプリを再読み込みします。
            時計やウィジェットの設定は保持されます。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearDialogOpen(false)}>キャンセル</Button>
          <Button onClick={handleClearCache} color="warning" variant="contained">
            クリアして再読み込み
          </Button>
        </DialogActions>
      </Dialog>

      {/* スナックバー通知 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
