import type { 
  User, 
  Team, 
  Hypothesis, 
  Experiment, 
  ScoringCriterion, 
  StatusConfig,
  AuditLogEntry,
  Comment,
  DeepDiveStageConfig,
  ProductCommitteeMember,
  StatusTransition,
  ScoringThresholdConfig,
  SLAConfig,
  SLANotificationConfig,
  NotificationChannelConfig,
  NotificationEventConfig,
  Notification,
  Respondent,
  PainSummary,
  UserRole
} from './types'

// Teams
export const mockTeams: Team[] = [
  { id: 'team-1', name: 'Growth', description: 'Growth and acquisition team', memberCount: 5, createdAt: '2024-01-01' },
  { id: 'team-2', name: 'Product', description: 'Core product development', memberCount: 8, createdAt: '2024-01-01' },
  { id: 'team-3', name: 'Platform', description: 'Platform and infrastructure', memberCount: 4, createdAt: '2024-01-15' },
  { id: 'team-4', name: 'Mobile', description: 'Mobile applications', memberCount: 3, createdAt: '2024-02-01' },
]

// Users
export const mockUsers: User[] = [
  { 
    id: 'user-1', 
    email: 'admin@company.com', 
    name: 'Alexey Ivanov', 
    role: 'admin', 
    teamId: 'team-1', 
    isActive: true, 
    createdAt: '2024-01-01',
    lastLoginAt: '2024-03-15',
    avatar: undefined
  },
  {
    id: 'user-2',
    email: 'po@company.com',
    name: 'Maria Petrova',
    role: 'pd_manager',
    teamId: 'team-2',
    isActive: true,
    createdAt: '2024-01-05',
    lastLoginAt: '2024-03-14',
    avatar: undefined
  },
  {
    id: 'user-3',
    email: 'viewer@company.com',
    name: 'Ivan Sidorov',
    role: 'initiator',
    teamId: 'team-2',
    isActive: true,
    createdAt: '2024-01-10',
    lastLoginAt: '2024-03-10',
    avatar: undefined
  },
  {
    id: 'user-4',
    email: 'po2@company.com',
    name: 'Elena Kozlova',
    role: 'pd_manager',
    teamId: 'team-3',
    isActive: true,
    createdAt: '2024-02-01',
    lastLoginAt: '2024-03-13',
    avatar: undefined
  },
  {
    id: 'user-5',
    email: 'inactive@company.com',
    name: 'Dmitry Volkov',
    role: 'initiator',
    teamId: 'team-1',
    isActive: false,
    createdAt: '2024-01-20',
    lastLoginAt: '2024-02-01',
    avatar: undefined
  },
]

