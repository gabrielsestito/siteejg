import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...\n');

  // 1. Criar usuário admin padrão
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@ejgcestas.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const hashedAdminPassword = await hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: 'Administrador',
      password: hashedAdminPassword,
      role: 'ADMIN',
    },
    create: {
      name: 'Administrador',
      email: adminEmail,
      password: hashedAdminPassword,
      role: 'ADMIN',
    },
  });

  console.log('✅ Usuário admin criado/atualizado:', admin.email);

  // 2. Criar zonas de entrega
  const deliveryZones = [
    { name: "Ribeirão Preto", city: "Ribeirão Preto", state: "SP", deliveryFee: 10 },
    { name: "Sertãozinho", city: "Sertãozinho", state: "SP", deliveryFee: 15 },
    { name: "Cravinhos", city: "Cravinhos", state: "SP", deliveryFee: 12 },
  ];

  for (const zone of deliveryZones) {
    await prisma.deliveryZone.upsert({
      where: { city: zone.city },
      update: {
        name: zone.name,
        state: zone.state,
        deliveryFee: zone.deliveryFee,
        active: true,
      },
      create: zone,
    });
  }

  console.log('✅ Zonas de entrega configuradas:', deliveryZones.length);

  // 3. Criar categorias de exemplo (se não existirem)
  const categories = [
    { name: 'Cestas Básicas', description: 'Cestas com produtos essenciais' },
    { name: 'Cestas Premium', description: 'Cestas com produtos selecionados' },
    { name: 'Cestas Especiais', description: 'Cestas temáticas e personalizadas' },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: category,
      create: category,
    });
  }

  console.log('✅ Categorias criadas/atualizadas:', categories.length);

  // 4. Criar usuários de exemplo com diferentes roles (opcional)
  const exampleUsers = [
    {
      name: 'Usuário Financeiro',
      email: 'financeiro@ejgcestas.com',
      password: await hash('financeiro123', 10),
      role: 'FINANCIAL' as const,
    },
    {
      name: 'Usuário Gerência',
      email: 'gerencia@ejgcestas.com',
      password: await hash('gerencia123', 10),
      role: 'MANAGEMENT' as const,
    },
    {
      name: 'Entregador Exemplo',
      email: 'entregador@ejgcestas.com',
      password: await hash('entregador123', 10),
      role: 'DELIVERY' as const,
    },
  ];

  for (const user of exampleUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        password: user.password,
        role: user.role,
      },
      create: user,
    });
  }

  console.log('✅ Usuários de exemplo criados/atualizados:', exampleUsers.length);

  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('\n📋 Credenciais padrão:');
  console.log(`   Admin: ${adminEmail} / ${adminPassword}`);
  console.log(`   Financeiro: financeiro@ejgcestas.com / financeiro123`);
  console.log(`   Gerência: gerencia@ejgcestas.com / gerencia123`);
  console.log(`   Entregador: entregador@ejgcestas.com / entregador123`);
  console.log('\n⚠️  IMPORTANTE: Altere as senhas após o primeiro login!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


