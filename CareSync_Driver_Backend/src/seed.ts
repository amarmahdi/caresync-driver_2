import 'reflect-metadata';
import { AppDataSource } from './data-source';
import { Admin } from './entities/Admin';
import { Driver } from './entities/Driver';
import { Child } from './entities/Child';
import { Vehicle } from './entities/Vehicle';
import { DriverCapability } from './entities/Driver';
import { ChildCategory } from './entities/Child';
import { VehicleEquipment } from './entities/Vehicle';

const seedDatabase = async () => {
  try {
    // Initialize the database connection
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    // Get repositories
    const adminRepository = AppDataSource.getRepository(Admin);
    const driverRepository = AppDataSource.getRepository(Driver);
    const childRepository = AppDataSource.getRepository(Child);
    const vehicleRepository = AppDataSource.getRepository(Vehicle);

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🧹 Clearing existing data...');
    // Clear in order to avoid foreign key constraints (stops -> routes -> children/drivers/vehicles -> admins)
    await AppDataSource.query('DELETE FROM "stop"');
    await AppDataSource.query('DELETE FROM "route"');
    await childRepository.clear();
    await vehicleRepository.clear();
    await driverRepository.clear();
    await adminRepository.clear();

    // ===== CREATE ADMIN USERS =====
    console.log('👤 Creating admin users...');
    
    const admin1 = adminRepository.create({
      email: 'admin@caresync.com',
      password: 'admin123', // This will be hashed automatically by the @BeforeInsert hook
    });
    
    const admin2 = adminRepository.create({
      email: 'manager@caresync.com', 
      password: 'manager123',
    });

    await adminRepository.save([admin1, admin2]);
    console.log('✅ Admin users created');

    // ===== CREATE DRIVER USERS =====
    console.log('🚗 Creating driver users...');
    
    const driver1 = driverRepository.create({
      name: 'Sarah Miller',
      email: 'sarah@caresync.com',
      password: 'driver123', // This will be hashed automatically
      capabilities: [DriverCapability.INFANT_CERTIFIED, DriverCapability.TODDLER_TRAINED],
    });

    const driver2 = driverRepository.create({
      name: 'Mike Johnson',
      email: 'mike@caresync.com', 
      password: 'driver123',
      capabilities: [DriverCapability.TODDLER_TRAINED, DriverCapability.SPECIAL_NEEDS],
    });

    const driver3 = driverRepository.create({
      name: 'Lisa Chen',
      email: 'lisa@caresync.com',
      password: 'driver123', 
      capabilities: [DriverCapability.INFANT_CERTIFIED],
    });

    await driverRepository.save([driver1, driver2, driver3]);
    console.log('✅ Driver users created');

    // ===== CREATE VEHICLES =====
    console.log('🚐 Creating vehicles...');
    
    const vehicle1 = vehicleRepository.create({
      name: 'Van Alpha',
      capacity: 8,
      equipment: [VehicleEquipment.INFANT_SEAT, VehicleEquipment.TODDLER_SEAT, VehicleEquipment.BOOSTER_SEAT],
    });

    const vehicle2 = vehicleRepository.create({
      name: 'Van Beta', 
      capacity: 12,
      equipment: [VehicleEquipment.TODDLER_SEAT, VehicleEquipment.BOOSTER_SEAT, VehicleEquipment.WHEELCHAIR_LIFT],
    });

    const vehicle3 = vehicleRepository.create({
      name: 'Minibus Gamma',
      capacity: 15,
      equipment: [VehicleEquipment.BOOSTER_SEAT],
    });

    await vehicleRepository.save([vehicle1, vehicle2, vehicle3]);
    console.log('✅ Vehicles created');

    // ===== CREATE SAMPLE CHILDREN =====
    console.log('👶 Creating sample children...');
    
    const child1 = childRepository.create({
      name: 'Baby Alex',
      addressStreet: '123 Elm Street', 
      addressCity: 'Seattle',
      addressState: 'WA',
      category: ChildCategory.INFANT,
      latitude: 47.6062,
      longitude: -122.3321,
    });

    const child2 = childRepository.create({
      name: 'Toddler Sam',
      addressStreet: '456 Oak Avenue',
      addressCity: 'Seattle', 
      addressState: 'WA',
      category: ChildCategory.TODDLER,
      latitude: 47.6205,
      longitude: -122.3493,
    });

    const child3 = childRepository.create({
      name: 'Emma Johnson',
      addressStreet: '789 Pine Road',
      addressCity: 'Bellevue',
      addressState: 'WA', 
      category: ChildCategory.PRESCHOOL,
      latitude: 47.6101,
      longitude: -122.2015,
    });

    const child4 = childRepository.create({
      name: 'Noah Williams',
      addressStreet: '321 Maple Drive',
      addressCity: 'Redmond',
      addressState: 'WA',
      category: ChildCategory.OOSC,
      latitude: 47.6740,
      longitude: -122.1215,
    });

    await childRepository.save([child1, child2, child3, child4]);
    console.log('✅ Sample children created');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📋 Created Users:');
    console.log('├── Admins:');
    console.log('│   ├── admin@caresync.com (password: admin123)');
    console.log('│   └── manager@caresync.com (password: manager123)');
    console.log('├── Drivers:'); 
    console.log('│   ├── sarah@caresync.com (password: driver123) - Infant + Toddler certified');
    console.log('│   ├── mike@caresync.com (password: driver123) - Toddler + Special needs');
    console.log('│   └── lisa@caresync.com (password: driver123) - Infant certified');
    console.log('├── Vehicles: Van Alpha (8 seats), Van Beta (12 seats), Minibus Gamma (15 seats)');
    console.log('└── Children: 4 sample children in Seattle area');
    
    console.log('\n🌐 Next steps:');
    console.log('1. Start your backend: npm run dev');
    console.log('2. Login to admin portal with admin@caresync.com');
    console.log('3. Login to driver app with any driver account');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await AppDataSource.destroy();
  }
};

// Run the seed function
seedDatabase();