// Hypotheses
export const mockHypotheses: Hypothesis[] = [
  {
    id: 'hyp-1',
    code: 'HYP-001',
    title: 'Gamification of onboarding will increase activation',
    description: 'Adding gamification elements (progress bar, achievements, rewards) to the onboarding process will increase new user activation rate by 15%',
    status: 'experiment',
    teamId: 'team-1',
    ownerId: 'user-2',
    deadline: '2026-04-10',
    createdAt: '2024-02-01',
    updatedAt: '2024-03-10',
    scoring: {
      criteriaScores: {
        'crit-tam': 2000000,
        'crit-som': 300000,
        'crit-market-potential': 4,
        'crit-competency-fit': 4,
        'crit-resource-cost': 3,
        'crit-strategic-fit': 5,
        'crit-stop-factor': 0
      },
      stopFactorTriggered: false,
      totalScore: 336,
      scoredAt: '2024-02-15',
      scoredBy: 'user-2'
    },
    deepDive: {
      stages: [
        {
          stageId: 'stage-1',
          description: 'Проанализированы 5 конкурентов. Все используют геймификацию в онбординге.',
          isCompleted: true,
          completedAt: '2024-02-10',
          completedBy: 'user-2',
          comments: [
            { id: 'c1', userId: 'user-2', userName: 'Maria Petrova', text: 'Добавила сравнительную таблицу конкурентов', createdAt: '2024-02-10T10:00:00' }
          ],
          files: [
            { id: 'f1', name: 'competitor_analysis.xlsx', url: '#', size: 245000, type: 'application/xlsx', uploadedAt: '2024-02-10', uploadedBy: 'Maria Petrova' }
          ]
        },
        {
          stageId: 'stage-2',
          description: 'Собрана база из 25 потенциальных респондентов',
          isCompleted: true,
          completedAt: '2024-02-11',
          completedBy: 'user-2',
          comments: [],
          files: []
        },
        {
          stageId: 'stage-3',
          description: 'Проведено 5 интервью. Основная боль - непонятность 3 шага.',
          isCompleted: true,
          completedAt: '2024-02-13',
          completedBy: 'user-2',
          comments: [
            { id: 'c2', userId: 'user-1', userName: 'Alexey Ivanov', text: 'Отличная работа!', createdAt: '2024-02-13T15:00:00' }
          ],
          files: [
            { id: 'f2', name: 'interview_1.mp3', url: '#', size: 15000000, type: 'audio/mpeg', uploadedAt: '2024-02-12', uploadedBy: 'Maria Petrova' },
            { id: 'f3', name: 'interview_2.mp3', url: '#', size: 12000000, type: 'audio/mpeg', uploadedAt: '2024-02-12', uploadedBy: 'Maria Petrova' }
          ]
        },
        {
          stageId: 'stage-4',
          description: '',
          isCompleted: false,
          comments: [],
          files: []
        },
        {
          stageId: 'stage-5',
          description: 'LTV = $150, CAC = $30, положительная юнит-экономика',
          isCompleted: true,
          completedAt: '2024-02-14',
          completedBy: 'user-2',
          comments: [],
          files: [
            { id: 'f4', name: 'financial_model.xlsx', url: '#', size: 180000, type: 'application/xlsx', uploadedAt: '2024-02-14', uploadedBy: 'Maria Petrova' }
          ]
        },
        {
          stageId: 'stage-6',
          description: 'Backend: 2 недели, Frontend: 2 недели, Аналитика: 1 неделя',
          isCompleted: true,
          completedAt: '2024-02-14',
          completedBy: 'user-2',
          comments: [],
          files: []
        },
        {
          stageId: 'stage-7',
          description: 'Паспорт сгенерирован автоматически',
          isCompleted: true,
          completedAt: '2024-02-15',
          completedBy: 'user-1',
          comments: [],
          files: []
        }
      ],
      completedAt: '2024-02-15',
      completedBy: 'user-2',
      // Legacy fields for backward compatibility
      problem: 'Current onboarding has 40% drop-off rate at step 3',
      targetAudience: 'New users in first 7 days',
      metrics: 'Activation rate, time to first value, completion rate',
      risks: 'Development complexity, potential performance impact',
      resources: '2 developers, 1 designer for 3 weeks',
      timeline: '4 weeks including testing'
    },
    risks: [
      {
        id: 'risk-1',
        title: 'Перегрузка интерфейса',
        description: 'Добавление геймификации может усложнить UI и отвлечь пользователей от основных задач',
        severity: 3,
        createdAt: '2024-02-05',
        createdBy: 'user-2'
      },
      {
        id: 'risk-2',
        title: 'Техническая сложность',
        description: 'Реализация системы достижений требует значительных изменений в архитектуре',
        severity: 4,
        createdAt: '2024-02-06',
        createdBy: 'user-1'
      },
      {
        id: 'risk-3',
        title: 'Негативное восприятие',
        description: 'Часть B2B-аудитории может воспринять геймификацию как несерьёзный подход',
        severity: 2,
        createdAt: '2024-02-07',
        createdBy: 'user-2'
      }
    ],
    resources: [
      {
        id: 'res-1',
        title: 'Исследование Gartner',
        description: 'Отчёт о влиянии геймификации на вовлечённость пользователей в SaaS',
        url: 'https://gartner.com/research/gamification-2024',
        createdAt: '2024-02-03',
        createdBy: 'user-2'
      },
      {
        id: 'res-2',
        title: 'Конкурентный анализ',
        description: 'Таблица сравнения геймификации у конкурентов',
        url: 'https://docs.google.com/spreadsheets/d/abc123',
        createdAt: '2024-02-04',
        createdBy: 'user-2'
      },
      {
        id: 'res-3',
        title: 'Прототип в Figma',
        description: 'Макеты прогресс-бара и системы достижений',
        url: 'https://figma.com/file/xyz789',
        createdAt: '2024-02-08',
        createdBy: 'user-4'
      }
    ],
    recommendations: [
      {
        id: 'rec-1',
        title: 'Начать с минимальной версии',
        description: 'Реализовать только прогресс-бар на первом этапе, без полной системы достижений',
        createdAt: '2024-02-10',
        createdBy: 'user-1'
      },
      {
        id: 'rec-2',
        title: 'A/B тест на 10% аудитории',
        description: 'Провести тестирование на небольшой выборке перед полным раскатом',
        createdAt: '2024-02-11',
        createdBy: 'user-2'
      }
    ]
  },
  {
    id: 'hyp-2',
    code: 'HYP-002',
    title: 'Push notifications will increase retention',
    description: 'Personalized push notifications about user activity will increase D7 retention by 10%',
    status: 'scoring',
    teamId: 'team-1',
    ownerId: 'user-2',
    createdAt: '2024-02-15',
    updatedAt: '2024-02-15',
    scoring: {
      criteriaScores: {
        'crit-tam': 1800000,
        'crit-som': 250000,
        'crit-market-potential': 4,
        'crit-competency-fit': 3,
        'crit-resource-cost': 4,
        'crit-strategic-fit': 4,
        'crit-stop-factor': 0
      },
      stopFactorTriggered: false,
      totalScore: 210,
      scoredAt: '2024-02-20',
      scoredBy: 'user-2'
    }
  },
  {
    id: 'hyp-3',
    code: 'HYP-003',
    title: 'Social login will increase conversion',
    description: 'Adding Google and Apple login options will increase signup conversion by 20%',
    status: 'done',
    teamId: 'team-2',
    ownerId: 'user-2',
    createdAt: '2024-01-10',
    updatedAt: '2024-03-01',
    scoring: {
      criteriaScores: {
        'crit-tam': 5000000,
        'crit-som': 800000,
        'crit-market-potential': 5,
        'crit-competency-fit': 5,
        'crit-resource-cost': 4,
        'crit-strategic-fit': 5,
        'crit-stop-factor': 0
      },
      stopFactorTriggered: false,
      totalScore: 576,
      scoredAt: '2024-01-20',
      scoredBy: 'user-2'
    },
    deepDive: {
      problem: 'High friction during registration process',
      targetAudience: 'All new users',
      metrics: 'Signup conversion, time to register',
      risks: 'Third-party dependency, privacy concerns',
      resources: '1 developer for 2 weeks',
      timeline: '2 weeks',
      completedAt: '2024-01-15',
      completedBy: 'user-2'
    },
    passport: {
      summary: 'Social login implementation was successful, increasing signup conversion by 25%',
      keyFindings: 'Google login is 3x more popular than Apple. Mobile users prefer social login 2x more than desktop.',
      recommendations: 'Roll out to all users, consider adding more providers',
      nextSteps: 'Monitor adoption rates, A/B test button placement',
      generatedAt: '2024-03-01'
    },
    decision: {
      result: 'go',
      comment: 'Exceeded expectations, rolling out to 100% of users',
      decidedAt: '2024-03-01',
      decidedBy: 'user-1'
    }
  },
  {
    id: 'hyp-4',
    code: 'HYP-004',
    title: 'Dark mode will increase engagement',
    description: 'Adding dark mode will increase daily session duration by 5%',
    status: 'backlog',
    teamId: 'team-2',
    ownerId: 'user-4',
    createdAt: '2024-03-01',
    updatedAt: '2024-03-01'
  },
  {
    id: 'hyp-5',
    code: 'HYP-005',
    title: 'Simplified checkout will increase purchases',
    description: 'Reducing checkout steps from 4 to 2 will increase purchase completion by 15%',
    status: 'deep_dive',
    teamId: 'team-2',
    ownerId: 'user-2',
    createdAt: '2024-02-20',
    updatedAt: '2024-03-05',
    scoring: {
      criteriaScores: {
        'crit-tam': 3000000,
        'crit-som': 400000,
        'crit-market-potential': 4,
        'crit-competency-fit': 4,
        'crit-resource-cost': 3,
        'crit-strategic-fit': 4,
        'crit-stop-factor': 0
      },
      stopFactorTriggered: false,
      totalScore: 315,
      scoredAt: '2024-02-22',
      scoredBy: 'user-2'
    },
    deepDive: {
      stages: [
        {
          stageId: 'stage-1',
          description: 'Проанализировано 8 конкурентов. Тренд на упрощение чекаутов.',
          isCompleted: true,
          completedAt: '2024-03-01',
          completedBy: 'user-2',
          comments: [],
          files: []
        },
        {
          stageId: 'stage-2',
          description: 'Подготовлен список из 15 респондентов',
          isCompleted: true,
          completedAt: '2024-03-02',
          completedBy: 'user-2',
          comments: [],
          files: []
        },
        {
          stageId: 'stage-3',
          description: 'Проведено 3 интервью из 5 запланированных',
          isCompleted: false,
          comments: [
            { id: 'c10', userId: 'user-2', userName: 'Maria Petrova', text: 'Нужно провести ещё 2 интервью на этой неделе', createdAt: '2024-03-04T11:00:00' }
          ],
          files: []
        },
        {
          stageId: 'stage-4',
          description: '',
          isCompleted: false,
          comments: [],
          files: []
        },
        {
          stageId: 'stage-5',
          description: '',
          isCompleted: false,
          comments: [],
          files: []
        },
        {
          stageId: 'stage-6',
          description: '',
          isCompleted: false,
          comments: [],
          files: []
        },
        {
          stageId: 'stage-7',
          description: '',
          isCompleted: false,
          comments: [],
          files: []
        }
      ]
    }
  },
  {
    id: 'hyp-6',
    code: 'HYP-006',
    title: 'Recommendation engine will increase AOV',
    description: 'Personalized product recommendations will increase average order value by 12%',
    status: 'analysis',
    teamId: 'team-3',
    ownerId: 'user-4',
    createdAt: '2024-01-25',
    updatedAt: '2024-03-12',
    scoring: {
      criteriaScores: {
        'crit-tam': 1500000,
        'crit-som': 200000,
        'crit-market-potential': 3,
        'crit-competency-fit': 3,
        'crit-resource-cost': 2,
        'crit-strategic-fit': 4,
        'crit-stop-factor': 0
      },
      stopFactorTriggered: false,
      totalScore: 192,
      scoredAt: '2024-01-28',
      scoredBy: 'user-4'
    },
    deepDive: {
      problem: 'Users buy single items, low cross-sell rate',
      targetAudience: 'Active buyers with 2+ purchases',
      metrics: 'AOV, items per order, recommendation CTR',
      risks: 'ML model accuracy, cold start problem',
      resources: '2 ML engineers, 1 backend developer for 6 weeks',
      timeline: '8 weeks including training',
      completedAt: '2024-02-10',
      completedBy: 'user-4'
    }
  },
  {
    id: 'hyp-7',
    code: 'HYP-007',
    title: 'In-app chat support will reduce churn',
    description: 'Adding live chat support will reduce monthly churn by 5%',
    status: 'go_no_go',
    teamId: 'team-1',
    ownerId: 'user-2',
    createdAt: '2024-01-15',
    updatedAt: '2024-03-14',
    scoring: {
      criteriaScores: {
        'crit-tam': 1000000,
        'crit-som': 150000,
        'crit-market-potential': 3,
        'crit-competency-fit': 4,
        'crit-resource-cost': 4,
        'crit-strategic-fit': 3,
        'crit-stop-factor': 0
      },
      stopFactorTriggered: false,
      totalScore: 210,
      scoredAt: '2024-01-18',
      scoredBy: 'user-2'
    },
    deepDive: {
      problem: 'Users churn after encountering issues without support',
      targetAudience: 'Users in first 30 days',
      metrics: 'Churn rate, support tickets, NPS',
      risks: 'Support team scaling, response time SLAs',
      resources: '1 developer, 3 support agents',
      timeline: '3 weeks for MVP',
      completedAt: '2024-02-01',
      completedBy: 'user-2'
    }
  },
  {
    id: 'hyp-8',
    code: 'HYP-008',
    title: 'Email digest will re-engage inactive users',
    description: 'Weekly email digest with personalized content will re-activate 10% of dormant users',
    status: 'backlog',
    teamId: 'team-1',
    ownerId: 'user-2',
    createdAt: '2024-03-10',
    updatedAt: '2024-03-10'
  },
  {
    id: 'hyp-9',
    code: 'HYP-009',
    title: 'Mobile app will increase retention',
    description: 'Native mobile app will increase D30 retention by 20% compared to mobile web',
    status: 'experiment',
    teamId: 'team-4',
    ownerId: 'user-4',
    createdAt: '2024-01-20',
    updatedAt: '2024-03-08',
    scoring: {
      criteriaScores: {
        'crit-tam': 4000000,
        'crit-som': 600000,
        'crit-market-potential': 4,
        'crit-competency-fit': 3,
        'crit-resource-cost': 2,
        'crit-strategic-fit': 5,
        'crit-stop-factor': 0
      },
      stopFactorTriggered: false,
      totalScore: 210,
      scoredAt: '2024-01-25',
      scoredBy: 'user-4'
    },
    deepDive: {
      problem: 'Mobile web has 50% lower retention than desktop',
      targetAudience: 'Mobile users (60% of traffic)',
      metrics: 'D7, D30 retention, session frequency',
      risks: 'Development cost, app store approval',
      resources: '3 mobile developers for 3 months',
      timeline: '12 weeks for MVP',
      completedAt: '2024-02-05',
      completedBy: 'user-4'
    }
  },
  {
    id: 'hyp-10',
    code: 'HYP-010',
    title: 'Performance optimization will reduce bounce rate',
    description: 'Reducing page load time by 50% will decrease bounce rate by 15%',
    status: 'scoring',
    teamId: 'team-3',
    ownerId: 'user-4',
    createdAt: '2024-03-05',
    updatedAt: '2024-03-05'
  },
  {
    id: 'hyp-11',
    code: 'HYP-011',
    title: 'Referral program will drive organic growth',
    description: 'Two-sided referral program with $10 rewards will increase organic signups by 25%',
    status: 'backlog',
    teamId: 'team-1',
    ownerId: 'user-2',
    createdAt: '2024-03-12',
    updatedAt: '2024-03-12'
  },
  {
    id: 'hyp-12',
    code: 'HYP-012',
    title: 'Video tutorials will improve feature adoption',
    description: 'In-app video tutorials will increase feature adoption by 30%',
    status: 'deep_dive',
    teamId: 'team-2',
    ownerId: 'user-2',
    createdAt: '2024-02-28',
    updatedAt: '2024-03-10',
    scoring: {
      criteriaScores: {
        'crit-tam': 2500000,
        'crit-som': 350000,
        'crit-market-potential': 4,
        'crit-competency-fit': 4,
        'crit-resource-cost': 4,
        'crit-strategic-fit': 4,
        'crit-stop-factor': 0
      },
      stopFactorTriggered: false,
      totalScore: 294,
      scoredAt: '2024-03-02',
      scoredBy: 'user-2'
    }
  },
]

