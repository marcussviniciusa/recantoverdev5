# 🍽️ Sistema de Pagamento por Mesa - Recanto Verde

## 📋 **OVERVIEW**

Implementação de um sistema de pagamento mais adequado para restaurantes, onde **um único pagamento é gerado por mesa** ao invés de pagamentos individuais por pedido.

### **🎯 Principais Funcionalidades**

- ✅ **Identificação de Mesa**: Campo opcional para identificar clientes
- ✅ **Pagamento Único**: Um pagamento para todos os pedidos da mesa
- ✅ **Múltiplos Métodos**: Dinheiro, cartão, PIX, etc.
- ✅ **Controle de Fluxo**: Só paga após todos os pedidos entregues
- ✅ **Interface Intuitiva**: Modal de pagamento com cálculo de troco
- ✅ **Admin Atualizado**: Interface do admin reflete o novo sistema

---

## 🏗️ **ARQUITETURA ATUALIZADA**

### **📊 Modelos Modificados**

#### **1. Table Model (`models/Table.ts`)**
```typescript
interface ITable {
  number: number;
  capacity: number;
  status: 'disponivel' | 'ocupada' | 'reservada' | 'manutencao';
  currentCustomers?: number;
  identification?: string; // 🆕 NOVO CAMPO
  openedAt?: Date;
  closedAt?: Date;
  assignedWaiter?: mongoose.Types.ObjectId;
}
```

**Benefícios**:
- Permite identificar mesa com nome/referência
- Campo opcional, não obrigatório
- Limita a 100 caracteres

#### **2. Payment Model (`models/Payment.ts`)**
```typescript
interface IPayment {
  tableId: mongoose.Types.ObjectId;
  orderIds: mongoose.Types.ObjectId[]; // 🆕 ARRAY de pedidos
  totalAmount: number;
  paymentMethods: IPaymentMethod[];
  status: 'pendente' | 'pago' | 'cancelado';
  tableIdentification?: string; // 🆕 Salva identificação
  // ... outros campos
}
```

**Mudanças**:
- `orderId` → `orderIds` (array)
- Novo campo `tableIdentification`
- Índices atualizados para performance

---

## 🔄 **FLUXO ATUALIZADO**

### **📝 Fluxo Anterior (Por Pedido)**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Pedido 1    │ →  │ Pagamento 1 │    │ Mesa aberta │
│ Entregue    │    │ Individual  │    │ para sempre │
└─────────────┘    └─────────────┘    └─────────────┘
┌─────────────┐    ┌─────────────┐    
│ Pedido 2    │ →  │ Pagamento 2 │    
│ Entregue    │    │ Individual  │    
└─────────────┘    └─────────────┘    
```

### **🎯 Fluxo Novo (Por Mesa)**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Garçom abre │ →  │ Múltiplos   │ →  │ Pagamento   │ →  │ Mesa pode   │
│ mesa c/ ID  │    │ pedidos     │    │ único p/    │    │ ser liberada│
└─────────────┘    └─────────────┘    │ toda mesa   │    └─────────────┘
                                      └─────────────┘    
```

---

## 🖥️ **INTERFACES IMPLEMENTADAS**

### **1. Modal de Abertura de Mesa**

**Local**: `/garcom/mesas` → Botão "Abrir Mesa"

**Campos**:
- **Número de clientes** (obrigatório)
- **Identificação** (opcional): "Família Silva", "João", "Evento"

**Validações**:
- Clientes não pode exceder capacidade
- Identificação máximo 100 caracteres

### **2. Página Fechar Conta**

**Local**: `/garcom/conta/[tableId]`

**Funcionalidades**:
- **Resumo da Conta**: Total, pago, a pagar
- **Lista de Pedidos**: Separados por status
- **Modal de Pagamento**: Múltiplos métodos
- **Cálculo de Troco**: Automático

**Estados**:
- 🟡 **Aguardando**: Pedidos ainda não entregues
- 🟢 **Pode Pagar**: Todos pedidos entregues
- ✅ **Pago**: Conta finalizada

### **3. Admin Pagamentos Atualizado**

**Local**: `/admin/pagamentos`

**Nova Funcionalidade**:
- ✅ **Visão por Mesa**: Lista mesas ao invés de pedidos individuais
- ✅ **Identificação**: Mostra identificação da mesa se houver
- ✅ **Status Consolidado**: Em Andamento, Pode Pagar, Pago
- ✅ **Múltiplos Métodos**: Exibe métodos de pagamento usado
- ✅ **Troco**: Mostra valor do troco se houver
- ✅ **Link Direto**: Botão para processar pagamento da mesa

