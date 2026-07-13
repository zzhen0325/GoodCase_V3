// Set NEXT_PUBLIC_USE_MOCK_DATA=true to run the app without Firebase.
export const isMockDataEnabled = () =>
  process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
