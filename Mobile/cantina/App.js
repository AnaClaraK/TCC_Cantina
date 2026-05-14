import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useFonts } from 'expo-font';

// ÍCONES
import { Ionicons, Feather } from '@expo/vector-icons'; 

// IMPORTAÇÃO DAS TELAS
import HomeScreen from './src/Screens/HomeScreen';
import CadastroScreen from './src/Screens/CadastroScreen';
import LoginScreen from './src/Screens/LoginScreen';
import CardapioScreen from './src/Screens/CardapioScreen';
import PerfilScreen from './src/Screens/CardapioScreen'; // Ajuste quando criar o PerfilScreen real
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
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          let IconComponent = Ionicons;

          if (route.name === 'Cardapio') {
            iconName = focused ? 'fast-food' : 'fast-food-outline';
          } else if (route.name === 'Buscar') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Pedidos') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'Perfil') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Compras') {
            // Seu carrinho personalizado conforme solicitado
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

          return <IconComponent name={iconName} size={size} color={color} />;
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
      {/* O Navigator de Pilha começa pela SplashScreen */}
      <PilhasTelas.Navigator 
        initialRouteName="SplashScreen" 
        screenOptions={{ headerShown: false }}
      >
        {/* 1ª Tela: Intro/Splash (Sem ícones embaixo) */}
        <PilhasTelas.Screen name="SplashScreen" component={SplashScreen} />

        {/* Telas de Autenticação (Sem ícones embaixo) */}
        <PilhasTelas.Screen name="HomeScreen" component={HomeScreen} />
        <PilhasTelas.Screen name="CadastroScreen" component={CadastroScreen} />
        <PilhasTelas.Screen name="LoginScreen" component={LoginScreen} />

        {/* Tela Principal (Aqui os ícones de baixo aparecem) */}
        <PilhasTelas.Screen name="MainApp" component={TabNavigator} />
      </PilhasTelas.Navigator>
    </NavigationContainer>
  );
}