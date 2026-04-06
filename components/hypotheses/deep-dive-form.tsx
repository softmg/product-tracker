"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  CheckCircle2, 
  Circle, 
  Upload, 
  File, 
  Trash2, 
  MessageSquare, 
  Send,
  ChevronDown,
  ChevronUp,
  Users,
  Lock,
  FileText,
  Image as ImageIcon,
  FileAudio
} from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { useAuth } from "@/lib/auth-context"
import { getActiveDeepDiveStages, getRequiredDeepDiveStages, roleLabels } from "@/lib/mock-data"
import type { DeepDiveData, DeepDiveStageData, DeepDiveComment, DeepDiveFile } from "@/lib/types"
import { RespondentCRM } from "./respondent-crm"

interface DeepDiveFormProps {
  hypothesisId?: string
  initialData?: DeepDiveData
  onSave?: (data: DeepDiveData) => void
  readOnly?: boolean
}

export function DeepDiveForm({ hypothesisId, initialData, onSave, readOnly = false }: DeepDiveFormProps) {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const stageConfigs = getActiveDeepDiveStages()
  const requiredStages = getRequiredDeepDiveStages()

  // Initialize stage data
  const initStageData = (): DeepDiveStageData[] => {
    return stageConfigs.map(config => {
      const existing = initialData?.stages?.find(s => s.stageId === config.id)
      return existing || {
        stageId: config.id,
        description: "",
        isCompleted: false,
        comments: [],
        files: [],
      }
    })
  }

  const [stagesData, setStagesData] = useState<DeepDiveStageData[]>(initStageData())
  const [expandedStage, setExpandedStage] = useState<string | null>(stageConfigs[0]?.id || null)
  const [newComments, setNewComments] = useState<Record<string, string>>({})
  const [uploadingStage, setUploadingStage] = useState<string | null>(null)
  const [isCRMOpen, setIsCRMOpen] = useState(false)

  const getStageData = (stageId: string): DeepDiveStageData => {
    return stagesData.find(s => s.stageId === stageId) || {
      stageId,
      description: "",
      isCompleted: false,
      comments: [],
      files: [],
    }
  }

  const updateStageData = (stageId: string, updates: Partial<DeepDiveStageData>) => {
    setStagesData(prev => prev.map(s => 
      s.stageId === stageId ? { ...s, ...updates } : s
    ))
  }

  const handleDescriptionChange = (stageId: string, value: string) => {
    updateStageData(stageId, { description: value })
  }

  const toggleCompleted = (stageId: string) => {
    const stage = getStageData(stageId)
    updateStageData(stageId, { 
      isCompleted: !stage.isCompleted,
      completedAt: !stage.isCompleted ? new Date().toISOString() : undefined,
      completedBy: !stage.isCompleted ? user?.id : undefined,
    })
  }

  const addComment = (stageId: string) => {
    const text = newComments[stageId]?.trim()
    if (!text || !user) return

    const newComment: DeepDiveComment = {
      id: `comment-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      text,
      createdAt: new Date().toISOString(),
    }

    const stage = getStageData(stageId)
    updateStageData(stageId, { 
      comments: [...stage.comments, newComment] 
    })
    setNewComments(prev => ({ ...prev, [stageId]: "" }))
  }

  const handleFileUpload = (stageId: string, files: FileList | null) => {
    if (!files || !user) return

    const newFiles: DeepDiveFile[] = Array.from(files).map(file => ({
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      url: URL.createObjectURL(file), // In real app, would upload to storage
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
      uploadedBy: user.name,
    }))

    const stage = getStageData(stageId)
    updateStageData(stageId, { 
      files: [...stage.files, ...newFiles] 
    })
    setUploadingStage(null)
  }

  const removeFile = (stageId: string, fileId: string) => {
    const stage = getStageData(stageId)
    updateStageData(stageId, { 
      files: stage.files.filter(f => f.id !== fileId) 
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />
    if (type.startsWith('audio/')) return <FileAudio className="h-4 w-4" />
    if (type.includes('pdf') || type.includes('document')) return <FileText className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  // Calculate progress
  const completedCount = stagesData.filter(s => s.isCompleted).length
  const completedRequiredCount = stagesData.filter(s => {
    const config = stageConfigs.find(c => c.id === s.stageId)
    return s.isCompleted && config?.isRequired
  }).length
  const progress = stageConfigs.length > 0 ? (completedCount / stageConfigs.length) * 100 : 0
  const requiredProgress = requiredStages.length > 0 
    ? (completedRequiredCount / requiredStages.length) * 100 
    : 100

  const canProceed = completedRequiredCount === requiredStages.length

  const handleSave = () => {
    const data: DeepDiveData = {
      stages: stagesData,
      completedAt: canProceed ? new Date().toISOString() : undefined,
      completedBy: canProceed ? user?.id : undefined,
    }
    onSave?.(data)
  }

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Прогресс Deep Dive</CardTitle>
              <CardDescription>
                Заполните все обязательные подэтапы для перехода к эксперименту
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{completedCount}/{stageConfigs.length}</div>
              <div className="text-sm text-muted-foreground">подэтапов выполнено</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Общий прогресс</span>
              <span className="font-mono">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Обязательные подэтапы
              </span>
              <span className="font-mono">{completedRequiredCount}/{requiredStages.length}</span>
            </div>
            <Progress 
              value={requiredProgress} 
              className={`h-2 ${requiredProgress === 100 ? '[&>div]:bg-green-500' : '[&>div]:bg-amber-500'}`} 
            />
          </div>

          {!canProceed && (
            <div className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3">
              Для перехода на стадию &quot;Эксперимент&quot; необходимо выполнить все обязательные подэтапы
            </div>
          )}

          {canProceed && (
            <div className="text-sm text-green-600 bg-green-50 dark:bg-green-950/20 rounded-lg p-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Все обязательные подэтапы выполнены. Можно переходить к эксперименту.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stages */}
      <div className="space-y-4">
        {stageConfigs.map((config, index) => {
          const stageData = getStageData(config.id)
          const isExpanded = expandedStage === config.id

          return (
            <Collapsible 
              key={config.id} 
              open={isExpanded}
              onOpenChange={(open) => setExpandedStage(open ? config.id : null)}
            >
              <Card className={stageData.isCompleted ? "border-green-200 bg-green-50/30 dark:border-green-900 dark:bg-green-950/10" : ""}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-base">{config.name}</CardTitle>
                          {config.isRequired ? (
                            <Badge variant="default" className="text-xs">Обязательный</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Опциональный</Badge>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            <Users className="mr-1 h-3 w-3" />
                            {roleLabels[config.responsibleRole]}
                          </Badge>
                          {stageData.isCompleted && (
                            <Badge variant="default" className="text-xs bg-green-500">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Выполнен
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="mt-1">{config.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-muted-foreground text-sm">
                          <MessageSquare className="h-4 w-4" />
                          {stageData.comments.length}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground text-sm">
                          <File className="h-4 w-4" />
                          {stageData.files.length}
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="space-y-6 pt-0">
                    {/* Description */}
                    <div className="space-y-2">
                      <Label>Описание / Результаты</Label>
                      <Textarea
                        value={stageData.description}
                        onChange={(e) => handleDescriptionChange(config.id, e.target.value)}
                        placeholder="Опишите результаты работы на этом этапе..."
                        rows={4}
                        disabled={readOnly}
                        className="resize-none"
                      />
                      {stageData.description && (
                        <p className="text-xs text-muted-foreground">
                          {stageData.description.trim().split(/\s+/).length} слов
                        </p>
                      )}
                    </div>

                    {/* CRM Button for "Поиск респондентов" stage (stage-2) */}
                    {config.id === 'stage-2' && hypothesisId && (
                      <div className="p-4 border rounded-lg bg-muted/30">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">CRM Респондентов</p>
                            <p className="text-xs text-muted-foreground">
                              Управление базой респондентов для интервью
                            </p>
                          </div>
                          <Button onClick={() => setIsCRMOpen(true)}>
                            <Users className="mr-2 h-4 w-4" />
                            Открыть CRM
                          </Button>
                        </div>
                      </div>
                    )}

                    <Separator />

                    {/* Files */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <File className="h-4 w-4" />
                          Файлы и артефакты
                        </Label>
                        {!readOnly && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setUploadingStage(config.id)
                              fileInputRef.current?.click()
                            }}
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Загрузить
                          </Button>
                        )}
                      </div>
                      
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          if (uploadingStage) {
                            handleFileUpload(uploadingStage, e.target.files)
                          }
                        }}
                      />

                      {stageData.files.length > 0 ? (
                        <div className="grid gap-2">
                          {stageData.files.map((file) => (
                            <div 
                              key={file.id}
                              className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                            >
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background border">
                                {getFileIcon(file.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatFileSize(file.size)} • {file.uploadedBy}
                                </p>
                              </div>
                              {!readOnly && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => removeFile(config.id, file.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground text-center py-4 border rounded-lg border-dashed">
                          Файлы не загружены
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Comments */}
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Комментарии
                        {stageData.comments.length > 0 && (
                          <Badge variant="secondary">{stageData.comments.length}</Badge>
                        )}
                      </Label>

                      {/* Add Comment */}
                      {!readOnly && (
                        <div className="flex gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 flex gap-2">
                            <Input
                              placeholder="Добавить комментарий..."
                              value={newComments[config.id] || ""}
                              onChange={(e) => setNewComments(prev => ({ 
                                ...prev, 
                                [config.id]: e.target.value 
                              }))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault()
                                  addComment(config.id)
                                }
                              }}
                            />
                            <Button 
                              size="icon" 
                              onClick={() => addComment(config.id)}
                              disabled={!newComments[config.id]?.trim()}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Comments List */}
                      {stageData.comments.length > 0 ? (
                        <div className="space-y-3 mt-3">
                          {stageData.comments.map((comment) => (
                            <div key={comment.id} className="flex gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">
                                  {comment.userName.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">{comment.userName}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(comment.createdAt).toLocaleDateString('ru-RU', {
                                      day: 'numeric',
                                      month: 'short',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">{comment.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          Комментариев пока нет
                        </p>
                      )}
                    </div>

                    <Separator />

                    {/* Complete Toggle */}
                    {!readOnly && (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Отметить как выполненный</p>
                          <p className="text-xs text-muted-foreground">
                            {config.isRequired 
                              ? "Обязателен для перехода на следующую стадию" 
                              : "Опциональный этап"
                            }
                          </p>
                        </div>
                        <Button
                          variant={stageData.isCompleted ? "default" : "outline"}
                          onClick={() => toggleCompleted(config.id)}
                          className={stageData.isCompleted ? "bg-green-500 hover:bg-green-600" : ""}
                        >
                          {stageData.isCompleted ? (
                            <>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Выполнен
                            </>
                          ) : (
                            <>
                              <Circle className="mr-2 h-4 w-4" />
                              Отметить выполненным
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )
        })}
      </div>

      {!readOnly && (
        <div className="flex justify-end gap-3">
          <Button variant="outline">Сохранить черновик</Button>
          <Button onClick={handleSave} disabled={!canProceed}>
            {canProceed ? "Завершить Deep Dive" : "Выполните обязательные этапы"}
          </Button>
        </div>
      )}

      {/* CRM Sheet */}
      {hypothesisId && (
        <Sheet open={isCRMOpen} onOpenChange={setIsCRMOpen}>
          <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle>CRM Респондентов</SheetTitle>
              <SheetDescription>
                Управление базой респондентов для проведения интервью
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              <RespondentCRM hypothesisId={hypothesisId} readOnly={readOnly} />
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  )
}
