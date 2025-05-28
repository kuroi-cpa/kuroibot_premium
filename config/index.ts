import type { AppInfo } from '@/types/app'
export const APP_ID = `${process.env.NEXT_PUBLIC_APP_ID}`
export const API_KEY = `${process.env.NEXT_PUBLIC_APP_KEY}`
export const API_URL = `${process.env.NEXT_PUBLIC_API_URL}`
export const APP_INFO: AppInfo = {
  title: '公認会計士くろいbot_Premium',
  description: '会計特化チャットボット',
  copyright: '©️ 2025 白井敬祐公認会計士事務所',
  privacy_policy: '/privacy',
  default_language: 'ja',
}

export const isShowPrompt = false
export const promptTemplate = 'I want you to act as a javascript console.'

export const API_PREFIX = '/api'

export const LOCALE_COOKIE_NAME = 'locale'

export const DEFAULT_VALUE_MAX_LEN = 48
