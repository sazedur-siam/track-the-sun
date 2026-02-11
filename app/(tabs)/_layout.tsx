import * as Haptics from 'expo-haptics';
import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Alert, BackHandler, Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  const handleExitPress = (e: any) => {
    e.preventDefault();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Alert.alert(
      'Exit App',
      'Are you sure you want to exit TrackTheSun?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            router.push('/');
          }
        },
        {
          text: 'Exit',
          style: 'destructive',
          onPress: () => {
            if (Platform.OS === 'android') {
              BackHandler.exitApp();
            } else {
              Alert.alert('Note', 'Please use the home button to close the app on iOS.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="saved_locations"
        options={{
          title: 'Saved Locations',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="star.fill" color={color} />,
        }}
      />
       <Tabs.Screen
        name="exit"
        options={{
          title: 'Exit',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="logout" color={color} />,
        }}
        listeners={{
          tabPress: handleExitPress,
        }}
      />
    </Tabs>
  );
}
