"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setIsLoading(false)
    setIsSubmitted(true)
  }

  if (isSubmitted) {
    return (
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Проверьте почту</h1>
          <p className="text-sm text-muted-foreground">
            Мы отправили ссылку для сброса пароля на
          </p>
          <p className="text-sm font-medium">{email}</p>
        </div>

        <Alert className="border-primary/20 bg-primary/5">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm">
            Если аккаунт с этим email существует, вы получите ссылку для сброса пароля в ближайшее время.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setIsSubmitted(false)}
          >
            Попробовать другой email
          </Button>
          
          <Link href="/login" className="block">
            <Button variant="ghost" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Вернуться ко входу
            </Button>
          </Link>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Не получили письмо? Проверьте папку спам или{" "}
          <button 
            onClick={() => setIsSubmitted(false)}
            className="text-primary hover:underline"
          >
            попробуйте снова
          </button>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Забыли пароль?</h1>
        <p className="text-sm text-muted-foreground">
          Введите email и мы отправим вам ссылку для сброса
        </p>
      </div>

      <Card>
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-lg">Сброс пароля</CardTitle>
          <CardDescription>
            Введите email, связанный с вашим аккаунтом
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Отправка..." : "Отправить ссылку"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Link href="/login" className="block">
        <Button variant="ghost" className="w-full">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to sign in
        </Button>
      </Link>
    </div>
  )
}
