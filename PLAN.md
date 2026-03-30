# Plano de Desenvolvimento — App de Gestão Financeira

## Stack Tecnológica

| Camada | Tecnologia | Custo |
|---|---|---|
| Mobile | React Native (Expo) | Grátis |
| Auth + Base de dados | Firebase (Authentication + Firestore) | Grátis (Spark plan) |
| APIs externas | Vercel Functions (Node.js) | Grátis (serverless) — apenas GoCardless e push notif. |
| Cron mensal | Railway | ~$0.05/mês (free tier $5) |
| Bank integration | GoCardless Bank Account Data API | Grátis (50 requisições/mês) |
| Gráficos | Victory Native | Grátis (open-source) |
| Distribuição | Google Play Store | $25 uma vez |

---

## Arquitetura

```
React Native App
   |                        |
   v                        v
Firebase                Vercel Functions
(Auth + Firestore)      (GoCardless, push notif.)
acesso direto                   |
via SDK + Security Rules   Railway Cron (1x/mês)
                                |
                           GoCardless API
```

- **React Native** acede diretamente ao Firebase via SDK — sem backend para CRUD
- **Firestore Security Rules** garantem que cada user só acede aos seus próprios dados
- **Vercel Functions** apenas para operações que precisam de secrets: GoCardless OAuth, push notifications
- **Railway** corre o cron mensal — chama GoCardless e escreve no Firestore via Admin SDK

---

## Limitações dos Planos Gratuitos

| Serviço | Limitação |
|---|---|
| Firebase Auth | 50,000 MAUs/mês — completamente gratuito para uso pessoal/pequeno |
| Firebase Firestore | 1GB storage, 50K leituras/dia, 20K escritas/dia, 10K deletes/dia — mais que suficiente para uso pessoal |
| Vercel Functions | 100GB-hours/mês — mais que suficiente |
| Railway | $5 crédito/mês — cron usa ~$0.05, muito folgado |
| GoCardless | 50 requisições/mês — suficiente para ~16 novos users/mês com 3 bancos |

---

## Regras de Negócio Importantes

- Máximo **3 bancos ligados por utilizador** (controlar requisições GoCardless)
- Consentimento bancário expira a cada **90 dias** (aviso na app para renovar)
- Sincronização bancária automática: **dia 1 de cada mês**
- Transações importadas do banco marcadas com `source: "bank"` vs `"manual"`
- Transações bancárias têm `external_id` para evitar duplicados
- **Saldo guardado diretamente em `accounts.balance`** — inicializado com o saldo inicial e atualizado atomicamente a cada operação (inserir/editar/apagar transação ou transferência). Nunca recalculado a partir do zero.
- Contas sem banco associado são suportadas (contas manuais dentro da app)
- Permissões verificadas via Firestore Security Rules em cada pedido que envolva contas partilhadas
- **Moeda única** — app funciona exclusivamente em EUR
- **Apagar categoria** — obrigatório redirecionar as transações existentes para outra categoria do mesmo tipo antes de apagar; não é possível apagar se não existir categoria alternativa do mesmo tipo; a categoria **"Outros"** (income e expense) nunca pode ser apagada — serve como fallback permanente
- **Categorias em contas partilhadas** — cada membro usa as suas próprias categorias; as categorias não são partilhadas entre membros de uma conta
- **Paginação** — 10 items por página, cursor-based (mais eficiente para listas que crescem em tempo real)

---

## Schema da Base de Dados (Firestore Collections)

```
users                   → user_id do Firebase Auth, dados do perfil
accounts                → contas da app (balance guardado diretamente; manual ou ligada a banco)
bank_connections        → ligações a bancos (max 3 por user)
bank_accounts           → contas bancárias importadas do GoCardless
categories              → categorias (tipo: income | expense, por user)
transactions            → despesas e rendimentos
transfers               → transferências entre contas
scheduled_transactions  → despesas/rendimentos agendados
scheduled_transfers     → transferências agendadas
account_members         → partilha de contas (user + conta + permissão: read | write)
```

**Notas Firestore:**
- Todas as collections são top-level (flat) — sem subcollections
- Sem foreign keys nativas — integridade garantida no cliente com Firestore transactions
- Aggregations (analytics, orçamentos) feitas no cliente após query ao Firestore
- Paginação cursor-based via `startAfter()` nativo do Firestore
- Firestore Security Rules protegem todos os dados — cada user só acede aos seus documentos

---

## Pré-requisitos — Antes de Implementar

Estas decisões têm de estar tomadas antes de escrever qualquer linha de código. Deixá-las para depois gera retrabalho.

