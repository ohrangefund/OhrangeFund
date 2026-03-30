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
| `NAVIGATION.md` | Mapa de ecrãs, stacks, tabs, modais e parâmetros |
| `docs/guidelines.md` | Convenções de código, padrões, estrutura de ficheiros |
| `.claude/skills/react-native-skills/AGENTS.md` | React Native best practices: listas, animações, UI, performance |
| `.claude/skills/frontend-design/SKILL.md` | Diretrizes de design de interfaces: tipografia, cor, motion, composição |

## Regras importantes

- Valores monetários **sempre em cêntimos** (`number`), nunca em euros com decimais
- `accounts.balance` **nunca calculado** — atualizado atomicamente via Firestore transaction
- App apenas em **EUR**
- Sem subcollections no Firestore — tudo flat
- Cada user acede apenas aos seus dados (Firestore Security Rules)
- Sem backend para CRUD — cliente acede diretamente ao Firebase

## Estrutura de pastas

```
src/
  api/          Wrappers Firebase SDK + chamadas Vercel (GoCardless)
  components/
    ui/         Primitivos sem lógica de negócio (Button, Card, Input...)
    shared/     Componentes de domínio sem fetch (TransactionItem, AccountCard...)
  context/      Contexts globais (ThemeContext...)
  hooks/        Toda a lógica de fetch e estado
  navigation/   RootNavigator, AuthStack, MainTabs, stacks/
  screens/      auth/ home/ transactions/ analytics/ settings/
  modals/       Modais globais
  constants/    theme.ts — tokens do design system
  types/        models.ts, api.ts, navigation.ts
  utils/        currency.ts, date.ts
```

## Convenções

- Componentes: PascalCase (`AccountCard.tsx`)
- Hooks: camelCase com prefixo `use` (`useAccounts.ts`)
- Utils/constants: camelCase (`currency.ts`)
- Sem cores hardcoded — sempre via tokens do tema
- Screens não fazem fetch — usam hooks
- `components/ui/` sem chamadas à API nem tipos de domínio
