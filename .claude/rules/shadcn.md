# shadcn/ui — MCP и корпоративные стили

---

## Установка MCP

Официальный MCP от shadcn/ui. Инициализация в проекте:

```bash
npx shadcn@latest mcp init --client claude
```

Или добавить вручную в `.mcp.json` проекта:

```json
{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["shadcn@latest", "mcp"]
    }
  }
}
```

Перезапустить Claude Code. Проверить подключение: `/mcp`

---

## Что даёт MCP

- Поиск компонентов: `"найди компоненты для формы авторизации"`
- Установка: `"добавь Button, Dialog, Card в проект"`
- Создание форм: `"создай контактную форму из shadcn registry"`
- Browsing: `"покажи все доступные блоки из shadcn"`

---

## Workflow: ASCII wireframe → компоненты

```
1. Нарисуй wireframe в Mockdown → экспортируй в docs/01-ux/wireframes.md

2. Скажи Claude:
   "Реализуй этот экран по wireframe из docs/01-ux/wireframes.md
    используя shadcn компоненты и корпоративные стили из CLAUDE.md"

3. Claude через shadcn MCP:
   → подбирает нужные компоненты
   → устанавливает их
   → применяет корпоративную тему
```

---

## Корпоративные design tokens

На основе корпоративного стиля (тёмная тема, фиолетовые акценты):

### Цвета — `tailwind.config.ts`

```ts
colors: {
  brand: {
    bg:        '#08081E',   // основной фон страницы
    surface:   '#0F0F2A',   // фон карточек и секций
    border:    '#1C1C3A',   // границы карточек
    accent:    '#6228FF',   // основной акцент (кнопки, иконки)
    'accent-2':'#7C52FF',   // вторичный акцент (hover, градиент)
    muted:     '#9CA3AF',   // приглушённый текст
    text:      '#FFFFFF',   // основной текст
  }
}
```

### CSS переменные — `globals.css`

```css
:root {
  --background:    8 8 30;       /* #08081E */
  --card:          15 15 42;     /* #0F0F2A */
  --border:        28 28 58;     /* #1C1C3A */
  --primary:       98 40 255;    /* #6228FF */
  --primary-hover: 124 82 255;   /* #7C52FF */
  --muted:         156 163 175;  /* #9CA3AF */
  --foreground:    255 255 255;
}
```

---

## Ключевые компоненты по секциям

### Hero секция

```tsx
// Большой заголовок с градиентом
<h1 className="text-5xl font-bold text-white">
  Берём разработку на себя,{' '}
  <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
    чтобы вы могли сосредоточиться на бизнесе
  </span>
</h1>
<Button size="lg" className="bg-brand-accent hover:bg-brand-accent-2 text-white rounded-full px-8">
  Оставить заявку
</Button>
```

### Карточки услуг

```tsx
<Card className="bg-brand-surface border border-brand-border hover:border-brand-accent/50
                 transition-colors rounded-2xl p-6">
  <div className="flex items-center justify-between">
    <CardTitle className="text-white text-lg">{title}</CardTitle>
    <ArrowUpRight className="text-brand-accent w-5 h-5" />
  </div>
  <CardDescription className="text-brand-muted mt-2">{description}</CardDescription>
</Card>
```

### Статистика

```tsx
<div className="flex flex-col items-center">
  <span className="text-5xl font-bold text-white">{value}</span>
  <span className="text-brand-muted text-sm mt-1">{label}</span>
</div>
```

### Логотипы партнёров

```tsx
<div className="flex items-center gap-8 opacity-60 grayscale hover:opacity-100
                hover:grayscale-0 transition-all">
  <img src={logo} alt={name} className="h-8 object-contain filter brightness-200" />
</div>
```

### Кнопки

```tsx
// Primary CTA
<Button className="bg-brand-accent hover:bg-brand-accent-2 rounded-full px-8 py-3 text-white">
  Оставить заявку
</Button>

// Secondary / outline
<Button variant="outline"
        className="border-brand-accent text-brand-accent hover:bg-brand-accent/10 rounded-full">
  Узнать больше
</Button>

// Ghost / text
<Button variant="ghost" className="text-brand-muted hover:text-white">
  Подробнее →
</Button>
```

### Секция с тёмным фоном и градиентом

```tsx
<section className="bg-gradient-to-br from-brand-surface via-[#13103A] to-brand-bg
                    rounded-3xl p-12 border border-brand-border">
  {/* контент */}
</section>
```

---

## Промпты для работы с корпоративными стилями

### Генерация секции по wireframe

```
Реализуй секцию "[название]" по wireframe:

[вставь ASCII wireframe из Mockdown]

Требования:
- shadcn компоненты
- Тёмная тема: bg #08081E, карточки #0F0F2A, акцент #6228FF
- Rounded-2xl на карточках, rounded-full на кнопках
- Tailwind CSS
- Responsive (mobile-first)
```

### Ревью дизайна

```
Проверь компонент на соответствие корпоративному стилю:
- тёмный фон (#08081E / #0F0F2A)?
- фиолетовые акценты (#6228FF)?
- правильные скругления (2xl карточки, full кнопки)?
- hover-состояния?
```

### Создание новой страницы

```
Создай страницу [название] используя shadcn компоненты.
Структура: [опиши или вставь wireframe]
Стиль: тёмная корпоративная тема, файл с токенами в tailwind.config.ts
```

---

## Установка базового набора компонентов

```bash
# Запусти один раз при старте проекта
npx shadcn@latest add button card badge dialog sheet
npx shadcn@latest add input textarea form label
npx shadcn@latest add navigation-menu dropdown-menu
npx shadcn@latest add avatar separator skeleton
```

---

## Источники

- [shadcn/ui MCP docs](https://ui.shadcn.com/docs/mcp)
- [shadcn/ui компоненты](https://ui.shadcn.com/docs/components)
- [Tailwind dark mode](https://tailwindcss.com/docs/dark-mode)
