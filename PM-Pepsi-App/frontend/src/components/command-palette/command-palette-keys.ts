/** ปุ่มลัดเปิด command palette — Ctrl+K (Win/Linux) · ⌘K (macOS) */
export function commandPaletteShortcut(): { modifier: string; key: string; aria: string } {
  const isApple =
    typeof navigator !== 'undefined' &&
    /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent)
  const modifier = isApple ? '⌘' : 'Ctrl'
  return { modifier, key: 'K', aria: `${modifier}+K` }
}
