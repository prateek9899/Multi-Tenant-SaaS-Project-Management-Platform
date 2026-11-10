require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 8000;

// Connect to MongoDB
connectDB();

const server = app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 ProjectFlow SaaS Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 API Base URL: http://localhost:${PORT}/api/v1`);
  console.log(`===============================================`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  // Keep server running in dev
  if (process.env.NODE_ENV === 'production') {
    server.close(() => process.exit(1));
  }
});

