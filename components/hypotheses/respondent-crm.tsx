"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { 
  Plus, 
  Users, 
  Phone, 
  Mail, 
  Building2, 
  Briefcase, 
  Calendar, 
  Clock, 
  Video, 
  MessageSquare,
  FileAudio,
  FileText,
  StickyNote,
  Link as LinkIcon,
  Tag,
  Quote,
  Download,
  X,
  ChevronRight,
  AlertCircle,
  ArrowLeft
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Respondent, RespondentStatus, RespondentPain, PainSummary, User } from "@/lib/types"

const MIN_INTERVIEWS_REQUIRED = 5

const respondentStatusConfig: Record<string, { label: string; color: string }> = {
  new: { label: "Новый", color: "bg-slate-100 text-slate-700" },
  in_contact: { label: "В контакте", color: "bg-blue-100 text-blue-700" },
  scheduled: { label: "Запланирован", color: "bg-amber-100 text-amber-700" },
  completed: { label: "Завершён", color: "bg-green-100 text-green-700" },
  refused: { label: "Отказ", color: "bg-red-100 text-red-700" },
}

const emptyUsers: User[] = []

const getRespondentsByHypothesisId = (_hypothesisId: string): Respondent[] => {
  return []
}

const getPainSummaryByHypothesisId = (_hypothesisId: string): PainSummary[] => {
  return []
}

const getCompletedInterviewsCount = (_hypothesisId: string): number => {
  return 0
}

const mockUsers = emptyUsers

interface RespondentCRMProps {
  hypothesisId: string
  readOnly?: boolean
}

