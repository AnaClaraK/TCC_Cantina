import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  Image, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  ScrollView 
} from 'react-native';
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from '@expo/vector-icons'; 
import Constants from 'expo-constants';
import { Botao } from '../Components/Botoes';

// Pega o IP local dinamicamente para testes com Expo Go
const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.developer?.manifest?.debuggerHost;
const IP_SERVIDOR = hostUri ? hostUri.split(':')[0] : '10.111.9.55';
const URL_API = `http://${IP_SERVIDOR}:3000`;

export default function RecuperarScreen() {
  const [email, setEmail] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  
  const [verNovaSenha, setVerNovaSenha] = useState(true);
  const [verConfirmarSenha, setVerConfirmarSenha] = useState(true);
  
  const [carregando, setCarregando] = useState(false);
  const navigation = useNavigation();

  const handleRecuperar = async () => {
    // 1. Validações locais
    if (!email.trim() || !novaSenha.trim() || !confirmarSenha.trim()) {
      Alert.alert("Campos Obrigatórios", "Por favor, preencha todos os campos.");
      return;
    }

    if (novaSenha.length < 7) {
      Alert.alert("Senha Fraca", "A nova senha deve conter no mínimo 7 caracteres.");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      Alert.alert("Senhas Divergentes", "A nova senha e a confirmação não correspondem.");
      return;
    }

    // 2. Envio para a API
    try {
      setCarregando(true);

      const resposta = await fetch(`${URL_API}/redefinir-senha`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email: email.trim(),
          novaSenha: novaSenha 
        }),
      });

      const dados = await resposta.json();

      if (resposta.ok && dados.resposta === "true") {
        Alert.alert(
          "Senha Alterada!",
          dados.mensagem || "Sua senha foi atualizada com sucesso.",
          [{ text: "Ir para o Login", onPress: () => navigation.navigate("LoginScreen") }]
        );
      } else {
        Alert.alert("Erro", dados.mensagem || "Não foi possível alterar a senha.");
      }
    } catch (erro) {
      console.error("Erro ao redefinir senha:", erro);
      Alert.alert(
        "Falha na Rede", 
        "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente."
      );
    } finally {
      setCarregando(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        {/* Botão de Voltar */}
        <TouchableOpacity 
          style={styles.btnVoltarTopo} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={28} color="#efac4a" />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Image 
            source={require('../../assets/images/logo.png')} 
            style={styles.imagemLogo} 
          />
          <Text style={styles.texto}>CANTINA</Text>
          <Image source={require('../../assets/images/logo_c.png')} style={styles.imagemTopo} />
          <Text style={styles.subtitulo}>Recuperar Senha</Text>
        </View>

        {/* Card do Formulário */}
        <View style={styles.quadrado}>
          {/* Campo E-mail */}
          <View style={styles.inputArea}>
            <Ionicons name="mail-outline" size={26} color="#eeaf55" />
            <TextInput 
              style={styles.inputInterno} 
              placeholder="E-mail cadastrado"
              placeholderTextColor="#888"
              onChangeText={setEmail}
              value={email}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Campo Nova Senha */}
          <View style={styles.inputArea}>
            <Ionicons name="lock-closed-outline" size={26} color="#eeaf55" />
            <TextInput 
              style={styles.inputInterno} 
              placeholder="Nova senha (min. 7 dígitos)"
              placeholderTextColor="#888"
              onChangeText={setNovaSenha}
              value={novaSenha}
              secureTextEntry={verNovaSenha}
            />
            <TouchableOpacity onPress={() => setVerNovaSenha(!verNovaSenha)}>
              <Ionicons 
                name={verNovaSenha ? "eye-off-outline" : "eye-outline"} 
                size={24} 
                color="#888" 
              />
            </TouchableOpacity>
          </View>

          {/* Campo Confirmar Nova Senha */}
          <View style={styles.inputArea}>
            <Ionicons name="checkmark-circle-outline" size={26} color="#eeaf55" />
            <TextInput 
              style={styles.inputInterno} 
              placeholder="Confirme a nova senha"
              placeholderTextColor="#888"
              onChangeText={setConfirmarSenha}
              value={confirmarSenha}
              secureTextEntry={verConfirmarSenha}
            />
            <TouchableOpacity onPress={() => setVerConfirmarSenha(!verConfirmarSenha)}>
              <Ionicons 
                name={verConfirmarSenha ? "eye-off-outline" : "eye-outline"} 
                size={24} 
                color="#888" 
              />
            </TouchableOpacity>
          </View>

          {/* Botão de Ação */}
          {carregando ? (
            <ActivityIndicator size="large" color="#efac4a" style={{ marginVertical: 15 }} />
          ) : (
            <Botao 
              texto="SALVAR NOVA SENHA" 
              acao={handleRecuperar} 
              tamFonte={16} 
            />
          )}

          <TouchableOpacity 
            style={styles.btnVoltarTexto} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.txtVoltar}>Cancelar e voltar ao login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#242628',
    alignItems: 'center',
    justifyContent: 'center', 
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  btnVoltarTopo: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30, 
  },
  imagemLogo: { 
    height: 100, 
    width: 100, 
    resizeMode: 'contain' 
  },
  texto: {
    color: '#efac4a',
    fontFamily: 'BebasNeue-Regular',
    fontSize: 55,
    lineHeight: 60, 
    marginTop: 5, 
  },
  subtitulo: {
    color: '#FFFFFF',
    fontFamily: 'BebasNeue-Regular',
    fontSize: 32,
    letterSpacing: 2,
    marginTop: 15,
  },
  quadrado: {
    backgroundColor: '#b0aead',
    width: '100%',
    paddingVertical: 25, 
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
  },
  inputArea: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    width: '100%',
    height: 55, 
    borderRadius: 15,
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 15,
  },
  inputInterno: {
    flex: 1,
    marginLeft: 10,
    fontFamily: 'Montserrat',
    color: '#333',
    fontSize: 15,
  },
  btnVoltarTexto: {
    marginTop: 18,
    padding: 5,
  },
  txtVoltar: {
    color: '#242628',
    fontFamily: 'Montserrat',
    fontWeight: 'bold',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  imagemTopo: { 
        height: 80, 
        width: 300, 
        resizeMode: 'contain',
        marginTop: -10 
    },
});