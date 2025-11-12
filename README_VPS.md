# 🚀 Deploy na VPS - EJG Cestas Básicas

## 📋 Informações do Servidor

- **IP da VPS**: 72.60.1.94
- **Domínio**: ejgcestas.com
- **Sistema**: Linux (Ubuntu/Debian recomendado)

---

## 🔧 Pré-requisitos

Certifique-se de ter instalado na VPS:
- Node.js 18+ e npm
- MySQL/MariaDB
- PM2 (gerenciador de processos)
- Nginx (servidor web)
- Git

---

## 📦 Passo 1: Preparar o Ambiente

### 1.1 Conectar na VPS
```bash
ssh root@72.60.1.94
# ou
ssh seu_usuario@72.60.1.94
```

### 1.2 Instalar Dependências (se necessário)
```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar MySQL
sudo apt install -y mysql-server

# Instalar PM2 globalmente
sudo npm install -g pm2

# Instalar Nginx
sudo apt install -y nginx

# Instalar Git
sudo apt install -y git
```

---

## 🗄️ Passo 2: Configurar Banco de Dados

### 2.1 Criar Banco de Dados
```bash
sudo mysql -u root -p
```

No MySQL:
```sql
CREATE DATABASE ejg_site CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'ejg_user'@'localhost' IDENTIFIED BY 'SUA_SENHA_FORTE_AQUI';
GRANT ALL PRIVILEGES ON ejg_site.* TO 'ejg_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2.2 Importar Schema

**Opção 1: Recriar banco do zero (apaga todos os dados existentes)**
```bash
# Navegar até o diretório do projeto
cd /var/www/ejg-site

# Excluir e recriar o banco de dados
mysql -u ejg_user -p << EOF
DROP DATABASE IF EXISTS ejg_site;
CREATE DATABASE ejg_site CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EOF

# Importar o schema
mysql -u ejg_user -p ejg_site < database.sql
```

**Opção 2: Apenas importar (se o banco já existe e você quer sobrescrever)**
```bash
cd /var/www/ejg-site
mysql -u ejg_user -p ejg_site < database.sql
```

**Opção 3: Comando único (excluir, recriar e importar)**
```bash
cd /var/www/ejg-site && \
mysql -u ejg_user -p << EOF
DROP DATABASE IF EXISTS ejg_site;
CREATE DATABASE ejg_site CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EOF
mysql -u ejg_user -p ejg_site < database.sql
```

⚠️ **ATENÇÃO**: O comando acima apaga TODOS os dados existentes no banco!

---

## 📥 Passo 3: Clonar e Configurar o Projeto

### 3.1 Criar Diretório e Fazer Upload
```bash
# Criar diretório (ajuste o caminho conforme necessário)
sudo mkdir -p /var/www/ejg-site
sudo chown -R $USER:$USER /var/www/ejg-site
cd /var/www/ejg-site

# Opção 1: Clonar repositório (se usar Git)
git clone SEU_REPOSITORIO .

# Opção 2: Fazer upload via SFTP/SCP
# Use um cliente SFTP (FileZilla, WinSCP, etc.) para fazer upload de todos os arquivos
# Certifique-se de NÃO fazer upload de:
# - node_modules/ (será criado com npm install)
# - .next/ (será criado com npm run build)
# - .env (criar manualmente na VPS)
# - package-lock.json (será criado com npm install)
```

### 3.2 Instalar Dependências
```bash
cd /var/www/ejg-site

# Instalar todas as dependências do projeto
npm install

# Isso irá criar a pasta node_modules e o package-lock.json
```

### 3.3 Configurar Variáveis de Ambiente
```bash
nano .env
```

Adicione:
```env
# Banco de Dados
DATABASE_URL="mysql://ejg_user:SUA_SENHA_AQUI@localhost:3306/ejg_site"

# NextAuth
NEXTAUTH_URL="https://ejgcestas.com"
NEXTAUTH_SECRET="GERE_UMA_CHAVE_SECRETA_LONGA_E_ALEATORIA_AQUI"

