import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function checkMongo() {
  const uri = process.env.MONGODB_URI;
  console.log('Checking MongoDB connection...');
  console.log('URI:', uri ? uri.replace(/:([^@]+)@/, ':****@') : 'MISSING');
  
  if (!uri) {
    console.error('❌ MONGODB_URI is missing');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ MongoDB connected successfully!');
    await mongoose.disconnect();
    console.log('✅ MongoDB disconnected.');
    process.exit(0);
  } catch (err) {
    console.error('❌ MongoDB connection FAILED:');
    console.error(err);
    process.exit(1);
  }
}

checkMongo();
