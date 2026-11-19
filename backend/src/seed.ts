import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create default client
  const client = await prisma.client.upsert({
    where: { id: 'PRAMITHA' },
    update: {},
    create: {
      id: 'PRAMITHA',
      description: 'SIGNAGE ANTRIAN',
    },
  });

  // Create default signage content
  await prisma.signageContent.upsert({
    where: { clientId: 'PRAMITHA' },
    update: {},
    create: {
      clientId:      'PRAMITHA',
      videoUrls:     JSON.stringify([]),
      slideUrls:     JSON.stringify([]),
      runningText:   'Selamat datang di Klinik Pramitha. Kami siap melayani Anda dengan sepenuh hati.',
      scheduleTable: JSON.stringify([
        { poli: 'Umum',       dokter: 'dr. Budi Santoso', jam: '08:00 - 12:00' },
        { poli: 'Gigi',       dokter: 'drg. Sari Dewi',   jam: '09:00 - 13:00' },
        { poli: 'Anak',       dokter: 'dr. Rahmat',        jam: '10:00 - 14:00' },
        { poli: 'Kandungan',  dokter: 'dr. Fitri',         jam: '13:00 - 17:00' },
      ]),
      backgroundUrl: '',
      layoutConfig:  JSON.stringify({}),
      clinicName:    'Klinik Pramitha',
      themeColor:    '#dc2626',
    },
  });

  // Create 5 default queue slots
  for (let i = 1; i <= 5; i++) {
    await prisma.queueSlot.upsert({
      where: { clientId_slotNumber: { clientId: 'PRAMITHA', slotNumber: i } },
      update: {},
      create: {
        clientId: 'PRAMITHA',
        slotNumber: i,
        loketName: `Loket ${i}`,
        currentNumber: '000',
      },
    });
  }

  // Seed TV channels
  const channels = [
    { code: 195, name: 'TransTV' },
    { code: 243, name: 'Indosiar' },
    { code: 251, name: 'RCTI' },
    { code: 269, name: 'ANTV' },
    { code: 277, name: 'Trans7' },
    { code: 309, name: 'MetroTV' },
  ];
  for (const ch of channels) {
    await prisma.tvChannel.upsert({
      where: { code: ch.code },
      update: {},
      create: ch,
    });
  }

  console.log('✅ Seed selesai. Client PRAMITHA, 5 slot antrian, dan channel TV telah dibuat.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