// Experiments
export const mockExperiments: Experiment[] = [
  {
    id: 'exp-1',
    hypothesisId: 'hyp-1',
    title: 'A/B Test: Progress Bar in Onboarding',
    type: 'a_b_test',
    status: 'running',
    description: 'Testing progress bar vs no progress bar in onboarding flow',
    metrics: [
      { id: 'm1-1', name: 'Конверсия онбординга', targetValue: '+15%', unit: '%' },
      { id: 'm1-2', name: 'Время прохождения', targetValue: '-20%', unit: 'мин' },
      { id: 'm1-3', name: 'Bounce rate на шаге 3', targetValue: '-30%', unit: '%' }
    ],
    metric: 'Onboarding completion rate',
    targetValue: '15% increase',
    links: [
      { id: 'l1-1', type: 'landing', title: 'Вариант A', url: 'https://example.com/onboarding-a' },
      { id: 'l1-2', type: 'landing', title: 'Вариант B', url: 'https://example.com/onboarding-b' }
    ],
    startDate: '2024-03-01',
    endDate: '2024-03-21',
    createdAt: '2024-02-28',
    createdBy: 'user-2',
    responsibleUserId: 'user-2'
  },
  {
    id: 'exp-2',
    hypothesisId: 'hyp-1',
    title: 'User Interview: Onboarding Pain Points',
    type: 'interview',
    status: 'completed',
    description: 'Interviews with 15 users who dropped off during onboarding',
    metrics: [
      { id: 'm2-1', name: 'Количество интервью', targetValue: '15', actualValue: '17', unit: 'шт', result: 'success' },
      { id: 'm2-2', name: 'Выявлено болей', targetValue: '5', actualValue: '8', unit: 'шт', result: 'success' }
    ],
    metric: 'Qualitative feedback',
    targetValue: '15 interviews',
    actualValue: '17 interviews completed',
    whatWorked: 'Респонденты охотно делились негативным опытом. Удалось выявить 3 критичные боли на шаге 3.',
    whatDidNotWork: 'Сложно было найти пользователей, которые ушли на 2 шаге - их мало.',
    files: [
      { id: 'f2-1', name: 'interview_summary.pdf', url: '#', size: 245000, type: 'application/pdf', uploadedAt: '2024-02-25', uploadedBy: 'Maria Petrova' }
    ],
    startDate: '2024-02-15',
    endDate: '2024-02-25',
    result: 'success',
    notes: 'Key finding: users are confused by step 3 terminology',
    createdAt: '2024-02-10',
    createdBy: 'user-2',
    responsibleUserId: 'user-2'
  },
  {
    id: 'exp-3',
    hypothesisId: 'hyp-3',
    title: 'A/B Test: Social Login Buttons',
    type: 'a_b_test',
    status: 'completed',
    description: 'Testing social login buttons on signup page',
    metrics: [
      { id: 'm3-1', name: 'Конверсия регистрации', targetValue: '+20%', actualValue: '+25%', unit: '%', result: 'success' },
      { id: 'm3-2', name: 'Время до регистрации', targetValue: '-30%', actualValue: '-45%', unit: 'сек', result: 'success' },
      { id: 'm3-3', name: 'Drop-off на форме', targetValue: '-15%', actualValue: '-18%', unit: '%', result: 'success' }
    ],
    metric: 'Signup conversion',
    targetValue: '20% increase',
    actualValue: '25% increase',
    whatWorked: 'Google login показал конверсию 35% vs 12% у Apple. Кнопка "Войти через Google" в верхней части формы работает лучше.',
    whatDidNotWork: 'Apple login почти не используется нашей аудиторией.',
    links: [
      { id: 'l3-1', type: 'landing', title: 'Страница регистрации', url: 'https://example.com/signup' },
      { id: 'l3-2', type: 'campaign', title: 'Google Ads кампания', url: 'https://ads.google.com/campaign/123' }
    ],
    startDate: '2024-02-01',
    endDate: '2024-02-21',
    result: 'success',
    notes: 'Google login significantly outperformed Apple',
    createdAt: '2024-01-28',
    createdBy: 'user-2',
    responsibleUserId: 'user-2'
  },
  {
    id: 'exp-4',
    hypothesisId: 'hyp-6',
    title: 'A/B Test: Product Recommendations',
    type: 'a_b_test',
    status: 'completed',
    description: 'Testing ML-based recommendations vs bestsellers',
    metrics: [
      { id: 'm4-1', name: 'Средний чек', targetValue: '+12%', actualValue: '+8%', unit: 'руб', result: 'inconclusive' },
      { id: 'm4-2', name: 'CTR рекомендаций', targetValue: '+25%', actualValue: '+15%', unit: '%', result: 'failure' },
      { id: 'm4-3', name: 'Добавлений в корзину', targetValue: '+18%', actualValue: '+22%', unit: '%', result: 'success' }
    ],
    metric: 'Average order value',
    targetValue: '12% increase',
    actualValue: '8% increase',
    whatWorked: 'ML-модель хорошо подбирает товары для добавления в корзину.',
    whatDidNotWork: 'Пользователи не доверяют рекомендациям - низкий CTR. Нужно улучшить UI блока.',
    startDate: '2024-02-20',
    endDate: '2024-03-10',
    result: 'inconclusive',
    notes: 'Results below target, needs model improvement',
    createdAt: '2024-02-18',
    createdBy: 'user-4',
    responsibleUserId: 'user-4'
  },
  {
    id: 'exp-5',
    hypothesisId: 'hyp-9',
    title: 'Beta Test: Mobile App',
    type: 'mvp',
    status: 'running',
    description: 'Beta testing mobile app with 500 users',
    metrics: [
      { id: 'm5-1', name: 'D30 retention', targetValue: '+20%', unit: '%' },
      { id: 'm5-2', name: 'DAU/MAU', targetValue: '0.25', unit: '' },
      { id: 'm5-3', name: 'Sessions per user', targetValue: '3.5', unit: 'шт' },
      { id: 'm5-4', name: 'Crash rate', targetValue: '<1%', unit: '%' }
    ],
    metric: 'D30 retention',
    targetValue: '20% improvement vs mobile web',
    links: [
      { id: 'l5-1', type: 'landing', title: 'TestFlight', url: 'https://testflight.apple.com/join/xxx' },
      { id: 'l5-2', type: 'form', title: 'Форма обратной связи', url: 'https://forms.google.com/xxx' }
    ],
    startDate: '2024-03-01',
    endDate: '2024-03-31',
    createdAt: '2024-02-25',
    createdBy: 'user-4',
    responsibleUserId: 'user-4'
  },
  {
    id: 'exp-6',
    hypothesisId: 'hyp-7',
    title: 'Prototype: Chat Support Widget',
    type: 'prototype',
    status: 'completed',
    description: 'Testing chat widget prototype with 100 users',
    metrics: [
      { id: 'm6-1', name: 'Удовлетворённость (CSAT)', targetValue: '80%', actualValue: '85%', unit: '%', result: 'success' },
      { id: 'm6-2', name: 'Время ответа', targetValue: '<30 сек', actualValue: '22 сек', unit: 'сек', result: 'success' },
      { id: 'm6-3', name: 'Решено с первого раза', targetValue: '70%', actualValue: '68%', unit: '%', result: 'inconclusive' }
    ],
    metric: 'User satisfaction, response time',
    targetValue: '80% satisfaction',
    actualValue: '85% satisfaction',
    whatWorked: 'Пользователи ценят быстрые ответы. AI-подсказки помогают операторам.',
    whatDidNotWork: 'Некоторые сложные вопросы требуют эскалации - нужен workflow для этого.',
    startDate: '2024-02-10',
    endDate: '2024-02-28',
    result: 'success',
    notes: 'Users appreciated quick responses, some UX improvements needed',
    createdAt: '2024-02-08',
    createdBy: 'user-2',
    responsibleUserId: 'user-2'
  },
]

