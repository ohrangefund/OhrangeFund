# Mapa de Navegação

## Estrutura Geral

```
RootNavigator
├── AuthStack          (utilizador não autenticado)
└── MainTabs           (utilizador autenticado)
    ├── HomeStack
    ├── AccountsStack
    ├── ScheduledStack
    ├── Analytics      (placeholder — Fase 9)
    ├── CategoriesScreen
    └── SettingsStack
```

**Nota de navegação:** A barra de tabs inferior está oculta. A navegação entre tabs é feita através do `DrawerMenu` (menu lateral hamburguer). O `NavBridge` captura o objeto `navigation` do Tab.Navigator e regista-o no `DrawerContext`, permitindo ao drawer navegar entre tabs sem acesso direto ao navigator.

---

## AuthStack

| Ecrã | Ficheiro | Descrição |
|---|---|---|
| `WelcomeScreen` | `screens/auth/WelcomeScreen.tsx` | Ecrã inicial com botões de login e registo |
| `LoginScreen` | `screens/auth/LoginScreen.tsx` | Formulário de login (email + password) |
| `RegisterScreen` | `screens/auth/RegisterScreen.tsx` | Formulário de registo — cria doc em `users` e categorias default |

---

## Layout Principal (autenticado)

Todas as screens autenticadas partilham o `AppHeader` (hamburguer + nome da app) e o `DrawerMenu` sobreposto.

| Componente | Ficheiro | Descrição |
|---|---|---|
| `AppHeader` | `components/ui/AppHeader.tsx` | Header fixo em todas as tabs — Menu icon (abre drawer) + "OhrangeFund" (navega para Home) |
| `DrawerMenu` | `components/ui/DrawerMenu.tsx` | Menu lateral animado com 5 destinos: Início, Contas, Gráficos, Categorias, Configurações |
| `DrawerContext` | `context/DrawerContext.tsx` | Estado do drawer + `registerNavigate` para bridge com Tab.Navigator |

---

## HomeStack

| Ecrã | Ficheiro | Parâmetros | Descrição |
|---|---|---|---|
| `HomeScreen` | `screens/home/HomeScreen.tsx` | — | Dashboard: selector de conta/Geral, cards de saldo + totais, tabs despesas/receitas |
| (AccountDetail acessível via AccountsStack) | | | |

**Modais acessíveis a partir de HomeScreen:**
| Modal | Trigger |
|---|---|
| `AddTransactionModal` | FAB (só em conta específica) |
| `EditTransactionModal` | Tap numa transação |
| `SelectAccountModal` | Selector de conta no topo |

---

## AccountsStack

| Ecrã | Ficheiro | Parâmetros | Descrição |
|---|---|---|---|
| `AccountsScreen` | `screens/accounts/AccountsScreen.tsx` | — | Lista de contas activas + arquivadas, saldo total, botões de transferência e histórico |
| `AccountDetailScreen` | `screens/home/AccountDetailScreen.tsx` | `{ accountId, accountName, accountColor }` | Detalhe de conta: tabs Transações/Transferências, FAB expandível |
| `TransfersHistoryScreen` | `screens/accounts/TransfersHistoryScreen.tsx` | — | Histórico de todas as transferências do utilizador |

**Modais acessíveis a partir de AccountsStack:**
| Modal | Trigger |
|---|---|
| `AddAccountModal` | FAB em AccountsScreen |
| `EditAccountModal` | Botão de edição em AccountsScreen |
| `AddTransferModal` | Botão "Nova transferência" em AccountsScreen |
| `EditTransferModal` | Tap numa transferência em TransfersHistoryScreen |
| `AddTransactionModal` | Sub-FAB "Transação" em AccountDetailScreen |
| `EditTransactionModal` | Tap numa transação em AccountDetailScreen |
| `AddTransferModal` (com fromAccount) | Sub-FAB "Transferência" em AccountDetailScreen |
| `EditTransferModal` | Tap numa transferência em AccountDetailScreen |

---

## CategoriesScreen (tab directa)

| Ecrã | Ficheiro | Descrição |
|---|---|---|
| `CategoriesScreen` | `screens/settings/CategoriesScreen.tsx` | Tabs Despesa/Receita — lista de categorias |

**Modais:**
| Modal | Trigger |
|---|---|
| `AddCategoryModal` | FAB |
| `EditCategoryModal` | Tap numa categoria |

---

## SettingsStack

| Ecrã | Ficheiro | Parâmetros | Descrição |
|---|---|---|---|
| `SettingsScreen` | `screens/settings/SettingsScreen.tsx` | — | Menu de configurações (actualmente só "Visuais") |
| `VisualsScreen` | `screens/settings/VisualsScreen.tsx` | — | Escolha de tema: Claro / Escuro |

---

## ScheduledStack

| Ecrã | Ficheiro | Descrição |
|---|---|---|
| `ScheduledScreen` | `screens/scheduled/ScheduledScreen.tsx` | Tabs Transações/Transferências — lista de agendamentos, FAB contextual |

**Modais:**
| Modal | Trigger |
|---|---|
| `AddScheduledTransactionModal` | FAB na tab Transações |
| `EditScheduledTransactionModal` | Tap num agendamento de transação |
| `AddScheduledTransferModal` | FAB na tab Transferências |
| `EditScheduledTransferModal` | Tap num agendamento de transferência |

---

## Analytics (placeholder)

Tab `Analytics` aponta para um `Placeholder` component vazio. Será implementado na Fase 9.

---

## Modais Globais

Modais reutilizados em múltiplos contextos:

| Modal | Ficheiro | Usado em |
|---|---|---|
| `SelectAccountModal` | `components/ui/SelectAccountModal.tsx` | HomeScreen, AddTransactionModal, EditTransactionModal, AddTransferModal |
| `SelectCategoryModal` | `components/ui/SelectCategoryModal.tsx` | AddTransactionModal, EditTransactionModal, EditCategoryModal |
| `DatePickerModal` | `components/ui/DatePickerModal.tsx` | AddTransactionModal, EditTransactionModal, AddTransferModal, EditTransferModal |
| `ConfirmModal` | `components/ui/ConfirmModal.tsx` | EditAccountModal, EditCategoryModal, EditTransactionModal, EditTransferModal |

---

## Parâmetros de Navegação (tipos actuais)

```ts
type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
};

type MainTabsParamList = {
  Home: undefined;
  Accounts: undefined;
  Scheduled: undefined;
  Analytics: undefined;
  Categories: undefined;
  Settings: undefined;
};

type HomeStackParamList = {
  HomeMain: undefined;
};

type AccountsStackParamList = {
  AccountsMain: undefined;
  AccountDetail: { accountId: string; accountName: string; accountColor: string };
  TransfersHistory: undefined;
};

type ScheduledStackParamList = {
  ScheduledMain: undefined;
};

type SettingsStackParamList = {
  SettingsMain: undefined;
  Visuals: undefined;
};
```
