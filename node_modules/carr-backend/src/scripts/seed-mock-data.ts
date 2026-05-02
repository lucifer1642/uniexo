import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in .env');
  process.exit(1);
}

async function seedMockData() {
  try {
    console.log('⏳ Connecting to database...');
    let uri = MONGODB_URI as string;
    if (!uri.includes('mongodb.net/uniexo')) {
      uri = uri.includes('?') 
        ? uri.replace('mongodb.net/', 'mongodb.net/uniexo')
        : uri.endsWith('/') ? uri + 'uniexo' : uri + '/uniexo';
    }

    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log('✅ Connected to database');

    const db = mongoose.connection.db;
    if (!db) throw new Error('Database connection failed');

    // 1. Create or Find Mock Vendor
    const usersCollection = db.collection('users');
    const email = 'mock_vendor@uniexo.in';
    
    let vendor = await usersCollection.findOne({ email });
    if (vendor) {
      console.log('🗑️  Clearing existing mock data for this vendor...');
      await db.collection('houses').deleteMany({ vendorId: vendor._id });
      await db.collection('vehicles').deleteMany({ vendorId: vendor._id });
      await db.collection('laundryservices').deleteMany({ vendorId: vendor._id });
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('MockVendor@123', salt);
      const insertResult = await usersCollection.insertOne({
        name: 'Mock Vendor',
        email,
        phone: '9999999999',
        password: hashedPassword,
        role: 'vendor',
        isEmailVerified: true,
        isSuspended: false,
        isDeleted: false,
        kycStatus: 'approved',
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0
      });
      vendor = await usersCollection.findOne({ _id: insertResult.insertedId });
    }

    if (!vendor) throw new Error('Vendor creation failed');
    console.log(`✅ Mock Vendor Ready: ${vendor._id}`);

    // Create Vendor Profile if not exists
    const vendorProfiles = db.collection('vendorprofiles');
    const existingProfile = await vendorProfiles.findOne({ userId: vendor._id });
    if (!existingProfile) {
      await vendorProfiles.insertOne({
        userId: vendor._id,
        businessName: 'Mock Services Pvt Ltd',
        businessType: 'Multiple',
        address: 'Mock City',
        city: 'Mockville',
        state: 'Mock State',
        pincode: '000000',
        kycDocuments: {},
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0
      });
    }

    // 2. Insert Houses (PGs)
    console.log('🏠 Seeding Houses...');
    const housesCollection = db.collection('houses');
    await housesCollection.insertMany([
      {
        vendorId: vendor._id,
        title: 'Premium Boys PG - Sector 12',
        description: 'Luxurious boys PG with all modern amenities.',
        propertyType: 'PG',
        address: '123 Tech Park Road',
        city: 'Jalandhar',
        state: 'Punjab',
        pincode: '144001',
        bedrooms: 5,
        bathrooms: 5,
        area: 2500,
        pricePerMonth: 8000,
        singleSharingPrice: 12000,
        doubleSharingPrice: 8000,
        tripleSharingPrice: 6000,
        securityDeposit: 8000,
        lockinPeriod: '6 months',
        noticePeriod: '30 days',
        electricityIncluded: false,
        electricityCharge: 10,
        images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800'],
        amenities: ['WiFi', 'AC', 'Power Backup'],
        commonAmenities: ['Lounge', 'Dining Area'],
        roomAmenities: ['Bed', 'Wardrobe', 'Study Table'],
        servicesAmenities: ['Daily Cleaning', 'Laundry'],
        foodAmenities: ['3 Meals', 'Veg Only'],
        rules: ['No smoking', 'Gate closes at 10 PM'],
        faqs: [{ question: 'Is electricity included?', answer: 'No' }],
        approvalStatus: 'approved',
        rank: 1, // High rank
        isAvailable: true,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0
      },
      {
        vendorId: vendor._id,
        title: 'Budget Girls PG',
        description: 'Affordable and safe living for girls.',
        propertyType: 'PG',
        address: '45 Near University',
        city: 'Phagwara',
        state: 'Punjab',
        pincode: '144411',
        bedrooms: 10,
        bathrooms: 8,
        area: 3000,
        pricePerMonth: 5000,
        doubleSharingPrice: 5000,
        tripleSharingPrice: 4000,
        securityDeposit: 5000,
        images: ['https://images.unsplash.com/photo-1502672260266-1c1e52504431?auto=format&fit=crop&q=80&w=800'],
        amenities: ['WiFi', 'Washing Machine'],
        commonAmenities: [],
        roomAmenities: [],
        servicesAmenities: [],
        foodAmenities: [],
        rules: [],
        faqs: [],
        approvalStatus: 'approved',
        rank: 2,
        isAvailable: true,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0
      }
    ]);

    // 3. Insert Vehicles
    console.log('🚗 Seeding Vehicles...');
    const vehiclesCollection = db.collection('vehicles');
    await vehiclesCollection.insertMany([
      {
        vendorId: vendor._id,
        name: 'Honda City',
        type: 'Car',
        brand: 'Honda',
        modelName: 'City ZX',
        year: 2023,
        registrationNumber: 'PB08-MOCK-1111',
        fuelType: 'Petrol',
        seatingCapacity: 5,
        pricePerDay: 2500,
        images: ['https://images.unsplash.com/photo-1549317661-bd32c8ce0be2?auto=format&fit=crop&q=80&w=800'],
        description: 'Smooth driving sedan.',
        features: ['AC', 'Bluetooth', 'Airbags'],
        location: 'Jalandhar City Center',
        availability: [],
        approvalStatus: 'approved',
        rank: 1,
        isAvailable: true,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0
      },
      {
        vendorId: vendor._id,
        name: 'Royal Enfield Classic 350',
        type: 'Bike',
        brand: 'Royal Enfield',
        modelName: 'Classic',
        year: 2022,
        registrationNumber: 'PB08-MOCK-2222',
        fuelType: 'Petrol',
        seatingCapacity: 2,
        pricePerDay: 800,
        images: ['https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800'],
        description: 'Cruise in style.',
        features: ['Electric Start', 'ABS'],
        location: 'University Campus',
        availability: [],
        approvalStatus: 'approved',
        rank: 2,
        isAvailable: true,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0
      }
    ]);

    // 4. Insert Laundry Services
    console.log('🧺 Seeding Laundry Services...');
    const laundryCollection = db.collection('laundryservices');
    await laundryCollection.insertMany([
      {
        vendorId: vendor._id,
        name: 'Express Cleaners',
        description: 'Quick and hygienic laundry service.',
        providerName: 'Mr. Sharma',
        providerPhone: '9988776655',
        providerAddress: 'Shop 10, Student Market',
        services: [
          { name: 'Wash & Iron', price: 15, unit: 'per piece' },
          { name: 'Dry Clean', price: 100, unit: 'per piece' }
        ],
        images: ['https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&q=80&w=800'],
        rank: 1,
        onsitePickup: true,
        onStoreService: true,
        onsitePickupCharge: 30,
        isActive: true,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0
      },
      {
        vendorId: vendor._id,
        name: 'Eco Wash',
        description: 'Eco-friendly and chemical-free washing.',
        providerName: 'Mrs. Verma',
        providerPhone: '8877665544',
        providerAddress: 'Phase 2 Market',
        services: [
          { name: 'Wash Only', price: 10, unit: 'per piece' },
          { name: 'Ironing', price: 8, unit: 'per piece' }
        ],
        images: ['https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&q=80&w=800'],
        rank: 2,
        onsitePickup: false,
        onStoreService: true,
        onsitePickupCharge: 0,
        isActive: true,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0
      }
    ]);

    console.log('🎉 Mock data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding mock data:', error);
    process.exit(1);
  }
}

seedMockData();