// Scoring Criteria
export const mockScoringCriteria: ScoringCriterion[] = [
  { 
    id: 'crit-tam', 
    name: 'TAM', 
    description: 'Total Addressable Market - общий объём рынка', 
    inputType: 'number',
    minValue: 0, 
    maxValue: 999999999, 
    weight: 0.15, 
    isActive: true,
    thresholds: [100000, 500000, 1000000, 5000000] // <100k=1, 100k-500k=2, 500k-1M=3, 1M-5M=4, >5M=5
  },
  { 
    id: 'crit-som', 
    name: 'SOM', 
    description: 'Serviceable Obtainable Market - достижимая доля рынка', 
    inputType: 'number',
    minValue: 0, 
    maxValue: 999999999, 
    weight: 0.15, 
    isActive: true,
    thresholds: [10000, 50000, 100000, 500000]
  },
  { 
    id: 'crit-market-potential', 
    name: 'Рыночный потенциал', 
    description: 'Общая оценка рыночного потенциала гипотезы', 
    inputType: 'slider',
    minValue: 1, 
    maxValue: 5, 
    weight: 0.2, 
    isActive: true 
  },
  { 
    id: 'crit-competency-fit', 
    name: 'Соответствие компетенциям', 
    description: 'Насколько гипотеза соответствует текущим компетенциям команды', 
    inputType: 'slider',
    minValue: 1, 
    maxValue: 5, 
    weight: 0.15, 
    isActive: true 
  },
  { 
    id: 'crit-resource-cost', 
    name: 'Ресурсоёмкость проверки', 
    description: 'Оценка затрат ресурсов на проверку гипотезы (5 = минимальная ресурсоёмкость)', 
    inputType: 'slider',
    minValue: 1, 
    maxValue: 5, 
    weight: 0.15, 
    isActive: true 
  },
  { 
    id: 'crit-strategic-fit', 
    name: 'Стратегический fit', 
    description: 'Соответствие стратегическим целям компании', 
    inputType: 'slider',
    minValue: 1, 
    maxValue: 5, 
    weight: 0.2, 
    isActive: true 
  },
  { 
    id: 'crit-stop-factor', 
    name: 'Стоп-факторы', 
    description: 'Наличие критических факторов, блокирующих гипотезу (если отмечено - итоговый балл = 0)', 
    inputType: 'checkbox',
    minValue: 0, 
    maxValue: 1, 
    weight: 0, 
    isActive: true,
    isStopFactor: true
  },
]

