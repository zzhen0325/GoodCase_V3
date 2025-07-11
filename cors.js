// This is a placeholder for CORS configuration.
// In a real application, you should configure this based on your needs.

// Default origins for development
const defaultOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "https://good-case-v3.vercel.app",
  "https://goodcase-v3-383688111435.europe-west1.run.app/"
];

// Get allowed origins from environment variable, split by comma, or use default
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(',')
  : defaultOrigins;


module.exports = {
    origin: allowedOrigins,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 204
}