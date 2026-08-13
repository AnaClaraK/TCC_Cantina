import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useFonts } from 'expo-font';
import { LogBox, StatusBar } from 'react-native'; 

// Silencia o aviso do InteractionManager
LogBox.ignoreLogs(['InteractionManager']);

// ÍCONES
import { Ionicons, Feather } from '@expo/vector-icons'; 

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

const PilhasTelas = createStackNavigator();
const Tab = createBottomTabNavigator();

// --- 1. CONFIGURAÇÃO DO MENU DE ABAS (BOTTOM TABS) ---
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        // 🛠️ MUDANÇA AQUI: Remove a faixa preta superior das abas
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
          height: 65,
          borderTopWidth: 0,
          paddingTop: 8,
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

        // Nota: As configurações de estilo de cabeçalho abaixo se tornam obsoletas
        // agora que definimos 'headerShown: false' acima.
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
  const [fontsLoaded] = useFonts({
    'Montserrat': require('./assets/fonts/Montserrat-Bold.ttf'),
    'BebasNeue-Regular': require('./assets/fonts/BebasNeue-Regular.ttf'),
  });

  if (!fontsLoaded) {
    return null; 
  }

  return (
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
      </PilhasTelas.Navigator>
    </NavigationContainer>
  );
}