# 📤 Subir Projeto no GitHub - Guia Completo

Guia passo a passo para fazer push do projeto para o GitHub.

---

## 📋 Situação Atual

- ✅ Repositório Git já inicializado
- ⚠️ Repositório no GitHub precisa ser criado
- ⚠️ Há 1 commit local que precisa ser enviado
- ✅ `.env` está no `.gitignore` (seguro)

---

## 🔧 Passo 0: Criar Repositório no GitHub

### 1. Criar Repositório no GitHub

1. Acesse: https://github.com/new
2. **Repository name:** `Site_Empresarial` (ou o nome que preferir)
3. **Description:** `Sistema de gerenciamento de vendas de cestas básicas - EJG`
4. **Visibility:** Escolha `Public` ou `Private`
5. **⚠️ IMPORTANTE:** NÃO marque nenhuma opção:
   - ❌ Add a README file
   - ❌ Add .gitignore
   - ❌ Choose a license
6. Clique em **"Create repository"**

### 2. Copiar URL do Repositório

Após criar, você verá uma página com instruções. Copie a URL:
- **HTTPS:** `https://github.com/gabrielsestito/Site_Empresarial.git`
- **SSH:** `git@github.com:gabrielsestito/Site_Empresarial.git`

### 3. Configurar Remote no Projeto

```bash
# Ver remote atual
git remote -v

# Se o remote estiver errado ou não existir, configurar:
git remote remove origin  # Se existir um remote antigo

# Adicionar novo remote (escolha HTTPS ou SSH)
git remote add origin https://github.com/gabrielsestito/Site_Empresarial.git

# Ou se preferir SSH (mais seguro):
git remote add origin git@github.com:gabrielsestito/Site_Empresarial.git

# Verificar
git remote -v
```

---

## 🚀 Passo 1: Fazer Push para o GitHub

### Opção A: Push Simples (Recomendado)

```bash
# Fazer push da branch main
git push -u origin main
```

O `-u` configura o tracking, então da próxima vez você só precisa de `git push`.

### Opção B: Se Precisar Fazer Commit Primeiro

```bash
# 1. Ver o que mudou
git status

# 2. Adicionar arquivos
git add .

# 3. Verificar o que será commitado
git status

# 4. Fazer commit
git commit -m "feat: atualização completa - schema Prisma recriado e deploy configurado"

# 5. Fazer push
git push -u origin main
```

---

## 🔐 Autenticação no GitHub

### Método 1: Personal Access Token (HTTPS) - Mais Fácil

