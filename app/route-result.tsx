import RouteResultScreen from '@/src/screens/RouteResultScreen';
import { Stack } from 'expo-router';

export default function RouteResult() {
  return (
    <>
      <Stack.Screen options={{ title: 'Route Details', headerShown: true }} />
      <RouteResultScreen />
    </>
  );
}
