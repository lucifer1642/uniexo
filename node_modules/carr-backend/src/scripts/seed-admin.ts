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
    
    // Ensure we are connecting to the 'uniexo' database
    let uri = MONGODB_URI as string;
    if (!uri.includes('mongodb.net/uniexo')) {
      uri = uri.includes('?') 
        ? uri.replace('mongodb.net/', 'mongodb.net/uniexo')
        : uri.endsWith('/') ? uri + 'uniexo' : uri + '/uniexo';
    }

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    
    console.log('✅ Connected to database');

    const db = mongoose.connection.db;
    if (!db) throw new Error('Database connection failed');

    const collections = await db.listCollections().toArray();
    
    console.log('🗑️  Clearing all collections...');
    for (const collection of collections) {
      // Skip system collections if any
      if (collection.name.startsWith('system.')) continue;
      
      await db.collection(collection.name).deleteMany({});
      console.log(`   - Cleared ${collection.name}`);
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('Uniexo@26', salt);

    // Create Super Admin in 'users' collection
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
  } catch (error: any) {
    console.error('\n❌ Seeding failed!');
    
    if (error.message.includes('MongooseServerSelectionError') || error.message.includes('SSL alert number 80')) {
      console.error('\n=========================================================');
      console.error('🛑 IP WHITELIST ERROR DETECTED');
      console.error('Your current IP address is not allowed to access this Atlas cluster.');
      console.error('\nTO FIX THIS:');
      console.error('1. Log in to https://cloud.mongodb.com/');
      console.error('2. Go to "Network Access" in the left sidebar.');
      console.error('3. Click "+ Add IP Address".');
      console.error('4. Click "Add Current IP Address" and then "Confirm".');
      console.error('5. Wait 1-2 minutes for the changes to deploy, then run this again.');
      console.error('=========================================================\n');
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

seedAdmin();
