import 'dotenv/config';
import { hash } from "bcryptjs";
import { ChallanStatus, PrismaClient, ProductCategory } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PRODUCTION_SEED !== 'true') {
    throw new Error(
      'Refusing to seed in production. Set ALLOW_PRODUCTION_SEED=true only for an intentional reset.',
    );
  }

  console.log('Seeding SolarDispatch database...');

  const seedDates = {
    now: new Date('2026-02-01T09:00:00.000Z'),
    tomorrow: new Date('2026-02-02T09:00:00.000Z'),
    inTwoDays: new Date('2026-02-03T09:00:00.000Z'),
    yesterday: new Date('2026-01-31T09:00:00.000Z'),
  };

  await prisma.salesChallanItem.deleteMany();
  await prisma.salesChallan.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.customerFollowUp.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany()
  const passwordHashes = {
    admin: await hash('SolarAdmin@123', 10),
    sales: await hash('SolarSales@123', 10),
    warehouse: await hash('SolarWarehouse@123', 10),
    accounts: await hash('SolarAccounts@123', 10),
  };

  const [admin, sales, warehouse, accountsUser] = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Aarav Admin',
        email: 'admin@demo.solardispatch.test',
        passwordHash: passwordHashes.admin,
        role: 'ADMIN',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Sneha Sales',
        email: 'sales@demo.solardispatch.test',
        passwordHash: passwordHashes.sales,
        role: 'SALES',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Wasim Warehouse',
        email: 'warehouse@demo.solardispatch.test',
        passwordHash: passwordHashes.warehouse,
        role: 'WAREHOUSE',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Anita Accounts',
        email: 'accounts@demo.solardispatch.test',
        passwordHash: passwordHashes.accounts,
        role: 'ACCOUNTS',
      },
    }),
  ]);

  const [solarPanel, solarInverter, energyMeter] = await Promise.all([
    prisma.product.create({
      data: {
        productName: 'Solar Panel',
        sku: 'SP-550',
        category: ProductCategory.SOLAR_PANEL,
        unitPrice: 12500,
        currentStock: 100,
        minimumStockAlertQuantity: 20,
        warehouseLocation: 'A-01',
      },
    }),
    prisma.product.create({
      data: {
        productName: 'Solar Inverter',
        sku: 'INV-5KW',
        category: ProductCategory.INVERTER,
        unitPrice: 48000,
        currentStock: 3,
        minimumStockAlertQuantity: 5,
        warehouseLocation: 'B-01',
      },
    }),
    prisma.product.create({
      data: {
        productName: 'Energy Meter',
        sku: 'MTR-01',
        category: ProductCategory.METER,
        unitPrice: 4200,
        currentStock: 10,
        minimumStockAlertQuantity: 2,
        warehouseLocation: 'C-01',
      },
    }),
  ]);

  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        customerName: 'Amit Kumar',
        mobileNumber: '9000000001',
        email: 'amit.kumar@solar.example',
        businessName: 'Kumar Electricals',
        gstNumber: null,
        address: '12 Park Road, Pune',
        customerType: 'RETAIL',
        status: 'LEAD',
        followUpDate: seedDates.tomorrow,
      },
    }),
    prisma.customer.create({
      data: {
        customerName: 'Neha Sharma',
        mobileNumber: '9000000002',
        email: 'neha.sharma@solar.example',
        businessName: 'Sharma Enterprises',
        gstNumber: null,
        address: '25 Market Road, Nashik',
        customerType: 'WHOLESALE',
        status: 'ACTIVE',
      },
    }),
    prisma.customer.create({
      data: {
        customerName: 'Rahul Verma',
        mobileNumber: '9000000003',
        email: 'rahul.verma@solar.example',
        businessName: 'Verma Traders',
        gstNumber: null,
        address: '8 Main Road, Jaipur',
        customerType: 'DISTRIBUTOR',
        status: 'ACTIVE',
      },
    }),
    prisma.customer.create({
      data: {
        customerName: 'Priya Das',
        mobileNumber: '9000000004',
        email: 'priya.das@solar.example',
        businessName: 'Das Energy Solutions',
        gstNumber: null,
        address: '16 Lake Road, Kolkata',
        customerType: 'RETAIL',
        status: 'INACTIVE',
      },
    }),
  ]);

  await Promise.all([
    prisma.customerFollowUp.create({
      data: {
        customerId: customers[0].id,
        note: 'Discussed solar panel requirements.',
        followUpType: 'CALL',
        nextFollowUpDate: seedDates.tomorrow,
        createdById: sales.id,
      },
    }),
    prisma.customerFollowUp.create({
      data: {
        customerId: customers[1].id,
        note: 'Sent the product quotation.',
        followUpType: 'PROPOSAL_SENT',
        nextFollowUpDate: seedDates.inTwoDays,
        createdById: sales.id,
      },
    }),
  ]);

  const draft = await prisma.salesChallan.create({
    data: {
      challanNumber: 'SDC-20260201-DRAFT1',
      customerId: customers[0].id,
      deliveryAddress: customers[0].address,
      totalQuantity: 5,
      createdById: sales.id,
      items: {
        create: [
          {
            productId: solarPanel.id,
            quantity: 5,
            productNameSnapshot: solarPanel.productName,
            skuSnapshot: solarPanel.sku,
            categorySnapshot: solarPanel.category,
            unitPriceSnapshot: solarPanel.unitPrice,
          },
        ],
      },
    },
  });

  const confirmed = await prisma.salesChallan.create({
    data: {
      challanNumber: 'SDC-20260125-CONF01',
      customerId: customers[1].id,
      deliveryAddress: customers[1].address,
      status: ChallanStatus.CONFIRMED,
      confirmedAt: seedDates.now,
      totalQuantity: 11,
      createdById: sales.id,
      items: {
        create: [
          {
            productId: solarPanel.id,
            quantity: 10,
            productNameSnapshot: solarPanel.productName,
            skuSnapshot: solarPanel.sku,
            categorySnapshot: solarPanel.category,
            unitPriceSnapshot: solarPanel.unitPrice,
          },
          {
            productId: solarInverter.id,
            quantity: 1,
            productNameSnapshot: solarInverter.productName,
            skuSnapshot: solarInverter.sku,
            categorySnapshot: solarInverter.category,
            unitPriceSnapshot: solarInverter.unitPrice,
          },
        ],
      },
    },
  });

  const cancelled = await prisma.salesChallan.create({
    data: {
      challanNumber: 'SDC-20260110-CANC01',
      customerId: customers[3].id,
      deliveryAddress: customers[3].address,
      status: ChallanStatus.CANCELLED,
      confirmedAt: seedDates.yesterday,
      cancelledAt: seedDates.now,
      totalQuantity: 2,
      createdById: sales.id,
      items: {
        create: [
          {
            productId: energyMeter.id,
            quantity: 2,
            productNameSnapshot: energyMeter.productName,
            skuSnapshot: energyMeter.sku,
            categorySnapshot: energyMeter.category,
            unitPriceSnapshot: energyMeter.unitPrice,
          },
        ],
      },
    },
  });

  await prisma.$transaction(async (tx) => {
    const confirmedLines = [
      { productId: solarPanel.id, quantity: 10 },
      { productId: solarInverter.id, quantity: 1 },
    ];

    for (const line of confirmedLines) {
      const updated = await tx.product.updateMany({
        where: { id: line.productId, currentStock: { gte: line.quantity } },
        data: { currentStock: { decrement: line.quantity } },
      });
      if (updated.count !== 1) {
        throw new Error(`Insufficient seed stock for product ${line.productId}`);
      }
      await tx.stockMovement.create({
        data: {
          productId: line.productId,
          quantityChanged: line.quantity,
          movementType: 'OUT',
          reason: `Challan confirmation ${confirmed.challanNumber}`,
          referenceType: 'SALES_CHALLAN',
          referenceId: confirmed.id,
          createdById: warehouse.id,
        },
      });
    }

    await tx.product.update({
      where: { id: energyMeter.id },
      data: { currentStock: { decrement: 2 } },
    });
    await tx.stockMovement.create({
      data: {
        productId: energyMeter.id,
        quantityChanged: 2,
        movementType: 'OUT',
        reason: `Challan confirmation ${cancelled.challanNumber}`,
        referenceType: 'SALES_CHALLAN',
        referenceId: cancelled.id,
        createdById: warehouse.id,
      },
    });
    await tx.product.update({
      where: { id: energyMeter.id },
      data: { currentStock: { increment: 2 } },
    });
    await tx.stockMovement.create({
      data: {
        productId: energyMeter.id,
        quantityChanged: 2,
        movementType: 'IN',
        reason: `Challan cancellation reversal ${cancelled.challanNumber}`,
        referenceType: 'SALES_CHALLAN_REVERSAL',
        referenceId: cancelled.id,
        createdById: warehouse.id,
      },
    });
  });

  console.log(
    `Seeded 3 products, 4 customers, 4 users, 2 follow-ups, and 3 challans (1 draft, 1 confirmed, 1 cancelled).`,
  );
  console.log(
    'Credentials: SolarAdmin@123 / SolarSales@123 / SolarWarehouse@123 / SolarAccounts@123.',
  );
  void admin;
  void accountsUser;
  void draft;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
