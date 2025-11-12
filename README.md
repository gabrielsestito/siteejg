# EJG Cestas Básicas

Sistema de gerenciamento de vendas de cestas básicas.

## Tecnologias

- Next.js 14
- TypeScript
- Prisma (MySQL/MariaDB)
- NextAuth.js
- Tailwind CSS

## Instalação Local

1. Instale as dependências:
```bash
npm install
```

2. Configure as variáveis de ambiente no arquivo `.env`:
```env
DATABASE_URL="mysql://usuario:senha@localhost:3306/ejg_site"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="sua_chave_secreta"
```

3. Crie o banco de dados `ejg_site` no MySQL/MariaDB

4. Execute o arquivo SQL para criar todas as tabelas:
```bash
mysql -u usuario -p ejg_site < database.sql
```
Ou importe o arquivo `database.sql` pelo seu cliente MySQL (phpMyAdmin, MySQL Workbench, etc.)

5. Gere o Prisma Client:
```bash
npx prisma generate
```

6. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

Acesse: http://localhost:3000

## Comandos Úteis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Build de produção
- `npm run start` - Inicia servidor de produção
- `npx prisma studio` - Interface visual do banco de dados
- `npx prisma migrate dev` - Criar nova migração
- `npx prisma generate` - Gerar Prisma Client

## Deploy na VPS

Para fazer deploy na VPS, consulte o arquivo **[README_VPS.md](./README_VPS.md)** com instruções completas.

**Informações do servidor:**
- IP: 72.60.1.94
- Domínio: ejgcestas.com

**Resetar banco de dados na VPS:**
Consulte **[COMANDO_RESET_DB.md](./COMANDO_RESET_DB.md)** para comandos rápidos.

## Notas

- As imagens dos produtos são armazenadas como Base64 no banco de dados
- O campo `image` e `description` na tabela `product` são do tipo `TEXT` para suportar dados grandes
- Use o arquivo `database.sql` na raiz do projeto para criar todo o banco de dados de uma vez

