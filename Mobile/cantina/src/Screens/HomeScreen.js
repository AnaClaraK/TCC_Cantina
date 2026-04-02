import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from "@react-navigation/native";
import { Botao } from '../Components/Botoes';


export default function HomeScreen(){
    const navigation = useNavigation()

    function navegarc(){
        navigation.navigate("CadastroScreen")
    }
    function navegarl(){
        navigation.navigate("LoginScreen")
    }
  return (
    <View style={styles.container}>
      <Text style={styles.texto} >BEM VINDO AO APP DA CANTINA</Text>
      <Image 
      source={require('../../assets/images/logo_c.png')}
      style={styles.imagem}
      />
      <Image 
      source={require('../../assets/images/logo.png')}
      style={styles.imageml}
      />
      <StatusBar style="auto" />
      <Botao acao={navegarl} texto={"Fazer Login"} cor={"green"}/>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#242628'
  },
  texto:{
    color:'#efac4a',
    fontFamily:'BebasNeue-Regular',
    fontSize: 40,
  },
  imagem: {
    height: 80,
    width: 300
  },
  imageml: {
    height: 182,
    width: 130
  },
  botao:{
    backgroundColor: 'green',
    padding: 15,
    marginTop:30
  }
});
