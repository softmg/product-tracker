"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { mockTeams, mockUsers } from "@/lib/mock-data"

export default function NewHypothesisPage() {
  const router = useRouter()
  const { hasPermission, user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect if no permission
  if (!hasPermission("hypothesis:create")) {
    router.push("/hypotheses")
    return null
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // In a real app, this would create the hypothesis
    router.push("/hypotheses")
  }

  const owners = mockUsers.filter(u => u.role !== "viewer" && u.isActive)

  return (
    <>
      <Header 
        breadcrumbs={[
          { title: "Гипотезы", href: "/hypotheses" },
          { title: "Новая гипотеза" }
        ]} 
      />
      
      <main className="flex-1 overflow-auto">
        <div className="container max-w-3xl pl-8 pr-8 py-6 space-y-6">
          {/* Back button */}
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href="/hypotheses">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад к гипотезам
            </Link>
          </Button>

          {/* Header */}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Создать гипотезу</h1>
            <p className="text-sm text-muted-foreground">
              Определите новую продуктовую гипотезу для тестирования и валидации
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Данные гипотезы</CardTitle>
                <CardDescription>
                  Укажите основную информацию о вашей гипотезе
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Название *</Label>
                  <Input 
                    id="title" 
                    placeholder="например, Добавление социального входа увеличит конверсию"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Чёткая, проверяемая формулировка вашей гипотезы
                  </p>
                </div>

                {/* Problem / Customer Pain */}
                <div className="space-y-2">
                  <Label htmlFor="problem">Проблема / боль клиента *</Label>
                  <Textarea 
                    id="problem" 
                    placeholder="Опишите проблему или боль клиента, которую вы хотите решить..."
                    rows={3}
                    required
                  />
                </div>

                {/* Solution Statement */}
                <div className="space-y-2">
                  <Label htmlFor="solution">Формулировка решения «Мы верим, что...» *</Label>
                  <Textarea 
                    id="solution" 
                    placeholder="Мы верим, что если мы сделаем X, то произойдёт Y..."
                    rows={2}
                    required
                  />
                </div>

                {/* Key Assumptions */}
                <div className="space-y-2">
                  <Label htmlFor="assumptions">Ключевые предположения *</Label>
                  <Textarea 
                    id="assumptions" 
                    placeholder="Какие предположения лежат в основе вашей гипотезы?"
                    rows={2}
                    required
                  />
                </div>

                {/* Target Audience */}
                <div className="space-y-2">
                  <Label htmlFor="audience">Целевая аудитория *</Label>
                  <Textarea 
                    id="audience" 
                    placeholder="Опишите целевую аудиторию для данной гипотезы..."
                    rows={2}
                    required
                  />
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <Label htmlFor="priority">Приоритет *</Label>
                  <Select defaultValue="medium">
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите приоритет" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Критический</SelectItem>
                      <SelectItem value="high">Высокий</SelectItem>
                      <SelectItem value="medium">Средний</SelectItem>
                      <SelectItem value="low">Низкий</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Team & Owner */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="team">Команда *</Label>
                    <Select defaultValue={user?.teamId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите команду" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockTeams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="owner">Владелец *</Label>
                    <Select defaultValue={user?.id}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите владельца" />
                      </SelectTrigger>
                      <SelectContent>
                        {owners.map((owner) => (
                          <SelectItem key={owner.id} value={owner.id}>
                            {owner.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" asChild>
                    <Link href="/hypotheses">Отмена</Link>
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Создание..." : "Создать гипотезу"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </main>
    </>
  )
}
