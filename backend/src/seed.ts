import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.client.upsert({
    where:  { id: 'PRAMITHA' },
    update: {},
    create: { id: 'PRAMITHA', description: 'SIGNAGE ANTRIAN' },
  });

  await prisma.signageContent.upsert({
    where:  { clientId: 'PRAMITHA' },
    update: {},
    create: {
      clientId:      'PRAMITHA',
      videoUrls:     JSON.stringify([]),
      slideUrls:     JSON.stringify([]),
      runningText:   'Selamat datang di Klinik Pramitha. Kami siap melayani Anda dengan sepenuh hati.',
      scheduleTable: JSON.stringify([
        { poli: 'Umum',      dokter: 'dr. Budi Santoso', jam: '08:00 - 12:00' },
        { poli: 'Gigi',      dokter: 'drg. Sari Dewi',   jam: '09:00 - 13:00' },
        { poli: 'Anak',      dokter: 'dr. Rahmat',        jam: '10:00 - 14:00' },
        { poli: 'Kandungan', dokter: 'dr. Fitri',         jam: '13:00 - 17:00' },
      ]),
      backgroundUrl: '',
      layoutConfig:  JSON.stringify({}),
      clinicName:    'Klinik Pramitha',
      themeColor:    '#dc2626',
    },
  });

  for (let i = 1; i <= 5; i++) {
    await prisma.queueSlot.upsert({
      where:  { clientId_slotNumber: { clientId: 'PRAMITHA', slotNumber: i } },
      update: {},
      create: { clientId: 'PRAMITHA', slotNumber: i, loketName: `Loket ${i}`, currentNumber: '000' },
    });
  }

  console.log('✅ Seed selesai. Client PRAMITHA dan 5 slot antrian dibuat.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
