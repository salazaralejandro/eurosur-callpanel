export const IS_DEV_AUTH = import.meta.env.VITE_DEV_AUTH === '1'
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === '1'

export const isDevAuth = (): boolean => IS_DEV_AUTH
export const useMocks = (): boolean => USE_MOCKS
