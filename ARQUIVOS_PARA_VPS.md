# 📦 Arquivos para Upload na VPS

## ✅ Arquivos que DEVEM ser enviados:

```
siteejg-main/
├── database.sql              ✅ Schema do banco
├── ecosystem.config.js       ✅ Configuração PM2
├── reset-database.sh         ✅ Script para resetar BD
├── reset-database.sql        ✅ SQL alternativo
├── COMANDO_RESET_DB.md       ✅ Guia de comandos
├── README_VPS.md            ✅ Guia completo de deploy
├── README.md                ✅ README principal
├── package.json             ✅ Dependências do projeto
├── next.config.js           ✅ Configuração Next.js
├── tailwind.config.js       ✅ Configuração Tailwind
├── postcss.config.js        ✅ Configuração PostCSS
├── tsconfig.json            ✅ Configuração TypeScript
├── .gitignore               ✅ Arquivos ignorados
├── prisma/
│   ├── schema.prisma        ✅ Schema Prisma
│   ├── seed.ts              ✅ Seed do banco (opcional)
│   └── tsconfig.json        ✅ Config TS para Prisma
└── src/                     ✅ Todo o código fonte
    ├── app/
    ├── components/
    ├── contexts/
    └── lib/
└── public/                  ✅ Assets públicos
    ├── background.jpeg
    ├── background.png
    ├── hero-banner.jpg
    ├── image.jpg
    └── logo.png
```

## ❌ Arquivos que NÃO devem ser enviados:

- `node_modules/` - Será criado com `npm install` na VPS
- `.next/` - Será criado com `npm run build` na VPS
- `package-lock.json` - Será criado com `npm install` na VPS
- `.env` - Criar manualmente na VPS com as credenciais corretas
- `.env.local` - Arquivo local, não enviar
- `logs/` - Logs do PM2 (criar na VPS)
- `*.log` - Arquivos de log

## 📋 Checklist antes de fazer upload:

- [ ] Remover `node_modules/` (se existir)
- [ ] Remover `.next/` (se existir)
- [ ] Remover `package-lock.json` (se existir)
- [ ] Verificar se não há arquivos `.env` no projeto
- [ ] Verificar se todos os arquivos de código estão presentes
- [ ] Verificar se `database.sql` está presente
- [ ] Verificar se `ecosystem.config.js` está presente

## 🚀 Após fazer upload na VPS:

1. **Instalar dependências:**
   ```bash
   cd /var/www/ejg-site
   npm install
   ```

2. **Criar arquivo .env:**
   ```bash
   nano .env
   # Adicionar variáveis de ambiente
   ```

3. **Gerar Prisma Client:**
   ```bash
   npx prisma generate
   ```

4. **Criar banco de dados:**
   ```bash
   mysql -u ejg_user -p ejg_site < database.sql
   ```

5. **Fazer build:**
   ```bash
   npm run build
   ```

6. **Iniciar com PM2:**
   ```bash
   pm2 start ecosystem.config.js
   ```

---

**Última atualização**: 2024-11-13

