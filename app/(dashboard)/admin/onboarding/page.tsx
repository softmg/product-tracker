"use client"

import Link from "next/link"
import { CheckCircle2, Circle, Users, UsersRound, BarChart3, GitMerge, Bell, Timer, ClipboardList, ArrowRight, BookOpen } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface Step {
  id: string
  title: string
  description: string
  href: string
  icon: React.ReactNode
  required: boolean
  details: string[]
}

const SETUP_STEPS: Step[] = [
  {
    id: "teams",
    title: "Создать команды",
    description: "Добавьте команды, которые будут работать с гипотезами.",
    href: "/admin/teams",
    icon: <UsersRound className="h-5 w-5" />,
    required: true,
    details: [
      "Перейдите в Администрирование → Команды",
      'Нажмите "Добавить команду"',
      "Укажите название и описание",
      "Повторите для каждой команды",
    ],
  },
  {
    id: "users",
    title: "Добавить пользователей",
    description: "Создайте учётные записи для сотрудников и назначьте им роли.",
    href: "/admin/users",
    icon: <Users className="h-5 w-5" />,
    required: true,
    details: [
      "Перейдите в Администрирование → Пользователи",
      'Нажмите "Добавить пользователя"',
      "Укажите имя, email, роль и команду",
      "Пользователь получит письмо для установки пароля",
      "Доступные роли: Инициатор, PD-менеджер, Аналитик, Техлид, Биздев, Комитет",
    ],
  },
  {
    id: "scoring",
    title: "Настроить критерии оценки",
    description: "Определите критерии, по которым будут оцениваться гипотезы.",
    href: "/admin/scoring",
    icon: <BarChart3 className="h-5 w-5" />,
    required: true,
    details: [
      "Перейдите в Администрирование → Критерии оценки",
      "Добавьте критерии (например: Охват, Влияние, Уверенность, Усилия)",
      "Укажите вес каждого критерия в итоговой оценке",
      "Настройте шкалу (обычно 1–5 или 1–10)",
    ],
  },
  {
    id: "scoring-thresholds",
    title: "Настроить пороги оценки",
    description: "Укажите, при каком балле гипотеза считается приоритетной.",
    href: "/admin/scoring-thresholds",
    icon: <BarChart3 className="h-5 w-5" />,
    required: false,
    details: [
      "Перейдите в Администрирование → Пороги оценки",
      "Настройте пороговые значения для уровней: низкий / средний / высокий приоритет",
      "Например: <30 — низкий, 30–70 — средний, >70 — высокий",
    ],
  },
  {
    id: "transitions",
    title: "Настроить переходы статусов",
    description: "Определите допустимые переходы между статусами гипотез.",
    href: "/admin/transitions",
    icon: <GitMerge className="h-5 w-5" />,
    required: true,
    details: [
      "Перейдите в Администрирование → Переходы статусов",
      "Проверьте стандартную цепочку: backlog → scoring → deep_dive → experiment → go_no_go → done/archived",
      "Укажите, каким ролям разрешён каждый переход",
      "Добавьте кастомные переходы при необходимости",
    ],
  },
  {
    id: "sla",
    title: "Настроить SLA-дедлайны",
    description: "Задайте максимальное время нахождения гипотезы в каждом статусе.",
    href: "/admin/sla",
    icon: <Timer className="h-5 w-5" />,
    required: false,
    details: [
      "Перейдите в Администрирование → SLA",
      "Укажите дедлайн (в днях) для каждого статуса",
      "Система будет автоматически помечать просроченные гипотезы",
      "Рекомендации: scoring — 7 дней, deep_dive — 14 дней, experiment — 30 дней",
    ],
  },
  {
    id: "notifications",
    title: "Настроить уведомления",
    description: "Выберите, о каких событиях и кому отправлять уведомления.",
    href: "/admin/notifications",
    icon: <Bell className="h-5 w-5" />,
    required: false,
    details: [
      "Перейдите в Администрирование → Уведомления",
      "Настройте события: смена статуса, приближение SLA, назначение на гипотезу",
      "Укажите каналы: in-app, email",
      "Определите получателей для каждого события",
    ],
  },
  {
    id: "deep-dive",
    title: "Настроить этапы Deep Dive",
    description: "Определите шаги, которые команда проходит при глубоком анализе гипотезы.",
    href: "/admin/deep-dive",
    icon: <ClipboardList className="h-5 w-5" />,
    required: false,
    details: [
      "Перейдите в Администрирование → Deep Dive",
      "Добавьте этапы (например: Исследование пользователей, Анализ рынка, Технический анализ)",
      "Укажите порядок этапов и обязательность каждого",
    ],
  },
]

export default function OnboardingPage() {
  return (
    <div className="flex flex-col">
      <Header breadcrumbs={[{ title: "Администрирование" }, { title: "Руководство по настройке" }]} />

      <div className="flex-1 space-y-6 p-6">
        {/* Intro */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Добро пожаловать в Product Tracker</CardTitle>
                <CardDescription className="mt-0.5">
                  Следуйте этим шагам, чтобы подготовить систему к работе. Обязательные шаги отмечены звёздочкой.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Steps */}
        <div className="space-y-4">
          {SETUP_STEPS.map((step, index) => (
            <Card key={step.id} className="group transition-colors hover:border-primary/40">
              <CardContent className="p-0">
                <div className="flex items-start gap-4 p-5">
                  {/* Step number */}
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-muted bg-muted/50 text-sm font-medium text-muted-foreground">
                    {index + 1}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-2 text-foreground">
                        {step.icon}
                        <span className="font-medium">{step.title}</span>
                      </div>
                      {step.required && (
                        <Badge variant="secondary" className="text-xs">
                          Обязательно
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground">{step.description}</p>

                    {/* Details */}
                    <ol className="space-y-1">
                      {step.details.map((detail, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Circle className="mt-0.5 h-3 w-3 shrink-0 fill-muted-foreground/30 text-muted-foreground/30" />
                          {detail}
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Action */}
                  <div className="shrink-0">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={step.href} className="flex items-center gap-1.5">
                        Открыть
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* After setup */}
        <Card className="bg-muted/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <CardTitle className="text-base">После настройки</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Когда все обязательные шаги выполнены, пользователи могут:</p>
            <ul className="ml-4 space-y-1 list-disc">
              <li>Создавать гипотезы и отслеживать их статус</li>
              <li>Проходить процесс оценки (scoring) по настроенным критериям</li>
              <li>Проводить глубокий анализ (deep dive) и эксперименты</li>
              <li>Голосовать на комитете за приоритизацию</li>
              <li>Видеть аналитику по воронке product discovery</li>
            </ul>
            <div className="pt-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard">Перейти к дашборду →</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
