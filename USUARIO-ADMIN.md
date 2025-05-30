# 👤 Script de Criação do Usuário Administrador

## ✅ **SCRIPT CRIADO COM SUCESSO**

Script para criar o primeiro usuário administrador (recepcionista) no Sistema Recanto Verde.

---

## 🚀 **Como Usar**

### 1. **Comando Rápido**
```bash
npm run admin:create
```

### 2. **Comando Direto**
```bash
node create-admin-user.js
```

### 3. **Ver Ajuda**
```bash
node create-admin-user.js --help
```

---

## 📋 **Credenciais Criadas**

Quando executado com sucesso, o script criará:

```
┌─────────────────────────────────────┐
│  👤 Username: admin                 │
│  📧 Email: admin@recantoverde.com   │
│  🔑 Senha: admin123                │
│  🎭 Role: recepcionista             │
│  📱 Telefone: (11) 99999-9999      │
│  📊 Status: ativo                   │
└─────────────────────────────────────┘
```

---

## 🔗 **Como Acessar o Sistema**

### 1. **URL de Login**
```
http://localhost:3000/auth/login?role=recepcionista
```

### 2. **Credenciais**
- **Email**: `admin@recantoverde.com`
- **Senha**: `admin123`

### 3. **Primeiro Acesso**
1. ✅ Faça login com as credenciais acima
2. ⚠️ **ALTERE A SENHA** imediatamente
3. 🔧 Vá em: **Admin → Configurações → Perfil**

---

## 🛡️ **Segurança**

### ⚠️ **IMPORTANTE**
- 🔑 **Altere a senha** após o primeiro login
- 🚫 **Não use em produção** sem alterar as credenciais
- 📱 **Atualize o telefone** nas configurações

### 🔒 **Características de Segurança**
- ✅ Senha criptografada com `bcrypt` (12 rounds)
- ✅ Verificação de duplicação de usuários
- ✅ Validação de dados de entrada
- ✅ Role de recepcionista com acesso completo

---

## 🔧 **Casos de Uso**

### 📦 **Sistema Novo/Limpo**
```bash
# 1. Resetar banco (opcional)
npm run db:reset

# 2. Criar usuário admin
npm run admin:create

# 3. Iniciar sistema
npm run dev

# 4. Acessar: http://localhost:3000
```

### 🔄 **Sistema Existente**
```bash
# Verificar se já existe admin
npm run admin:create

# Se existir, será mostrado:
# "ℹ️ Já existe um usuário administrador no sistema"
```

---

## 🐛 **Solução de Problemas**

### ❌ **Erro: MONGODB_URI não encontrado**
```bash
# Criar arquivo .env.local com:
echo "MONGODB_URI=mongodb://localhost:27017/recanto-verde" > .env.local

# Ou verificar se existe .env
ls -la .env*
```

### ❌ **Erro: Usuário já existe**
```bash
# Ver usuário existente
npm run admin:create

# Ou resetar banco
npm run db:reset
```

### ❌ **Erro de Conexão MongoDB**
```bash
# Verificar se MongoDB está rodando
sudo systemctl status mongod

# Ou iniciar MongoDB
sudo systemctl start mongod
```

---

## 📂 **Arquivos Criados**

### 1. **Script Principal**
- `create-admin-user.js` - Script de criação do usuário

### 2. **Comando no Package.json**
```json
{
  "scripts": {
    "admin:create": "node create-admin-user.js"
  }
}
```

---

## 🔄 **Scripts Relacionados**

| Comando | Descrição |
|---------|-----------|
| `npm run admin:create` | Criar usuário admin |
| `npm run db:reset` | Resetar banco de dados |
| `npm run dev` | Iniciar servidor |
| `npm run build` | Build para produção |

---

## 🎯 **Status de Validação**

### ✅ **Testado e Funcionando**
- ✅ Criação de usuário no MongoDB
- ✅ Criptografia de senha (bcrypt)
- ✅ Detecção de usuários existentes
- ✅ Login funcional na interface
- ✅ Acesso completo ao sistema admin

### 🔍 **Teste de Login Realizado**
```bash
# Comando testado:
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@recantoverde.com","password":"admin123"}'

# Resultado: ✅ Login com sucesso!
```

---

## 🎉 **Conclusão**

O script de criação do usuário administrador está **100% funcional** e pronto para uso. 

**Próximos passos:**
1. ✅ Execute `npm run admin:create`
2. ✅ Acesse o sistema com as credenciais
3. ✅ Configure o restaurante
4. ✅ Comece a usar o sistema!

---

**📅 Data de Criação**: Janeiro 2025  
**👨‍💻 Status**: FUNCIONANDO PERFEITAMENTE ✅  
**🎯 Resultado**: Usuário admin criado e testado com sucesso! 🚀 