# Node Environment
NODE_ENV="production"
```

**Gerar NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 3.4 Gerar Prisma Client
```bash
npx prisma generate
```

---

## 🏗️ Passo 4: Build da Aplicação

```bash
npm run build
```

Isso irá:
- Gerar o Prisma Client
- Fazer o build do Next.js
- Criar a pasta `.next` com os arquivos otimizados

---

## 🔄 Passo 5: Configurar PM2

### 5.1 Criar Arquivo de Configuração PM2
```bash
nano ecosystem.config.js
```

Adicione:
```javascript
module.exports = {
  apps: [{
    name: 'ejg-site',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/var/www/ejg-site',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G'
  }]
};
```

### 5.2 Criar Diretório de Logs
```bash
mkdir -p logs
```

### 5.3 Iniciar com PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 5.4 Comandos Úteis do PM2
```bash
pm2 status          # Ver status
pm2 logs ejg-site   # Ver logs
pm2 restart ejg-site # Reiniciar
pm2 stop ejg-site   # Parar
pm2 delete ejg-site # Remover
```

---

## 🌐 Passo 6: Configurar Nginx

### 6.1 Criar Configuração do Nginx
```bash
sudo nano /etc/nginx/sites-available/ejgcestas.com
```

Adicione:
```nginx
server {
    listen 80;
    server_name ejgcestas.com www.ejgcestas.com;

    # Redirecionar HTTP para HTTPS (após configurar SSL)
    # return 301 https://$server_name$request_uri;

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
}
```

### 6.2 Ativar Site
```bash
sudo ln -s /etc/nginx/sites-available/ejgcestas.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6.3 Configurar SSL com Certbot (Let's Encrypt)
```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obter certificado SSL
sudo certbot --nginx -d ejgcestas.com -d www.ejgcestas.com

# Renovação automática (já configurado pelo certbot)
sudo certbot renew --dry-run
```

Após configurar SSL, descomente a linha de redirecionamento HTTP para HTTPS no arquivo do Nginx.

---

## 🔒 Passo 7: Configurar Firewall

```bash
# Permitir SSH
sudo ufw allow 22/tcp

# Permitir HTTP e HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Ativar firewall
sudo ufw enable

# Verificar status
sudo ufw status
```

---

## ✅ Passo 8: Verificar Funcionamento

### 8.1 Verificar PM2
```bash
pm2 status
pm2 logs ejg-site --lines 50
```

### 8.2 Verificar Nginx
```bash
sudo systemctl status nginx
sudo nginx -t
```

### 8.3 Testar Aplicação
- Acesse: http://ejgcestas.com ou https://ejgcestas.com
- Verifique se a aplicação está respondendo
- Teste login, cadastro, etc.

---

## 🔄 Atualizações Futuras

### Atualizar Código
```bash
cd /var/www/ejg-site

# Parar aplicação
pm2 stop ejg-site

# Atualizar código (se usar Git)
git pull origin main

# Instalar novas dependências (se houver)
npm install

# Gerar Prisma Client (se schema mudou)
npx prisma generate

# Fazer build
npm run build

# Reiniciar aplicação
pm2 restart ejg-site

# Verificar logs
pm2 logs ejg-site --lines 50
```

### Atualizar Banco de Dados
Se houver mudanças no schema:

**Opção 1 - Usando o script (Recomendado):**
```bash
cd /var/www/ejg-site

# Dar permissão de execução
chmod +x reset-database.sh

# Executar script (ele pedirá confirmação)
./reset-database.sh
```

**Opção 2 - Comandos manuais:**
```bash
# Fazer backup primeiro!
mysqldump -u ejg_user -p ejg_site > backup_$(date +%Y%m%d_%H%M%S).sql

# Excluir e recriar banco
mysql -u ejg_user -p << EOF
DROP DATABASE IF EXISTS ejg_site;
CREATE DATABASE ejg_site CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EOF

# Importar novo schema
mysql -u ejg_user -p ejg_site < database.sql
```

**Opção 3 - Comando único (CUIDADO: apaga tudo!):**
```bash
# Excluir banco, recriar e importar em um comando
mysql -u ejg_user -p -e "DROP DATABASE IF EXISTS ejg_site; CREATE DATABASE ejg_site CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" && \
mysql -u ejg_user -p ejg_site < database.sql
```

---

## 🐛 Troubleshooting

### Aplicação não inicia
```bash
# Ver logs do PM2
pm2 logs ejg-site

# Verificar se a porta 3000 está em uso
sudo lsof -i :3000

# Verificar variáveis de ambiente
pm2 env ejg-site
```

### Erro de conexão com banco
```bash
# Testar conexão MySQL
mysql -u ejg_user -p ejg_site

# Verificar se MySQL está rodando
sudo systemctl status mysql

# Verificar DATABASE_URL no .env
cat .env | grep DATABASE_URL
```

### Nginx retorna 502 Bad Gateway
```bash
# Verificar se aplicação está rodando
pm2 status

# Verificar logs do Nginx
sudo tail -f /var/log/nginx/error.log

# Verificar se porta 3000 está acessível
curl http://localhost:3000
```

### Problemas de permissão
```bash
# Ajustar permissões do diretório
sudo chown -R $USER:$USER /var/www/ejg-site
chmod -R 755 /var/www/ejg-site
```

---

## 📝 Notas Importantes

1. **Segurança**:
   - Use senhas fortes para MySQL
   - Mantenha o NEXTAUTH_SECRET seguro
   - Configure firewall adequadamente
   - Use SSL/HTTPS em produção

2. **Backup**:
   - Faça backup regular do banco de dados
   - Mantenha backups do código

3. **Monitoramento**:
   - Configure alertas do PM2
   - Monitore logs regularmente
   - Configure renovação automática do SSL

4. **Performance**:
   - Ajuste `instances` no PM2 conforme necessário
   - Configure cache do Nginx se necessário
   - Monitore uso de memória

---

## 📞 Suporte

Em caso de problemas:
1. Verifique os logs: `pm2 logs ejg-site`
2. Verifique status: `pm2 status`
3. Verifique Nginx: `sudo systemctl status nginx`
4. Verifique MySQL: `sudo systemctl status mysql`

---

**Última atualização**: 2024-11-13

