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
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import type { DisplaySize } from '../context/SettingsContext'

export default function Settings() {
  const navigate = useNavigate()
  const { settings, updateSetting } = useSettings()

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
              OpenWeatherMap API キー
            </Typography>
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
          </Paper>
        </Stack>
      </Box>
    </Box>
  )
}
