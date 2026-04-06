// Product Tracker Types

export type UserRole = 'admin' | 'po' | 'viewer'

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: UserRole
  teamId: string
  isActive: boolean
  createdAt: string
  lastLoginAt?: string
}

export type HypothesisStatus = 
  | 'backlog' 
  | 'scoring' 
  | 'deep_dive' 
  | 'experiment' 
  | 'analysis' 
  | 'go_no_go' 
  | 'done'

export interface Comment {
  id: string
  hypothesisId: string
  userId: string
  userName: string
  text: string
  createdAt: string
}

export interface Hypothesis {
  id: string
  code: string // e.g., "HYP-001"
  title: string
  description: string
  status: HypothesisStatus
  teamId: string
  ownerId: string
  deadline?: string // SLA deadline
  createdAt: string
  updatedAt: string
  
  // Scoring
  scoring?: HypothesisScoring
  
  // Deep Dive
  deepDive?: DeepDiveData
  
  // Passport
  passport?: PassportData
  
  // Decision
  decision?: {
    result: 'go' | 'no_go' | 'pivot'
    comment?: string
    decidedAt?: string
    decidedBy?: string
    actionPlan?: string
  }
  
  // Committee Votes
  committeeVotes?: CommitteeVote[]
  
  // Risks, Resources, Recommendations
  risks?: HypothesisRisk[]
  resources?: HypothesisResource[]
  recommendations?: HypothesisRecommendation[]
}

// Deep Dive Stage Configuration
export interface DeepDiveStageConfig {
  id: string
  name: string
  description: string
  order: number
  isRequired: boolean
  responsibleRole: UserRole
  isActive: boolean
}

// Deep Dive Stage Data (filled by user)
export interface DeepDiveStageData {
  stageId: string
  description: string
  isCompleted: boolean
  completedAt?: string
  completedBy?: string
  comments: DeepDiveComment[]
  files: DeepDiveFile[]
}

export interface DeepDiveComment {
  id: string
  userId: string
  userName: string
  text: string
  createdAt: string
}

export interface DeepDiveFile {
  id: string
  name: string
  url: string
  size: number
  type: string
  uploadedAt: string
  uploadedBy: string
}

export interface DeepDiveData {
  stages?: DeepDiveStageData[]
  completedAt?: string
  completedBy?: string
  // Legacy fields for backward compatibility
  problem?: string
  targetAudience?: string
  metrics?: string
  risks?: string
  resources?: string
  timeline?: string
}

export interface PassportData {
  summary: string
  keyFindings: string
  recommendations: string
  nextSteps: string
  generatedAt?: string
}

// Risks for hypothesis
export interface HypothesisRisk {
  id: string
  title: string
  description: string
  severity: 1 | 2 | 3 | 4 | 5 // 1 - low, 5 - critical
  createdAt: string
  createdBy: string
}

// Resources for hypothesis
export interface HypothesisResource {
  id: string
  title: string
  description: string
  url: string
  createdAt: string
  createdBy: string
}

// Recommendations for hypothesis
export interface HypothesisRecommendation {
  id: string
  title: string
  description: string
  createdAt: string
  createdBy: string
}

export type ExperimentType = 'a_b_test' | 'survey' | 'interview' | 'prototype' | 'mvp' | 'other'
export type ExperimentStatus = 'planned' | 'running' | 'completed' | 'cancelled'

export interface ExperimentMetric {
  id: string
  name: string
  targetValue: string
  actualValue?: string
  unit?: string // e.g., '%', 'шт', 'руб'
  result?: 'success' | 'failure' | 'inconclusive'
}

export interface ExperimentLink {
  id: string
  type: 'landing' | 'form' | 'campaign' | 'other'
  title: string
  url: string
}

export interface ExperimentFile {
  id: string
  name: string
  url: string
  size: number
  type: string
  uploadedAt: string
  uploadedBy: string
}

export interface Experiment {
  id: string
  hypothesisId: string
  title: string
  type: ExperimentType
  status: ExperimentStatus
  description: string
  // Multiple metrics support
  metrics: ExperimentMetric[]
  // Legacy single metric fields (for backward compatibility)
  metric?: string
  targetValue?: string
  actualValue?: string
  // Results
  whatWorked?: string
  whatDidNotWork?: string
  // Links and files
  links?: ExperimentLink[]
  files?: ExperimentFile[]
  // Dates
  startDate: string
  endDate: string
  result?: 'success' | 'failure' | 'inconclusive'
  notes?: string
  createdAt: string
  createdBy: string
  responsibleUserId?: string
}

export interface Team {
  id: string
  name: string
  description?: string
  memberCount: number
  createdAt: string
}

export type ScoringInputType = 'slider' | 'number' | 'checkbox'

export interface ScoringCriterion {
  id: string
  name: string
  description: string
  inputType: ScoringInputType
  minValue: number
  maxValue: number
  weight: number
  isActive: boolean
  // For number type (TAM/SOM) - thresholds for normalizing to 1-5
  thresholds?: number[]
  // For checkbox type - if checked, score becomes 0 (disqualification)
  isStopFactor?: boolean
}

