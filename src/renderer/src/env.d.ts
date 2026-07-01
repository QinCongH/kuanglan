/// <reference types="vite/client" />

// Electron webview tag types
interface WebviewTag extends HTMLElement {
  src: string
  nodeintegration: string
  webpreferences: string
  allowpopups: string
  reload(): void
  goBack(): void
  goForward(): void
  getURL(): string
  getTitle(): string
  isLoading(): boolean
  stop(): void
  openDevTools(): void
  closeDevTools(): void
  getWebContentsId(): number
  addEventListener<K extends keyof HTMLElementEventMap>(
    type: K,
    listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void
}

declare global {
  namespace Electron {
    interface WebviewTag extends WebviewTag {}
  }
}
