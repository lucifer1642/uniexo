import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in .env');
  process.exit(1);
}

async function seedAdmin() {
  try {
    console.log('⏳ Connecting to database...');
    const uri = (MONGODB_URI as string).includes('?') 
      ? (MONGODB_URI as string).replace('cluster0.o3s7rcm.mongodb.net/', 'cluster0.o3s7rcm.mongodb.net/uniexo')
      : (MONGODB_URI as string) + '/uniexo';
    
    await mongoose.connect(uri);
    console.log('✅ Connected to database');

    const db = mongoose.connection.db;
    if (!db) throw new Error('Database connection failed');

    const collections = await db.listCollections().toArray();
    
    console.log('🗑️  Clearing all collections...');
    for (const collection of collections) {
      await db.collection(collection.name).deleteMany({});
      console.log(`   - Cleared ${collection.name}`);
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('Uniexo@26', salt);

    // Create Super Admin
    await db.collection('users').insertOne({
      name: 'UniExo Admin',
      email: 'uniexo.in@gmail.com',
      phone: '0000000000',
      password: hashedPassword,
      role: 'admin',
      isEmailVerified: true,
      isSuspended: false,
      isDeleted: false,
      kycStatus: 'approved',
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0
    });

    console.log('✅ Super Admin created successfully!');
    console.log('   Email: uniexo.in@gmail.com');
    console.log('   Password: Uniexo@26');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedAdmin();