**Estatísticas**:
- Mesas Pendentes (podem pagar)
- Mesas Pagas
- Total Recebido
- Valor Pendente

---

## 🛠️ **APIs IMPLEMENTADAS**

### **1. API de Mesa Atualizada**

**Endpoint**: `PUT /api/tables/[id]`

**Novos Campos**:
```typescript
{
  status: 'ocupada',
  currentCustomers: 4,
  identification: 'Família Silva', // 🆕 NOVO
  assignedWaiter: 'waiterId'
}
```

### **2. Nova API de Pagamento por Mesa**

**Endpoint**: `GET /api/payments/mesa/[tableId]`
```typescript
// Retorna resumo da conta da mesa
{
  table: Table,
  orders: Order[],
  ordersByStatus: {
    preparando: Order[],
    pronto: Order[],
    entregue: Order[],
    pago: Order[]
  },
  summary: {
    totalOrders: number,
    totalAmount: number,
    unpaidAmount: number,
    paidAmount: number,
    canPayNow: boolean
  }
}
```

**Endpoint**: `POST /api/payments/mesa/[tableId]`
```typescript
// Cria pagamento para todos os pedidos entregues
{
  paymentMethods: [
    { type: 'dinheiro', amount: 50.00 },
    { type: 'cartao_credito', amount: 30.00 }
  ]
}
```

### **3. API Antiga Deprecated**

**Endpoint**: `/api/payments` ⚠️ **DEPRECATED**

- **POST**: Retorna erro 410 (Gone) direcionando para nova API
- **GET**: Ainda funciona mas filtra apenas pagamentos do novo sistema
- **Warning**: Logs de aviso quando usada

---

## 🎮 **COMO USAR**

### **👨‍🍳 Para o Garçom**

1. **Abrir Mesa**:
   - Ir em `/garcom/mesas`
   - Clicar "Abrir Mesa"
   - Informar número de clientes
   - Opcionalmente adicionar identificação
   - Confirmar

2. **Fazer Pedidos**:
   - Clicar "Novo Pedido"
   - Adicionar produtos
   - Finalizar (quantos pedidos precisar)

3. **Fechar Conta**:
   - Clicar "Fechar Conta"
   - Verificar se todos pedidos foram entregues
   - Clicar "Processar Pagamento"
   - Escolher métodos de pagamento
   - Confirmar valor e troco
   - Finalizar

4. **Liberar Mesa**:
   - Após pagamento, clicar "Liberar Mesa"
   - Mesa volta para status "disponível"

### **👩‍💼 Para o Admin/Recepcionista**

1. **Acompanhar Pedidos**:
   - Ir em `/admin/pedidos`
   - Ver pedidos em tempo real
   - Atualizar status conforme entrega

2. **Ver Pagamentos**:
   - Ir em `/admin/pagamentos`
   - **NOVA INTERFACE**: Lista por mesa
   - Ver identificações dos clientes
   - Filtrar por status: Em Andamento, Pode Pagar, Pago
   - Clicar "Processar Pagamento" para ir direto à tela

3. **Estatísticas**:
   - Total de mesas pendentes
   - Valor total recebido
   - Valor pendente de recebimento

---

## 📊 **BENEFÍCIOS DO NOVO SISTEMA**

### **🍽️ Para o Restaurante**

- **Fluxo Real**: Espelha como restaurantes realmente funcionam
- **Controle**: Uma conta por mesa, não por pedido
- **Identificação**: Melhor atendimento personalizado
- **Flexibilidade**: Múltiplos métodos de pagamento

### **👨‍🍳 Para o Garçom**

- **Simplicidade**: Uma única conta por mesa
- **Visibilidade**: Ver todos os pedidos da mesa
- **Controle**: Só paga quando tudo estiver pronto
- **Troco**: Cálculo automático

### **👩‍💼 Para o Admin**

- **Organização**: Pagamentos organizados por mesa
- **Histórico**: Identificação salva no pagamento
- **Relatórios**: Análise por mesa, não por pedido individual
- **Interface Moderna**: Lista consolidada e informativa

---

## 🔧 **DETALHES TÉCNICOS**

### **🗃️ Estrutura de Dados**

**Mesa com Identificação**:
```json
{
  "_id": "...",
  "number": 5,
  "capacity": 4,
  "status": "ocupada",
  "currentCustomers": 4,
  "identification": "Família Silva",
  "assignedWaiter": "...",
  "openedAt": "2025-01-01T19:00:00Z"
}
```

