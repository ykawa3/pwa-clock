import { createContext, useContext } from 'react'

export const SizeScaleContext = createContext(1.0)
export const useSizeScale = () => useContext(SizeScaleContext)
