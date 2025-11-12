# 🔄 Comando para Resetar Banco de Dados na VPS

## ⚠️ ATENÇÃO
Este comando **APAGA TODOS OS DADOS** do banco de dados e recria do zero!

---

## 📋 Comando Único (Recomendado)

Execute na VPS dentro do diretório do projeto:

```bash
cd /var/www/ejg-site && \
mysql -u ejg_user -p -e "DROP DATABASE IF EXISTS ejg_site; CREATE DATABASE ejg_site CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" && \
mysql -u ejg_user -p ejg_site < database.sql && \
echo "✅ Banco de dados resetado com sucesso!"
```

**O que este comando faz:**
1. Navega até o diretório do projeto
2. Exclui o banco de dados `ejg_site` (se existir)
3. Cria um novo banco de dados `ejg_site` vazio
4. Importa o schema completo do arquivo `database.sql`
5. Exibe mensagem de sucesso

---

## 🔧 Alternativa: Usando o Script

Se preferir usar o script interativo (mais seguro):

```bash
cd /var/www/ejg-site
chmod +x reset-database.sh
./reset-database.sh
```

O script pedirá confirmação antes de executar.

---

## 📝 Passo a Passo Manual

Se preferir executar passo a passo:

```bash
# 1. Navegar até o diretório
cd /var/www/ejg-site

# 2. Excluir banco de dados
mysql -u ejg_user -p -e "DROP DATABASE IF EXISTS ejg_site;"

# 3. Criar novo banco de dados
mysql -u ejg_user -p -e "CREATE DATABASE ejg_site CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 4. Importar schema
mysql -u ejg_user -p ejg_site < database.sql

# 5. Gerar Prisma Client (após resetar)
npx prisma generate
```

---

## ✅ Após Resetar o Banco

Não esqueça de:

1. **Gerar Prisma Client:**
   ```bash
   npx prisma generate
   ```

2. **Reiniciar a aplicação:**
   ```bash
   pm2 restart ejg-site
   ```

3. **Verificar logs:**
   ```bash
   pm2 logs ejg-site --lines 50
   ```

---

## 💾 Fazer Backup Antes (Recomendado)

Antes de resetar, faça um backup:

```bash
cd /var/www/ejg-site
mysqldump -u ejg_user -p ejg_site > backup_$(date +%Y%m%d_%H%M%S).sql
```

---

**Última atualização**: 2024-11-13

