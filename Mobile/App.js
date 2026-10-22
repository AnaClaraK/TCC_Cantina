import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useFonts } from 'expo-font';
import { 
  LogBox, 
  StatusBar, 
  Alert, 
  DeviceEventEmitter, 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
  NativeModules 
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'; 

// --- CORREÇÃO DO INTERACTIONMANAGER (SDK 58) ---
// Polyfill temporário para bibliotecas antigas que ainda tentam chamar InteractionManager
if (!NativeModules.InteractionManager) {
  NativeModules.InteractionManager = {
    runAfterInteractions: (task) => {
      if (typeof task === 'function') {
        setTimeout(task, 0);
      }
      return { cancel: () => {} };
    },
    createInteractionHandle: () => 1,
    clearInteractionHandle: () => {},
  };
}

// Silencia avisos residuais no console
LogBox.ignoreLogs(['InteractionManager', 'Invariant Violation: InteractionManager']);

// ÍCONES
import { Ionicons, Feather } from '@expo/vector-icons'; 

// Alertas personalizados da Grano Vita
const EVENTO_ALERTA_GRANO_VITA = 'grano-vita-alerta';
Alert.alert = (titulo, mensagem, botoes) => {
  DeviceEventEmitter.emit(EVENTO_ALERTA_GRANO_VITA, {
    titulo: titulo || 'Aviso',
    mensagem: mensagem || '',
    botoes: Array.isArray(botoes) && botoes.length ? botoes : [{ text: 'OK' }],
  });
};

// IMPORTAÇÃO DAS TELAS
import HomeScreen from './src/Screens/HomeScreen';
import CadastroScreen from './src/Screens/CadastroScreen';
import LoginScreen from './src/Screens/LoginScreen';
import CardapioScreen from './src/Screens/CardapioScreen';
import PerfilScreen from './src/Screens/PerfilScreen'; 
import ComprasScreen from './src/Screens/ComprasScreen';
import BuscarScreen from './src/Screens/BuscarScreen';
import PedidosScreen from './src/Screens/PedidosScreen'; 
import SplashScreen from './src/Screens/SplashScreen'; 
import RecuperarScreen from './src/Screens/RecuperarScreen'; 

const PilhasTelas = createStackNavigator();
const Tab = createBottomTabNavigator();

// --- 1. CONFIGURAÇÃO DO MENU DE ABAS (BOTTOM TABS) ---
function TabNavigator() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, 

        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Cardapio') {
            iconName = focused ? 'fast-food' : 'fast-food-outline';
          } else if (route.name === 'Buscar') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Pedidos') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'Perfil') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Compras') {
            return (
              <Feather 
                name="shopping-cart" 
                size={35} 
                color={color} 
                style={{
                  width: 50,
                  height: 50,
                  textAlign: 'center',
                  textAlignVertical: 'center',
                  marginTop: 15, 
                }} 
              />
            );
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },

        tabBarActiveTintColor: '#3E2723',
        tabBarInactiveTintColor: '#5D4037',
        
        tabBarStyle: {
          backgroundColor: '#efac4a',
          height: 65 + insets.bottom,
          borderTopWidth: 0,
          paddingTop: 8,
          paddingBottom: insets.bottom,
        },
        
        tabBarIconStyle: {
          marginBottom: -5,
        },

        tabBarLabelStyle: {
          fontFamily: 'Montserrat',
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
          marginBottom: 5,
        },

        tabBarItemStyle: {
          overflow: 'visible',
        },

        headerStyle: { backgroundColor: '#242628' },
        headerTintColor: '#efac4a',
        headerTitleAlign: 'center',
        headerTitleStyle: {
          fontFamily: 'BebasNeue-Regular',
          fontSize: 25,
        },
      })}
    > 
      <Tab.Screen name="Cardapio" component={CardapioScreen} options={{ title: 'Início' }} />
      <Tab.Screen name="Buscar" component={BuscarScreen} options={{ title: 'Buscar' }} />
      
      <Tab.Screen 
        name="Compras" 
        component={ComprasScreen} 
        options={{ 
          tabBarLabel: () => null, 
        }} 
      />

      <Tab.Screen name="Pedidos" component={PedidosScreen} options={{ title: 'Pedidos' }} />
      <Tab.Screen name="Perfil" component={PerfilScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}

