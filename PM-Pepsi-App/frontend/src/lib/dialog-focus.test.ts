// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest'
import {
  DIALOG_CLOSE_ATTR,
  DIALOG_INITIAL_FOCUS_ATTR,
  focusInitialInDialog,
} from '@/lib/dialog-focus'

describe('focusInitialInDialog', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('focuses element with data-dialog-initial-focus', () => {
    const root = document.createElement('div')
    root.innerHTML = `
      <button type="button">Other</button>
      <input id="target" ${DIALOG_INITIAL_FOCUS_ATTR} />
    `
    document.body.appendChild(root)
    const input = root.querySelector('#target') as HTMLInputElement
    focusInitialInDialog(root)
    expect(document.activeElement).toBe(input)
  })

  it('skips data-dialog-close and focuses first field', () => {
    const root = document.createElement('div')
    root.innerHTML = `
      <button type="button" ${DIALOG_CLOSE_ATTR}>Close</button>
      <input id="field" type="text" />
    `
    document.body.appendChild(root)
    const field = root.querySelector('#field') as HTMLInputElement
    focusInitialInDialog(root)
    expect(document.activeElement).toBe(field)
  })

  it('focuses first non-close button when no fields', () => {
    const root = document.createElement('div')
    root.innerHTML = `
      <button type="button" ${DIALOG_CLOSE_ATTR}>X</button>
      <button type="button" id="ok">OK</button>
    `
    document.body.appendChild(root)
    const ok = root.querySelector('#ok') as HTMLButtonElement
    focusInitialInDialog(root)
    expect(document.activeElement).toBe(ok)
  })
})
