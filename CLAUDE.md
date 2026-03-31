# OhrangeFund — Guia para Claude Code

## O que é este projeto

App móvel de gestão financeira pessoal. React Native (Expo) com Firebase (Auth + Firestore). O plano completo está em `PLAN.md`.

## Stack

- **Mobile:** React Native (Expo SDK 54), TypeScript
- **Auth + DB:** Firebase Authentication + Firestore (acesso direto do cliente via SDK)
- **APIs externas:** Vercel Functions (apenas GoCardless e push notifications — Fase 7+)
- **Cron:** Railway (sincronização bancária mensal — Fase 7+)

## Ficheiros de referência

| Ficheiro | Para quê |
|---|---|
| `PLAN.md` | Plano completo: fases, regras de negócio, stack, decisões |
| `DATABASE.md` | Schema Firestore: collections, campos, tipos, Security Rules |
| `NAVIGATION.md` | Mapa de ecrãs, stacks, modais, parâmetros e arquitectura de navegação |
| `docs/guidelines.md` | Convenções de código, padrões, estrutura de ficheiros |

## Fases implementadas

| Fase | Estado | Descrição |
|---|---|---|
| 1a–1d | ✅ | Fundação: Expo, Firebase, Auth, Temas |
| 2 | ✅ | Contas (CRUD, arquivo, cores, ícones) |
| 3 | ✅ | Categorias (CRUD, defaults, redirect ao apagar) |
| 4 | ✅ | Transações manuais (CRUD, saldo atómico) |
| 5 | ✅ | Transferências (CRUD, saldo atómico em 2 contas) |
| 6–13 | ⏳ | Agendamentos, Banco, Partilha, Analytics, etc. |

## Arquitectura de navegação

A barra de tabs inferior está **oculta**. Toda a navegação entre tabs é feita via `DrawerMenu` (menu lateral animado com hamburguer icon).

**Mecanismo:** `NavBridge` é renderizado como `tabBar` prop do `Tab.Navigator`, captura o objeto `navigation` e regista-o em `DrawerContext.registerNavigate`. O drawer usa esse callback para navegar entre tabs.

**Tabs actuais:** Home, Accounts, Analytics (placeholder), Categories, Settings

## Regras importantes

- Valores monetários **sempre em cêntimos** (`number`), nunca em euros com decimais
- `accounts.balance` **nunca calculado** — atualizado atomicamente via Firestore transaction
- App apenas em **EUR**
- Sem subcollections no Firestore — tudo flat
- Cada user acede apenas aos seus dados (Firestore Security Rules)
- Sem backend para CRUD — cliente acede diretamente ao Firebase
- Ícones de categoria/conta: mapa de strings Lucide duplicado em vários ficheiros — é intencional (evita abstrações prematuras)
- Datas nas forms: sempre via `DatePickerModal` (nunca TextInput manual)
- `ConfirmModal` em vez de `Alert.alert` (Alert não é fiável na web)

## Estrutura de pastas

```
src/
  api/          Wrappers Firebase SDK (accounts, categories, transactions, transfers, firebase)
  components/
    ui/         Primitivos sem lógica de negócio (Button, Card, AppHeader, DrawerMenu,
                DatePickerModal, SelectAccountModal, SelectCategoryModal, ConfirmModal)
    shared/     Componentes de domínio sem fetch (TransactionItem, AccountCard,
                CategoryItem, TransferItem)
  context/      AuthContext, ThemeContext, DrawerContext
  hooks/        useAccounts, useCategories, useTransactions, useTransfers
  navigation/   RootNavigator, AuthStack, MainTabs, stacks/
  screens/      auth/ home/ accounts/ settings/
  modals/       Add/Edit modais para Account, Category, Transaction, Transfer
  constants/    theme.ts — tokens do design system
  types/        models.ts, navigation.ts
  utils/        currency.ts, date.ts
```

## Convenções

- Componentes: PascalCase (`AccountCard.tsx`)
- Hooks: camelCase com prefixo `use` (`useAccounts.ts`)
- Utils/constants: camelCase (`currency.ts`)
- Sem cores hardcoded — sempre via tokens do tema
- Screens não fazem fetch — usam hooks
- `components/ui/` sem chamadas à API nem tipos de domínio
- Modais controlados por `visible: boolean` (Add) ou `item: T | null` (Edit — visível quando `!!item`)

## Tokens do tema

Definidos em `src/constants/theme.ts`. Dois conjuntos: `darkColors` e `lightColors`. Sempre aceder via `useTheme().colors`.

Tokens disponíveis: `background`, `surface`, `surfaceAlt`, `border`, `text`, `textSecondary`, `textDisabled`, `primary`, `primaryForeground`, `error`, `success`, `income`, `expense`
