// app/_layout.js — root layout: wraps every screen in UserProvider
import { Stack } from 'expo-router';
import { UserProvider } from '../context/UserContext';

export default function RootLayout() {
  return (
    // UserProvider makes the logged-in user available on all screens
    <UserProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </UserProvider>
  );
}
