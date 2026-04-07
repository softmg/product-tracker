"use client"

import { useState } from "react"
import { Send, MessageSquare, FileText, Pencil, Check, X, Eye } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { mockNotificationChannels, mockNotificationEvents, roleLabels } from "@/lib/mock-data"
import type { NotificationChannelConfig, NotificationEventConfig, NotificationEventType, UserRole } from "@/lib/types"
import { toast } from "sonner"

const eventTypeLabels: Record<NotificationEventType, string> = {
  status_change: "Смена статуса",
  responsible_assigned: "Назначение ответственного",
  committee_decision: "Решение ПК",
  sla_warning: "Предупреждение SLA",
  sla_violation: "Нарушение SLA",
  artifact_added: "Добавлен артефакт",
  committee_voting_opened: "Открыто голосование ПК",
}

const templateVariables = [
  { name: '{hyp_id}', desc: 'Код гипотезы' },
  { name: '{title}', desc: 'Название гипотезы' },
  { name: '{new_status}', desc: 'Новый статус' },
  { name: '{pm_name}', desc: 'Имя ответственного' },
  { name: '{url}', desc: 'Ссылка на гипотезу' },
  { name: '{decision}', desc: 'Решение комитета' },
  { name: '{days_left}', desc: 'Осталось дней' },
  { name: '{days_overdue}', desc: 'Просрочено дней' },
  { name: '{artifact_name}', desc: 'Название артефакта' },
]

