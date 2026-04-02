# Schema da Base de Dados — Firestore

Todas as collections são top-level (flat). Valores monetários guardados como `number` em cêntimos inteiros (ex: `15050` = €150.50). Timestamps são `Firestore Timestamp`.

---

## `users`

Criado no registo. O `id` do documento é o Firebase Auth UID.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | string | Firebase Auth UID (doc ID) |
| `email` | string | Email do utilizador |
| `display_name` | string | Nome visível na app |
| `theme` | string | `'system'` \| `'dark'` \| `'light'` |
| `created_at` | timestamp | |

---

## `accounts`

Contas da app (manual ou ligada a banco).

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | string | doc ID (auto) |
| `user_id` | string | ref → users |
| `name` | string | Nome da conta |
| `balance` | number | Saldo atual em cêntimos — atualizado atomicamente a cada operação |
| `color` | string | Hex (ex: `'#4F46E5'`) |
| `icon` | string | Nome do ícone Lucide (ex: `'wallet'`) |
| `archived` | boolean | Conta arquivada (oculta mas mantém histórico) |
| `bank_account_id` | string \| null | ref → bank_accounts (se ligada a banco) |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

---

## `bank_connections`

Ligações a bancos via GoCardless. Máximo 3 por utilizador.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | string | doc ID (auto) |
| `user_id` | string | ref → users |
| `institution_id` | string | ID da instituição no GoCardless |
| `institution_name` | string | Nome do banco (ex: `'Millennium BCP'`) |
| `requisition_id` | string | ID da requisição GoCardless |
| `status` | string | `'active'` \| `'expired'` \| `'pending'` |
| `consent_expires_at` | timestamp | Expiração do consentimento (90 dias) |
| `created_at` | timestamp | |

---

## `bank_accounts`

Contas bancárias importadas do GoCardless.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | string | doc ID (auto) |
| `user_id` | string | ref → users |
| `bank_connection_id` | string | ref → bank_connections |
| `external_id` | string | ID da conta no GoCardless |
| `name` | string | Nome da conta bancária |
| `iban` | string \| null | IBAN (se disponível) |
| `created_at` | timestamp | |

---

## `categories`

Categorias por utilizador, separadas por tipo.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | string | doc ID (auto) |
| `user_id` | string | ref → users |
| `name` | string | Nome da categoria |
| `type` | string | `'income'` \| `'expense'` |
| `icon` | string | Nome do ícone Lucide |
| `color` | string | Hex |
| `is_default` | boolean | `true` para `'Outros'` — nunca pode ser apagada |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

**Categorias criadas automaticamente no registo:**
- `Outros` (income, `is_default: true`)
- `Outros` (expense, `is_default: true`)
- Templates iniciais: Salário, Freelance, Investimentos, Alimentação, Transportes, Casa, Saúde, Lazer (`is_default: false`)

---

## `transactions`

Despesas e rendimentos.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | string | doc ID (auto) |
| `user_id` | string | ref → users |
| `account_id` | string | ref → accounts |
| `category_id` | string | ref → categories |
| `amount` | number | Valor em cêntimos — sempre positivo |
| `type` | string | `'income'` \| `'expense'` |
| `description` | string \| null | Descrição opcional |
| `date` | timestamp | Data da transação (pode ser no passado) |
| `source` | string | `'manual'` \| `'bank'` |
| `external_id` | string \| null | ID GoCardless — para evitar duplicados em transações bancárias |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

---

## `transfers`

Transferências entre contas.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | string | doc ID (auto) |
| `user_id` | string | ref → users |
| `from_account_id` | string | ref → accounts (conta debitada) |
| `to_account_id` | string | ref → accounts (conta creditada) |
| `account_ids` | string[] | `[from_account_id, to_account_id]` — campo auxiliar para queries `array-contains` |
| `amount` | number | Valor em cêntimos — sempre positivo |
| `description` | string | Descrição (pode ser string vazia) |
| `date` | timestamp | Data da transferência |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

---

## `scheduled_transactions`

Despesas/rendimentos agendados (únicos ou recorrentes).

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | string | doc ID (auto) |
| `user_id` | string | ref → users |
| `account_id` | string | ref → accounts |
| `category_id` | string | ref → categories |
| `amount` | number | Valor em cêntimos |
| `type` | string | `'income'` \| `'expense'` |
| `description` | string \| null | |
| `recurrence` | string | `'once'` \| `'weekly'` \| `'monthly'` \| `'yearly'` |
| `next_date` | timestamp | Próxima data de execução |
| `end_date` | timestamp \| null | Data de fim (null = sem fim) |
| `created_at` | timestamp | |

---

## `scheduled_transfers`

