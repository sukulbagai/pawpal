import app from './index';

// Get port from environment or default to 4000
const PORT = process.env.PORT || 4000;

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 PawPal API server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📍 API docs: http://localhost:${PORT}/`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Process terminated');
  });
});