**Pagamento por Mesa**:
```json
{
  "_id": "...",
  "tableId": "...",
  "orderIds": ["order1", "order2", "order3"],
  "totalAmount": 85.50,
  "paymentMethods": [
    { "type": "dinheiro", "amount": 50.00 },
    { "type": "cartao_credito", "amount": 35.50 }
  ],
  "status": "pago",
  "paidAt": "2025-01-01T20:30:00Z",
  "tableIdentification": "Família Silva",
  "changeAmount": 14.50
}
```

### **⚡ Performance**

**Índices Atualizados**:
```typescript
// Payment Model
PaymentSchema.index({ tableId: 1, status: 1 });
PaymentSchema.index({ orderIds: 1 });
PaymentSchema.index({ status: 1, createdAt: -1 });
```

### **🔄 Socket.IO**

**Eventos Atualizados**:
- `payment_completed`: Notifica quando pagamento é processado
- `order_created`: Continua notificando novos pedidos
- `order_status_updated`: Continua notificando mudanças de status

### **⚠️ Backward Compatibility**

**API Antiga Deprecated**:
- `/api/payments` POST → Retorna erro 410 com instruções
- `/api/payments` GET → Filtra apenas novos pagamentos
- Logs de warning para debug

---

## 🧪 **COMO TESTAR**

### **🔄 Teste Completo do Fluxo**

1. **Login Garçom** → `/auth/login?role=garcom`
2. **Abrir Mesa** → Adicionar identificação "Família Silva"
3. **Fazer Pedidos** → 2-3 pedidos diferentes
4. **Admin Pedidos** → Entregar todos os pedidos
5. **Fechar Conta** → Processar pagamento (dinheiro + cartão)
6. **Verificar Admin** → Ver pagamento na lista de mesas
7. **Liberar Mesa** → Mesa volta para disponível

### **📊 Verificações**

- ✅ Identificação aparece na mesa e no admin
- ✅ Múltiplos pedidos na mesma mesa
- ✅ Só pode pagar após entrega de todos
- ✅ Cálculo correto do troco
- ✅ Interface do admin mostra dados consolidados
- ✅ Notificações Socket.IO funcionando
- ✅ API antiga retorna deprecated warning

---

## 📋 **ARQUIVOS MODIFICADOS**

### **🏗️ Modelos**
- ✅ `models/Table.ts` - Campo identification
- ✅ `models/Payment.ts` - Array orderIds + tableIdentification

### **🔌 APIs**
- ✅ `src/app/api/tables/[id]/route.ts` - Aceita identification
- ✅ `src/app/api/payments/mesa/[tableId]/route.ts` - Nova API
- ✅ `src/app/api/payments/route.js` - **DEPRECATED** com warnings

### **🖥️ Interfaces**
- ✅ `src/app/garcom/mesas/page.tsx` - Modal abertura + identificação
- ✅ `src/app/garcom/conta/[tableId]/page.tsx` - Nova página fechar conta
- ✅ `src/app/admin/pagamentos/page.tsx` - **ATUALIZADA** para sistema por mesa

### **📝 Documentação**
- ✅ `SISTEMA-PAGAMENTO-MESA.md` - Este documento
- ✅ `FUNCIONALIDADES-PROJETO.md` - Checklist atualizado

---

## 🚀 **PRÓXIMOS PASSOS**

### **🔄 Para Testar Agora**
1. Iniciar servidor: `npm run dev`
2. Testar fluxo completo garçom
3. Testar interface admin atualizada
4. Verificar logs no console
5. Validar notificações Socket.IO

### **📈 Futuras Melhorias**
- Remover completamente API antiga deprecated
- Dashboard de relatórios avançados
- Relatórios de identificações mais usadas
- Integração com sistema fiscal
- Histórico de mesas por garçom

---

**🎯 Status**: IMPLEMENTAÇÃO COMPLETA ✅  
**📅 Data**: Janeiro 2025  
**👨‍💻 Desenvolvedor**: Sistema Recanto Verde  
**🆕 Última atualização**: Interface Admin corrigida

### 🧪 **Testar Agora!**
Execute `npm run dev` e teste o novo fluxo completo:
1. **Garçom**: Abrir mesa → Pedidos → Fechar conta
2. **Admin**: Ver pagamentos consolidados por mesa

**Sistema 100% atualizado para pagamentos por mesa!** 🚀 