export default function AdminNotificationsPage() {
  const [channels, setChannels] = useState<NotificationChannelConfig>(mockNotificationChannels)
  const [events, setEvents] = useState<NotificationEventConfig[]>(mockNotificationEvents)
  const [editingEvent, setEditingEvent] = useState<NotificationEventConfig | null>(null)
  const [editTemplate, setEditTemplate] = useState("")
  const [previewEvent, setPreviewEvent] = useState<NotificationEventConfig | null>(null)
  const [testingConnection, setTestingConnection] = useState<'telegram' | 'confluence' | null>(null)

  const handleToggleTelegram = () => {
    setChannels(prev => ({
      ...prev,
      telegram: { ...prev.telegram, enabled: !prev.telegram.enabled }
    }))
  }

  const handleToggleConfluence = () => {
    setChannels(prev => ({
      ...prev,
      confluence: { ...prev.confluence, enabled: !prev.confluence.enabled }
    }))
  }

  const handleUpdateTelegramBot = (botToken: string) => {
    setChannels(prev => ({
      ...prev,
      telegram: { ...prev.telegram, botToken }
    }))
  }

  const handleUpdateTelegramChat = (chatId: string) => {
    setChannels(prev => ({
      ...prev,
      telegram: { ...prev.telegram, chatId }
    }))
  }

  const handleUpdateConfluenceSpace = (spaceKey: string) => {
    setChannels(prev => ({
      ...prev,
      confluence: { ...prev.confluence, spaceKey }
    }))
  }

  const handleUpdateConfluencePage = (pageId: string) => {
    setChannels(prev => ({
      ...prev,
      confluence: { ...prev.confluence, pageId }
    }))
  }

  const handleTestConnection = async (channel: 'telegram' | 'confluence') => {
    setTestingConnection(channel)
    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 1500))
    setTestingConnection(null)
    toast.success(`Соединение с ${channel === 'telegram' ? 'Telegram' : 'Confluence'} установлено`)
  }

  const handleToggleEventActive = (id: string) => {
    setEvents(prev => prev.map(e => 
      e.id === id ? { ...e, isActive: !e.isActive } : e
    ))
  }

  const handleEditTemplate = (event: NotificationEventConfig) => {
    setEditingEvent(event)
    setEditTemplate(event.template)
  }

  const handleSaveTemplate = () => {
    if (!editingEvent) return
    setEvents(prev => prev.map(e => 
      e.id === editingEvent.id ? { ...e, template: editTemplate } : e
    ))
    setEditingEvent(null)
    toast.success("Шаблон обновлён")
  }

  const handleToggleRecipient = (eventId: string, role: UserRole) => {
    setEvents(prev => prev.map(e => {
      if (e.id !== eventId) return e
      const recipients = e.recipients.includes(role)
        ? e.recipients.filter(r => r !== role)
        : [...e.recipients, role]
      return { ...e, recipients }
    }))
  }

  const handleSaveAll = () => {
    toast.success("Настройки уведомлений сохранены")
  }

  const renderPreviewMessage = (event: NotificationEventConfig) => {
    let message = event.template
    message = message.replace('{hyp_id}', 'HYP-001')
    message = message.replace('{title}', 'Геймификация онбординга')
    message = message.replace('{new_status}', 'Deep Dive')
    message = message.replace('{pm_name}', 'Maria Petrova')
    message = message.replace('{url}', 'https://tracker.example.com/hypotheses/hyp-001')
    message = message.replace('{decision}', 'GO')
    message = message.replace('{days_left}', '3')
    message = message.replace('{days_overdue}', '2')
    message = message.replace('{artifact_name}', 'competitor_analysis.xlsx')
    return message
  }

  return (
    <>
      <Header breadcrumbs={[{ title: "Admin" }, { title: "Уведомления" }]} />
      
      <main className="flex-1 overflow-auto">
        <div className="container pl-8 pr-8 py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Уведомления</h1>
              <p className="text-sm text-muted-foreground">
                Настройка каналов отправки и шаблонов уведомлений
              </p>
            </div>
            <Button onClick={handleSaveAll}>Сохранить настройки</Button>
          </div>

          {/* Channels Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Каналы отправки</CardTitle>
              </div>
              <CardDescription>
                Настройте подключение к Telegram и Confluence
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Telegram */}
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    <span className="font-medium">Telegram</span>
                  </div>
                  <Switch
                    checked={channels.telegram.enabled}
                    onCheckedChange={handleToggleTelegram}
                  />
                </div>
                {channels.telegram.enabled && (
                  <div className="grid gap-4 pl-7">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bot-token">Bot Token</Label>
                        <Input
                          id="bot-token"
                          type="password"
                          value={channels.telegram.botToken || ''}
                          onChange={(e) => handleUpdateTelegramBot(e.target.value)}
                          placeholder="123456:ABC-DEF..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="chat-id">Chat ID / Group ID</Label>
                        <Input
                          id="chat-id"
                          value={channels.telegram.chatId || ''}
                          onChange={(e) => handleUpdateTelegramChat(e.target.value)}
                          placeholder="-1001234567890"
                        />
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-fit"
                      onClick={() => handleTestConnection('telegram')}
                      disabled={testingConnection === 'telegram'}
                    >
                      {testingConnection === 'telegram' ? 'Проверка...' : 'Проверить соединение'}
                    </Button>
                  </div>
                )}
              </div>

              {/* Confluence */}
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    <span className="font-medium">Confluence</span>
                  </div>
                  <Switch
                    checked={channels.confluence.enabled}
                    onCheckedChange={handleToggleConfluence}
                  />
                </div>
                {channels.confluence.enabled && (
                  <div className="grid gap-4 pl-7">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="space-key">Space Key</Label>
                        <Input
                          id="space-key"
                          value={channels.confluence.spaceKey || ''}
                          onChange={(e) => handleUpdateConfluenceSpace(e.target.value)}
                          placeholder="PRODUCT"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="page-id">Page ID (страница-лог)</Label>
                        <Input
                          id="page-id"
                          value={channels.confluence.pageId || ''}
                          onChange={(e) => handleUpdateConfluencePage(e.target.value)}
                          placeholder="12345678"
                        />
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-fit"
                      onClick={() => handleTestConnection('confluence')}
                      disabled={testingConnection === 'confluence'}
                    >
                      {testingConnection === 'confluence' ? 'Проверка...' : 'Проверить соединение'}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Events Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Таблица событий</CardTitle>
              <CardDescription>
                Настройте активность, получателей и шаблоны для каждого типа события
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Событие</TableHead>
                    <TableHead className="w-24">Активно</TableHead>
                    <TableHead>Получатели</TableHead>
                    <TableHead className="w-48">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id} className={!event.isActive ? "opacity-50" : ""}>
                      <TableCell className="font-medium">
                        {eventTypeLabels[event.eventType]}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={event.isActive}
                          onCheckedChange={() => handleToggleEventActive(event.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(['admin', 'pd_manager', 'initiator', 'analyst', 'tech_lead', 'bizdev', 'committee'] as UserRole[]).map(role => (
                            <Badge
                              key={role}
                              variant={event.recipients.includes(role) ? "default" : "outline"}
                              className="cursor-pointer text-xs"
                              onClick={() => handleToggleRecipient(event.id, role)}
                            >
                              {roleLabels[role]}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTemplate(event)}
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Изменить шаблон
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setPreviewEvent(event)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Preview Section */}
          {previewEvent && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Предпросмотр: {eventTypeLabels[previewEvent.eventType]}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPreviewEvent(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-muted rounded-lg font-mono text-sm whitespace-pre-wrap">
                  {renderPreviewMessage(previewEvent)}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Edit Template Dialog */}
      <Dialog open={!!editingEvent} onOpenChange={(open) => !open && setEditingEvent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Редактировать шаблон</DialogTitle>
            <DialogDescription>
              {editingEvent && eventTypeLabels[editingEvent.eventType]}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Шаблон сообщения</Label>
              <Textarea
                value={editTemplate}
                onChange={(e) => setEditTemplate(e.target.value)}
                rows={4}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">Доступные переменные:</Label>
              <div className="flex flex-wrap gap-2">
                {templateVariables.map(v => (
                  <Badge
                    key={v.name}
                    variant="outline"
                    className="cursor-pointer font-mono text-xs"
                    onClick={() => setEditTemplate(prev => prev + ' ' + v.name)}
                  >
                    {v.name}
                    <span className="ml-1 text-muted-foreground font-normal">— {v.desc}</span>
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Предпросмотр</Label>
              <div className="p-3 bg-muted rounded-lg font-mono text-sm">
                {editingEvent && renderPreviewMessage({ ...editingEvent, template: editTemplate })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingEvent(null)}>
              Отмена
            </Button>
            <Button onClick={handleSaveTemplate}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