// Status Configurations
export const mockStatusConfigs: StatusConfig[] = [
  { id: 'backlog', name: 'Backlog', description: 'New hypothesis waiting for scoring', order: 1, color: 'backlog', isActive: true },
  { id: 'scoring', name: 'Scoring', description: 'Being evaluated with ICE framework', order: 2, color: 'scoring', isActive: true },
  { id: 'deep_dive', name: 'Deep Dive', description: 'Detailed research and planning', order: 3, color: 'deep-dive', isActive: true },
  { id: 'experiment', name: 'Experiment', description: 'Running experiments to validate', order: 4, color: 'experiment', isActive: true },
  { id: 'analysis', name: 'Analysis', description: 'Analyzing experiment results', order: 5, color: 'analysis', isActive: true },
  { id: 'go_no_go', name: 'Go / No-Go', description: 'Decision pending', order: 6, color: 'go-no-go', isActive: true },
  { id: 'done', name: 'Done', description: 'Decision made, hypothesis closed', order: 7, color: 'done', isActive: true },
]

// Audit Log
export const mockAuditLog: AuditLogEntry[] = [
  {
    id: 'audit-1',
    entityType: 'hypothesis',
    entityId: 'hyp-1',
    action: 'status_change',
    changes: { status: { old: 'deep_dive', new: 'experiment' } },
    userId: 'user-2',
    userName: 'Maria Petrova',
    timestamp: '2024-03-10T14:30:00Z'
  },
  {
    id: 'audit-2',
    entityType: 'experiment',
    entityId: 'exp-1',
    action: 'create',
    changes: {},
    userId: 'user-2',
    userName: 'Maria Petrova',
    timestamp: '2024-02-28T10:00:00Z'
  },
  {
    id: 'audit-3',
    entityType: 'hypothesis',
    entityId: 'hyp-3',
    action: 'update',
    changes: { decision: { old: null, new: { result: 'go' } } },
    userId: 'user-1',
    userName: 'Alexey Ivanov',
    timestamp: '2024-03-01T16:45:00Z'
  },
  {
    id: 'audit-4',
    entityType: 'user',
    entityId: 'user-5',
    action: 'update',
    changes: { isActive: { old: true, new: false } },
    userId: 'user-1',
    userName: 'Alexey Ivanov',
    timestamp: '2024-02-01T09:15:00Z'
  },
  {
    id: 'audit-5',
    entityType: 'hypothesis',
    entityId: 'hyp-7',
    action: 'status_change',
    changes: { status: { old: 'analysis', new: 'go_no_go' } },
    userId: 'user-2',
    userName: 'Maria Petrova',
    timestamp: '2024-03-14T11:20:00Z'
  },
  {
    id: 'audit-6',
    entityType: 'team',
    entityId: 'team-4',
    action: 'create',
    changes: {},
    userId: 'user-1',
    userName: 'Alexey Ivanov',
    timestamp: '2024-02-01T08:00:00Z'
  },
  {
    id: 'audit-7',
    entityType: 'experiment',
    entityId: 'exp-2',
    action: 'update',
    changes: { status: { old: 'running', new: 'completed' }, result: { old: null, new: 'success' } },
    userId: 'user-2',
    userName: 'Maria Petrova',
    timestamp: '2024-02-25T17:00:00Z'
  },
  {
    id: 'audit-8',
    entityType: 'hypothesis',
    entityId: 'hyp-5',
    action: 'status_change',
    changes: { status: { old: 'scoring', new: 'deep_dive' } },
    userId: 'user-2',
    userName: 'Maria Petrova',
    timestamp: '2024-03-05T13:30:00Z'
  },
]

// Helper functions
export function getTeamById(id: string): Team | undefined {
  return mockTeams.find(t => t.id === id)
}

export function getUserById(id: string): User | undefined {
  return mockUsers.find(u => u.id === id)
}

export function getHypothesisById(id: string): Hypothesis | undefined {
  return mockHypotheses.find(h => h.id === id)
}

export function getExperimentsByHypothesisId(hypothesisId: string): Experiment[] {
  return mockExperiments.filter(e => e.hypothesisId === hypothesisId)
}

export function getHypothesesByStatus(status: string): Hypothesis[] {
  return mockHypotheses.filter(h => h.status === status)
}

export function getHypothesesByTeam(teamId: string): Hypothesis[] {
  return mockHypotheses.filter(h => h.teamId === teamId)
}

// Status display info
export const statusDisplayInfo: Record<string, { label: string; colorClass: string }> = {
  backlog: { label: 'Backlog', colorClass: 'bg-status-backlog text-status-backlog-foreground' },
  scoring: { label: 'Scoring', colorClass: 'bg-status-scoring text-status-scoring-foreground' },
  deep_dive: { label: 'Deep Dive', colorClass: 'bg-status-deep-dive text-status-deep-dive-foreground' },
  experiment: { label: 'Experiment', colorClass: 'bg-status-experiment text-status-experiment-foreground' },
  analysis: { label: 'Analysis', colorClass: 'bg-status-analysis text-status-analysis-foreground' },
  go_no_go: { label: 'Go / No-Go', colorClass: 'bg-status-go-no-go text-status-go-no-go-foreground' },
  done: { label: 'Done', colorClass: 'bg-status-done text-status-done-foreground' },
}

export const experimentTypeLabels: Record<string, string> = {
  a_b_test: 'A/B Test',
  survey: 'Survey',
  interview: 'Interview',
  prototype: 'Prototype',
  mvp: 'MVP',
  other: 'Other',
}

