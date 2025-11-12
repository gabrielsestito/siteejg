#!/bin/bash

# ============================================
# Script para Resetar o Banco de Dados
# ============================================
# Este script exclui e recria o banco de dados
# CUIDADO: Isso apaga TODOS os dados existentes!
# ============================================

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configurações (ajuste conforme necessário)
DB_NAME="ejg_site"
DB_USER="ejg_user"
DB_PASS=""
SQL_FILE="database.sql"

echo -e "${YELLOW}⚠️  ATENÇÃO: Este script irá APAGAR todos os dados do banco de dados!${NC}"
echo -e "${YELLOW}Banco de dados: ${DB_NAME}${NC}"
echo ""
read -p "Tem certeza que deseja continuar? (digite 'SIM' para confirmar): " confirm

if [ "$confirm" != "SIM" ]; then
    echo -e "${RED}Operação cancelada.${NC}"
    exit 1
fi

# Solicitar senha do MySQL se não foi fornecida
if [ -z "$DB_PASS" ]; then
    read -sp "Digite a senha do MySQL para o usuário ${DB_USER}: " DB_PASS
    echo ""
fi

echo ""
echo -e "${GREEN}🔄 Iniciando reset do banco de dados...${NC}"

# Verificar se o arquivo SQL existe
if [ ! -f "$SQL_FILE" ]; then
    echo -e "${RED}❌ Erro: Arquivo ${SQL_FILE} não encontrado!${NC}"
    exit 1
fi

# Excluir banco de dados existente
echo -e "${YELLOW}📦 Excluindo banco de dados existente...${NC}"
mysql -u "$DB_USER" -p"$DB_PASS" -e "DROP DATABASE IF EXISTS \`${DB_NAME}\`;" 2>/dev/null

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao excluir banco de dados. Verifique as credenciais.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Banco de dados excluído com sucesso.${NC}"

# Criar novo banco de dados
echo -e "${YELLOW}📦 Criando novo banco de dados...${NC}"
mysql -u "$DB_USER" -p"$DB_PASS" -e "CREATE DATABASE \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao criar banco de dados.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Banco de dados criado com sucesso.${NC}"

# Importar schema
echo -e "${YELLOW}📦 Importando schema do banco de dados...${NC}"
mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$SQL_FILE" 2>/dev/null

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao importar schema.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Schema importado com sucesso.${NC}"

# Verificar tabelas criadas
echo ""
echo -e "${YELLOW}📊 Tabelas criadas:${NC}"
mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW TABLES;" 2>/dev/null

echo ""
echo -e "${GREEN}🎉 Banco de dados resetado com sucesso!${NC}"
echo -e "${GREEN}✅ Próximo passo: Execute 'npx prisma generate' para gerar o Prisma Client${NC}"

