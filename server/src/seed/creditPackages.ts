import { CreditPackage } from '../models/CreditPackage';

const packages = [
  { name: 'Starter Pack', credits: 10, price: 2.99, currency: 'USD', popular: false },
  { name: 'Popular Pack', credits: 50, price: 9.99, currency: 'USD', popular: true },
  { name: 'Pro Pack', credits: 150, price: 19.99, currency: 'USD', popular: false },
  { name: 'Unlimited Pack', credits: 500, price: 49.99, currency: 'USD', popular: false },
];

export const seedCreditPackages = async () => {
  for (const data of packages) {
    await CreditPackage.findOneAndUpdate(
      { name: data.name },
      { $setOnInsert: data },
      { upsert: true }
    );
  }
  console.log(`Seeded ${packages.length} credit packages`);
};
