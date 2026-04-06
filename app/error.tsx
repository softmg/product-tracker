'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-warning/10 mb-6">
            <AlertTriangle className="w-10 h-10 text-warning" />
          </div>
          <h1 className="text-7xl font-bold text-foreground mb-2">500</h1>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Внутренняя ошибка сервера
          </h2>
          <p className="text-muted-foreground">
            Произошла непредвиденная ошибка. Попробуйте обновить страницу 
            или вернитесь позже.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground mt-2">
              Код ошибки: {error.digest}
            </p>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={reset}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Повторить
          </Button>
          <Button asChild>
            <Link href="/hypotheses">
              <Home className="w-4 h-4 mr-2" />
              На главную
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
