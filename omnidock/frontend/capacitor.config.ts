import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'cl.nodalix.omnidock',
  appName: 'OmniDock',
  webDir: 'www',
  server: {
    // El backend de desarrollo corre en http (sin TLS): permitir tráfico en claro en Android.
    androidScheme: 'http',
    cleartext: true,
  },
};

export default config;