### Documentação a criar
- [x] `NAVIGATION.md` — mapa de todos os ecrãs, tabs, stacks e modais
- [x] `DATABASE.md` — schema detalhado com colunas, tipos, relações e foreign keys
- [ ] `docs/guidelines.md` — diretrizes de código (estrutura de ficheiros, convenções, padrões)

### Decisões técnicas a tomar
- [x] **Estratégia de moeda e valores** — app apenas em EUR. Valores guardados como `bigint` em cêntimos (ex: `15050` = €150.50).
- [x] **Estrutura de pastas** — ver estrutura definida abaixo
- [x] **Biblioteca de ícones** — Lucide React Native (`lucide-react-native`)
- [x] **Família de fontes** — fonte do sistema (`-apple-system` / `Roboto`), sem fonte custom
- [x] **Formato de resposta da API** — apenas para os endpoints Vercel (GoCardless, push notif.): `{ data: T, error: null }` em sucesso; `{ data: null, error: { code: string, message: string } }` em erro. Códigos: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `LIMIT_REACHED`, `INTERNAL_ERROR`
- [x] **Base de dados** — Firebase Firestore (collections flat, sem subcollections); cliente acede diretamente via SDK; agregações feitas no cliente
- [ ] **Estratégia de falha do cron** — se a sincronização bancária mensal falhar: retry automático? notificação ao user? log de erros?
- [ ] **Serviço de push notifications** — Expo Push Notifications precisa de setup no backend (token por device, envio server-side). Decidir antes da Fase 10.
- [ ] **GoCardless redirect URI** — o OAuth callback precisa de uma URL pública do Vercel definida antes de implementar a Fase 5

### Estrutura de pastas

```
├── App.tsx
├── app.json
├── babel.config.js
├── tsconfig.json
├── assets/
│   └── images/
└── src/
    ├── api/                     # Wrappers do Firebase SDK (firestore.ts, auth.ts) + endpoints Vercel (gocardless.ts)
    ├── components/
    │   ├── ui/                  # Primitivos (Button, Card, Input, Badge, Divider...)
    │   └── shared/              # Componentes de domínio (TransactionItem, AccountCard...)
    ├── context/                 # ThemeContext e outros contexts globais
    ├── hooks/                   # Um hook por conceito de negócio (useAccounts, useTransactions...)
    ├── navigation/
    │   ├── RootNavigator.tsx
    │   ├── AuthStack.tsx
    │   ├── MainTabs.tsx
    │   └── stacks/              # HomeStack, TransactionsStack, AnalyticsStack, SettingsStack
    ├── screens/
    │   ├── auth/
    │   ├── home/
    │   ├── transactions/
    │   ├── analytics/
    │   └── settings/
    ├── modals/                  # Modais globais (AddTransactionModal, AddTransferModal...)
    ├── constants/
    │   └── theme.ts             # Tokens do design system (cores, espaçamento, radius)
    ├── types/
    │   ├── models.ts            # Tipos de domínio: Account, Transaction, Category...
    │   ├── api.ts               # Tipos de request/response da API
    │   └── navigation.ts        # ParamList de cada stack
    └── utils/
        ├── currency.ts          # formatCurrency, centsToAmount, amountToCents
        └── date.ts              # formatDate, formatRelativeDate
```

**Regras:**
- `components/ui/` — zero lógica de negócio, zero chamadas à API
- `components/shared/` — conhece os tipos de domínio mas não faz fetch
- `hooks/` — toda a lógica de fetch e estado; os screens não fazem fetch diretamente
- `screens/` — orquestram hooks e componentes, pouco código próprio

---

## Fases de Desenvolvimento

### Fase 1 — Fundação

#### Fase 1a — Esqueleto do projeto
- Criar projeto Expo com TypeScript
- Estrutura de pastas exata definida neste ficheiro (só as pastas, sem código)
- Criar `docs/guidelines.md` e `CLAUDE.md`
- **Verificação:** app abre no Expo Go

#### Fase 1b — Firebase setup
- Firebase project criado (Authentication + Firestore ativados)
- Firebase SDK integrado na app Expo (`firebase/app`, `firebase/auth`, `firebase/firestore`)
- Firestore Security Rules base configuradas (user só acede aos seus documentos)
- Collection `users` — estrutura definida
- **Verificação:** app consegue ler/escrever no Firestore diretamente

#### Fase 1c — Auth end-to-end
- Firebase Authentication configurado (email/password)
- Ecrãs: `WelcomeScreen`, `LoginScreen`, `RegisterScreen`
- Navegação: `RootNavigator`, `AuthStack`, `MainTabs` (placeholder vazio)
- No registo: criar documento em `users` via SDK
- **Verificação:** login/registo/logout funcional no telemóvel, user aparece no Firestore