Transferências agendadas (únicas ou recorrentes).

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | string | doc ID (auto) |
| `user_id` | string | ref → users |
| `from_account_id` | string | ref → accounts |
| `to_account_id` | string | ref → accounts |
| `amount` | number | Valor em cêntimos |
| `description` | string \| null | |
| `recurrence` | string | `'once'` \| `'weekly'` \| `'monthly'` \| `'yearly'` |
| `next_date` | timestamp | Próxima data de execução |
| `end_date` | timestamp \| null | |
| `created_at` | timestamp | |

---

## `account_members`

Partilha de contas entre utilizadores.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | string | doc ID (auto) |
| `account_id` | string | ref → accounts |
| `user_id` | string | ID do membro convidado |
| `owner_id` | string | ID do owner da conta |
| `permission` | string | `'read'` \| `'write'` |
| `created_at` | timestamp | |

---

## Regras de Atualização do `balance`

A cada operação, `accounts.balance` é atualizado numa Firestore transaction:

| Operação | Efeito no balance |
|---|---|
| Inserir despesa `X` | `balance -= X` |
| Inserir rendimento `X` | `balance += X` |
| Editar despesa `X → Y` | `balance += (X - Y)` |
| Editar rendimento `X → Y` | `balance += (Y - X)` |
| Apagar despesa `X` | `balance += X` |
| Apagar rendimento `X` | `balance -= X` |
| Inserir transferência `X` (origem) | `balance -= X` |
| Inserir transferência `X` (destino) | `balance += X` |
| Apagar transferência `X` | reverter ambos os lados |
| Editar transação mudando conta `A → B` | revert em A, apply em B (Firestore transaction com 2 reads antes de qualquer write) |

---

## Firestore Security Rules (base)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    match /accounts/{accountId} {
      allow read, update, delete: if request.auth.uid == resource.data.user_id;
      allow create: if request.auth.uid == request.resource.data.user_id;
    }

    match /categories/{categoryId} {
      allow read, update, delete: if request.auth.uid == resource.data.user_id;
      allow create: if request.auth.uid == request.resource.data.user_id;
    }

    match /transactions/{transactionId} {
      allow read, update, delete: if request.auth.uid == resource.data.user_id;
      allow create: if request.auth.uid == request.resource.data.user_id;
    }

    match /transfers/{transferId} {
      allow read, update, delete: if request.auth.uid == resource.data.user_id;
      allow create: if request.auth.uid == request.resource.data.user_id;
    }

    match /scheduled_transactions/{id} {
      allow read, update, delete: if request.auth.uid == resource.data.user_id;
      allow create: if request.auth.uid == request.resource.data.user_id;
    }

    match /scheduled_transfers/{id} {
      allow read, update, delete: if request.auth.uid == resource.data.user_id;
      allow create: if request.auth.uid == request.resource.data.user_id;
    }

    match /bank_connections/{id} {
      allow read, update, delete: if request.auth.uid == resource.data.user_id;
      allow create: if request.auth.uid == request.resource.data.user_id;
    }

    match /bank_accounts/{id} {
      allow read, update, delete: if request.auth.uid == resource.data.user_id;
      allow create: if request.auth.uid == request.resource.data.user_id;
    }

    // account_members: owner pode gerir, membro pode ler
    match /account_members/{id} {
      allow read: if request.auth.uid == resource.data.user_id
                  || request.auth.uid == resource.data.owner_id;
      allow create: if request.auth.uid == request.resource.data.owner_id;
      allow update, delete: if request.auth.uid == resource.data.owner_id;
    }

    // investment_accounts: 1 por user, criada no registo
    match /investment_accounts/{id} {
      allow read, delete: if request.auth.uid == resource.data.user_id;
      allow create: if request.auth.uid == request.resource.data.user_id;
    }

    // investment_assets: quantity atualizada via Firestore transaction (buy/sell)
    match /investment_assets/{id} {
      allow read, update, delete: if request.auth.uid == resource.data.user_id;
      allow create: if request.auth.uid == request.resource.data.user_id;
    }

    // investment_transactions: imutáveis após criação — sem update/delete do cliente
    match /investment_transactions/{id} {
      allow read: if request.auth.uid == resource.data.user_id;
      allow create: if request.auth.uid == request.resource.data.user_id;
    }

    // investment_snapshots: escritos atomicamente com cada compra/venda — read-only do cliente
    match /investment_snapshots/{id} {
      allow read: if request.auth.uid == resource.data.user_id;
      allow create: if request.auth.uid == request.resource.data.user_id;
    }

    // scheduled_investment_transactions
    match /scheduled_investment_transactions/{id} {
      allow read, update, delete: if request.auth.uid == resource.data.user_id;
      allow create: if request.auth.uid == request.resource.data.user_id;
    }

  }
}
```

**Nota:** as rules de `account_members` serão refinadas na Fase 8 para permitir que membros com permissão `write` possam criar transações em contas partilhadas.

**Nota:** o ficheiro `firestore.rules` na raiz do projecto é a fonte de verdade — estas regras devem estar sincronizadas com ele.
