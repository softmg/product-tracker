"use client"

import { useState } from "react"
import {
  BarChart3,
  TrendingUp,
  Target,
  Users,
  AlertTriangle,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  Cell,
  Legend,
} from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"

// KPI Data
const kpiData = {
  total: 128,
  inProgress: 43,
  inCommittee: 7,
  archived: 52,
}

// Status distribution data
const statusDistribution = [
  { status: "Идея", count: 24, color: "#94a3b8" },
  { status: "Первичный скоринг", count: 15, color: "#60a5fa" },
  { status: "Deep Dive", count: 21, color: "#a78bfa" },
  { status: "Эксперимент", count: 12, color: "#f59e0b" },
  { status: "Питч", count: 6, color: "#10b981" },
  { status: "Решение принято", count: 4, color: "#06b6d4" },
  { status: "Архив", count: 46, color: "#6b7280" },
]

// Initiator stats
const initiatorStats = [
  { name: "Maria Petrova", team: "Product", hypotheses: 18, inProgress: 5, completed: 8 },
  { name: "Elena Kozlova", team: "Platform", hypotheses: 12, inProgress: 3, completed: 5 },
  { name: "Alexey Ivanov", team: "Growth", hypotheses: 15, inProgress: 4, completed: 7 },
  { name: "Ivan Sidorov", team: "BizDev", hypotheses: 8, inProgress: 2, completed: 3 },
]

// Funnel data
const funnelData = [
  { stage: "Идея", absolute: 128, percent: 100, dropoff: 0 },
  { stage: "Первичный скоринг", absolute: 87, percent: 68, dropoff: -32 },
  { stage: "Deep Dive", absolute: 54, percent: 62, dropoff: -38 },
  { stage: "Эксперимент", absolute: 28, percent: 52, dropoff: -48 },
  { stage: "Питч", absolute: 14, percent: 50, dropoff: -50 },
  { stage: "Решение принято", absolute: 9, percent: 64, dropoff: -36 },
]

const decisionResults = [
  { result: "Go", count: 6, percent: 67, color: "#10b981" },
  { result: "No-Go", count: 2, percent: 22, color: "#ef4444" },
  { result: "Iterate", count: 1, percent: 11, color: "#f59e0b" },
]

// Trend data
const trendData = [
  { month: "Oct", conversion: 10 },
  { month: "Nov", conversion: 15 },
  { month: "Dec", conversion: 12 },
  { month: "Jan", conversion: 15 },
  { month: "Feb", conversion: 18 },
  { month: "Mar", conversion: 20 },
]

// SLA data
const slaData = [
  { status: "Идея", avgDays: 2.1, limit: 3, ok: true },
  { status: "Первичный скоринг", avgDays: 4.8, limit: 5, ok: true },
  { status: "Deep Dive", avgDays: 12.3, limit: 15, ok: true },
  { status: "Эксперимент", avgDays: 9.7, limit: 10, ok: true },
  { status: "Питч", avgDays: 3.2, limit: null, ok: true },
]

const slaViolations = [
  { id: "HYP-071", status: "Deep Dive", days: 29, limit: 15, owner: "kozlov@smg.ru" },
  { id: "HYP-088", status: "Эксперимент", days: 22, limit: 10, owner: "nikitin@smg.ru" },
]

// Quality analysis data
const qualityMetrics = {
  threshold: 7.0,
  truePositive: { count: 34, percent: 63 },
  falsePositive: { count: 12, percent: 22 },
  trueNegative: { count: 6, percent: 11 },
  falseNegative: { count: 2, percent: 4 },
  accuracy: 68,
  precision: 74,
  recall: 94,
}

const scatterData = [
  { score: 4.2, result: "No-Go", x: 4.2, y: 0 },
  { score: 5.1, result: "No-Go", x: 5.1, y: 0 },
  { score: 5.5, result: "No-Go", x: 5.5, y: 0 },
  { score: 6.0, result: "No-Go", x: 6.0, y: 0 },
  { score: 6.3, result: "No-Go", x: 6.3, y: 0 },
  { score: 5.8, result: "Iterate", x: 5.8, y: 1 },
  { score: 6.5, result: "Iterate", x: 6.5, y: 1 },
  { score: 7.0, result: "Go", x: 7.0, y: 2 },
  { score: 7.5, result: "Go", x: 7.5, y: 2 },
  { score: 7.8, result: "Go", x: 7.8, y: 2 },
  { score: 8.2, result: "Go", x: 8.2, y: 2 },
  { score: 8.5, result: "Go", x: 8.5, y: 2 },
  { score: 8.9, result: "Go", x: 8.9, y: 2 },
  { score: 9.1, result: "Go", x: 9.1, y: 2 },
  { score: 9.5, result: "Go", x: 9.5, y: 2 },
]

