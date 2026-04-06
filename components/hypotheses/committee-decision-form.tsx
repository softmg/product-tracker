"use client"

import { useState } from "react"
import { 
  FileText, 
  BarChart3, 
  FlaskConical, 
  ScrollText,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertTriangle,
  Check
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { 
  getActiveCommitteeMembers, 
  mockUsers 
} from "@/lib/mock-data"
import type { Hypothesis, CommitteeVote, ProductCommitteeMember } from "@/lib/types"

interface CommitteeDecisionFormProps {
  hypothesis: Hypothesis
  onTabChange?: (tab: string) => void
  readOnly?: boolean
}

type VoteValue = 'go' | 'no_go' | 'iterate' | null
type DecisionValue = 'go' | 'no_go' | 'pivot'

const voteOptions: { value: VoteValue; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'go', label: 'Go', icon: <CheckCircle2 className="h-4 w-4" />, color: 'text-green-600' },
  { value: 'no_go', label: 'No-Go', icon: <XCircle className="h-4 w-4" />, color: 'text-red-600' },
  { value: 'iterate', label: 'Iterate', icon: <RefreshCw className="h-4 w-4" />, color: 'text-amber-600' },
]

export function CommitteeDecisionForm({ 
  hypothesis, 
  onTabChange,
  readOnly = false 
}: CommitteeDecisionFormProps) {
  const committeeMembers = getActiveCommitteeMembers()
  
  // Initialize votes from hypothesis or create empty votes
  const initialVotes: Record<string, { vote: VoteValue; comment: string }> = {}
  committeeMembers.forEach(member => {
    const existingVote = hypothesis.committeeVotes?.find(v => v.memberId === member.id)
    initialVotes[member.id] = {
      vote: existingVote?.vote || null,
      comment: existingVote?.comment || ''
    }
  })
  
  const [votes, setVotes] = useState(initialVotes)
  const [finalDecision, setFinalDecision] = useState<DecisionValue | ''>(hypothesis.decision?.result || '')
  const [actionPlan, setActionPlan] = useState(hypothesis.decision?.actionPlan || '')
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  
  const isDecisionMade = !!hypothesis.decision?.result
  
  const handleVoteChange = (memberId: string, vote: VoteValue) => {
    setVotes(prev => ({
      ...prev,
      [memberId]: { ...prev[memberId], vote }
    }))
  }
  
  const handleCommentChange = (memberId: string, comment: string) => {
    setVotes(prev => ({
      ...prev,
      [memberId]: { ...prev[memberId], comment }
    }))
  }
  
  const getVoteSummary = () => {
    const summary = { go: 0, no_go: 0, iterate: 0, pending: 0 }
    Object.values(votes).forEach(v => {
      if (v.vote === 'go') summary.go++
      else if (v.vote === 'no_go') summary.no_go++
      else if (v.vote === 'iterate') summary.iterate++
      else summary.pending++
    })
    return summary
  }
  
  const summary = getVoteSummary()
  const allVoted = summary.pending === 0
  
  const handleConfirmDecision = () => {
    if (!finalDecision) return
    
    // Mock save - in real app would call API
    console.log("[v0] Finalizing decision:", { 
      decision: finalDecision, 
      actionPlan,
      votes 
    })
    
    // After decision:
    // - Go -> status: реализация
    // - No-Go -> status: архив
    // - Pivot/Iterate -> status: deep_dive or experiment
    
    setIsConfirmDialogOpen(false)
  }
  
  const getNextStatusText = () => {
    switch (finalDecision) {
      case 'go': return 'Гипотеза перейдёт в статус "Реализация"'
      case 'no_go': return 'Гипотеза будет перемещена в "Архив"'
      case 'pivot': return 'Гипотеза вернётся на этап "Deep Dive" или "Эксперимент"'
      default: return ''
    }
  }
  
  const getMemberUser = (member: ProductCommitteeMember) => {
    return mockUsers.find(u => u.id === member.userId)
  }

  return (
    <div className="space-y-6">
      {/* Quick Links to Materials */}
      <Card>
        <CardHeader>
          <CardTitle>Материалы для комитета</CardTitle>
          <CardDescription>Быстрые ссылки на артефакты гипотезы</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button 
              variant="outline" 
              onClick={() => onTabChange?.('passport')}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Паспорт
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onTabChange?.('overview')}
              className="gap-2"
            >
              <ScrollText className="h-4 w-4" />
              Артефакты
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onTabChange?.('scoring')}
              className="gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Скоринг
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onTabChange?.('experiments')}
              className="gap-2"
            >
              <FlaskConical className="h-4 w-4" />
              Эксперименты ({hypothesis.committeeVotes?.length || 0})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Voting Summary */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Go
            </CardDescription>
            <CardTitle className="text-2xl text-green-600">{summary.go}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <XCircle className="h-4 w-4 text-red-600" />
              No-Go
            </CardDescription>
            <CardTitle className="text-2xl text-red-600">{summary.no_go}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <RefreshCw className="h-4 w-4 text-amber-600" />
              Iterate
            </CardDescription>
            <CardTitle className="text-2xl text-amber-600">{summary.iterate}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              Ожидание
            </CardDescription>
            <CardTitle className="text-2xl text-muted-foreground">{summary.pending}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Voting Table */}
      <Card>
        <CardHeader>
          <CardTitle>Голосование комитета</CardTitle>
          <CardDescription>
            {committeeMembers.length} участников из настроек Продуктового комитета
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {committeeMembers.map((member) => {
              const user = getMemberUser(member)
              const memberVote = votes[member.id]
              
              return (
                <div key={member.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {user?.name?.split(' ').map(n => n[0]).join('') || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user?.name || 'Неизвестный'}</p>
                        <p className="text-sm text-muted-foreground">{member.displayRole}</p>
                      </div>
                    </div>
                    
                    {memberVote?.vote && (
                      <Badge 
                        variant={
                          memberVote.vote === 'go' ? 'default' : 
                          memberVote.vote === 'no_go' ? 'destructive' : 
                          'secondary'
                        }
                        className={
                          memberVote.vote === 'go' ? 'bg-green-600' : 
                          memberVote.vote === 'iterate' ? 'bg-amber-500' : 
                          ''
                        }
                      >
                        {memberVote.vote === 'go' ? 'Go' : 
                         memberVote.vote === 'no_go' ? 'No-Go' : 
                         'Iterate'}
                      </Badge>
                    )}
                  </div>
                  
                  {!isDecisionMade && !readOnly && (
                    <>
                      <RadioGroup
                        value={memberVote?.vote || ''}
                        onValueChange={(value) => handleVoteChange(member.id, value as VoteValue)}
                        className="flex gap-4"
                      >
                        {voteOptions.map((option) => (
                          <div key={option.value} className="flex items-center space-x-2">
                            <RadioGroupItem 
                              value={option.value || ''} 
                              id={`${member.id}-${option.value}`} 
                            />
                            <Label 
                              htmlFor={`${member.id}-${option.value}`}
                              className={`flex items-center gap-1.5 cursor-pointer ${option.color}`}
                            >
                              {option.icon}
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                      
                      <Textarea
                        placeholder="Комментарий к голосу..."
                        value={memberVote?.comment || ''}
                        onChange={(e) => handleCommentChange(member.id, e.target.value)}
                        rows={2}
                        className="resize-none"
                      />
                    </>
                  )}
                  
                  {(isDecisionMade || readOnly) && memberVote?.comment && (
                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                      {memberVote.comment}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Final Decision */}
      <Card>
        <CardHeader>
          <CardTitle>Итоговое решение</CardTitle>
          <CardDescription>
            {isDecisionMade 
              ? `Решение принято ${hypothesis.decision?.decidedAt ? new Date(hypothesis.decision.decidedAt).toLocaleDateString('ru-RU') : ''}`
              : 'Выберите итоговое решение на основе голосования'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isDecisionMade ? (
            <>
              <div className="flex items-center gap-3">
                <Badge 
                  variant={
                    hypothesis.decision?.result === 'go' ? 'default' : 
                    hypothesis.decision?.result === 'no_go' ? 'destructive' : 
                    'secondary'
                  }
                  className={`text-lg px-4 py-2 ${
                    hypothesis.decision?.result === 'go' ? 'bg-green-600' : 
                    hypothesis.decision?.result === 'pivot' ? 'bg-amber-500' : 
                    ''
                  }`}
                >
                  {hypothesis.decision?.result === 'go' ? 'Go' : 
                   hypothesis.decision?.result === 'no_go' ? 'No-Go' : 
                   'Iterate / Pivot'}
                </Badge>
              </div>
              
              {hypothesis.decision?.actionPlan && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">План действий</Label>
                  <div className="bg-muted/50 p-4 rounded-md">
                    <p className="text-sm whitespace-pre-wrap">{hypothesis.decision.actionPlan}</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="final-decision">Решение</Label>
                <Select 
                  value={finalDecision} 
                  onValueChange={(value) => setFinalDecision(value as DecisionValue)}
                  disabled={readOnly}
                >
                  <SelectTrigger id="final-decision">
                    <SelectValue placeholder="Выберите решение" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="go">
                      <span className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        Go - в реализацию
                      </span>
                    </SelectItem>
                    <SelectItem value="no_go">
                      <span className="flex items-center gap-2 text-red-600">
                        <XCircle className="h-4 w-4" />
                        No-Go - в архив
                      </span>
                    </SelectItem>
                    <SelectItem value="pivot">
                      <span className="flex items-center gap-2 text-amber-600">
                        <RefreshCw className="h-4 w-4" />
                        Iterate - доработать
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="action-plan">План действий</Label>
                <Textarea
                  id="action-plan"
                  placeholder="Опишите следующие шаги и ответственных..."
                  value={actionPlan}
                  onChange={(e) => setActionPlan(e.target.value)}
                  rows={4}
                  disabled={readOnly}
                />
              </div>
              
              {finalDecision && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {getNextStatusText()}
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-end gap-3">
                <Button
                  onClick={() => setIsConfirmDialogOpen(true)}
                  disabled={!finalDecision || readOnly}
                  className={
                    finalDecision === 'go' ? 'bg-green-600 hover:bg-green-700' :
                    finalDecision === 'no_go' ? 'bg-red-600 hover:bg-red-700' :
                    finalDecision === 'pivot' ? 'bg-amber-500 hover:bg-amber-600' :
                    ''
                  }
                >
                  <Check className="h-4 w-4 mr-2" />
                  Зафиксировать решение
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Подтвердить решение?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Вы собираетесь зафиксировать решение: <strong>
                  {finalDecision === 'go' ? 'Go' : 
                   finalDecision === 'no_go' ? 'No-Go' : 
                   'Iterate / Pivot'}
                </strong>
              </p>
              <p className="text-amber-600">
                {getNextStatusText()}
              </p>
              <p>
                Это действие нельзя отменить. Все заинтересованные лица получат уведомление.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDecision}
              className={
                finalDecision === 'go' ? 'bg-green-600 hover:bg-green-700' :
                finalDecision === 'no_go' ? 'bg-red-600 hover:bg-red-700' :
                finalDecision === 'pivot' ? 'bg-amber-500 hover:bg-amber-600' :
                ''
              }
            >
              Подтвердить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
