/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_API_KEY: string
  readonly VITE_GOOGLE_CLIENT_ID: string
  readonly VITE_ROOM_A_CALENDAR_ID: string
  readonly VITE_ROOM_B_CALENDAR_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}