1. **Criar Token no GitHub:**
   - Acesse: https://github.com/settings/tokens
   - Clique em "Generate new token" → "Generate new token (classic)"
   - **Note:** `Site_Empresarial`
   - **Expiration:** `90 days` (ou escolha)
   - **Select scopes:** Marque `repo` (acesso completo aos repositórios)
   - Clique em "Generate token"
   - **⚠️ COPIE O TOKEN** (você só verá uma vez!

2. **Fazer Push:**
   ```bash
   git push -u origin main
   ```
   - **Username:** `gabrielsestito`
   - **Password:** Cole o TOKEN (não sua senha do GitHub!)

### Método 2: SSH (Mais Seguro - Recomendado)

1. **Verificar se já tem chave SSH:**
   ```powershell
   # Windows PowerShell
   ls ~/.ssh
   ```

2. **Se não tiver, criar chave SSH:**
   ```bash
   ssh-keygen -t ed25519 -C "seu-email@exemplo.com"
   # Pressione Enter para aceitar local padrão
   # Digite uma senha (ou deixe vazio)
   ```

3. **Copiar chave pública:**
   ```powershell
   # Windows PowerShell
   Get-Content ~/.ssh/id_ed25519.pub | Set-Clipboard
   # A chave foi copiada para a área de transferência
   ```

4. **Adicionar chave no GitHub:**
   - Acesse: https://github.com/settings/keys
   - Clique em "New SSH key"
   - **Title:** `Meu PC Windows`
   - **Key:** Cole a chave (Ctrl+V)
   - Clique em "Add SSH key"

5. **Alterar remote para SSH:**
   ```bash
   git remote set-url origin git@github.com:gabrielsestito/Site_Empresarial.git
   
   # Verificar
   git remote -v
   ```

6. **Testar conexão:**
   ```bash
   ssh -T git@github.com
   # Deve aparecer: Hi gabrielsestito! You've successfully authenticated...
   ```

7. **Fazer push:**
   ```bash
   git push -u origin main
   ```

---

## ✅ Verificar se Deu Certo

### 1. Verificar no GitHub

Acesse: https://github.com/gabrielsestito/Site_Empresarial

Você deve ver:
- ✅ Todos os arquivos do projeto
- ✅ Último commit com sua mensagem
- ✅ Branch `main` atualizado
- ✅ README.md, DEPLOY_VPS.md, GITHUB.md, etc.

### 2. Verificar Localmente

```bash
git status
```

**Deve aparecer:**
```
On branch main
Your branch is up to date with 'origin/main'.
nothing to commit, working tree clean
```

---

## 📝 Comandos Úteis

### Ver Status

```bash
# Ver status atual
git status

# Ver commits locais não enviados
git log origin/main..HEAD --oneline

# Ver arquivos que serão enviados
git diff --name-only origin/main..HEAD
```

### Fazer Commit

```bash
# Adicionar todos os arquivos
git add .

# Adicionar arquivo específico
git add nome-do-arquivo.ts

# Fazer commit
git commit -m "tipo: descrição"

# Tipos recomendados:
# feat: Nova funcionalidade
# fix: Correção de bug
# docs: Documentação
# refactor: Refatoração
# chore: Manutenção
```

### Ver Histórico

```bash
# Ver últimos 10 commits
git log --oneline -10

# Ver diferenças
git diff origin/main..HEAD
```

### Desfazer Mudanças

```bash
# Desfazer mudanças em arquivo não commitado
git restore nome-do-arquivo.ts

# Desfazer todas as mudanças não commitadas
git restore .

# Desfazer último commit (mantém mudanças)
git reset --soft HEAD~1
```

---

## ⚠️ Problemas Comuns

### Erro: "Repository not found"

**Solução:** 
1. Verifique se o repositório existe no GitHub
2. Verifique se você tem permissão de acesso
3. Crie o repositório no GitHub primeiro (veja Passo 0)

### Erro: "Permission denied (publickey)"

**Solução:** Configure SSH (veja Método 2 acima) ou use Personal Access Token (Método 1)

### Erro: "remote: Support for password authentication was removed"

**Solução:** Use Personal Access Token ou SSH. Senha não funciona mais no GitHub.

### Erro: "Updates were rejected because the remote contains work"

**Solução:**
```bash
# Fazer pull primeiro
git pull origin main --rebase

# Resolver conflitos se houver, depois:
git push origin main
```

### Erro: "fatal: not a git repository"

**Solução:**
```bash
# Inicializar repositório
git init

# Adicionar remote
git remote add origin https://github.com/gabrielsestito/Site_Empresarial.git
```

### Arquivo Sensível Commitado por Engano

**Solução:**
```bash
# Remover do índice (mas manter localmente)
git rm --cached .env

# Adicionar ao .gitignore (se não estiver)
echo ".env" >> .gitignore

# Fazer commit
git add .gitignore
git commit -m "chore: adicionar .env ao gitignore"

# Fazer push
git push origin main
```

---

## 🔒 Segurança - Checklist

Antes de fazer push, verifique:

- [x] `.env` está no `.gitignore` ✅
- [ ] Não há senhas hardcoded no código
- [ ] Não há tokens ou chaves API no código
- [ ] Arquivos sensíveis não estão sendo commitados

### Verificar Arquivos Sensíveis

```bash
# Buscar por possíveis senhas/tokens
grep -r "password.*=" src/ --exclude-dir=node_modules
grep -r "api.*key" src/ --exclude-dir=node_modules
```

---

## 🎯 Resumo Rápido

### Se o Repositório Já Existe no GitHub:

```bash
git push -u origin main
```

### Se Precisa Criar o Repositório:

1. Criar no GitHub: https://github.com/new
2. Configurar remote:
   ```bash
   git remote add origin https://github.com/gabrielsestito/Site_Empresarial.git
   ```
3. Fazer push:
   ```bash
   git push -u origin main
   ```

### Se Precisa Fazer Commit Primeiro:

```bash
git add .
git commit -m "feat: atualização completa do projeto"
git push -u origin main
```

---

## 📚 Próximos Passos

Após fazer push:

1. ✅ Verificar no GitHub se tudo está correto
2. ✅ Adicionar descrição no repositório
3. ✅ Adicionar tags/releases (se necessário)
4. ✅ Configurar GitHub Actions (se necessário)
5. ✅ Compartilhar o link do repositório

---

**Pronto!** Siga os passos acima para subir seu código no GitHub! 🚀

**Link do repositório:** https://github.com/gabrielsestito/Site_Empresarial