export const experimentStatusLabels: Record<string, string> = {
  planned: 'Planned',
  running: 'Running',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const roleLabels: Record<UserRole, string> = {
  admin: 'Administrator',
  initiator: 'Initiator',
  pd_manager: 'Product Discovery Manager',
  analyst: 'Analyst',
  tech_lead: 'Tech Lead',
  bizdev: 'BizDev',
  committee: 'Committee',
}

// Comments
export const mockComments: Comment[] = [
  {
    id: 'comment-1',
    hypothesisId: 'hyp-1',
    userId: 'user-2',
    userName: 'Maria Petrova',
    text: 'Запустили эксперимент. Первые результаты будут через неделю.',
    createdAt: '2024-03-10T14:30:00',
  },
  {
    id: 'comment-2',
    hypothesisId: 'hyp-1',
    userId: 'user-1',
    userName: 'Alexey Ivanov',
    text: 'Отличная инициатива! Убедит��сь, что контрольная группа достаточно большая.',
    createdAt: '2024-03-10T15:45:00',
  },
  {
    id: 'comment-3',
    hypothesisId: 'hyp-1',
    userId: 'user-2',
    userName: 'Maria Petrova',
    text: 'Да, разделили 50/50. Всего около 2000 пользователей в каждой группе.',
    createdAt: '2024-03-11T09:15:00',
  },
  {
    id: 'comment-4',
    hypothesisId: 'hyp-3',
    userId: 'user-4',
    userName: 'Elena Kozlova',
    text: 'Нужно добавить метрику по конверсии в покупку.',
    createdAt: '2024-03-12T11:00:00',
  },
  {
    id: 'comment-5',
    hypothesisId: 'hyp-5',
    userId: 'user-2',
    userName: 'Maria Petrova',
    text: 'Гипотеза подтвердилась! CTR увеличился на 23%.',
    createdAt: '2024-03-08T16:20:00',
  },
]

export function getCommentsByHypothesisId(hypothesisId: string): Comment[] {
  return mockComments.filter(c => c.hypothesisId === hypothesisId)
}

// Deep Dive Stage Configurations
export const mockDeepDiveStages: DeepDiveStageConfig[] = [
  {
    id: 'stage-1',
    name: 'Рыночное и конкурентное исследование',
    description: 'Бенчмаркинг: анализ рынка и конкурентов',
    order: 1,
    isRequired: true,
    responsibleRole: 'pd_manager',
    isActive: true,
  },
  {
    id: 'stage-2',
    name: 'Поиск респондентов',
    description: 'CRM-таблица контактов для интервью',
    order: 2,
    isRequired: true,
    responsibleRole: 'pd_manager',
    isActive: true,
  },
  {
    id: 'stage-3',
    name: 'Интервью',
    description: 'Минимум 3-5 интервью с тегами болей',
    order: 3,
    isRequired: true,
    responsibleRole: 'pd_manager',
    isActive: true,
  },
  {
    id: 'stage-4',
    name: 'CJM / JTBD',
    description: 'Customer Journey Map или Jobs To Be Done анализ',
    order: 4,
    isRequired: false,
    responsibleRole: 'pd_manager',
    isActive: true,
  },
  {
    id: 'stage-5',
    name: 'Финансовое моделирование',
    description: 'LTV, CAC, маржа и другие финансовые показатели',
    order: 5,
    isRequired: true,
    responsibleRole: 'pd_manager',
    isActive: true,
  },
  {
    id: 'stage-6',
    name: 'Оценка трудозатрат',
    description: 'Оценка ресурсов: бэкенд, фронт, аналитика',
    order: 6,
    isRequired: true,
    responsibleRole: 'pd_manager',
    isActive: true,
  },
  {
    id: 'stage-7',
    name: 'Паспорт гипотезы',
    description: 'Заполняется автоматически на основе собранных данных',
    order: 7,
    isRequired: true,
    responsibleRole: 'admin',
    isActive: true,
  },
]

export function getActiveDeepDiveStages(): DeepDiveStageConfig[] {
  return mockDeepDiveStages.filter(s => s.isActive).sort((a, b) => a.order - b.order)
}

export function getRequiredDeepDiveStages(): DeepDiveStageConfig[] {
  return mockDeepDiveStages.filter(s => s.isActive && s.isRequired).sort((a, b) => a.order - b.order)
}

// Product Committee Members
export const mockProductCommitteeMembers: ProductCommitteeMember[] = [
  {
    id: 'pc-1',
    userId: 'user-1',
    displayRole: 'CPO',
    order: 1,
    isActive: true,
    createdAt: '2024-01-01',
  },
  {
    id: 'pc-2',
    userId: 'user-3',
    displayRole: 'CEO',
    order: 2,
    isActive: true,
    createdAt: '2024-01-01',
  },
  {
    id: 'pc-3',
    userId: 'user-2',
    displayRole: 'Head of Product',
    order: 3,
    isActive: true,
    createdAt: '2024-01-15',
  },
  {
    id: 'pc-4',
    userId: 'user-4',
    displayRole: 'Tech Lead',
    order: 4,
    isActive: false,
    createdAt: '2024-02-01',
  },
]

export function getActiveCommitteeMembers(): ProductCommitteeMember[] {
  return mockProductCommitteeMembers.filter(m => m.isActive).sort((a, b) => a.order - b.order)
}

export function getCommitteeMemberWithUser(member: ProductCommitteeMember): ProductCommitteeMember & { user: User | undefined } {
  const user = mockUsers.find(u => u.id === member.userId)
  return { ...member, user }
}

// Status Transitions
export const mockStatusTransitions: StatusTransition[] = [
  {
    id: 'trans-1',
    fromStatus: 'backlog',
    toStatus: 'scoring',
    allowedRoles: ['admin', 'pd_manager'],
    conditionType: 'required_fields',
    conditionValue: 'title,description',
    isActive: true,
  },
  {
    id: 'trans-2',
    fromStatus: 'scoring',
    toStatus: 'deep_dive',
    allowedRoles: ['admin', 'pd_manager'],
    conditionType: 'scoring_threshold',
    conditionValue: '7.0',
    isActive: true,
  },
  {
    id: 'trans-3',
    fromStatus: 'deep_dive',
    toStatus: 'experiment',
    allowedRoles: ['admin', 'pd_manager'],
    conditionType: 'checklist_closed',
    isActive: true,
  },
  {
    id: 'trans-4',
    fromStatus: 'experiment',
    toStatus: 'analysis',
    allowedRoles: ['admin', 'pd_manager'],
    conditionType: 'none',
    isActive: true,
  },
  {
    id: 'trans-5',
    fromStatus: 'analysis',
    toStatus: 'go_no_go',
    allowedRoles: ['admin'],
    conditionType: 'required_fields',
    conditionValue: 'experiment_results',
    isActive: true,
  },
  {
    id: 'trans-6',
    fromStatus: 'go_no_go',
    toStatus: 'done',
    allowedRoles: ['admin'],
    conditionType: 'none',
    isActive: true,
  },
  // Iterate transitions (backwards)
  {
    id: 'trans-7',
    fromStatus: 'experiment',
    toStatus: 'deep_dive',
    allowedRoles: ['admin', 'pd_manager'],
    conditionType: 'none',
    isActive: true,
  },
  {
    id: 'trans-8',
    fromStatus: 'analysis',
    toStatus: 'experiment',
    allowedRoles: ['admin'],
    conditionType: 'none',
    isActive: true,
  },
]

// Scoring Thresholds
export const mockScoringThresholds: ScoringThresholdConfig = {
  primaryThreshold: 7.0,
  deepThreshold: 7.5,
}

// SLA Configurations
export const mockSLAConfigs: SLAConfig[] = [
  { id: 'sla-1', status: 'backlog', limitDays: 14, warningDays: 3, isActive: true },
  { id: 'sla-2', status: 'scoring', limitDays: 7, warningDays: 2, isActive: true },
  { id: 'sla-3', status: 'deep_dive', limitDays: 21, warningDays: 5, isActive: true },
  { id: 'sla-4', status: 'experiment', limitDays: 30, warningDays: 7, isActive: true },
  { id: 'sla-5', status: 'analysis', limitDays: 7, warningDays: 2, isActive: true },
  { id: 'sla-6', status: 'go_no_go', limitDays: 14, warningDays: 3, isActive: true },
  { id: 'sla-7', status: 'done', limitDays: 0, warningDays: 0, isActive: false },
]

export const mockSLANotificationConfig: SLANotificationConfig = {
  notifyResponsible: true,
  notifyInitiator: true,
  notifyAdmin: true,
  notifyAllParticipants: false,
}

// Notification Configurations
export const mockNotificationChannels: NotificationChannelConfig = {
  telegram: {
    enabled: true,
    botToken: '123456:ABC-DEF...',
    chatId: '-1001234567890',
  },
  confluence: {
    enabled: false,
    spaceKey: '',
    pageId: '',
  },
}

export const mockNotificationEvents: NotificationEventConfig[] = [
  {
    id: 'notif-1',
    eventType: 'status_change',
    isActive: true,
    recipients: ['admin', 'pd_manager'],
    template: 'Гипотеза {hyp_id} "{title}" перешла в статус {new_status}. Ответственный: {pm_name}. {url}',
  },
  {
    id: 'notif-2',
    eventType: 'responsible_assigned',
    isActive: true,
    recipients: ['pd_manager'],
    template: 'Вам назначена гипотеза {hyp_id} "{title}". {url}',
  },
  {
    id: 'notif-3',
    eventType: 'committee_decision',
    isActive: true,
    recipients: ['admin', 'pd_manager'],
    template: 'Решение ПК по гипотезе {hyp_id}: {decision}. {url}',
  },
  {
    id: 'notif-4',
    eventType: 'sla_warning',
    isActive: true,
    recipients: ['admin', 'pd_manager'],
    template: 'Внимание! Гипотеза {hyp_id} скоро просрочит SLA (осталось {days_left} дней). {url}',
  },
  {
    id: 'notif-5',
    eventType: 'sla_violation',
    isActive: true,
    recipients: ['admin', 'pd_manager'],
    template: 'Нарушение SLA! Гипотеза {hyp_id} просрочена на {days_overdue} дней. {url}',
  },
  {
    id: 'notif-6',
    eventType: 'artifact_added',
    isActive: false,
    recipients: ['pd_manager'],
    template: 'К гипотезе {hyp_id} добавлен артефакт: {artifact_name}. {url}',
  },
  {
    id: 'notif-7',
    eventType: 'committee_voting_opened',
    isActive: true,
    recipients: ['admin'],
    template: 'Открыто голосование ПК по гипотезе {hyp_id} "{title}". {url}',
  },
]

// User Notifications
export const mockNotifications: Notification[] = [
  // Today
  {
    id: 'notif-001',
    type: 'sla_violation',
    hypothesisId: 'hyp-1',
    hypothesisCode: 'HYP-001',
    hypothesisTitle: 'Gamification of onboarding will increase activation',
    message: 'SLA нарушен',
    details: 'Просрочено на 2 дня',
    initiator: 'система',
    isRead: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'notif-002',
    type: 'status_change',
    hypothesisId: 'hyp-5',
    hypothesisCode: 'HYP-005',
    hypothesisTitle: 'Simplified checkout will increase purchases',
    message: 'Статус изменён',
    details: 'Scoring → Deep Dive',
    initiator: 'Maria Petrova',
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  },
  {
    id: 'notif-003',
    type: 'responsible_assigned',
    hypothesisId: 'hyp-12',
    hypothesisCode: 'HYP-012',
    hypothesisTitle: 'Video tutorials will improve feature adoption',
    message: 'Вам назначена гипотеза',
    details: undefined,
    initiator: 'Alexey Ivanov',
    isRead: false,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
  },
  {
    id: 'notif-004',
    type: 'comment_added',
    hypothesisId: 'hyp-1',
    hypothesisCode: 'HYP-001',
    hypothesisTitle: 'Gamification of onboarding will increase activation',
    message: 'Новый комментарий',
    details: 'Нужно уточнить метрики эксперимента',
    initiator: 'Elena Kozlova',
    isRead: false,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
  },
  // Yesterday
  {
    id: 'notif-005',
    type: 'sla_warning',
    hypothesisId: 'hyp-7',
    hypothesisCode: 'HYP-007',
    hypothesisTitle: 'In-app chat support will reduce churn',
    message: 'SLA — предупреждение',
    details: 'Осталось 2 дня',
    initiator: 'система',
    isRead: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // yesterday
  },
  {
    id: 'notif-006',
    type: 'committee_voting_opened',
    hypothesisId: 'hyp-7',
    hypothesisCode: 'HYP-007',
    hypothesisTitle: 'In-app chat support will reduce churn',
    message: 'Голосование ПК открыто',
    details: undefined,
    initiator: 'система',
    isRead: true,
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-007',
    type: 'artifact_added',
    hypothesisId: 'hyp-5',
    hypothesisCode: 'HYP-005',
    hypothesisTitle: 'Simplified checkout will increase purchases',
    message: 'Новый артефакт',
    details: 'competitive_analysis.pdf',
    initiator: 'Maria Petrova',
    isRead: true,
    createdAt: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(),
  },
  // 3 days ago
  {
    id: 'notif-008',
    type: 'committee_decision',
    hypothesisId: 'hyp-3',
    hypothesisCode: 'HYP-003',
    hypothesisTitle: 'Social login will increase conversion',
    message: 'Решение ПК',
    details: 'Go — раскатка на 100% пользователей',
    initiator: 'система',
    isRead: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-009',
    type: 'status_change',
    hypothesisId: 'hyp-9',
    hypothesisCode: 'HYP-009',
    hypothesisTitle: 'Mobile app will increase retention',
    message: 'Статус изменён',
    details: 'Deep Dive → Experiment',
    initiator: 'Elena Kozlova',
    isRead: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000).toISOString(),
  },
  // 5 days ago
  {
    id: 'notif-010',
    type: 'responsible_assigned',
    hypothesisId: 'hyp-6',
    hypothesisCode: 'HYP-006',
    hypothesisTitle: 'Recommendation engine will increase AOV',
    message: 'Вам назначена гипотеза',
    details: undefined,
    initiator: 'Alexey Ivanov',
    isRead: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-011',
    type: 'sla_violation',
    hypothesisId: 'hyp-6',
    hypothesisCode: 'HYP-006',
    hypothesisTitle: 'Recommendation engine will increase AOV',
    message: 'SLA нарушен',
    details: 'Просрочено на 5 дней',
    initiator: 'система',
    isRead: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 - 3 * 60 * 60 * 1000).toISOString(),
  },
  // 7 days ago
  {
    id: 'notif-012',
    type: 'comment_added',
    hypothesisId: 'hyp-9',
    hypothesisCode: 'HYP-009',
    hypothesisTitle: 'Mobile app will increase retention',
    message: 'Новый комментарий',
    details: 'Добавила результаты тестирования',
    initiator: 'Elena Kozlova',
    isRead: true,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

// Respondents for Deep Dive CRM
export const mockRespondents: Respondent[] = [
  // Respondents for HYP-001 (Gamification of onboarding)
  {
    id: 'resp-1',
    hypothesisId: 'hyp-1',
    name: 'Морозов Андрей',
    company: 'ООО Ритейл',
    position: 'CPO',
    email: 'morozov@retail.ru',
    phone: '+7 (999) 123-45-67',
    contactSource: 'LinkedIn',
    status: 'completed',
    interviewDate: '2024-04-01',
    interviewDuration: 45,
    interviewerUserId: 'user-2',
    interviewFormat: 'zoom',
    recordingUrl: 'https://zoom.us/rec/123',
    pains: [
      { id: 'pain-1-1', tag: 'ценообразование', quote: 'Непонятно, как формируется цена на тарифы', createdAt: '2024-04-01' },
      { id: 'pain-1-2', tag: 'онбординг', quote: 'Третий шаг онбординга вообще непонятный', createdAt: '2024-04-01' },
      { id: 'pain-1-3', tag: 'биллинг', quote: 'Счета приходят в неудобном формате', createdAt: '2024-04-01' },
    ],
    artifacts: [
      { id: 'art-1-1', type: 'audio', name: 'interview_morozov.mp3', url: '#', uploadedAt: '2024-04-01', uploadedBy: 'Maria Petrova' },
      { id: 'art-1-2', type: 'transcript', name: 'transcript_morozov.txt', url: '#', uploadedAt: '2024-04-01', uploadedBy: 'Maria Petrova' },
    ],
    createdAt: '2024-03-25',
    updatedAt: '2024-04-01',
  },
  {
    id: 'resp-2',
    hypothesisId: 'hyp-1',
    name: 'Соколова Ирина',
    company: 'FinTech Pro',
    position: 'Product Manager',
    email: 'sokolova@fintech.pro',
    phone: '+7 (999) 234-56-78',
    contactSource: 'Рекомендация',
    status: 'completed',
    interviewDate: '2024-04-02',
    interviewDuration: 35,
    interviewerUserId: 'user-2',
    interviewFormat: 'zoom',
    recordingUrl: 'https://zoom.us/rec/124',
    pains: [
      { id: 'pain-2-1', tag: 'ценообразование', quote: 'Хотелось бы видеть сравнение тарифов', createdAt: '2024-04-02' },
      { id: 'pain-2-2', tag: 'онбординг', quote: 'Долго разбиралась с интерфейсом в начале', createdAt: '2024-04-02' },
      { id: 'pain-2-3', tag: 'биллинг', quote: 'Нет автоматического выставления счетов', createdAt: '2024-04-02' },
    ],
    artifacts: [
      { id: 'art-2-1', type: 'audio', name: 'interview_sokolova.mp3', url: '#', uploadedAt: '2024-04-02', uploadedBy: 'Maria Petrova' },
    ],
    createdAt: '2024-03-26',
    updatedAt: '2024-04-02',
  },
  {
    id: 'resp-3',
    hypothesisId: 'hyp-1',
    name: 'Орлов Дмитрий',
    company: 'TechStart',
    position: 'CEO',
    email: 'orlov@techstart.io',
    contactSource: 'Конференция ProductSense',
    status: 'completed',
    interviewDate: '2024-04-03',
    interviewDuration: 50,
    interviewerUserId: 'user-2',
    interviewFormat: 'in_person',
    pains: [
      { id: 'pain-3-1', tag: 'ценообразование', quote: 'Для стартапов цены слишком высокие', createdAt: '2024-04-03' },
    ],
    artifacts: [
      { id: 'art-3-1', type: 'notes', name: 'notes_orlov.md', url: '#', uploadedAt: '2024-04-03', uploadedBy: 'Maria Petrova' },
    ],
    createdAt: '2024-03-27',
    updatedAt: '2024-04-03',
  },
  {
    id: 'resp-4',
    hypothesisId: 'hyp-1',
    name: 'Лебедева Анна',
    company: 'MediaGroup',
    position: 'Head of Product',
    email: 'lebedeva@mediagroup.ru',
    phone: '+7 (999) 345-67-89',
    contactSource: 'LinkedIn',
    status: 'completed',
    interviewDate: '2024-04-04',
    interviewDuration: 40,
    interviewerUserId: 'user-2',
    interviewFormat: 'phone',
    pains: [
      { id: 'pain-4-1', tag: 'ценообразование', quote: 'Непрозрачное ценообразование', createdAt: '2024-04-04' },
      { id: 'pain-4-2', tag: 'онбординг', quote: 'Нужен гайд для команды', createdAt: '2024-04-04' },
    ],
    artifacts: [],
    createdAt: '2024-03-28',
    updatedAt: '2024-04-04',
  },
  {
    id: 'resp-5',
    hypothesisId: 'hyp-1',
    name: 'Волков Сергей',
    company: 'DataDriven',
    position: 'CTO',
    email: 'volkov@datadriven.com',
    contactSource: 'Рекомендация',
    status: 'scheduled',
    interviewDate: '2024-04-08',
    interviewerUserId: 'user-2',
    interviewFormat: 'zoom',
    pains: [],
    artifacts: [],
    createdAt: '2024-03-29',
    updatedAt: '2024-04-01',
  },
  {
    id: 'resp-6',
    hypothesisId: 'hyp-1',
    name: 'Козлова Мария',
    company: 'EduPlatform',
    position: 'Product Owner',
    email: 'kozlova@eduplatform.ru',
    contactSource: 'LinkedIn',
    status: 'in_contact',
    pains: [],
    artifacts: [],
    createdAt: '2024-03-30',
    updatedAt: '2024-03-31',
  },
  {
    id: 'resp-7',
    hypothesisId: 'hyp-1',
    name: 'Петров Игорь',
    company: 'LogiTech',
    position: 'Director',
    email: 'petrov@logitech.ru',
    contactSource: 'Конференция',
    status: 'refused',
    pains: [],
    artifacts: [],
    createdAt: '2024-03-28',
    updatedAt: '2024-03-30',
  },
  // Respondents for HYP-005 (Simplified checkout)
  {
    id: 'resp-8',
    hypothesisId: 'hyp-5',
    name: 'Иванов Алексей',
    company: 'ShopOnline',
    position: 'E-commerce Manager',
    email: 'ivanov@shoponline.ru',
    contactSource: 'LinkedIn',
    status: 'completed',
    interviewDate: '2024-03-28',
    interviewDuration: 30,
    interviewerUserId: 'user-2',
    interviewFormat: 'zoom',
    pains: [
      { id: 'pain-8-1', tag: 'checkout', quote: 'Слишком много шагов при оформлении заказа', createdAt: '2024-03-28' },
    ],
    artifacts: [],
    createdAt: '2024-03-20',
    updatedAt: '2024-03-28',
  },
  {
    id: 'resp-9',
    hypothesisId: 'hyp-5',
    name: 'Сидорова Елена',
    company: 'FastBuy',
    position: 'UX Lead',
    email: 'sidorova@fastbuy.com',
    contactSource: 'Рекомендация',
    status: 'scheduled',
    interviewDate: '2024-04-05',
    interviewerUserId: 'user-2',
    interviewFormat: 'zoom',
    pains: [],
    artifacts: [],
    createdAt: '2024-03-25',
    updatedAt: '2024-04-01',
  },
  {
    id: 'resp-10',
    hypothesisId: 'hyp-5',
    name: 'Новиков Павел',
    company: 'MarketPlace',
    position: 'Product Director',
    email: 'novikov@marketplace.ru',
    contactSource: 'LinkedIn',
    status: 'new',
    pains: [],
    artifacts: [],
    createdAt: '2024-04-01',
    updatedAt: '2024-04-01',
  },
]

// Respondent status labels and colors
export const respondentStatusConfig: Record<string, { label: string; color: string }> = {
  new: { label: 'Новый', color: 'bg-slate-100 text-slate-700' },
  in_contact: { label: 'На связи', color: 'bg-blue-100 text-blue-700' },
  scheduled: { label: 'Запланирован', color: 'bg-amber-100 text-amber-700' },
  completed: { label: 'Проведён', color: 'bg-green-100 text-green-700' },
  refused: { label: 'Отказ', color: 'bg-red-100 text-red-700' },
}

// Helper functions for respondents
export function getRespondentsByHypothesisId(hypothesisId: string): Respondent[] {
  return mockRespondents.filter(r => r.hypothesisId === hypothesisId)
}

export function getRespondentById(id: string): Respondent | undefined {
  return mockRespondents.find(r => r.id === id)
}

export function getPainSummaryByHypothesisId(hypothesisId: string): PainSummary[] {
  const respondents = getRespondentsByHypothesisId(hypothesisId)
  const completedRespondents = respondents.filter(r => r.status === 'completed')
  
  const painMap = new Map<string, { count: number; respondentNames: string[] }>()
  
  completedRespondents.forEach(respondent => {
    respondent.pains.forEach(pain => {
      const existing = painMap.get(pain.tag)
      if (existing) {
        if (!existing.respondentNames.includes(respondent.name)) {
          existing.count++
          existing.respondentNames.push(respondent.name)
        }
      } else {
        painMap.set(pain.tag, { count: 1, respondentNames: [respondent.name] })
      }
    })
  })
  
  return Array.from(painMap.entries())
    .map(([tag, data]) => ({ tag, ...data }))
    .sort((a, b) => b.count - a.count)
}

export function getCompletedInterviewsCount(hypothesisId: string): number {
  return mockRespondents.filter(r => r.hypothesisId === hypothesisId && r.status === 'completed').length
}

export const MIN_INTERVIEWS_REQUIRED = 5
