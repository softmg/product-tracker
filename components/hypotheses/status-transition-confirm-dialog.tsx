"use client"

import { ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { StatusBadge } from "./status-badge"
import type { HypothesisStatus } from "@/lib/types"

interface StatusTransitionConfirmDialogProps {
  open: boolean
  currentStatus: HypothesisStatus
  targetStatus: HypothesisStatus | null
  isLoading: boolean
  decisionResult: "go" | "no_go" | "iterate" | ""
  decisionComment: string
  nextStep: "deep_dive" | "done" | ""
  onOpenChange: (open: boolean) => void
  onDecisionResultChange: (value: "go" | "no_go" | "iterate" | "") => void
  onDecisionCommentChange: (value: string) => void
  onNextStepChange: (value: "deep_dive" | "done" | "") => void
  onConfirm: () => void
}

export function StatusTransitionConfirmDialog({
  open,
  currentStatus,
  targetStatus,
  isLoading,
  decisionResult,
  decisionComment,
  nextStep,
  onOpenChange,
  onDecisionResultChange,
  onDecisionCommentChange,
  onNextStepChange,
  onConfirm,
}: StatusTransitionConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Подтверждение перехода</DialogTitle>
          <DialogDescription>
            {targetStatus && (
              <span className="mt-2 flex items-center gap-2">
                <StatusBadge status={currentStatus} />
                <ArrowRight className="h-4 w-4" />
                <StatusBadge status={targetStatus} />
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {currentStatus === "go_no_go" && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Финальное решение</Label>
              <RadioGroup value={decisionResult} onValueChange={(value) => onDecisionResultChange(value as "go" | "no_go" | "iterate" | "")}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="go" id="go" />
                  <Label htmlFor="go">Go - запуск в реализацию</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no_go" id="no_go" />
                  <Label htmlFor="no_go">No-Go - закрыть гипотезу</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="iterate" id="iterate" />
                  <Label htmlFor="iterate">Iterate - доработать и повторить</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="decision-comment">Комментарий комитета</Label>
              <Textarea
                id="decision-comment"
                placeholder="Укажите причины решения..."
                value={decisionComment}
                onChange={(event) => onDecisionCommentChange(event.target.value)}
              />
            </div>

            {decisionResult === "iterate" && (
              <div className="space-y-2">
                <Label>Следующий шаг</Label>
                <RadioGroup value={nextStep} onValueChange={(value) => onNextStepChange(value as "deep_dive" | "done" | "") }>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="deep_dive" id="back_deep_dive" />
                    <Label htmlFor="back_deep_dive">Вернуть в Deep Dive</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="done" id="to_archive" />
                    <Label htmlFor="to_archive">Перевести в Архив</Label>
                  </div>
                </RadioGroup>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={onConfirm} disabled={isLoading || (currentStatus === "go_no_go" && !decisionResult)}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Подтвердить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
