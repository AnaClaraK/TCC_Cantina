import 'react-native-gesture-handler'

//container de navegação
import { NavigationContainer } from '@react-navigation/native';

//criando a pilha
import {createStackNavigator} from '@react-navigation/stack';
import { useFonts } from 'expo-font';
import HomeScreen from './src/Screens/HomeScreen';
import CadastroScreen from './src/Screens/CadastroScreen';
import LoginScreen from './src/Screens/LoginScreen';

const PilhasTelas = createStackNavigator()

export default function App() {
  const [fontsLoaded] = useFonts({
    'Montserrat': require('./assets/fonts/Montserrat-Bold.ttf'),
    'BebasNeue-Regular': require('./assets/fonts/BebasNeue-Regular.ttf'),
  });
  return (
    <NavigationContainer>
    <PilhasTelas.Navigator>
    <PilhasTelas.Screen name="HomeScreen" component={HomeScreen} options={{headerShown:false}}/>
    <PilhasTelas.Screen name="CadastroScreen" component={CadastroScreen} options={{headerShown:false}}/>
    <PilhasTelas.Screen name="LoginScreen" component={LoginScreen} options={{headerShown:false}}/>

    </PilhasTelas.Navigator>
    </NavigationContainer>
  );
}
