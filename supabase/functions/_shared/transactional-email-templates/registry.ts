/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as labResultNotification } from './lab-result-notification.tsx'
import { template as securityAlert } from './security-alert.tsx'
import { template as taxReport } from './tax-report.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'lab-result-notification': labResultNotification,
  'security-alert': securityAlert,
  'tax-report': taxReport,
}
