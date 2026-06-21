import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AppToaster } from '@/components/ui/sonner'
import App from './App.tsx'
import { AppErrorBoundary } from '@/features/errors/AppErrorBoundary'
import { I18nProvider } from '@/providers/I18nProvider'
import { SettingsProvider } from '@/providers/SettingsProvider'
import { ThemeProvider } from '@/providers/ThemeProvider'
import './index.css'
import './styles/fullcalendar.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <I18nProvider>
          <SettingsProvider>
            <ThemeProvider>
              <AppErrorBoundary>
                <App />
              </AppErrorBoundary>
              <AppToaster />
            </ThemeProvider>
          </SettingsProvider>
        </I18nProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
