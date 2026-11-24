import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image } from 'react-native';
import { useNavigation } from "@react-navigation/native";
import { Botao } from '../Components/Botoes';
import React, { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen(){
  const navigation = useNavigation();

  useEffect(() => {
    const verificarSessao = async () => {
      const logado = await AsyncStorage.getItem('@usuario_logado');
      if (logado === 'true') {
        navigation.replace("CardapioScreen"); 
      }
    };
    verificarSessao();
  }, []);

  function navegarl(){
    navigation.navigate("LoginScreen");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.texto}>BEM VINDO AO APP DA CANTINA</Text>
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
  }
});
