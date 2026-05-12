import 'react-native-gesture-handler';
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { createStackNavigator } from '@react-navigation/stack';
import { useFonts } from 'expo-font';
import Feather from '@expo/vector-icons/Feather';

// Suas Telas
import HomeScreen from './src/Screens/HomeScreen';
import CadastroScreen from './src/Screens/CadastroScreen';
import LoginScreen from './src/Screens/LoginScreen';
import CardapioScreen from './src/Screens/CardapioScreen';
import PerfilScreen from './src/Screens/CardapioScreen'; 
import ComprasScreen from './src/Screens/ComprasScreen';
import BuscarScreen from './src/Screens/BuscarScreen';
import PedidosScreen from './src/Screens/PedidosScreen'; 

const PilhasTelas = createStackNavigator();
const Tab = createBottomTabNavigator();


// --- 1. CONFIGURAÇÃO DAS ABAS (BOTTOM TABS) ---
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          let IconComponent = Ionicons; // Padroniza o uso de Ionicons

          if (route.name === 'Cardapio') {

            iconName = focused ? 'restaurant' : 'restaurant-outline';

          } else if (route.name === 'Perfil') {

            iconName = focused ? 'person' : 'person-outline';

          }else if (route.name === 'Buscar') {

            iconName = focused ? 'search' : 'search-outline';

          }else if (route.name === 'Pedidos') {

            iconName = focused ? 'receipt' : 'receipt-outline';

          }
          else if (route.name === 'Compras') {
            IconComponent = Feather; // Muda para Feather apenas nesta aba
            iconName = 'shopping-cart';
          } 
          
    

          // Retorna apenas UM componente de ícone
          return <IconComponent name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3E2723', // Marrom escuro da sua foto
        tabBarInactiveTintColor: '#5D4037', // Marrom médio
        tabBarStyle: {
          backgroundColor: '#efac4a', // Laranja de fundo do seu menu
          height: 70,
          paddingBottom: 10,
          borderTopWidth: 0,
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
      <Tab.Screen name="Compras" component={ComprasScreen} options={{ title: 'Carrinho' }} />
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
    return null; // Ou uma tela de carregamento
  }

  return (
    <NavigationContainer>
      <PilhasTelas.Navigator screenOptions={{ headerShown: false }}>
        {/* Telas de Autenticação */}
        <PilhasTelas.Screen name="HomeScreen" component={HomeScreen} />
        <PilhasTelas.Screen name="CadastroScreen" component={CadastroScreen} />
        <PilhasTelas.Screen name="LoginScreen" component={LoginScreen} />

        {/* IMPORTANTE: Em vez de chamar CardapioScreen direto, 
            chamamos o TabNavigator que criamos acima.
        */}
        <PilhasTelas.Screen name="MainApp" component={TabNavigator} />
      </PilhasTelas.Navigator>
    </NavigationContainer>
  );
}