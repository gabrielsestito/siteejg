# EJG Cestas Básicas

Sistema de gerenciamento de vendas de cestas básicas.

## Tecnologias

- Next.js 14
- TypeScript
- Prisma (MySQL/MariaDB)
- NextAuth.js
- Tailwind CSS

## Instalação

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

4. Aplique as migrações:
```bash
npx prisma migrate dev
```

5. Gere o Prisma Client:
```bash
npx prisma generate
```

6. Inicie o servidor:
```bash
npm run dev
```

Acesse: http://localhost:3000

## Comandos

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Build de produção
- `npm run start` - Inicia servidor de produção
- `npx prisma studio` - Interface visual do banco de dados


