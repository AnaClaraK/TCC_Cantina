import React, { useState, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const CORES = {
  marromEscuro: '#341d04',
  marromDestaque: '#713b00',
  dourado: '#efac4a',
  creme: '#ebd5a6',
  branco: '#FFFFFF',
  cinzaCard: '#4a2c0a',
  vermelho: '#ff4d4d'
};

export default function PerfilScreen() {
  const navigation = useNavigation();
  const [carregando, setCarregando] = useState(true);
  const [dadosUsuario, setDadosUsuario] = useState({
    id: '',
    nome: '',
    token: ''
  });

  const carregarDadosDoLogin = async () => {
    try {
      setCarregando(true);
      const idUser = await AsyncStorage.getItem("id_user");
      const token = await AsyncStorage.getItem("token");
      
      // Se você salva o nome completo no login, use a chave correta aqui
      // Caso contrário, simularemos usando a informação recuperada
      const nomeUser = await AsyncStorage.getItem("nome_user") || "Usuário Conectado";

      setDadosUsuario({
        id: idUser || 'Não encontrado',
        nome: nomeUser,
        token: token ? 'Sessão Ativa (JWT)' : 'Sem Token'
      });
    } catch (erro) {
      console.error("Erro ao ler dados do AsyncStorage:", erro);
      Alert.alert("Erro", "Não foi possível carregar os dados do perfil.");
    } finally {
      setCarregando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      carregarDadosDoLogin();
    }, [])
  );

  const efetuarLogout = () => {
    Alert.alert(
      "Sair da Conta",
      "Deseja realmente encerrar a sua sessão?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          style: "destructive",
          onPress: async () => {
            try {
              // Limpa as credenciais gravadas
              await AsyncStorage.removeItem("token");
              await AsyncStorage.removeItem("id_user");
              await AsyncStorage.removeItem("nome_user");
              
              // Redireciona de volta para a tela de Login
              // Altere o nome 'Login' caso sua rota de autenticação tenha outro nome
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (e) {
              Alert.alert("Erro", "Falha ao deslogar.");
            }
          }
        }
      ]
    );
  };

  if (carregando) {
    return (
      <SafeAreaView style={[styles.container, styles.containerCentro]}>
        <ActivityIndicator size="large" color={CORES.dourado} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.barraTituloTela}>
        <Text style={styles.txtTituloTela}>MEU PERFIL</Text>
      </View>

      <View style={styles.content}>
        
        {/* Bloco do Avatar / Cabeçalho do Usuário */}
        <View style={styles.containerAvatar}>
          <View style={styles.circuloAvatar}>
            <Ionicons name="person-outline" size={50} color={CORES.marromEscuro} />
          </View>
          <Text style={styles.txtNomeUsuario}>{dadosUsuario.nome}</Text>
          <Text style={styles.txtSubtitulo}>ID do Cliente: #{dadosUsuario.id}</Text>
        </View>

        {/* Bloco de Detalhes Técnicos do Login */}
        <View style={styles.boxInformacoes}>
          <Text style={styles.tituloSecao}>DADOS DA SESSÃO ATUAL</Text>
          
          <View style={styles.linhaInfo}>
            <Text style={styles.labelInfo}>ID Armazenado:</Text>
            <Text style={styles.valorInfo}>{dadosUsuario.id}</Text>
          </View>

          <View style={styles.linhaInfo}>
            <Text style={styles.labelInfo}>Status do Token:</Text>
            <Text style={[styles.valorInfo, { color: '#4CD964' }]}>{dadosUsuario.token}</Text>
          </View>
        </View>

        {/* Botão de Logout */}
        <TouchableOpacity style={styles.btnSair} onPress={efetuarLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={CORES.branco} />
          <Text style={styles.txtBtnSair}>SAIR DA CONTA</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#242628',
  },
  containerCentro: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  barraTituloTela: { 
    backgroundColor: CORES.marromDestaque, 
    paddingVertical: 15, 
    alignItems: 'center' 
  },
  txtTituloTela: { 
    color: CORES.branco, 
    fontFamily: 'BebasNeue-Regular', 
    fontSize: 24, 
    letterSpacing: 2 
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  containerAvatar: {
    alignItems: 'center',
    marginTop: 20,
  },
  circuloAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: CORES.dourado,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  txtNomeUsuario: {
    color: CORES.branco,
    fontSize: 22,
    fontWeight: 'bold',
  },
  txtSubtitulo: {
    color: CORES.creme,
    fontSize: 14,
    marginTop: 4,
  },
  boxInformacoes: {
    backgroundColor: CORES.cinzaCard,
    borderRadius: 12,
    padding: 15,
    marginVertical: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  tituloSecao: {
    color: CORES.dourado,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 15,
    letterSpacing: 1,
  },
  linhaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  labelInfo: {
    color: CORES.creme,
    fontSize: 14,
  },
  valorInfo: {
    color: CORES.branco,
    fontSize: 14,
    fontWeight: 'bold',
  },
  btnSair: {
    flexDirection: 'row',
    backgroundColor: CORES.vermelho,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 15,
  },
  txtBtnSair: {
    color: CORES.branco,
    fontSize: 15,
    fontWeight: 'bold',
  }
});