#### Fase 1d — Temas
- `ThemeContext` com `system` / `dark` / `light`
- Tokens de cor, espaçamento, radius (baseados em `DESIGN_SYSTEM.md`)
- Nenhum componente usa cores hardcoded — sempre via tokens do tema
- `AsyncStorage` para preferência local
- Sync com campo `theme` no documento `users/{userId}` quando o user altera
- **Verificação:** toggle funciona, persiste entre sessões, fica guardado no Firestore

### Fase 2 — Contas
- CRUD de contas (criar, editar, arquivar, remover)
- Campos: nome, saldo inicial, cor, ícone; `balance` inicializado com saldo inicial
- UI: lista de contas com `balance` atual

### Fase 3 — Categorias
- CRUD de categorias por tipo (`income` / `expense`)
- Categorias são por utilizador (campo `user_id` em cada documento)
- Categorias default criadas automaticamente no registo (`Outros` income e `Outros` expense)
- `Outros` nunca pode ser apagada — serve como fallback permanente
- Apagar categoria obriga a redirecionar transações existentes para outra do mesmo tipo

### Fase 4 — Transações Manuais
- Adicionar despesa / rendimento a uma conta
- Campos: valor, categoria, data, descrição, conta
- Editar e remover transações
- `accounts.balance` atualizado atomicamente via Firestore transaction a cada operação
- Histórico de transações por conta com filtros e paginação

### Fase 5 — Transferências
- Transferência manual entre duas contas
- Debitar conta origem e creditar conta destino numa única Firestore transaction
- Editar e remover transferências (reverter ambos os saldos atomicamente)
- Histórico de transferências

### Fase 6 — Agendamentos
- Agendar despesa/rendimento (data futura, única ou recorrente)
- Agendar transferência (mesmas opções)
- Cron job diário (Railway) processa agendamentos vencidos e atualiza saldos
- UI: lista de agendamentos pendentes

### Fase 7 — Integração Bancária (GoCardless)
- Vercel Functions configuradas (Firebase Admin SDK para escrever no Firestore server-side)
- Máximo 3 bancos por utilizador
- Flow: escolher banco → OAuth do banco (Vercel callback) → listar contas → mapear para conta da app
- Na ligação inicial: importar saldo e histórico dos últimos 90 dias; `balance` inicializado com saldo real
- Cron mensal (Railway, dia 1): buscar transações do mês anterior, inserir no Firestore (sem duplicados via `external_id`), atualizar `balance`
- Alerta quando `balance` diverge do saldo real do banco
- UI: gerir bancos ligados + aviso de expiração de consentimento (90 dias)

### Fase 8 — Partilha de Contas
- Convidar outro utilizador para uma conta (por email)
- Permissões: `read` (só ver) ou `write` (ver + adicionar transações)
- Owner pode alterar permissões ou remover membros
- Todas as queries filtram por `account_members` do utilizador autenticado
- Cada membro usa as suas próprias categorias

### Fase 9 — Gráficos & Analytics
- Gráfico de pizza: despesas por categoria (mês atual)
- Gráfico de barras: income vs expense por mês (últimos 6 meses)
- Gráfico de linha: evolução do saldo de uma conta
- Aggregações feitas no cliente após query ao Firestore
- Filtros: por conta, por período, por categoria
- Ecrã de resumo mensal

### Fase 10 — Orçamentos & Alertas
- Definir orçamento mensal por categoria (ex: max €200 em restaurantes)
- Barra de progresso por categoria (gasto vs limite) — aggregação no cliente
- Alerta quando o user atinge 80% do orçamento de uma categoria
- Alerta quando o orçamento é ultrapassado
- Alerta de saldo mínimo por conta

### Fase 11 — Net Worth
- Ecrã com total consolidado de todas as contas
- Gráfico de evolução do net worth ao longo do tempo (últimos 12 meses)

### Fase 12 — Push Notifications
- Notificação no dia de uma transação agendada
- Notificação quando orçamento de categoria a 80% / ultrapassado
- Notificação quando saldo desce abaixo do mínimo definido
- Lembrete de renovação de consentimento bancário (90 dias)
- Resumo mensal automático no dia 1

### Fase 13 — Documentação & Polish
- Completar docs de diretrizes de código
- Tratamento de erros consistente (toasts, empty states)
- Loading states e skeleton screens
- Testes dos fluxos críticos (auth, transações, bank sync)
- Review de segurança (permissões, validação server-side)
- Ecrã de definições: toggle dark/light mode
- Preparação para publicação na Google Play Store

