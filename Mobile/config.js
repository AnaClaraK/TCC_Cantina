import Constants from 'expo-constants';

// Endereço central do backend.
// No Expo Go, tenta detectar automaticamente o IP do computador que executa o Expo.
const IP_SERVIDOR_PADRAO = '10.0.2.2';

const hostUri =
  Constants.expoConfig?.hostUri ||
  Constants.manifest2?.extra?.expoGo?.developer?.manifest?.debuggerHost ||
  Constants.manifest?.debuggerHost;

const IP_SERVIDOR = hostUri ? hostUri.split(':')[0] : IP_SERVIDOR_PADRAO;

export const BASE_URL = `10.111.9.87`;