export function RespondentCRM({ hypothesisId, readOnly = false }: RespondentCRMProps) {
  const [respondents, setRespondents] = useState<Respondent[]>(
    getRespondentsByHypothesisId(hypothesisId)
  )
  const [selectedRespondent, setSelectedRespondent] = useState<Respondent | null>(null)
  const [view, setView] = useState<'list' | 'detail'>('list')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'table' | 'pains'>('table')
  
  const completedCount = getCompletedInterviewsCount(hypothesisId)
  const painSummary = getPainSummaryByHypothesisId(hypothesisId)
  const progress = Math.min((completedCount / MIN_INTERVIEWS_REQUIRED) * 100, 100)
  
  const handleRespondentClick = (respondent: Respondent) => {
    setSelectedRespondent(respondent)
    setView('detail')
  }
  
  const handleBackToList = () => {
    setView('list')
    setSelectedRespondent(null)
  }
  
  const handleStatusChange = (respondentId: string, newStatus: RespondentStatus) => {
    setRespondents(prev => prev.map(r => 
      r.id === respondentId ? { ...r, status: newStatus, updatedAt: new Date().toISOString() } : r
    ))
    if (selectedRespondent?.id === respondentId) {
      setSelectedRespondent(prev => prev ? { ...prev, status: newStatus } : null)
    }
  }
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
    })
  }
  
  const isScheduledSoon = (respondent: Respondent) => {
    if (respondent.status !== 'scheduled' || !respondent.interviewDate) return false
    const today = new Date()
    const interviewDate = new Date(respondent.interviewDate)
    const diffDays = Math.ceil((interviewDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays >= 0 && diffDays <= 1
  }

  // Detail view
  if (view === 'detail' && selectedRespondent) {
    return (
      <div className="space-y-6 px-2">
        <RespondentDetailView 
          respondent={selectedRespondent}
          onStatusChange={handleStatusChange}
          readOnly={readOnly}
          onBack={handleBackToList}
        />
      </div>
    )
  }

  // List view
  return (
    <div className="space-y-6 px-2">
      {/* Progress Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                CRM Респондентов
              </CardTitle>
              <CardDescription>
                Управление респондентами для проведения интервью
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{completedCount}/{MIN_INTERVIEWS_REQUIRED}</div>
              <div className="text-sm text-muted-foreground">интервью проведено</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Прогресс интервью</span>
              <span className="font-mono">{completedCount}/{MIN_INTERVIEWS_REQUIRED}</span>
            </div>
            <Progress 
              value={progress} 
              className={cn(
                "h-2",
                progress >= 100 ? "[&>div]:bg-green-500" : "[&>div]:bg-primary"
              )} 
            />
          </div>
          
          {progress >= 100 ? (
            <div className="text-sm text-green-600 bg-green-50 dark:bg-green-950/20 rounded-lg p-3">
              Минимальное количество интервью проведено. Можно переходить к анализу болей.
            </div>
          ) : (
            <div className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3">
              Необходимо провести ещё {MIN_INTERVIEWS_REQUIRED - completedCount} интервью
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'table' | 'pains')}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="table">Респонденты</TabsTrigger>
            <TabsTrigger value="pains">
              Сводка болей
              {painSummary.length > 0 && (
                <Badge variant="secondary" className="ml-1.5">{painSummary.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          {!readOnly && activeTab === 'table' && (
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Добавить респондента
            </Button>
          )}
        </div>

        {/* Respondents Table */}
        <TabsContent value="table" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Имя</TableHead>
                    <TableHead>Компания</TableHead>
                    <TableHead>Должность</TableHead>
                    <TableHead>Контакт</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead className="text-center">Боли</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {respondents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Респонденты не ��обавлены
                      </TableCell>
                    </TableRow>
                  ) : (
                    respondents.map((respondent) => (
                      <TableRow 
                        key={respondent.id}
                        className={cn(
                          "cursor-pointer hover:bg-muted/50 transition-colors",
                          respondent.status === 'refused' && "opacity-50",
                          isScheduledSoon(respondent) && "bg-amber-50 dark:bg-amber-950/20"
                        )}
                        onClick={() => handleRespondentClick(respondent)}
                      >
                        <TableCell className="font-medium">{respondent.name}</TableCell>
                        <TableCell>{respondent.company}</TableCell>
                        <TableCell>{respondent.position}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span className="text-xs truncate max-w-[120px]">{respondent.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary" 
                            className={cn("text-xs", respondentStatusConfig[respondent.status].color)}
                          >
                            {respondent.status === 'completed' && '✓ '}
                            {respondentStatusConfig[respondent.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(respondent.interviewDate)}
                          {isScheduledSoon(respondent) && (
                            <AlertCircle className="inline ml-1 h-3 w-3 text-amber-500" />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {respondent.pains.length > 0 ? (
                            <Badge variant="outline">{respondent.pains.length}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          {/* Export Button */}
          {respondents.length > 0 && (
            <div className="flex justify-end mt-4">
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Экспорт в Excel
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Pain Summary */}
        <TabsContent value="pains" className="mt-4">
          <PainSummaryView 
            painSummary={painSummary} 
            totalInterviews={completedCount}
            minRequired={MIN_INTERVIEWS_REQUIRED}
          />
        </TabsContent>
      </Tabs>

      {/* Add Respondent Dialog */}
      <AddRespondentDialog 
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        hypothesisId={hypothesisId}
        onAdd={(newRespondent) => {
          setRespondents(prev => [...prev, newRespondent])
          setIsAddDialogOpen(false)
        }}
      />
    </div>
  )
}

// Pain Summary View Component
interface PainSummaryViewProps {
  painSummary: PainSummary[]
  totalInterviews: number
  minRequired: number
}

function PainSummaryView({ painSummary, totalInterviews, minRequired }: PainSummaryViewProps) {
  const confirmedThreshold = 3 // Pain is confirmed if mentioned by >= 3 respondents
  
  if (painSummary.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Tag className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Боли ещё не зафиксированы</p>
          <p className="text-sm mt-1">Проведите интервью и добавьте выявленные боли</p>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Агрегированные боли</CardTitle>
        <CardDescription>
          Боли, упомянутые респондентами. Боль считается подтверждённой при упоминании {confirmedThreshold}+ раз.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {painSummary.map((pain) => {
          const percentage = (pain.count / totalInterviews) * 100
          const isConfirmed = pain.count >= confirmedThreshold
          
          return (
            <div key={pain.tag} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={isConfirmed ? "default" : "outline"}
                    className={cn(
                      isConfirmed && "bg-green-500 hover:bg-green-600"
                    )}
                  >
                    {pain.tag}
                  </Badge>
                  {isConfirmed && (
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                      Подтверждена
                    </Badge>
                  )}
                </div>
                <span className="text-sm font-mono">
                  {pain.count}/{totalInterviews}
                </span>
              </div>
              <Progress 
                value={percentage} 
                className={cn(
                  "h-2",
                  isConfirmed ? "[&>div]:bg-green-500" : "[&>div]:bg-primary"
                )} 
              />
              <div className="flex flex-wrap gap-1">
                {pain.respondentNames.map((name, idx) => (
                  <span key={idx} className="text-xs text-muted-foreground">
                    {name}{idx < pain.respondentNames.length - 1 ? ',' : ''}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
        
        {/* Auto-checklist note */}
        <Separator className="my-4" />
        <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
          <strong>Автоматическая связь с чек-листом:</strong> если боль упомянута {'>'}= {confirmedThreshold} раз 
          из {minRequired} интервью, пункт «Подтверждённая боль» в Deep Dive чек-листе отмечается автоматически.
        </div>
      </CardContent>
    </Card>
  )
}

// Respondent Detail View Component (full panel view)
interface RespondentDetailViewProps {
  respondent: Respondent
  onStatusChange: (id: string, status: RespondentStatus) => void
  readOnly: boolean
  onBack: () => void
}

function RespondentDetailView({ respondent, onStatusChange, readOnly, onBack }: RespondentDetailViewProps) {
  const [isAddingPain, setIsAddingPain] = useState(false)
  const [newPainTag, setNewPainTag] = useState("")
  const [newPainQuote, setNewPainQuote] = useState("")
  
  const interviewer = respondent.interviewerUserId 
    ? mockUsers.find(u => u.id === respondent.interviewerUserId) 
    : null
  
  const formatInterviewFormat = (format?: string) => {
    switch (format) {
      case 'zoom': return 'Zoom'
      case 'in_person': return 'Очно'
      case 'phone': return 'Телефон'
      default: return '-'
    }
  }

  return (
    <>
      {/* Back button and header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold">{respondent.name}</h2>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {respondent.company}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Contact Information */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Контактные данные
          </h4>
          <div className="grid gap-3 text-sm">
            <div className="flex items-center gap-3">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span>{respondent.position}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a href={`mailto:${respondent.email}`} className="text-primary hover:underline">
                {respondent.email}
              </a>
            </div>
            {respondent.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${respondent.phone}`} className="text-primary hover:underline">
                  {respondent.phone}
                </a>
              </div>
            )}
            <div className="flex items-center gap-3">
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Источник: {respondent.contactSource}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Status */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Статус работы
          </h4>
          <div className="grid gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Статус</span>
              {readOnly ? (
                <Badge className={respondentStatusConfig[respondent.status].color}>
                  {respondentStatusConfig[respondent.status].label}
                </Badge>
              ) : (
                <Select 
                  value={respondent.status} 
                  onValueChange={(value) => onStatusChange(respondent.id, value as RespondentStatus)}
                >
                  <SelectTrigger className="w-[140px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(respondentStatusConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            {respondent.interviewDate && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Дата интервью</span>
                <span>{new Date(respondent.interviewDate).toLocaleDateString('ru-RU')}</span>
              </div>
            )}
            {respondent.interviewDuration && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Длительность</span>
                <span>{respondent.interviewDuration} мин</span>
              </div>
            )}
            {interviewer && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Интервьюер</span>
                <span>{interviewer.name}</span>
              </div>
            )}
            {respondent.interviewFormat && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Формат</span>
                <div className="flex items-center gap-1">
                  <Video className="h-3 w-3" />
                  <span>{formatInterviewFormat(respondent.interviewFormat)}</span>
                </div>
              </div>
            )}
            {respondent.recordingUrl && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Запись</span>
                <a 
                  href={respondent.recordingUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  <LinkIcon className="h-3 w-3" />
                  Открыть
                </a>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Pains */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Зафиксированные боли
              {respondent.pains.length > 0 && (
                <Badge variant="secondary">{respondent.pains.length}</Badge>
              )}
            </h4>
            {!readOnly && respondent.status === 'completed' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsAddingPain(true)}
              >
                <Plus className="mr-1 h-3 w-3" />
                Добавить
              </Button>
            )}
          </div>
          
          {isAddingPain && (
            <Card className="p-3 space-y-3">
              <div className="space-y-2">
                <Label>Тег боли</Label>
                <Input 
                  placeholder="например: ценообразование"
                  value={newPainTag}
                  onChange={(e) => setNewPainTag(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Цитата из интервью</Label>
                <Textarea 
                  placeholder="Прямая цитата респондента..."
                  value={newPainQuote}
                  onChange={(e) => setNewPainQuote(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm"
                  disabled={!newPainTag.trim() || !newPainQuote.trim()}
                  onClick={() => {
                    // Would add pain in real app
                    setNewPainTag("")
                    setNewPainQuote("")
                    setIsAddingPain(false)
                  }}
                >
                  Сохранить
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setNewPainTag("")
                    setNewPainQuote("")
                    setIsAddingPain(false)
                  }}
                >
                  Отмена
                </Button>
              </div>
            </Card>
          )}
          
          {respondent.pains.length > 0 ? (
            <div className="space-y-3">
              {respondent.pains.map((pain) => (
                <div 
                  key={pain.id} 
                  className="p-3 rounded-lg border bg-muted/30 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{pain.tag}</Badge>
                  </div>
                  <div className="flex gap-2 text-sm text-muted-foreground">
                    <Quote className="h-4 w-4 shrink-0 mt-0.5" />
                    <p className="italic">&quot;{pain.quote}&quot;</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              {respondent.status === 'completed' 
                ? 'Боли не зафиксированы. Добавьте выявленные боли.'
                : 'Боли будут доступны после проведения интервью'}
            </p>
          )}
        </div>

        <Separator />

        {/* Artifacts */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Артефакты
          </h4>
          
          {respondent.artifacts.length > 0 ? (
            <div className="space-y-2">
              {respondent.artifacts.map((artifact) => (
                <div 
                  key={artifact.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-background border">
                    {artifact.type === 'audio' && <FileAudio className="h-4 w-4" />}
                    {artifact.type === 'transcript' && <FileText className="h-4 w-4" />}
                    {artifact.type === 'notes' && <StickyNote className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{artifact.name}</p>
                    <p className="text-xs text-muted-foreground">{artifact.uploadedBy}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Артефакты не загружены
            </p>
          )}
        </div>
      </div>
    </>
  )
}

// Add Respondent Dialog
interface AddRespondentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  hypothesisId: string
  onAdd: (respondent: Respondent) => void
}

function AddRespondentDialog({ open, onOpenChange, hypothesisId, onAdd }: AddRespondentDialogProps) {
  const [name, setName] = useState("")
  const [company, setCompany] = useState("")
  const [position, setPosition] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [contactSource, setContactSource] = useState("")
  
  const handleSubmit = () => {
    const newRespondent: Respondent = {
      id: `resp-${Date.now()}`,
      hypothesisId,
      name,
      company,
      position,
      email,
      phone: phone || undefined,
      contactSource,
      status: 'new',
      pains: [],
      artifacts: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    onAdd(newRespondent)
    // Reset form
    setName("")
    setCompany("")
    setPosition("")
    setEmail("")
    setPhone("")
    setContactSource("")
  }
  
  const isValid = name.trim() && company.trim() && email.trim() && contactSource.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Добавить респондента</DialogTitle>
          <DialogDescription>
            Заполните контактные данные нового респондента
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Имя *</Label>
              <Input 
                id="name"
                placeholder="Иванов Иван"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Компания *</Label>
              <Input 
                id="company"
                placeholder="ООО Компания"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="position">Должность</Label>
            <Input 
              id="position"
              placeholder="Product Manager"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input 
                id="email"
                type="email"
                placeholder="email@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Телефон</Label>
              <Input 
                id="phone"
                placeholder="+7 (999) 123-45-67"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="source">Источник контакта *</Label>
            <Input 
              id="source"
              placeholder="LinkedIn / Рекомендация / Конференция..."
              value={contactSource}
              onChange={(e) => setContactSource(e.target.value)}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid}>
            Добавить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
