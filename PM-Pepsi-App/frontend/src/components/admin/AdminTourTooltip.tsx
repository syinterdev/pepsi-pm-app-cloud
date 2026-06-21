import { PepsiStripe } from '@/components/brand/PepsiStripe'
import { Compass } from 'lucide-react'
import type { TooltipRenderProps } from 'react-joyride'
import './admin-tour.css'

export function AdminTourTooltip({
  continuous,
  index,
  step,
  backProps,
  primaryProps,
  skipProps,
  tooltipProps,
  size,
  isLastStep,
}: TooltipRenderProps) {
  const current = index + 1
  const pct = size > 0 ? Math.round((current / size) * 100) : 0

  return (
    <div
      {...tooltipProps}
      className="admin-tour-tooltip"
      role="dialog"
      aria-labelledby="admin-tour-title"
      aria-describedby="admin-tour-body"
    >
      <PepsiStripe className="admin-tour-tooltip__stripe" />
      <div className="admin-tour-tooltip__inner">
        <div className="admin-tour-tooltip__progress">
          <span className="admin-tour-tooltip__eyebrow">
            <Compass className="size-3.5 shrink-0" aria-hidden />
            ทัวร์ผู้ดูแลระบบ
          </span>
          <span className="admin-tour-tooltip__step-pill" aria-live="polite">
            {current} / {size}
          </span>
        </div>
        <div
          className="admin-tour-tooltip__progress-track"
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={1}
          aria-valuemax={size}
          aria-label={`ความคืบหน้าทัวร์ ${current} จาก ${size}`}
        >
          <div className="admin-tour-tooltip__progress-fill" style={{ width: `${pct}%` }} />
        </div>

        {step.title ? (
          <h3 id="admin-tour-title" className="admin-tour-tooltip__title">
            {step.title}
          </h3>
        ) : null}
        <div id="admin-tour-body" className="admin-tour-tooltip__body">
          {step.content}
        </div>

        <footer className="admin-tour-tooltip__footer">
          <div className="admin-tour-tooltip__footer-left">
            {index > 0 && continuous ? (
              <button
                type="button"
                className="admin-tour-btn admin-tour-btn--ghost"
                {...backProps}
              >
                {backProps.title}
              </button>
            ) : null}
            <button type="button" className="admin-tour-btn admin-tour-btn--ghost" {...skipProps}>
              {skipProps.title}
            </button>
          </div>
          {continuous ? (
            <button
              type="button"
              className="admin-tour-btn admin-tour-btn--primary"
              {...primaryProps}
            >
              {isLastStep ? 'เสร็จสิ้น' : primaryProps.title}
            </button>
          ) : null}
        </footer>
      </div>
    </div>
  )
}