const criteriaAnalysis = [
  { criteria: "Размер рынка", goAvg: 8.2, noGoAvg: 5.4, diff: 2.8 },
  { criteria: "Боль клиента", goAvg: 8.7, noGoAvg: 6.1, diff: 2.6 },
  { criteria: "Техреализуемость", goAvg: 7.1, noGoAvg: 6.8, diff: 0.3 },
  { criteria: "Финмодель (LTV/CAC)", goAvg: 7.9, noGoAvg: 4.2, diff: 3.7 },
  { criteria: "Скорость проверки", goAvg: 6.5, noGoAvg: 6.3, diff: 0.2 },
]

// Cohort data
const cohortData = [
  { team: "Продукт", hypotheses: 42, idea: 8, scoring: 12, deepDive: 10, experiment: 7, pitch: 3, go: 2, noGo: 1, conv: 4.8, avgDays: 28.4 },
  { team: "Growth", hypotheses: 31, idea: 5, scoring: 8, deepDive: 7, experiment: 5, pitch: 3, go: 2, noGo: 1, conv: 6.5, avgDays: 24.1 },
  { team: "Platform", hypotheses: 18, idea: 4, scoring: 5, deepDive: 4, experiment: 2, pitch: 1, go: 1, noGo: 0, conv: 5.6, avgDays: 31.2 },
  { team: "BizDev", hypotheses: 22, idea: 5, scoring: 7, deepDive: 5, experiment: 3, pitch: 1, go: 0, noGo: 1, conv: 0.0, avgDays: 19.8 },
]

const quarterlyTrend = [
  { quarter: "Q2'25", Продукт: 3.1, Growth: 5.0, Platform: 4.0, BizDev: 2.1 },
  { quarter: "Q3'25", Продукт: 4.2, Growth: 5.8, Platform: 3.5, BizDev: 1.8 },
  { quarter: "Q4'25", Продукт: 4.5, Growth: 6.1, Platform: 4.8, BizDev: 0.5 },
  { quarter: "Q1'26", Продукт: 4.8, Growth: 6.5, Platform: 5.6, BizDev: 0.0 },
]

const stuckHypotheses = [
  { id: "HYP-071", team: "BizDev", status: "Deep Dive", days: 29, limit: 15, owner: "kozlov@smg.ru" },
  { id: "HYP-088", team: "Platform", status: "Эксперимент", days: 22, limit: 10, owner: "nikitin@smg.ru" },
  { id: "HYP-094", team: "Продукт", status: "Скоринг", days: 11, limit: 5, owner: "petrov@smg.ru" },
]

const teamOptions = [
  { value: "Продукт", label: "Продукт" },
  { value: "Growth", label: "Growth" },
  { value: "Platform", label: "Platform" },
  { value: "BizDev", label: "BizDev" },
]

