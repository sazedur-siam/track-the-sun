import HomeScreen from '@/src/screens/HomeScreen';
import LoadingScreen from '@/src/screens/LoadingScreen';
import React, { useState } from 'react';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);

  if (isLoading) {
    return <LoadingScreen onLoadComplete={() => setIsLoading(false)} />;
  }

  return <HomeScreen />;
}