---

## Extras (Pós-MVP)

Funcionalidades planeadas para depois do MVP estar completo e estável.

### Extra 1 — Módulo de Investimentos

#### Conceito
Conta de investimentos integrada na app para tracking de ativos (ETFs, ações, crypto). Não executa investimentos — é uma camada de gestão e visualização por cima do que o user faz na corretora (ex: Trade Republic).

#### Conta de Investimentos
- Criada automaticamente no registo do utilizador (tal como as categorias default)
- 1 por utilizador, não pode ser apagada nem arquivada
- Saldo = `SUM(num_acoes × preco_por_acao)` por ativo — atualizado apenas em compra/venda (não há polling contínuo)
- Aparece no net worth com este valor

#### Ativos
- User adiciona ticker + tipo (`etf` / `stock` / `crypto`)
- App valida que o ticker existe na API antes de guardar
- Pode remover um ativo apenas se a quantidade for 0

#### Compra
- User transfere valor de uma conta da app → conta de investimentos, associado a um ativo
- App busca preço atual via API automaticamente no momento da compra
- Quantidade calculada: `valor transferido / preço_por_acao`
- `num_acoes` do ativo atualizado: `num_acoes += quantidade_comprada`
- Saldo da conta de investimentos atualizado: `balance = SUM(num_acoes × preco_por_acao)` para todos os ativos
- Snapshot registado automaticamente
- Pode ser anulada (reverte `num_acoes`, transferência e `balance`)

#### Venda
- User regista venda: valor recebido + ativo
- App busca preço atual via API automaticamente no momento da venda
- Quantidade vendida calculada: `valor / preco_por_acao`
- `num_acoes` do ativo atualizado: `num_acoes -= quantidade_vendida`
- Saldo da conta de investimentos atualizado: `balance = SUM(num_acoes × preco_por_acao)` para todos os ativos
- Transferência gerada: conta de investimentos → conta destino
- Snapshot registado automaticamente
- Pode ser anulada também

#### Atualização de Preços
| Momento | Trigger |
|---|---|
| Compra | automático (busca preço na API) |
| Venda | automático (busca preço na API) |
| Mensal | cron já existente (Railway, dia 1) — atualiza `balance` com preços atuais |

#### APIs de Preços
| Tipo | API | Plano gratuito |
|---|---|---|
| Ações / ETFs | Alpha Vantage | 25 req/dia |
| Crypto | CoinGecko | 30 req/min |

**Nota:** Trade Republic tem licença bancária e está disponível no GoCardless — ao ligar na Fase 5, os depósitos/levantamentos da corretora aparecem automaticamente na app.

#### Gráfico de Evolução
- Linha com snapshots ao longo do tempo — valor total do portfolio
- Pontos marcados em momentos de compra/venda
- Implementado com Victory Native (já planeado)

#### Novas Collections Necessárias

**`investment_assets`**
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | string | doc ID |
| `user_id` | string | ref → users |
| `ticker` | string | ex: VWCE, AAPL, BTC |
| `name` | string | Nome legível |
| `type` | string | 'etf' / 'stock' / 'crypto' |
| `quantity` | number | Unidades acumuladas (ex: 30.5) |
| `created_at` | timestamp | |

**`investment_snapshots`**
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | string | doc ID |
| `asset_id` | string | ref → investment_assets |
| `price` | number | Preço unitário em cêntimos |
| `total_value` | number | quantidade × preço, em cêntimos |
| `trigger` | string | 'purchase' / 'sale' / 'cron' |
| `captured_at` | timestamp | |

#### Novos Ecrãs / Modais
- `InvestmentsScreen` — lista de ativos, valor total, gráfico de evolução
- `AddInvestmentAssetModal` — adicionar novo ativo (ticker, tipo)
- `BuyAssetModal` — registar compra (valor, conta de origem, ativo)
- `SellAssetModal` — registar venda (valor, conta de destino, ativo)

---

## Ficheiros de Referência

| Ficheiro | Conteúdo |
|---|---|
| `PLAN.md` | Este ficheiro — plano de desenvolvimento completo |
| `DESIGN_SYSTEM.md` | Paleta de cores, tipografia, espaçamento, estilos default |
| `NAVIGATION.md` | Mapa de ecrãs e navegação (a criar) |
| `DATABASE.md` | Schema detalhado da base de dados (a criar) |
| `docs/guidelines.md` | Diretrizes de código (a criar na Fase 1) |