const initiatorOptions = [
  { value: "Maria Petrova", label: "Maria Petrova" },
  { value: "Elena Kozlova", label: "Elena Kozlova" },
  { value: "Alexey Ivanov", label: "Alexey Ivanov" },
  { value: "Ivan Sidorov", label: "Ivan Sidorov" },
]

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("30days")
  const [team, setTeam] = useState("all")
  const [initiator, setInitiator] = useState("all")

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Аналитика</h1>
          <p className="text-muted-foreground">
            Статистика и метрики по гипотезам
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Экспорт Excel
        </Button>
      </div>

      <Tabs defaultValue="mvp" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="mvp" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">MVP</span>
          </TabsTrigger>
          <TabsTrigger value="funnel" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Воронка</span>
          </TabsTrigger>
          <TabsTrigger value="quality" className="gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Качество</span>
          </TabsTrigger>
          <TabsTrigger value="cohorts" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Когорты</span>
          </TabsTrigger>
        </TabsList>

        {/* MVP Tab */}
        <TabsContent value="mvp" className="mt-6">
          <div className="flex flex-col gap-6">
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Всего гипотез</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpiData.total}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">В работе</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{kpiData.inProgress}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">В решении ПК</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-600">{kpiData.inCommittee}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">В архиве</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-muted-foreground">{kpiData.archived}</div>
                </CardContent>
              </Card>
            </div>

            {/* Status Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle>По статусам</CardTitle>
                <CardDescription>Распределение гипотез по текущим статусам</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusDistribution} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="status" type="category" width={120} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Initiator Stats Table */}
            <Card>
              <CardHeader>
                <CardTitle>По инициаторам / ответственным</CardTitle>
                <CardDescription>Статистика по владельцам гипотез</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Имя</TableHead>
                      <TableHead>Команда</TableHead>
                      <TableHead className="text-right">Гипотез</TableHead>
                      <TableHead className="text-right">В работе</TableHead>
                      <TableHead className="text-right">Завершено</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {initiatorStats.map((stat) => (
                      <TableRow key={stat.name}>
                        <TableCell className="font-medium">{stat.name}</TableCell>
                        <TableCell>{stat.team}</TableCell>
                        <TableCell className="text-right">{stat.hypotheses}</TableCell>
                        <TableCell className="text-right">{stat.inProgress}</TableCell>
                        <TableCell className="text-right">{stat.completed}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Funnel Tab */}
        <TabsContent value="funnel" className="mt-6">
          <div className="flex flex-col gap-6">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Период:</span>
                    <Select value={period} onValueChange={setPeriod}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7days">Последние 7 дней</SelectItem>
                        <SelectItem value="30days">Последние 30 дней</SelectItem>
                        <SelectItem value="90days">Последние 90 дней</SelectItem>
                        <SelectItem value="all">Все время</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Команда:</span>
                    <Select value={team} onValueChange={setTeam}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все</SelectItem>
                        {teamOptions.map((teamOption) => (
                          <SelectItem key={teamOption.value} value={teamOption.value}>{teamOption.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Инициатор:</span>
                    <Select value={initiator} onValueChange={setInitiator}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все</SelectItem>
                        {initiatorOptions.map((initiatorOption) => (
                          <SelectItem key={initiatorOption.value} value={initiatorOption.value}>{initiatorOption.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" size="sm">Применить</Button>
                  <Button variant="ghost" size="sm">Сброс</Button>
                </div>
              </CardContent>
            </Card>

            {/* Funnel Visualization */}
            <Card>
              <CardHeader>
                <CardTitle>Воронка конверсии</CardTitle>
                <CardDescription>Абсолютные значения и % от предыдущего этапа</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  {funnelData.map((stage, index) => (
                    <div key={stage.stage} className="flex items-center gap-4">
                      <div className="w-36 text-sm font-medium">{stage.stage}</div>
                      <div className="flex-1">
                        <Progress value={stage.percent} className="h-8" />
                      </div>
                      <div className="w-16 text-right font-bold">{stage.absolute}</div>
                      <div className="w-16 text-right text-sm text-muted-foreground">
                        {stage.percent}%
                      </div>
                      {stage.dropoff !== 0 && (
                        <Badge variant="secondary" className="w-16 justify-center">
                          {stage.dropoff}%
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex items-center gap-6">
                  {decisionResults.map((result) => (
                    <div key={result.result} className="flex items-center gap-2">
                      <div
                        className="h-4 w-4 rounded"
                        style={{ backgroundColor: result.color }}
                      />
                      <span className="text-sm font-medium">{result.result}</span>
                      <span className="text-sm text-muted-foreground">
                        {result.count} ({result.percent}%)
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Тренд конверсии Идея → Питч</CardTitle>
                <CardDescription>Последние 6 месяцев</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis unit="%" />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="conversion"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: "#3b82f6" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* SLA Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Среднее время в статусе</CardTitle>
                <CardDescription>Сравнение с SLA-лимитами</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Статус</TableHead>
                      <TableHead className="text-right">Среднее (дней)</TableHead>
                      <TableHead className="text-right">SLA-лимит</TableHead>
                      <TableHead className="text-right">Статус</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {slaData.map((item) => (
                      <TableRow key={item.status}>
                        <TableCell className="font-medium">{item.status}</TableCell>
                        <TableCell className="text-right">{item.avgDays}</TableCell>
                        <TableCell className="text-right">
                          {item.limit ?? "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.ok ? (
                            <CheckCircle className="ml-auto h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="ml-auto h-4 w-4 text-red-600" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* SLA Violations */}
            {slaViolations.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>
                    SLA-нарушения сейчас: {slaViolations.length} гипотез просрочено
                  </span>
                  <Button variant="outline" size="sm">
                    Показать список
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </TabsContent>

        {/* Quality Tab */}
        <TabsContent value="quality" className="mt-6">
          <div className="flex flex-col gap-6">
            {/* Accuracy Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Точность первичного скоринга</CardTitle>
                <CardDescription>Порог скоринга: {qualityMetrics.threshold}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded bg-green-500" />
                        <span className="text-sm">Прошли порог → Go (верный позитив)</span>
                      </div>
                      <span className="font-bold">{qualityMetrics.truePositive.count}</span>
                    </div>
                    <Progress value={qualityMetrics.truePositive.percent} className="h-3 bg-green-100" />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded bg-red-500" />
                        <span className="text-sm">Прошли порог → No-Go (ложный позитив)</span>
                      </div>
                      <span className="font-bold">{qualityMetrics.falsePositive.count}</span>
                    </div>
                    <Progress value={qualityMetrics.falsePositive.percent} className="h-3 bg-red-100" />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded bg-slate-500" />
                        <span className="text-sm">Не прошли → No-Go (верный негатив)</span>
                      </div>
                      <span className="font-bold">{qualityMetrics.trueNegative.count}</span>
                    </div>
                    <Progress value={qualityMetrics.trueNegative.percent} className="h-3 bg-slate-100" />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded bg-amber-500" />
                        <span className="text-sm">Не прошли → Go (ложный негатив)</span>
                      </div>
                      <span className="font-bold">{qualityMetrics.falseNegative.count}</span>
                    </div>
                    <Progress value={qualityMetrics.falseNegative.percent} className="h-3 bg-amber-100" />
                  </div>

                  <div className="flex flex-col items-center justify-center gap-4 rounded-lg border p-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold">{qualityMetrics.accuracy}%</div>
                      <div className="text-sm text-muted-foreground">Точность модели</div>
                    </div>
                    <div className="flex gap-8">
                      <div className="text-center">
                        <div className="text-xl font-bold">{qualityMetrics.precision}%</div>
                        <div className="text-xs text-muted-foreground">Precision</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold">{qualityMetrics.recall}%</div>
                        <div className="text-xs text-muted-foreground">Recall</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Scatter Plot */}
            <Card>
              <CardHeader>
                <CardTitle>Скоринг vs итог</CardTitle>
                <CardDescription>Каждая точка — гипотеза</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart>
                      <CartesianGrid />
                      <XAxis
                        type="number"
                        dataKey="x"
                        name="Балл скоринга"
                        domain={[4, 10]}
                        label={{ value: "Балл первичного скоринга", position: "bottom" }}
                      />
                      <YAxis
                        type="number"
                        dataKey="y"
                        domain={[-0.5, 2.5]}
                        ticks={[0, 1, 2]}
                        tickFormatter={(value) => {
                          if (value === 0) return "No-Go"
                          if (value === 1) return "Iterate"
                          if (value === 2) return "Go"
                          return ""
                        }}
                      />
                      <Tooltip
                        formatter={(value, name) => {
                          if (name === "y") {
                            if (value === 0) return "No-Go"
                            if (value === 1) return "Iterate"
                            if (value === 2) return "Go"
                          }
                          return value
                        }}
                      />
                      <Scatter name="Гипотезы" data={scatterData}>
                        {scatterData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.result === "Go"
                                ? "#10b981"
                                : entry.result === "No-Go"
                                ? "#ef4444"
                                : "#f59e0b"
                            }
                          />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
                <Alert className="mt-4">
                  <AlertDescription>
                    <strong>Вывод:</strong> при пороге 7.0 большинство No-Go концентрируется в зоне 5–6.5.
                    <br />
                    <strong>Рекомендация:</strong> рассмотреть снижение порога до 6.5 для уменьшения ложных позитивов.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Criteria Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Детализация по критериям скоринга</CardTitle>
                <CardDescription>Средние баллы по результату</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Критерий</TableHead>
                      <TableHead className="text-right">Средний балл (Go)</TableHead>
                      <TableHead className="text-right">Средний балл (No-Go)</TableHead>
                      <TableHead className="text-right">Разница</TableHead>
                      <TableHead>Визуализация</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {criteriaAnalysis.map((item) => (
                      <TableRow key={item.criteria}>
                        <TableCell className="font-medium">{item.criteria}</TableCell>
                        <TableCell className="text-right">{item.goAvg}</TableCell>
                        <TableCell className="text-right">{item.noGoAvg}</TableCell>
                        <TableCell className="text-right font-bold text-green-600">
                          +{item.diff.toFixed(1)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.round(item.diff) }).map((_, i) => (
                              <div
                                key={i}
                                className="h-3 w-2 rounded-sm bg-green-500"
                              />
                            ))}
                            {item.diff < 1 && (
                              <div className="h-3 w-2 rounded-sm bg-slate-200" />
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Alert className="mt-4">
                  <AlertDescription>
                    <strong>Наиболее предсказывающий:</strong> Финмодель LTV/CAC (+3.7)
                    <br />
                    <strong>Наименее предсказывающий:</strong> Скорость проверки (+0.2) — кандидат на пересмотр веса
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cohorts Tab */}
        <TabsContent value="cohorts" className="mt-6">
          <div className="flex flex-col gap-6">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Период создания:</span>
                    <Select defaultValue="q1-2026">
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="q4-2025">Q4 2025</SelectItem>
                        <SelectItem value="q1-2026">Q1 2026</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Группировка:</span>
                    <Select defaultValue="team">
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="team">Команда</SelectItem>
                        <SelectItem value="initiator">Инициатор</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Метрика:</span>
                    <Select defaultValue="conversion">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="conversion">Конверсия в Go</SelectItem>
                        <SelectItem value="time">Время в воронке</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cohort Summary Table */}
            <Card>
              <CardHeader>
                <CardTitle>Сводная таблица когорт</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Команда</TableHead>
                        <TableHead className="text-right">Гипотез</TableHead>
                        <TableHead className="text-right">Идея</TableHead>
                        <TableHead className="text-right">Скоринг</TableHead>
                        <TableHead className="text-right">Deep Dive</TableHead>
                        <TableHead className="text-right">Эксп.</TableHead>
                        <TableHead className="text-right">Питч</TableHead>
                        <TableHead className="text-right">Go</TableHead>
                        <TableHead className="text-right">No-Go</TableHead>
                        <TableHead className="text-right">Conv.%</TableHead>
                        <TableHead className="text-right">Ср.время(дн)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cohortData.map((row) => (
                        <TableRow key={row.team}>
                          <TableCell className="font-medium">{row.team}</TableCell>
                          <TableCell className="text-right">{row.hypotheses}</TableCell>
                          <TableCell className="text-right">{row.idea}</TableCell>
                          <TableCell className="text-right">{row.scoring}</TableCell>
                          <TableCell className="text-right">{row.deepDive}</TableCell>
                          <TableCell className="text-right">{row.experiment}</TableCell>
                          <TableCell className="text-right">{row.pitch}</TableCell>
                          <TableCell className="text-right text-green-600 font-medium">{row.go}</TableCell>
                          <TableCell className="text-right text-red-600">{row.noGo}</TableCell>
                          <TableCell className="text-right font-bold">{row.conv}%</TableCell>
                          <TableCell className="text-right">{row.avgDays}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell>Итого</TableCell>
                        <TableCell className="text-right">113</TableCell>
                        <TableCell className="text-right">22</TableCell>
                        <TableCell className="text-right">32</TableCell>
                        <TableCell className="text-right">26</TableCell>
                        <TableCell className="text-right">17</TableCell>
                        <TableCell className="text-right">8</TableCell>
                        <TableCell className="text-right text-green-600">5</TableCell>
                        <TableCell className="text-right text-red-600">3</TableCell>
                        <TableCell className="text-right">4.4%</TableCell>
                        <TableCell className="text-right">26.2</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  <Badge variant="outline" className="text-green-600">
                    Лучшая конверсия: Growth (6.5%)
                  </Badge>
                  <Badge variant="outline" className="text-blue-600">
                    Наименьшее время в воронке: BizDev (19.8 дн.)
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Quarterly Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Тренд по кварталам</CardTitle>
                <CardDescription>Конверсия Идея → Go</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={quarterlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="quarter" />
                      <YAxis unit="%" />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="Продукт" stroke="#3b82f6" strokeWidth={2} />
                      <Line type="monotone" dataKey="Growth" stroke="#10b981" strokeWidth={2} />
                      <Line type="monotone" dataKey="Platform" stroke="#a78bfa" strokeWidth={2} />
                      <Line type="monotone" dataKey="BizDev" stroke="#ef4444" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <Alert variant="destructive" className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Конверсия BizDev падает 3 квартала подряд. Последнее Go — Q4&apos;25.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Stuck Hypotheses */}
            <Card>
              <CardHeader>
                <CardTitle>Выпадающие гипотезы</CardTitle>
                <CardDescription>Застряли более чем на 2× SLA-лимит</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Команда</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead className="text-right">Дней</TableHead>
                      <TableHead className="text-right">Лимит</TableHead>
                      <TableHead>Ответственный</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stuckHypotheses.map((hyp) => (
                      <TableRow key={hyp.id}>
                        <TableCell className="font-medium">{hyp.id}</TableCell>
                        <TableCell>{hyp.team}</TableCell>
                        <TableCell>{hyp.status}</TableCell>
                        <TableCell className="text-right text-red-600 font-bold">{hyp.days}</TableCell>
                        <TableCell className="text-right">{hyp.limit}</TableCell>
                        <TableCell>{hyp.owner}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            Открыть
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
