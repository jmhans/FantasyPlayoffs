import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.actuarialgames.fantasyplayoffs',
  appName: 'Fantasy Playoffs',
  webDir: 'public', // Temporary, we'll use server URL instead
  server: {
    url: 'https://fantasy-playoffs.vercel.app', // Your production URL
    cleartext: true
  },
  ios: {
    contentInset: 'always',
  }
};

export default config;
