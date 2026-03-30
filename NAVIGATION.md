# Mapa de Navegação

## Estrutura Geral

```
RootNavigator
├── AuthStack          (utilizador não autenticado)
└── MainTabs           (utilizador autenticado)
    ├── HomeStack
    ├── TransactionsStack
    ├── AnalyticsStack
    └── SettingsStack
```

---

## AuthStack

| Ecrã | Ficheiro | Descrição |
|---|---|---|
| `WelcomeScreen` | `screens/auth/WelcomeScreen.tsx` | Ecrã inicial com opções de login e registo |
| `LoginScreen` | `screens/auth/LoginScreen.tsx` | Formulário de login (email + password) |
| `RegisterScreen` | `screens/auth/RegisterScreen.tsx` | Formulário de registo (email + password) |

---

## MainTabs

4 tabs fixas na barra inferior.

| Tab | Ícone | Stack |
|---|---|---|
| Home | `home` | `HomeStack` |
| Transações | `arrow-left-right` | `TransactionsStack` |
| Analytics | `bar-chart-2` | `AnalyticsStack` |
| Definições | `settings` | `SettingsStack` |

---

## HomeStack

| Ecrã | Ficheiro | Descrição |
|---|---|---|
| `HomeScreen` | `screens/home/HomeScreen.tsx` | Dashboard: net worth, lista de contas, transações recentes |
| `AccountDetailScreen` | `screens/home/AccountDetailScreen.tsx` | Detalhe de uma conta: saldo, histórico de transações, membros |

**Modais acessíveis a partir do HomeStack:**
| Modal | Ficheiro | Trigger |
|---|---|---|
| `AddAccountModal` | `modals/AddAccountModal.tsx` | Botão "+" em HomeScreen |
| `EditAccountModal` | `modals/EditAccountModal.tsx` | Opções de conta em HomeScreen / AccountDetailScreen |
| `AddTransactionModal` | `modals/AddTransactionModal.tsx` | FAB global |
| `AddTransferModal` | `modals/AddTransferModal.tsx` | FAB global |

---

## TransactionsStack

| Ecrã | Ficheiro | Descrição |
|---|---|---|
| `TransactionsScreen` | `screens/transactions/TransactionsScreen.tsx` | Lista de todas as transações com filtros (conta, tipo, categoria, data) |
| `ScheduledScreen` | `screens/transactions/ScheduledScreen.tsx` | Lista de transações e transferências agendadas |

**Modais acessíveis a partir do TransactionsStack:**
| Modal | Ficheiro | Trigger |
|---|---|---|
| `AddTransactionModal` | `modals/AddTransactionModal.tsx` | FAB global |
| `EditTransactionModal` | `modals/EditTransactionModal.tsx` | Tap numa transação |
| `AddTransferModal` | `modals/AddTransferModal.tsx` | FAB global |
| `EditTransferModal` | `modals/EditTransferModal.tsx` | Tap numa transferência |
| `AddScheduledModal` | `modals/AddScheduledModal.tsx` | Botão "+" em ScheduledScreen |
| `EditScheduledModal` | `modals/EditScheduledModal.tsx` | Tap num agendamento |

---

## AnalyticsStack

| Ecrã | Ficheiro | Descrição |
|---|---|---|
| `AnalyticsScreen` | `screens/analytics/AnalyticsScreen.tsx` | Gráficos: pizza por categoria, barras income/expense, linha de saldo |
| `BudgetsScreen` | `screens/analytics/BudgetsScreen.tsx` | Orçamentos mensais por categoria com barras de progresso |
| `NetWorthScreen` | `screens/analytics/NetWorthScreen.tsx` | Net worth total + gráfico de evolução (12 meses) |

**Modais acessíveis a partir do AnalyticsStack:**
| Modal | Ficheiro | Trigger |
|---|---|---|
| `AddBudgetModal` | `modals/AddBudgetModal.tsx` | Botão "+" em BudgetsScreen |
| `EditBudgetModal` | `modals/EditBudgetModal.tsx` | Tap num orçamento |

---

## SettingsStack

| Ecrã | Ficheiro | Descrição |
|---|---|---|
| `SettingsScreen` | `screens/settings/SettingsScreen.tsx` | Menu de definições: perfil, tema, categorias, bancos, partilha, notificações |
| `CategoriesScreen` | `screens/settings/CategoriesScreen.tsx` | Lista de categorias income e expense, com opção de apagar/editar |
| `BankConnectionsScreen` | `screens/settings/BankConnectionsScreen.tsx` | Bancos ligados (max 3), avisos de expiração de consentimento |
| `AccountMembersScreen` | `screens/settings/AccountMembersScreen.tsx` | Membros de uma conta partilhada, permissões, convites |

**Modais acessíveis a partir do SettingsStack:**
| Modal | Ficheiro | Trigger |
|---|---|---|
| `EditProfileModal` | `modals/EditProfileModal.tsx` | Tap no perfil em SettingsScreen |
| `AddCategoryModal` | `modals/AddCategoryModal.tsx` | Botão "+" em CategoriesScreen |
| `EditCategoryModal` | `modals/EditCategoryModal.tsx` | Tap numa categoria |
| `AddBankModal` | `modals/AddBankModal.tsx` | Botão "+" em BankConnectionsScreen |
| `InviteMemberModal` | `modals/InviteMemberModal.tsx` | Botão "+" em AccountMembersScreen |

---

## FAB Global

Botão flutuante acessível em qualquer tab.

| Ação | Modal |
|---|---|
| Adicionar despesa/rendimento | `AddTransactionModal` |
| Adicionar transferência | `AddTransferModal` |

---

## Parâmetros de Navegação

```ts
// AuthStack
type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
};

// HomeStack
type HomeStackParamList = {
  Home: undefined;
  AccountDetail: { accountId: string };
};

// TransactionsStack
type TransactionsStackParamList = {
  Transactions: { accountId?: string } | undefined;
  Scheduled: undefined;
};

// AnalyticsStack
type AnalyticsStackParamList = {
  Analytics: undefined;
  Budgets: undefined;
  NetWorth: undefined;
};

// SettingsStack
type SettingsStackParamList = {
  Settings: undefined;
  Categories: undefined;
  BankConnections: undefined;
  AccountMembers: { accountId: string };
};
```
