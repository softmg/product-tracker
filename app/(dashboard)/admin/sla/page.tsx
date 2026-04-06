"use client"

import { useState } from "react"
import { Clock, AlertTriangle, CheckCircle, Bell } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatusBadge } from "@/components/hypotheses/status-badge"
import { mockSLAConfigs, mockSLANotificationConfig, mockStatusConfigs } from "@/lib/mock-data"
import type { HypothesisStatus, SLAConfig, SLANotificationConfig } from "@/lib/types"
import { toast } from "sonner"

export default function AdminSLAPage() {
  const [slaConfigs, setSlaConfigs] = useState<SLAConfig[]>(mockSLAConfigs)
  const [notificationConfig, setNotificationConfig] = useState<SLANotificationConfig>(mockSLANotificationConfig)

  const handleUpdateLimit = (id: string, limitDays: number) => {
    setSlaConfigs(prev => prev.map(c => 
      c.id === id ? { ...c, limitDays } : c
    ))
  }

  const handleUpdateWarning = (id: string, warningDays: number) => {
    setSlaConfigs(prev => prev.map(c => 
      c.id === id ? { ...c, warningDays } : c
    ))
  }

  const handleToggleActive = (id: string) => {
    setSlaConfigs(prev => prev.map(c => 
      c.id === id ? { ...c, isActive: !c.isActive } : c
    ))
  }

  const handleToggleNotification = (key: keyof SLANotificationConfig) => {
    setNotificationConfig(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleSaveAll = () => {
    toast.success("Настройки SLA сохранены")
  }

  const getStatusName = (status: HypothesisStatus) => {
    const config = mockStatusConfigs.find(s => s.id === status)
    return config?.name || status
  }

  return (
    <>
      <Header breadcrumbs={[{ title: "Admin" }, { title: "SLA" }]} />
      
      <main className="flex-1 overflow-auto">
        <div className="container pl-8 pr-8 py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">SLA</h1>
              <p className="text-sm text-muted-foreground">
                Настройка лимитов времени и уведомлений при нарушении SLA
              </p>
            </div>
            <Button onClick={handleSaveAll}>Сохранить настройки</Button>
          </div>

          {/* SLA Limits Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Лимиты по статусам</CardTitle>
              </div>
              <CardDescription>
                Настройте максимальное время нахождения гипотезы в каждом статусе
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Статус</TableHead>
                    <TableHead className="w-36">Лимит (дней)</TableHead>
                    <TableHead className="w-48">Предупреждение за (дней)</TableHead>
                    <TableHead className="w-24">Активен</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {slaConfigs.map((config) => (
                    <TableRow key={config.id} className={!config.isActive ? "opacity-50" : ""}>
                      <TableCell>
                        <StatusBadge status={config.status} />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={config.limitDays}
                          onChange={(e) => handleUpdateLimit(config.id, parseInt(e.target.value) || 0)}
                          min={0}
                          className="w-24 h-8"
                          disabled={!config.isActive}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={config.warningDays}
                          onChange={(e) => handleUpdateWarning(config.id, parseInt(e.target.value) || 0)}
                          min={0}
                          max={config.limitDays}
                          className="w-24 h-8"
                          disabled={!config.isActive}
                        />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={config.isActive}
                          onCheckedChange={() => handleToggleActive(config.id)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Реакция при нарушении</CardTitle>
              </div>
              <CardDescription>
                Настройте кого уведомлять при нарушении SLA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Кого уведомить при просрочке</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="notify-responsible"
                      checked={notificationConfig.notifyResponsible}
                      onCheckedChange={() => handleToggleNotification('notifyResponsible')}
                    />
                    <Label htmlFor="notify-responsible" className="font-normal">
                      Ответственный PM
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="notify-initiator"
                      checked={notificationConfig.notifyInitiator}
                      onCheckedChange={() => handleToggleNotification('notifyInitiator')}
                    />
                    <Label htmlFor="notify-initiator" className="font-normal">
                      Инициатор
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="notify-admin"
                      checked={notificationConfig.notifyAdmin}
                      onCheckedChange={() => handleToggleNotification('notifyAdmin')}
                    />
                    <Label htmlFor="notify-admin" className="font-normal">
                      Администратор
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="notify-all"
                      checked={notificationConfig.notifyAllParticipants}
                      onCheckedChange={() => handleToggleNotification('notifyAllParticipants')}
                    />
                    <Label htmlFor="notify-all" className="font-normal">
                      Все участники
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-sm">Правила отображения бейджа в интерфейсе</h4>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
                    <div className="flex h-3 w-3 rounded-full bg-green-500" />
                    <span className="text-sm font-medium">В срок</span>
                    <span className="text-sm text-muted-foreground">(до предупреждения)</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
                    <div className="flex h-3 w-3 rounded-full bg-amber-500" />
                    <span className="text-sm font-medium">Предупреждение</span>
                    <span className="text-sm text-muted-foreground">(за N дней до истечения)</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
                    <div className="flex h-3 w-3 rounded-full bg-red-500" />
                    <span className="text-sm font-medium">Нарушение</span>
                    <span className="text-sm text-muted-foreground">(после истечения лимита)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-base">Предпросмотр бейджей SLA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Badge variant="outline" className="border-green-500 text-green-600 gap-1">
                  <CheckCircle className="h-3 w-3" />
                  В срок (5 дней осталось)
                </Badge>
                <Badge variant="outline" className="border-amber-500 text-amber-600 gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Предупреждение (2 дня осталось)
                </Badge>
                <Badge variant="outline" className="border-red-500 text-red-600 gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Просрочено (3 дня)
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}
