import { describe, it, expect } from 'vitest'
import { swapWidgets } from './Dashboard'

type SlotPosition =
  | 'top-left' | 'top-center' | 'top-right'
  | 'middle-left' | 'middle-center' | 'middle-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right'

const layout = [
  { id: 'clock',    label: '時計',         slot: 'top-center'  as SlotPosition },
  { id: 'calendar', label: 'カレンダー',   slot: 'bottom-left'  as SlotPosition },
  { id: 'weather',  label: '天気',         slot: 'bottom-right' as SlotPosition },
]

describe('swapWidgets', () => {
  it('ウィジェットを空スロットに移動できる', () => {
    const result = swapWidgets(layout, 'clock', 'top-left')
    expect(result.find(w => w.id === 'clock')?.slot).toBe('top-left')
  })

  it('2つのウィジェットがスワップされる', () => {
    const result = swapWidgets(layout, 'clock', 'bottom-left')
    expect(result.find(w => w.id === 'clock')?.slot).toBe('bottom-left')
    expect(result.find(w => w.id === 'calendar')?.slot).toBe('top-center')
  })

  it('同じスロットに移動しようとすると変化なし（同一参照を返す）', () => {
    const result = swapWidgets(layout, 'clock', 'top-center')
    expect(result).toBe(layout)
  })

  it('存在しない id を指定すると変化なし（同一参照を返す）', () => {
    const result = swapWidgets(layout, 'unknown', 'top-left')
    expect(result).toBe(layout)
  })

  it('移動後も全ウィジェット数が変わらない', () => {
    const result = swapWidgets(layout, 'weather', 'middle-center')
    expect(result).toHaveLength(layout.length)
  })

  it('他のウィジェットのスロットは変化しない', () => {
    const result = swapWidgets(layout, 'clock', 'top-left')
    expect(result.find(w => w.id === 'calendar')?.slot).toBe('bottom-left')
    expect(result.find(w => w.id === 'weather')?.slot).toBe('bottom-right')
  })

  it('元の配列を変更しない（immutable）', () => {
    const original = layout.map(w => ({ ...w }))
    swapWidgets(layout, 'clock', 'top-left')
    expect(layout).toEqual(original)
  })
})
