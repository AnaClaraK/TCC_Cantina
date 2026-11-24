import Constants from 'expo-constants';

const IP_SERVIDOR_PADRAO = '10.111.9.70';

const hostUri =
  Constants.expoConfig?.hostUri ||
  Constants.manifest2?.extra?.expoGo?.developer?.manifest?.debuggerHost ||
  Constants.manifest?.debuggerHost;

const IP_SERVIDOR = hostUri ? hostUri.split(':')[0] : IP_SERVIDOR_PADRAO;

export const BASE_URL = `https://resource-dragonfly-arguably.ngrok-free.dev`;
