"use client"

import { useState } from "react"
import { 
  AlertTriangle, 
  Link2, 
  Lightbulb, 
  Plus, 
  Trash2, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Shield
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useAuth } from "@/lib/auth-context"
import type { HypothesisRisk, HypothesisResource, HypothesisRecommendation } from "@/lib/types"

interface RisksResourcesFormProps {
  risks?: HypothesisRisk[]
  resources?: HypothesisResource[]
  recommendations?: HypothesisRecommendation[]
  readOnly?: boolean
}

const severityConfig = {
  1: { label: 'Низкий', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  2: { label: 'Умеренный', color: 'bg-sky-500/10 text-sky-600 border-sky-500/20' },
  3: { label: 'Средний', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  4: { label: 'Высокий', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  5: { label: 'Критический', color: 'bg-red-500/10 text-red-600 border-red-500/20' },
}

export function RisksResourcesForm({ 
  risks: initialRisks = [], 
  resources: initialResources = [], 
  recommendations: initialRecommendations = [],
  readOnly = false 
}: RisksResourcesFormProps) {
  const { user } = useAuth()
  
  const [risks, setRisks] = useState<HypothesisRisk[]>(initialRisks)
  const [resources, setResources] = useState<HypothesisResource[]>(initialResources)
  const [recommendations, setRecommendations] = useState<HypothesisRecommendation[]>(initialRecommendations)
  
  // Dialog states
  const [isRiskDialogOpen, setIsRiskDialogOpen] = useState(false)
  const [isResourceDialogOpen, setIsResourceDialogOpen] = useState(false)
  const [isRecommendationDialogOpen, setIsRecommendationDialogOpen] = useState(false)
  
  // Form states
  const [newRisk, setNewRisk] = useState({ title: '', description: '', severity: 3 as 1 | 2 | 3 | 4 | 5 })
  const [newResource, setNewResource] = useState({ title: '', description: '', url: '' })
  const [newRecommendation, setNewRecommendation] = useState({ title: '', description: '' })
  
  // Collapsible states
  const [risksOpen, setRisksOpen] = useState(true)
  const [resourcesOpen, setResourcesOpen] = useState(true)
  const [recommendationsOpen, setRecommendationsOpen] = useState(true)

  const handleAddRisk = () => {
    if (!newRisk.title.trim()) return
    
    const risk: HypothesisRisk = {
      id: `risk-${Date.now()}`,
      title: newRisk.title,
      description: newRisk.description,
      severity: newRisk.severity,
      createdAt: new Date().toISOString(),
      createdBy: user?.id || ''
    }
    
    setRisks([...risks, risk])
    setNewRisk({ title: '', description: '', severity: 3 })
    setIsRiskDialogOpen(false)
  }
  
  const handleDeleteRisk = (id: string) => {
    setRisks(risks.filter(r => r.id !== id))
  }
  
  const handleAddResource = () => {
    if (!newResource.title.trim() || !newResource.url.trim()) return
    
    const resource: HypothesisResource = {
      id: `res-${Date.now()}`,
      title: newResource.title,
      description: newResource.description,
      url: newResource.url,
      createdAt: new Date().toISOString(),
      createdBy: user?.id || ''
    }
    
    setResources([...resources, resource])
    setNewResource({ title: '', description: '', url: '' })
    setIsResourceDialogOpen(false)
  }
  
  const handleDeleteResource = (id: string) => {
    setResources(resources.filter(r => r.id !== id))
  }
  
  const handleAddRecommendation = () => {
    if (!newRecommendation.title.trim()) return
    
    const recommendation: HypothesisRecommendation = {
      id: `rec-${Date.now()}`,
      title: newRecommendation.title,
      description: newRecommendation.description,
      createdAt: new Date().toISOString(),
      createdBy: user?.id || ''
    }
    
    setRecommendations([...recommendations, recommendation])
    setNewRecommendation({ title: '', description: '' })
    setIsRecommendationDialogOpen(false)
  }
  
  const handleDeleteRecommendation = (id: string) => {
    setRecommendations(recommendations.filter(r => r.id !== id))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Risks Section */}
      <Card>
        <Collapsible open={risksOpen} onOpenChange={setRisksOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Риски</CardTitle>
                    <CardDescription>
                      {risks.length} {risks.length === 1 ? 'риск' : risks.length >= 2 && risks.length <= 4 ? 'риска' : 'рисков'}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!readOnly && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsRiskDialogOpen(true)
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Добавить
                    </Button>
                  )}
                  {risksOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              {risks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Риски не добавлены</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {risks.sort((a, b) => b.severity - a.severity).map((risk) => (
                    <div 
                      key={risk.id} 
                      className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{risk.title}</h4>
                          <Badge 
                            variant="outline" 
                            className={severityConfig[risk.severity].color}
                          >
                            {severityConfig[risk.severity].label}
                          </Badge>
                        </div>
                        {risk.description && (
                          <p className="text-sm text-muted-foreground">{risk.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Добавлено {formatDate(risk.createdAt)}
                        </p>
                      </div>
                      {!readOnly && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteRisk(risk.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Resources Section */}
      <Card>
        <Collapsible open={resourcesOpen} onOpenChange={setResourcesOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Link2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Ресурсы</CardTitle>
                    <CardDescription>
                      {resources.length} {resources.length === 1 ? 'ресурс' : resources.length >= 2 && resources.length <= 4 ? 'ресурса' : 'ресурсов'}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!readOnly && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsResourceDialogOpen(true)
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Добавить
                    </Button>
                  )}
                  {resourcesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              {resources.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Link2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Ресурсы не добавлены</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {resources.map((resource) => (
                    <div 
                      key={resource.id} 
                      className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{resource.title}</h4>
                          <a 
                            href={resource.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        {resource.description && (
                          <p className="text-sm text-muted-foreground">{resource.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground truncate max-w-md">
                          {resource.url}
                        </p>
                      </div>
                      {!readOnly && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteResource(resource.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Recommendations Section */}
      <Card>
        <Collapsible open={recommendationsOpen} onOpenChange={setRecommendationsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Lightbulb className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Рекомендации</CardTitle>
                    <CardDescription>
                      {recommendations.length} {recommendations.length === 1 ? 'рекомендация' : recommendations.length >= 2 && recommendations.length <= 4 ? 'рекомендации' : 'рекомендаций'}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!readOnly && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsRecommendationDialogOpen(true)
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Добавить
                    </Button>
                  )}
                  {recommendationsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              {recommendations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Lightbulb className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Рекомендации не добавлены</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recommendations.map((rec) => (
                    <div 
                      key={rec.id} 
                      className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex-1 space-y-2">
                        <h4 className="font-medium">{rec.title}</h4>
                        {rec.description && (
                          <p className="text-sm text-muted-foreground">{rec.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Добавлено {formatDate(rec.createdAt)}
                        </p>
                      </div>
                      {!readOnly && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteRecommendation(rec.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Add Risk Dialog */}
      <Dialog open={isRiskDialogOpen} onOpenChange={setIsRiskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить риск</DialogTitle>
            <DialogDescription>
              Укажите потенциальный риск для гипотезы
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="risk-title">Название *</Label>
              <Input
                id="risk-title"
                placeholder="Например: Техническая сложность"
                value={newRisk.title}
                onChange={(e) => setNewRisk({ ...newRisk, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="risk-description">Описание</Label>
              <Textarea
                id="risk-description"
                placeholder="Подробное описание риска..."
                value={newRisk.description}
                onChange={(e) => setNewRisk({ ...newRisk, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="risk-severity">Уровень риска *</Label>
              <Select 
                value={String(newRisk.severity)} 
                onValueChange={(v) => setNewRisk({ ...newRisk, severity: Number(v) as 1 | 2 | 3 | 4 | 5 })}
              >
                <SelectTrigger id="risk-severity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Низкий</SelectItem>
                  <SelectItem value="2">2 - Умеренный</SelectItem>
                  <SelectItem value="3">3 - Средний</SelectItem>
                  <SelectItem value="4">4 - Высокий</SelectItem>
                  <SelectItem value="5">5 - Критический</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRiskDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleAddRisk} disabled={!newRisk.title.trim()}>
              Добавить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Resource Dialog */}
      <Dialog open={isResourceDialogOpen} onOpenChange={setIsResourceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить ресурс</DialogTitle>
            <DialogDescription>
              Добавьте полезную ссылку или материал
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="resource-title">Название *</Label>
              <Input
                id="resource-title"
                placeholder="Например: Исследование рынка"
                value={newResource.title}
                onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resource-description">Описание</Label>
              <Textarea
                id="resource-description"
                placeholder="Краткое описание ресурса..."
                value={newResource.description}
                onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resource-url">Ссылка *</Label>
              <Input
                id="resource-url"
                type="url"
                placeholder="https://..."
                value={newResource.url}
                onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResourceDialogOpen(false)}>
              Отмена
            </Button>
            <Button 
              onClick={handleAddResource} 
              disabled={!newResource.title.trim() || !newResource.url.trim()}
            >
              Добавить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Recommendation Dialog */}
      <Dialog open={isRecommendationDialogOpen} onOpenChange={setIsRecommendationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить рекомендацию</DialogTitle>
            <DialogDescription>
              Добавьте рекомендацию по гипотезе
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rec-title">Название *</Label>
              <Input
                id="rec-title"
                placeholder="Например: Провести A/B тест"
                value={newRecommendation.title}
                onChange={(e) => setNewRecommendation({ ...newRecommendation, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rec-description">Описание</Label>
              <Textarea
                id="rec-description"
                placeholder="Подробное описание рекомендации..."
                value={newRecommendation.description}
                onChange={(e) => setNewRecommendation({ ...newRecommendation, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRecommendationDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleAddRecommendation} disabled={!newRecommendation.title.trim()}>
              Добавить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
