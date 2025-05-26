# 🍽️ Sistema Recanto Verde

**Sistema completo de gestão para restaurantes com notificações em tempo real**

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8.1-green)](https://socket.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)](https://www.mongodb.com/)
[![Status](https://img.shields.io/badge/Status-100%25%20Completo-success)]()

## 🎯 Sobre o Projeto

O **Recanto Verde** é uma solução moderna e completa para gestão de restaurantes, oferecendo:

- 📱 **Interface Garçom**: Mobile-first para operações em campo
- 🖥️ **Interface Admin**: Desktop para gestão completa do restaurante  
- 🔔 **Notificações em Tempo Real**: Comunicação instantânea via Socket.IO
- 📊 **Analytics**: Relatórios e métricas detalhadas
- 💰 **Sistema de Pagamentos**: Controle financeiro completo

## ✨ Funcionalidades Principais

### 🏨 **Para Recepcionistas (Admin)**
- Dashboard executivo com métricas em tempo real
- Gestão visual de mesas e layout do restaurante
- CRUD completo do cardápio com upload de imagens
- Controle de pedidos e status em tempo real
- Sistema de pagamentos com múltiplos métodos
- Gestão de usuários (garçons) e permissões
- Relatórios avançados e analytics
- **🔔 Central de notificações instantâneas**

### 🍽️ **Para Garçons (Mobile)**
- Interface touch-friendly otimizada
- Visualização de mesas atribuídas
- Criação e gestão de pedidos
- Carrinho de compras interativo
- **🔔 Notificações de pedidos prontos**

### 🚀 **Notificações em Tempo Real (NOVO!)**
- ⚡ Socket.IO integrado ao Next.js
- 🔔 Sons diferenciados por tipo de evento
- 📱 Notificações nativas do browser
- 🎯 Direcionamento por role (garçom/recepcionista)
- 🔄 Reconexão automática

## 🚀 Início Rápido

### 📋 Pré-requisitos
- Node.js 18 ou superior
- NPM ou Yarn
- Acesso ao MongoDB

### ⚙️ Instalação

1. **Clone o repositório**:
```bash
git clone https://github.com/seu-usuario/recanto-verde.git
cd recanto-verde
```

2. **Instale as dependências**:
```bash
npm install
```

3. **Configure as variáveis de ambiente**:
Crie um arquivo `.env.local`:
```env
MONGODB_URI=mongodb://admin:Marcus1911Marcus@206.183.131.10:27017/recanto-verde?authSource=admin
JWT_SECRET=sua-chave-secreta-jwt
NEXT_PUBLIC_API_URL=http://localhost:3000
```

4. **Execute o servidor de desenvolvimento**:
```bash
npm run dev
```

5. **Acesse o sistema**:
- **Homepage**: http://localhost:3000
- **Admin (Recepcionista)**: http://localhost:3000/admin/dashboard
- **Garçom**: http://localhost:3000/garcom/dashboard
- **Login**: http://localhost:3000/auth/login

## 🏗️ Arquitetura

### 🔧 **Stack Tecnológico**
- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + Socket.IO
- **Database**: MongoDB com Mongoose ODM
- **Autenticação**: JWT + bcrypt
- **Real-time**: Socket.IO para notificações
- **Estilo**: Tailwind CSS + componentes responsivos

### 📁 **Estrutura do Projeto**
```
recanto-verde/
├── server.js                    # Servidor customizado com Socket.IO
├── src/
│   ├── app/                     # App Router (Next.js 15)
│   │   ├── admin/              # Interface recepcionista
│   │   ├── garcom/             # Interface garçom
│   │   ├── auth/               # Autenticação
│   │   └── api/                # APIs RESTful
│   ├── components/             # Componentes React
│   ├── lib/                    # Utilitários e configs
│   └── models/                 # Modelos do MongoDB
├── funcionalidades.md          # Lista completa de funcionalidades
├── plan-dev.md                 # Plano de desenvolvimento
└── notificacoes-tempo-real.md  # Documentação Socket.IO
```

## 🔔 Sistema de Notificações

### ⚡ **Como Funciona**
O sistema utiliza **Socket.IO** para comunicação em tempo real:

1. **Autenticação**: Usuários se conectam com base em seus roles
2. **Salas**: Garçons e recepcionistas ficam em salas específicas
3. **Eventos**: Cada ação gera uma notificação direcionada
4. **Interface**: Central de notificações elegante no header

### 📋 **Tipos de Eventos**
- 📝 **Novo Pedido** → Notifica recepcionistas
- 🍽️ **Pedido Pronto** → Notifica garçom + recepcionistas (som especial)
- 🪑 **Mesa Ocupada/Liberada** → Notifica recepcionistas
- 💰 **Pagamento Registrado** → Notifica recepcionistas
- 📢 **Broadcast** → Notifica todos os usuários

## 🔧 APIs Disponíveis

### 🔐 **Autenticação**
- `POST /api/auth/login` - Login com JWT

### 👥 **Usuários**
- `GET /api/users` - Listar usuários
- `POST /api/users` - Criar usuário
- `PUT /api/users/[id]` - Editar usuário
- `DELETE /api/users/[id]` - Excluir usuário

### 🪑 **Mesas**
- `GET /api/tables` - Listar mesas
- `POST /api/tables` - Criar mesa
- `PUT /api/tables/[id]` - Editar mesa

### 🍽️ **Produtos**
- `GET /api/products` - Listar produtos
- `POST /api/products` - Criar produto
- `PUT /api/products/[id]` - Editar produto

### 📝 **Pedidos**
- `GET /api/orders` - Listar pedidos
- `POST /api/orders` - Criar pedido
- `PATCH /api/orders/[id]/status` - Alterar status

### 💰 **Pagamentos**
- `GET /api/payments` - Listar pagamentos
- `POST /api/payments` - Registrar pagamento

### 📊 **Relatórios**
- `GET /api/reports` - Analytics e métricas

## 📊 Scripts Disponíveis

```bash
# Desenvolvimento (servidor customizado com Socket.IO)
npm run dev

# Desenvolvimento Next.js puro (sem Socket.IO)
npm run dev:next

# Build para produção
npm run build

# Iniciar produção (servidor customizado)
npm start

# Iniciar produção Next.js puro
npm run start:next

# Linting
npm run lint
```

## 🎯 Como Usar

### 👤 **Para Recepcionistas**
1. Acesse `/admin/dashboard`
2. Faça login com suas credenciais
3. Use a central de notificações no header
4. Gerencie mesas, pedidos e pagamentos

### 🍽️ **Para Garçons**
1. Acesse `/garcom/dashboard`
2. Faça login com suas credenciais
3. Veja suas mesas atribuídas
4. Receba notificações de pedidos prontos

## 🚨 Troubleshooting

### ❌ **Problemas Comuns**

**Socket.IO não conecta**:
- Verifique se o `server.js` está sendo usado (`npm run dev`)
- Confirme se a porta 3000 está livre

**Notificações não funcionam**:
- Permita notificações no browser
- Verifique se há bloqueio de autoplay

**Erro de autenticação**:
- Verifique o `JWT_SECRET` no `.env.local`
- Confirme se o MongoDB está acessível

## 📚 Documentação Adicional

- 📋 **[funcionalidades.md](./funcionalidades.md)** - Lista completa de recursos
- 🎯 **[plan-dev.md](./plan-dev.md)** - Plano de desenvolvimento
- 🔔 **[notificacoes-tempo-real.md](./notificacoes-tempo-real.md)** - Sistema Socket.IO
- 🏆 **[SISTEMA-COMPLETO.md](./SISTEMA-COMPLETO.md)** - Documentação completa

## 🎉 Status do Projeto

### ✅ **100% Implementado**
- ✅ Interface dupla (Admin + Garçom)
- ✅ Sistema CRUD completo
- ✅ Autenticação e segurança
- ✅ Notificações em tempo real
- ✅ Design responsivo
- ✅ MongoDB integrado

### 🚀 **Pronto para Produção**
O sistema está totalmente funcional e pronto para transformar a operação do seu restaurante!

---

**🏆 Desenvolvido com excelência para revolucionar a gestão de restaurantes!** 🍽️
