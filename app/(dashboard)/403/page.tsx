'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ShieldX, Home, ArrowLeft } from 'lucide-react'

export default function ForbiddenPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10 mb-6">
            <ShieldX className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="text-7xl font-bold text-foreground mb-2">403</h1>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Доступ запрещён
          </h2>
          <p className="text-muted-foreground">
            У вас недостаточно прав для просмотра этой страницы. 
            Обратитесь к администратору для получения доступа.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
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