export interface HypothesisScoring {
  criteriaScores: Record<string, number> // criterionId -> score (1-5 or normalized)
  stopFactorTriggered: boolean
  totalScore: number
  scoredAt?: string
  scoredBy?: string
}

export interface AuditLogEntry {
  id: string
  entityType: 'hypothesis' | 'experiment' | 'user' | 'team' | 'settings'
  entityId: string
  action: 'create' | 'update' | 'delete' | 'status_change'
  changes: Record<string, { old: unknown; new: unknown }>
  userId: string
  userName: string
  timestamp: string
}

export interface StatusConfig {
  id: HypothesisStatus
  name: string
  description: string
  order: number
  color: string
  isActive: boolean
}

// Product Committee Member
export interface ProductCommitteeMember {
  id: string
  userId: string
  displayRole: string // e.g., "CPO", "CEO", "Tech Lead"
  order: number
  isActive: boolean
  createdAt: string
}

// Committee Vote
export interface CommitteeVote {
  id: string
  memberId: string // ProductCommitteeMember id
  vote: 'go' | 'no_go' | 'iterate' | null
  comment?: string
  votedAt?: string
}

// Status Transition Configuration
export type TransitionConditionType = 'required_fields' | 'scoring_threshold' | 'checklist_closed' | 'none'

export interface StatusTransition {
  id: string
  fromStatus: HypothesisStatus
  toStatus: HypothesisStatus
  allowedRoles: UserRole[]
  conditionType: TransitionConditionType
  conditionValue?: string // e.g., threshold value, field list
  isActive: boolean
}

// Scoring Threshold Configuration
export interface ScoringThresholdConfig {
  primaryThreshold: number // for Deep Dive transition
  deepThreshold: number // for Experiment transition
}

// SLA Configuration
export interface SLAConfig {
  id: string
  status: HypothesisStatus
  limitDays: number
  warningDays: number
  isActive: boolean
}

export interface SLANotificationConfig {
  notifyResponsible: boolean
  notifyInitiator: boolean
  notifyAdmin: boolean
  notifyAllParticipants: boolean
}

// Notification Configuration
export type NotificationChannel = 'telegram' | 'confluence'
export type NotificationEventType = 
  | 'status_change' 
  | 'responsible_assigned' 
  | 'committee_decision' 
  | 'sla_warning' 
  | 'sla_violation' 
  | 'artifact_added' 
  | 'committee_voting_opened'

export interface NotificationChannelConfig {
  telegram: {
    enabled: boolean
    botToken?: string
    chatId?: string
  }
  confluence: {
    enabled: boolean
    spaceKey?: string
    pageId?: string
  }
}

export interface NotificationEventConfig {
  id: string
  eventType: NotificationEventType
  isActive: boolean
  recipients: UserRole[]
  template: string
}

// Notification types
export type NotificationType = 
  | 'status_change'
  | 'responsible_assigned'
  | 'sla_violation'
  | 'sla_warning'
  | 'committee_voting_opened'
  | 'committee_decision'
  | 'artifact_added'
  | 'comment_added'

export interface Notification {
  id: string
  type: NotificationType
  hypothesisId: string
  hypothesisCode: string
  hypothesisTitle: string
  message: string
  details?: string
  initiator: string // user name or 'система'
  isRead: boolean
  createdAt: string
}

// Respondent CRM Types for Deep Dive
export type RespondentStatus = 'new' | 'in_contact' | 'scheduled' | 'completed' | 'refused'

export interface RespondentPain {
  id: string
  tag: string // pain tag from global dictionary or free-tagging
  quote: string // quote from interview
  createdAt: string
}

export interface RespondentArtifact {
  id: string
  type: 'audio' | 'transcript' | 'notes'
  name: string
  url: string
  uploadedAt: string
  uploadedBy: string
}

export interface Respondent {
  id: string
  hypothesisId: string
  name: string
  company: string
  position: string
  email: string
  phone?: string
  contactSource: string // LinkedIn / recommendation / conference / free text
  status: RespondentStatus
  interviewDate?: string
  interviewDuration?: number // minutes
  interviewerUserId?: string
  interviewFormat?: 'zoom' | 'in_person' | 'phone'
  recordingUrl?: string
  pains: RespondentPain[]
  artifacts: RespondentArtifact[]
  createdAt: string
  updatedAt: string
}

export interface PainSummary {
  tag: string
  count: number
  respondentNames: string[]
}

// UI Types
export interface NavItem {
  title: string
  href: string
  icon: string
  badge?: number
  children?: NavItem[]
}

export interface FilterOption {
  value: string
  label: string
}

export interface TableColumn<T> {
  key: keyof T | string
  title: string
  sortable?: boolean
  width?: string
  render?: (value: unknown, row: T) => React.ReactNode
}
