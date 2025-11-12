# 🚀 Deploy na VPS Hostinger - Guia Completo

Guia passo a passo para fazer deploy do sistema EJG Cestas Básicas na VPS Hostinger.

---

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Configuração Inicial da VPS](#configuração-inicial-da-vps)
3. [Instalação de Dependências](#instalação-de-dependências)
4. [Configuração do Banco de Dados](#configuração-do-banco-de-dados)
5. [Clone e Configuração do Projeto](#clone-e-configuração-do-projeto)
6. [Build e Deploy](#build-e-deploy)
7. [Configuração do PM2](#configuração-do-pm2)
8. [Configuração do Nginx](#configuração-do-nginx)
9. [Configuração de SSL/HTTPS](#configuração-de-sslhttps)
10. [Manutenção e Atualizações](#manutenção-e-atualizações)
11. [Troubleshooting](#troubleshooting)

---

## 📦 Pré-requisitos

- VPS Hostinger com acesso root/SSH
- Domínio configurado apontando para o IP da VPS
- Acesso SSH à VPS
- Cliente SSH (PuTTY, Terminal, ou similar)
- Conta no GitHub/GitLab com o código do projeto

---

## 🖥️ Configuração Inicial da VPS

### 1. Conectar na VPS via SSH

```bash
ssh root@SEU_IP_VPS
# ou
ssh root@seu-dominio.com
```

**Nota:** Substitua `SEU_IP_VPS` pelo IP da sua VPS ou `seu-dominio.com` pelo seu domínio.

### 2. Atualizar o Sistema

```bash
# Ubuntu/Debian
apt update && apt upgrade -y

# CentOS/RHEL
yum update -y
```

### 3. Criar Usuário Não-Root (Recomendado)

```bash
# Criar usuário
adduser ejg
usermod -aG sudo ejg

# Configurar SSH para o novo usuário
mkdir -p /home/ejg/.ssh
cp ~/.ssh/authorized_keys /home/ejg/.ssh/
chown -R ejg:ejg /home/ejg/.ssh
chmod 700 /home/ejg/.ssh
chmod 600 /home/ejg/.ssh/authorized_keys

# Trocar para o novo usuário
su - ejg
```

---

## 🔧 Instalação de Dependências

### 1. Instalar Node.js 18+ (via NodeSource)

```bash
# Instalar Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalação
node --version  # Deve mostrar v20.x.x
npm --version   # Deve mostrar 10.x.x
```

### 2. Instalar MySQL/MariaDB

```bash
# Instalar MySQL
sudo apt install mysql-server -y

# Iniciar e habilitar MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# Configurar segurança do MySQL
sudo mysql_secure_installation
```

**Durante a configuração:**
- Defina uma senha forte para o root
- Remova usuários anônimos: **Y**
- Desabilite login remoto do root: **Y**
- Remova banco de teste: **Y**
- Recarregue privilégios: **Y**

### 3. Instalar Nginx

```bash
sudo apt install nginx -y

# Iniciar e habilitar Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verificar status
sudo systemctl status nginx
```

### 4. Instalar PM2 (Gerenciador de Processos)

```bash
sudo npm install -g pm2

# Configurar PM2 para iniciar no boot
pm2 startup
# Execute o comando que aparecer (algo como: sudo env PATH=...)
```

### 5. Instalar Git

```bash
sudo apt install git -y
git --version
```

### 6. Instalar Certbot (para SSL)

```bash
sudo apt install certbot python3-certbot-nginx -y
```

---

## 🗄️ Configuração do Banco de Dados

### 1. Acessar MySQL

```bash
sudo mysql -u root -p
# Digite a senha do root que você configurou
```

### 2. Criar Banco de Dados e Usuário

```sql
-- Criar banco de dados
CREATE DATABASE ejg_site CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Criar usuário para a aplicação
CREATE USER 'ejg_user'@'localhost' IDENTIFIED BY 'SENHA_FORTE_AQUI';

-- Dar permissões ao usuário
GRANT ALL PRIVILEGES ON ejg_site.* TO 'ejg_user'@'localhost';

-- Aplicar mudanças
FLUSH PRIVILEGES;

-- Verificar
SHOW DATABASES;
SELECT user, host FROM mysql.user;

-- Sair do MySQL
EXIT;
```

**⚠️ IMPORTANTE:** Substitua `SENHA_FORTE_AQUI` por uma senha forte e segura!

### 3. Testar Conexão

```bash
mysql -u ejg_user -p ejg_site
# Digite a senha do usuário
# Se conectar, está funcionando!
EXIT;
```

---

## 📥 Clone e Configuração do Projeto

### 1. Criar Diretório do Projeto

```bash
# Se estiver como root, criar em /var/www
sudo mkdir -p /var/www/ejg-site
sudo chown -R $USER:$USER /var/www/ejg-site

# Ou criar na home do usuário
mkdir -p ~/ejg-site
cd ~/ejg-site
```

### 2. Clonar Repositório

```bash
# Via HTTPS
git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git .

# Ou via SSH (se tiver chave configurada)
git clone git@github.com:SEU_USUARIO/SEU_REPOSITORIO.git .
```

**Nota:** Substitua `SEU_USUARIO` e `SEU_REPOSITORIO` pelos seus dados do GitHub.

### 3. Instalar Dependências do Projeto

```bash
cd /var/www/ejg-site  # ou ~/ejg-site
npm install
```

### 4. Configurar Variáveis de Ambiente

```bash
# Criar arquivo .env
nano .env
```

**Cole o seguinte conteúdo (ajuste os valores):**

```env
# Banco de Dados
DATABASE_URL="mysql://ejg_user:SENHA_FORTE_AQUI@localhost:3306/ejg_site"

# NextAuth
NEXTAUTH_URL="https://seu-dominio.com"
NEXTAUTH_SECRET="GERE_UMA_CHAVE_SECRETA_FORTE_AQUI"

# Upload (opcional - se usar)
UPLOAD_API_KEY="sua_chave_api"

# Admin Phone (opcional - para notificações WhatsApp)
ADMIN_PHONE="5511999999999"
```

**Para gerar NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

**Salvar o arquivo:**
- Pressione `Ctrl + O` (salvar)
- Pressione `Enter` (confirmar)
- Pressione `Ctrl + X` (sair)

### 5. Aplicar Migrações do Prisma

```bash
# Gerar Prisma Client
npx prisma generate

# Aplicar migrações (criar tabelas)
npx prisma migrate deploy

# Verificar se as tabelas foram criadas
npx prisma studio
# Acesse http://SEU_IP:5555 para ver o banco
# Pressione Ctrl+C para sair
```

### 6. (Opcional) Popular Dados Iniciais

```bash
npm run prisma:seed
```

---

## 🏗️ Build e Deploy

### 1. Fazer Build do Projeto

```bash
cd /var/www/ejg-site  # ou ~/ejg-site

# Build de produção
npm run build
```

**Aguarde o build terminar.** Isso pode levar alguns minutos.

### 2. Testar o Build Localmente

```bash
# Iniciar servidor de produção localmente
npm start

# Em outro terminal, testar
curl http://localhost:3000

# Se funcionar, pare o servidor (Ctrl+C)
```

---

## ⚙️ Configuração do PM2

### 1. Criar Arquivo de Configuração do PM2

```bash
nano ecosystem.config.js
```

**Cole o seguinte conteúdo:**

```javascript
module.exports = {
  apps: [{
    name: 'ejg-site',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/var/www/ejg-site', // ou ~/ejg-site
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G'
  }]
};
```

**Salvar:** `Ctrl + O`, `Enter`, `Ctrl + X`

### 2. Criar Diretório de Logs

```bash
mkdir -p logs
```

### 3. Iniciar Aplicação com PM2

```bash
pm2 start ecosystem.config.js

# Verificar status
pm2 status

# Ver logs
pm2 logs ejg-site

# Salvar configuração do PM2
pm2 save
```

### 4. Comandos Úteis do PM2

```bash
pm2 restart ejg-site    # Reiniciar aplicação
pm2 stop ejg-site       # Parar aplicação
pm2 delete ejg-site     # Remover aplicação
pm2 logs ejg-site       # Ver logs
pm2 monit               # Monitor em tempo real
```

---

## 🌐 Configuração do Nginx

### 1. Criar Configuração do Nginx

```bash
sudo nano /etc/nginx/sites-available/ejg-site
```

**Cole o seguinte conteúdo (ajuste o domínio):**

```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

    # Redirecionar para HTTPS (após configurar SSL)
    # return 301 https://$server_name$request_uri;

    # Configuração temporária para HTTP (antes do SSL)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Tamanho máximo de upload
    client_max_body_size 10M;
}
```

**Salvar:** `Ctrl + O`, `Enter`, `Ctrl + X`

### 2. Ativar Site

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/ejg-site /etc/nginx/sites-enabled/

# Remover site padrão (opcional)
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Se tudo estiver OK, recarregar Nginx
sudo systemctl reload nginx
```

### 3. Verificar Firewall

```bash
# Verificar status do firewall
sudo ufw status

# Se não estiver ativo, configurar:
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

---

## 🔒 Configuração de SSL/HTTPS

### 1. Obter Certificado SSL com Let's Encrypt

```bash
# Obter certificado
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Seguir as instruções:
# - Email: seu-email@exemplo.com
# - Aceitar termos: Y
# - Compartilhar email: N (ou Y, sua escolha)
# - Redirecionar HTTP para HTTPS: 2 (recomendado)
```

### 2. Verificar Renovação Automática

```bash
# Testar renovação
sudo certbot renew --dry-run

# Ver certificados
sudo certbot certificates
```

O Certbot renova automaticamente os certificados. Não é necessário fazer nada.

### 3. Atualizar Configuração do Nginx (se necessário)

Após o Certbot, ele atualiza automaticamente o arquivo do Nginx. Verifique:

```bash
sudo nano /etc/nginx/sites-available/ejg-site
```

Deve ter algo como:

```nginx
server {
    listen 443 ssl http2;
    server_name seu-dominio.com www.seu-dominio.com;

    ssl_certificate /etc/letsencrypt/live/seu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com/privkey.pem;
    
    # ... outras configurações SSL ...

    location / {
        proxy_pass http://localhost:3000;
        # ... outras configurações ...
    }
}

server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;
    return 301 https://$server_name$request_uri;
}
```

### 4. Atualizar Variável de Ambiente

```bash
nano .env
```

**Atualizar:**
```env
NEXTAUTH_URL="https://seu-dominio.com"
```

**Reiniciar aplicação:**
```bash
pm2 restart ejg-site
```

---

## 🔄 Manutenção e Atualizações

### 1. Atualizar Código do Repositório

```bash
cd /var/www/ejg-site/siteejg  # ou ~/ejg-site

# Parar aplicação
pm2 stop ejg-site

# Atualizar código
git pull origin main

# Instalar novas dependências (se houver)
npm install

# Gerar Prisma Client (se schema mudou)
npx prisma generate

# Aplicar novas migrações (se houver)
npx prisma migrate deploy

# Fazer build
npm run build

# Reiniciar aplicação
pm2 restart ejg-site

# Verificar logs
pm2 logs ejg-site
```

### 2. Backup do Banco de Dados

```bash
# Criar backup
mysqldump -u ejg_user -p ejg_site > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar backup
mysql -u ejg_user -p ejg_site < backup_20241108_120000.sql
```

### 3. Monitoramento

```bash
# Ver uso de recursos
pm2 monit

# Ver logs em tempo real
pm2 logs ejg-site --lines 100

# Verificar status do sistema
htop
# ou
top
```

### 4. Reiniciar Serviços

```bash
# Reiniciar aplicação
pm2 restart ejg-site

# Reiniciar Nginx
sudo systemctl restart nginx

# Reiniciar MySQL
sudo systemctl restart mysql

# Reiniciar servidor (se necessário)
sudo reboot
```

### 5. Acessar Prisma Studio Remotamente

O Prisma Studio roda na porta 5555 e por padrão só é acessível localmente na VPS. Para acessar remotamente do seu computador, você precisa criar um **túnel SSH**.

#### Opção 1: SSH Tunnel (Recomendado - Mais Seguro)

**No seu computador local (Windows PowerShell ou Terminal):**

```bash
# Criar túnel SSH que redireciona a porta local 5555 para a porta 5555 da VPS
ssh -L 5555:localhost:5555 root@ejgcestas.com

# Ou se usar um usuário diferente
ssh -L 5555:localhost:5555 ejg@ejgcestas.com
```

**Em outro terminal, conecte na VPS e inicie o Prisma Studio:**

```bash
# Conectar na VPS
ssh root@ejgcestas.com

# Navegar até o diretório do projeto
cd /var/www/ejg-site/siteejg  # ou onde estiver o projeto

# Iniciar Prisma Studio
npm run prisma:studio
```

**Agora no seu navegador local, acesse:**
```
http://localhost:5555
```

O Prisma Studio estará disponível no seu computador através do túnel SSH!

**Para fechar:**
- Pressione `Ctrl + C` no terminal onde o Prisma Studio está rodando
- Feche o túnel SSH também (Ctrl + C no terminal do túnel)

#### Opção 2: SSH Tunnel em Background (Windows PowerShell)

```powershell
# Criar túnel em background (Windows)
Start-Process ssh -ArgumentList "-L 5555:localhost:5555 root@ejgcestas.com -N"

# Depois, na VPS, iniciar Prisma Studio normalmente
ssh root@ejgcestas.com
cd /var/www/ejg-site/siteejg
npm run prisma:studio
```

#### Opção 3: Usando PuTTY (Windows - Interface Gráfica)

1. Abra o PuTTY
2. Em **Host Name**, digite: `ejgcestas.com`
3. Vá em **Connection > SSH > Tunnels**
4. Em **Source port**, digite: `5555`
5. Em **Destination**, digite: `localhost:5555`
6. Clique em **Add**
7. Volte em **Session** e clique em **Open**
8. Faça login na VPS
9. Na VPS, execute: `cd /var/www/ejg-site/siteejg && npm run prisma:studio`
10. No seu navegador local, acesse: `http://localhost:5555`

**⚠️ Importante:**
- Mantenha o túnel SSH aberto enquanto usar o Prisma Studio
- O Prisma Studio só estará acessível enquanto estiver rodando na VPS
- Para segurança, não exponha a porta 5555 diretamente no firewall

#### Troubleshooting - Prisma Studio não conecta

**1. Verificar se o Prisma Studio está rodando na VPS:**
```bash
# Na VPS, verificar se há processo na porta 5555
sudo lsof -i :5555
# ou
sudo netstat -tulpn | grep 5555
```

**2. Verificar se o túnel SSH está funcionando:**
```bash
# No seu computador, verificar se a porta local está em uso
# Windows PowerShell:
netstat -an | findstr 5555

# Se não aparecer nada, o túnel não está ativo
```

**3. Verificar o caminho do projeto:**
```bash
# Na VPS, encontrar onde está o projeto
find /var/www -name "package.json" -type f 2>/dev/null
find ~ -name "package.json" -type f 2>/dev/null

# Verificar se o .env existe no diretório correto
cd /caminho/do/projeto
ls -la .env
```

**4. Testar Prisma Studio localmente na VPS primeiro:**
```bash
# Na VPS, testar se funciona localmente
cd /var/www/ejg-site/siteejg  # ou caminho correto
npm run prisma:studio

# Deve aparecer: "Prisma Studio is up on http://localhost:5555"
# Se aparecer erro, verifique:
# - Se o .env está configurado: cat .env | grep DATABASE_URL
# - Se o Prisma Client está gerado: npx prisma generate
```

**5. Verificar se a porta 5555 está livre:**
```bash
# Na VPS, verificar se algo está usando a porta
sudo lsof -i :5555

# Se houver algo, matar o processo:
sudo kill -9 PID_DO_PROCESSO
```

**6. Testar túnel SSH manualmente:**
```bash
# No seu computador, criar túnel com verbose para ver erros
ssh -v -L 5555:localhost:5555 root@ejgcestas.com

# Deve aparecer mensagens de conexão
# Se der erro de conexão, verifique:
# - Se o SSH está funcionando: ssh root@ejgcestas.com
# - Se o usuário tem permissão
```

**7. Verificar firewall na VPS (não deve bloquear, mas verificar):**
```bash
# Na VPS
sudo ufw status
# A porta 5555 NÃO deve estar aberta (por segurança)
# O túnel SSH deve funcionar mesmo com firewall ativo
```

**8. Solução alternativa - Usar porta diferente:**
```bash
# Se a porta 5555 estiver em conflito, use outra porta
# No seu computador:
ssh -L 5556:localhost:5555 root@ejgcestas.com

# Na VPS, iniciar Prisma Studio normalmente na porta 5555
# No navegador, acesse: http://localhost:5556
```

**9. Verificar variáveis de ambiente:**
```bash
# Na VPS, verificar se DATABASE_URL está correto
cd /var/www/ejg-site/siteejg  # ou caminho correto
cat .env | grep DATABASE_URL

# Testar conexão com o banco
npx prisma db pull
```

**10. Reinstalar Prisma Client (se necessário):**
```bash
# Na VPS
cd /var/www/ejg-site/siteejg
rm -rf node_modules/.prisma
npx prisma generate
npm run prisma:studio
```

---

## 🐛 Troubleshooting

### Erro: "Cannot connect to database"

**Solução:**
```bash
# Verificar se MySQL está rodando
sudo systemctl status mysql

# Verificar credenciais no .env
cat .env | grep DATABASE_URL

# Testar conexão manualmente
mysql -u ejg_user -p ejg_site
```

### Erro: "Port 3000 already in use"

**Solução:**
```bash
# Verificar o que está usando a porta
sudo lsof -i :3000

# Parar processo ou mudar porta no PM2
pm2 delete ejg-site
# Editar ecosystem.config.js para usar outra porta
pm2 start ecosystem.config.js
```

### Erro: "Prisma Client not generated"

**Solução:**
```bash
# Regenerar Prisma Client
npx prisma generate

# Limpar cache e reinstalar
rm -rf node_modules/.prisma
npm install
npx prisma generate
```

### Erro: "502 Bad Gateway" no Nginx

**Solução:**
```bash
# Verificar se a aplicação está rodando
pm2 status

# Verificar logs
pm2 logs ejg-site

# Verificar se a porta está correta no Nginx
sudo nano /etc/nginx/sites-available/ejg-site
# Deve ter: proxy_pass http://localhost:3000;

# Testar configuração do Nginx
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

### Erro: "Permission denied"

**Solução:**
```bash
# Dar permissões corretas
sudo chown -R $USER:$USER /var/www/ejg-site
chmod -R 755 /var/www/ejg-site
```

### Aplicação não inicia após reiniciar servidor

**Solução:**
```bash
# Verificar se PM2 está configurado para iniciar no boot
pm2 startup
# Execute o comando que aparecer

# Salvar configuração atual
pm2 save
```

### SSL não funciona / Certificado expirado

**Solução:**
```bash
# Renovar certificado manualmente
sudo certbot renew

# Verificar certificados
sudo certbot certificates

# Recarregar Nginx
sudo systemctl reload nginx
```

### Erro de memória / Aplicação trava

**Solução:**
```bash
# Verificar uso de memória
free -h

# Limitar memória no PM2 (já configurado em ecosystem.config.js)
# Se necessário, aumentar limite ou otimizar aplicação

# Reiniciar aplicação
pm2 restart ejg-site
```

---

## 📝 Checklist Final

- [ ] Node.js 18+ instalado
- [ ] MySQL/MariaDB instalado e configurado
- [ ] Banco de dados `ejg_site` criado
- [ ] Usuário do banco criado com permissões
- [ ] Nginx instalado e configurado
- [ ] PM2 instalado e configurado
- [ ] Projeto clonado e dependências instaladas
- [ ] Arquivo `.env` configurado corretamente
- [ ] Migrações do Prisma aplicadas
- [ ] Build do projeto concluído
- [ ] Aplicação rodando no PM2
- [ ] Nginx configurado como proxy reverso
- [ ] SSL/HTTPS configurado
- [ ] Firewall configurado
- [ ] Domínio apontando para o IP da VPS
- [ ] Site acessível via HTTPS
- [ ] Backup do banco de dados configurado

---

## 🔗 Comandos Rápidos de Referência

```bash
# Status da aplicação
pm2 status

# Logs da aplicação
pm2 logs ejg-site

# Reiniciar aplicação
pm2 restart ejg-site

# Status do Nginx
sudo systemctl status nginx

# Recarregar Nginx
sudo systemctl reload nginx

# Status do MySQL
sudo systemctl status mysql

# Acessar MySQL
mysql -u ejg_user -p ejg_site

# Verificar portas em uso
sudo netstat -tulpn | grep LISTEN

# Ver uso de recursos
htop
```

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs: `pm2 logs ejg-site`
2. Verifique o status dos serviços: `pm2 status`, `sudo systemctl status nginx`
3. Verifique a configuração do Nginx: `sudo nginx -t`
4. Verifique as variáveis de ambiente: `cat .env`
5. Consulte a seção [Troubleshooting](#troubleshooting)

---

## ✅ Pronto!

Seu sistema está rodando na VPS Hostinger! 🎉

Acesse: `https://seu-dominio.com`

---

**Última atualização:** Novembro 2025

