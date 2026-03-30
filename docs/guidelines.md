# Diretrizes de Código — OhrangeFund

## Naming

| Tipo | Convenção | Exemplo |
|---|---|---|
| Componentes | PascalCase | `AccountCard.tsx`, `AddTransactionModal.tsx` |
| Screens | PascalCase + sufixo Screen | `HomeScreen.tsx`, `LoginScreen.tsx` |
| Hooks | camelCase + prefixo `use` | `useAccounts.ts`, `useTransactions.ts` |
| Utils | camelCase | `currency.ts`, `date.ts` |
| Contexts | PascalCase + sufixo Context | `ThemeContext.tsx` |
| Types/interfaces | PascalCase | `Account`, `Transaction`, `Category` |
| Constantes | UPPER_SNAKE_CASE | `MAX_BANK_CONNECTIONS` |

## Estrutura de ficheiros

### Componente simples
```tsx
// src/components/ui/Button.tsx
import { ... } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface ButtonProps { ... }

export function Button({ ... }: ButtonProps) { ... }
```

### Hook de domínio
```tsx
// src/hooks/useAccounts.ts
export function useAccounts() {
  // fetch, estado, operações
  return { accounts, loading, addAccount, ... };
}
```

### Screen
```tsx
// src/screens/home/HomeScreen.tsx
export function HomeScreen() {
  const { accounts, loading } = useAccounts();
  // sem fetch direto — apenas hooks e componentes
}
```

## Regras de componentes

- `components/ui/` — zero lógica de negócio, zero chamadas Firebase, zero tipos de domínio
- `components/shared/` — conhece os tipos de domínio (`Account`, `Transaction`...) mas não faz fetch
- `hooks/` — toda a lógica de fetch Firestore e gestão de estado
- `screens/` — orquestram hooks e componentes, pouco código próprio
- `modals/` — podem usar hooks; recebem `onClose` e dados necessários por props

## Valores monetários

```ts
// SEMPRE em cêntimos (number inteiro)
const amount = 15050; // = €150.50

// Conversão via utils
import { centsToAmount, amountToCents, formatCurrency } from '@/utils/currency';

centsToAmount(15050)        // → 150.50
amountToCents(150.50)       // → 15050
formatCurrency(15050)       // → "€150,50"
```

## Firestore — padrões

```ts
// Leitura
const snap = await getDoc(doc(db, 'accounts', accountId));
const account = snap.data() as Account;

// Atualização atómica do balance (SEMPRE via transaction)
await runTransaction(db, async (tx) => {
  const ref = doc(db, 'accounts', accountId);
  const snap = await tx.get(ref);
  const current = snap.data()!.balance;
  tx.update(ref, { balance: current - amount });
  tx.set(doc(db, 'transactions', newId), transactionData);
});
```

## Tema

```ts
// NUNCA hardcoded
// ❌
style={{ color: '#000000' }}

// ✅
const { colors } = useTheme();
style={{ color: colors.text }}
```

## Formato de erro (endpoints Vercel)

```ts
// Sucesso
{ data: T, error: null }

// Erro
{ data: null, error: { code: string, message: string } }

// Códigos possíveis:
// UNAUTHORIZED | FORBIDDEN | NOT_FOUND | VALIDATION_ERROR | LIMIT_REACHED | INTERNAL_ERROR
```

## Imports

Usar alias `@/` para imports internos:
```ts
import { useAccounts } from '@/hooks/useAccounts';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/currency';
```

Configurar em `tsconfig.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  }
}
```
