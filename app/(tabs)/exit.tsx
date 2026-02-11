import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

export default function ExitScreen() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home immediately if somehow this screen is accessed
    router.replace('/');
  }, []);

  return <View />;
}
