import mongoose from 'mongoose';

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI not set in environment');
  }
  
  try {
    mongoose.set('strictQuery', true);
    
    // Connection options for Atlas
    const options = {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    };
    
    await mongoose.connect(mongoUri, options);
    console.log('✅ MongoDB Atlas connected successfully');
  } catch (error) {
    console.error('❌ MongoDB Atlas connection failed:', error.message);
    
    // Provide helpful error messages
    if (error.message.includes('IP')) {
      console.error('💡 Solution: Add your IP address to MongoDB Atlas Network Access:');
      console.error('   1. Go to https://cloud.mongodb.com/');
      console.error('   2. Navigate to Network Access');
      console.error('   3. Add your current IP or use 0.0.0.0/0 for development');
    }
    
    throw error;
  }
};

export default connectDB;


