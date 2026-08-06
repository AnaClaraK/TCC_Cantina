// src/services/api.js
import Constants from 'expo-constants';

// Pega o IP do computador na rede local automaticamente
const hostUri = Constants.expoConfig?.hostUri;
const IP_SERVIDOR = hostUri ? hostUri.split(':')[0] : '10.0.2.2';

export const BASE_URL = `http://${IP_SERVIDOR}:3000`;