// --- 2. COMPONENTE PRINCIPAL (APP) ---
export default function App() {
  const [alertaSistema, setAlertaSistema] = React.useState(null);
  const [fontsLoaded] = useFonts({
    'Montserrat': require('./assets/fonts/Montserrat-Bold.ttf'),
    'BebasNeue-Regular': require('./assets/fonts/BebasNeue-Regular.ttf'),
  });

  React.useEffect(() => {
    const assinatura = DeviceEventEmitter.addListener(EVENTO_ALERTA_GRANO_VITA, setAlertaSistema);
    return () => assinatura.remove();
  }, []);

  const fecharAlertaSistema = (botao) => {
    setAlertaSistema(null);
    if (botao && typeof botao.onPress === 'function') {
      Promise.resolve().then(() => botao.onPress());
    }
  };

  if (!fontsLoaded) {
    return null; 
  }

  const botoesAlerta = alertaSistema?.botoes?.length ? alertaSistema.botoes : [{ text: 'OK' }];

  return (
    <SafeAreaProvider>
      <View style={stylesAplicativo.raiz}>
        <NavigationContainer>
          <StatusBar hidden={true} />
          <PilhasTelas.Navigator 
            initialRouteName="SplashScreen" 
            screenOptions={{ headerShown: false }}
          >
            <PilhasTelas.Screen name="SplashScreen" component={SplashScreen} />
            <PilhasTelas.Screen name="HomeScreen" component={HomeScreen} />
            <PilhasTelas.Screen name="CadastroScreen" component={CadastroScreen} />
            <PilhasTelas.Screen name="LoginScreen" component={LoginScreen} />
            <PilhasTelas.Screen name="MainApp" component={TabNavigator} />
            <PilhasTelas.Screen name="RecuperarScreen" component={RecuperarScreen} />
          </PilhasTelas.Navigator>
        </NavigationContainer>

        <Modal
          visible={!!alertaSistema}
          transparent
          animationType="fade"
          onRequestClose={() => fecharAlertaSistema(botoesAlerta.find(b => b.style === 'cancel') || botoesAlerta[0])}
        >
          <View style={stylesAplicativo.fundoAlerta}>
            <View style={stylesAplicativo.caixaAlerta}>
              <Text style={stylesAplicativo.tituloAlerta}>{alertaSistema?.titulo}</Text>
              {!!alertaSistema?.mensagem && (
                <Text style={stylesAplicativo.mensagemAlerta}>{alertaSistema.mensagem}</Text>
              )}
              <View style={[
                stylesAplicativo.acoesAlerta,
                botoesAlerta.length === 1 && stylesAplicativo.acaoUnicaAlerta,
              ]}>
                {botoesAlerta.map((botao, indice) => {
                  const cancelar = botao.style === 'cancel';
                  const destrutivo = botao.style === 'destructive';
                  return (
                    <TouchableOpacity
                      key={`${botao.text || 'acao'}-${indice}`}
                      style={[
                        stylesAplicativo.botaoAlerta,
                        cancelar && stylesAplicativo.botaoCancelarAlerta,
                        destrutivo && stylesAplicativo.botaoDestrutivoAlerta,
                        botoesAlerta.length === 1 && stylesAplicativo.botaoUnicoAlerta,
                      ]}
                      onPress={() => fecharAlertaSistema(botao)}
                      activeOpacity={0.8}
                    >
                      <Text style={[
                        stylesAplicativo.textoBotaoAlerta,
                        cancelar && stylesAplicativo.textoCancelarAlerta,
                        destrutivo && stylesAplicativo.textoDestrutivoAlerta,
                      ]}>{botao.text || 'OK'}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaProvider>
  );
}

const stylesAplicativo = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: '#341d04' },
  fundoAlerta: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  caixaAlerta: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#341d04',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#efac4a',
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 18,
    elevation: 15,
  },
  tituloAlerta: {
    color: '#efac4a',
    fontFamily: 'Montserrat',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  mensagemAlerta: {
    color: '#ebd5a6',
    fontFamily: 'Montserrat',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 20,
  },
  acoesAlerta: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  acaoUnicaAlerta: { justifyContent: 'center' },
  botaoAlerta: {
    minWidth: 90,
    minHeight: 42,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#efac4a',
  },
  botaoUnicoAlerta: { minWidth: 110 },
  botaoCancelarAlerta: {
    backgroundColor: '#713b00',
    borderWidth: 1,
    borderColor: '#efac4a',
  },
  botaoDestrutivoAlerta: { backgroundColor: '#b93820' },
  textoBotaoAlerta: {
    color: '#341d04',
    fontFamily: 'Montserrat',
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
  },
  textoCancelarAlerta: { color: '#efac4a' },
  textoDestrutivoAlerta: { color: '#FFFFFF' },
});