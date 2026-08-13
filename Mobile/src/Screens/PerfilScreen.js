import React, { useState, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const BASE_URL = 'http://10.0.2.2:3000'; 

const CORES = {
  fundo: '#242628',
  marromEscuro: '#341d04',
  marromDestaque: '#713b00',
  dourado: '#efac4a',
  creme: '#ebd5a6',
  branco: '#FFFFFF',
  cinzaCard: '#4a2c0a',
  cinzaInput: '#1a1b1c',
  vermelho: '#ff4d4d',
};

export default function PerfilScreen() {
  const navigation = useNavigation();
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // Estados
  const [idUser, setIdUser] = useState('');
  const [emailAntigo, setEmailAntigo] = useState('');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [fotoUri, setFotoUri] = useState(null);
  const [fotoServidor, setFotoServidor] = useState(null);

  // Senhas
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  // 1. Carregar Dados do Perfil
  const carregarDadosDoPerfil = async () => {
    try {
      setCarregando(true);

      // Busca do AsyncStorage
      const idSalvo = await AsyncStorage.getItem("id_user") || "";
      const nomeSalvo = await AsyncStorage.getItem("nome_user") || "";
      const emailSalvo = await AsyncStorage.getItem("email_user") || "";
      const fotoSalva = await AsyncStorage.getItem("foto_user") || "";

      setIdUser(idSalvo);
      setNome(nomeSalvo);
      setEmail(emailSalvo);
      setEmailAntigo(emailSalvo); // Guarda o e-mail atual para busca no backend
      setFotoServidor(fotoSalva);

    } catch (erro) {
      console.error("Erro ao carregar dados locais:", erro);
      Alert.alert("Erro", "Não foi possível carregar as informações do perfil.");
    } finally {
      setCarregando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      carregarDadosDoPerfil();
    }, [])
  );

  // 2. Selecionar Foto da Galeria
  const selecionarImagem = async () => {
    const permResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permResult.granted) {
      Alert.alert("Permissão Necessária", "É preciso permitir o acesso à galeria.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      setFotoUri(result.assets[0].uri);
    }
  };

  // 3. Salvar Alterações
  const handleSalvarPerfil = async () => {
    // Validação de segurança: emailAntigo não pode estar vazio
    if (!emailAntigo && !idUser) {
      Alert.alert(
        "Atenção", 
        "Não foi possível identificar o seu usuário atual. Por favor, saia da conta e faça login novamente."
      );
      return;
    }

    // Validações de senha
    if (novaSenha || senhaAtual || confirmarSenha) {
      if (!senhaAtual) {
        Alert.alert("Atenção", "Informe sua senha atual para alterar a senha.");
        return;
      }
      if (novaSenha !== confirmarSenha) {
        Alert.alert("Atenção", "A nova senha e a confirmação não conferem.");
        return;
      }
    }

    try {
      setSalvando(true);
      const token = await AsyncStorage.getItem("token");

      const formData = new FormData();
      formData.append("id_user", idUser);
      formData.append("nome", nome);
      formData.append("email", email);
      formData.append("emailAntigo", emailAntigo); // Envia o e-mail antigo correto
      formData.append("senha_atual", senhaAtual);
      formData.append("nova_senha", novaSenha);
      formData.append("conf_senha", confirmarSenha);

      if (fotoUri) {
        const filename = fotoUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        formData.append("imagem", {
          uri: fotoUri,
          name: filename || 'perfil.jpg',
          type: type,
        });
      }

      const response = await fetch(`${BASE_URL}/perfil/atualizar`, {
        method: "PUT",
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const dados = await response.json();

      if (response.ok) {
        // Atualiza os dados salvos no celular
        if (dados.novoNome) await AsyncStorage.setItem("nome_user", dados.novoNome);
        if (dados.novoEmail) {
          await AsyncStorage.setItem("email_user", dados.novoEmail);
          setEmailAntigo(dados.novoEmail);
        }
        if (dados.novaFoto) await AsyncStorage.setItem("foto_user", dados.novaFoto);

        setSenhaAtual('');
        setNovaSenha('');
        setConfirmarSenha('');

        Alert.alert("Sucesso", "Perfil atualizado com sucesso!");
      } else {
        Alert.alert("Aviso", dados.resposta || "Erro ao salvar alterações.");
      }
    } catch (erro) {
      console.error("Erro ao atualizar perfil:", erro);
      Alert.alert("Erro", "Falha de conexão com o servidor.");
    } finally {
      setSalvando(false);
    }
  };

  // 4. Logout
  const efetuarLogout = () => {
    Alert.alert("Sair", "Deseja encerrar a sessão?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove(["token", "id_user", "nome_user", "email_user", "foto_user"]);
          const rootNav = navigation.getParent() || navigation;
          rootNav.reset({ index: 0, routes: [{ name: 'LoginScreen' }] });
        }
      }
    ]);
  };

  const renderAvatar = () => {
    if (fotoUri) return <Image source={{ uri: fotoUri }} style={styles.imagemAvatar} />;
    if (fotoServidor && fotoServidor !== "null" && fotoServidor !== "undefined") {
      const caminho = fotoServidor.startsWith('/') ? fotoServidor : '/' + fotoServidor;
      return <Image source={{ uri: `${BASE_URL}${caminho}` }} style={styles.imagemAvatar} />;
    }
    return <Ionicons name="person-outline" size={50} color={CORES.marromEscuro} />;
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
        <Text style={styles.txtTituloTela}>EDITAR MEU PERFIL</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.containerAvatar}>
          <View style={styles.circuloAvatar}>{renderAvatar()}</View>
          <TouchableOpacity style={styles.btnTrocarFoto} onPress={selecionarImagem}>
            <Ionicons name="camera-outline" size={18} color={CORES.branco} />
            <Text style={styles.txtBtnTrocarFoto}>Trocar Foto</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.cardSecao}>
          <Text style={styles.tituloSecao}>INFORMAÇÕES PESSOAIS</Text>
          
          <Text style={styles.label}>Nome</Text>
          <TextInput
            style={styles.input}
            value={nome}
            onChangeText={setNome}
            placeholder="Seu nome"
            placeholderTextColor="#888"
          />

          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="Seu e-mail"
            placeholderTextColor="#888"
          />
        </View>

        <View style={styles.cardSecao}>
          <Text style={styles.tituloSecao}>SEGURANÇA</Text>
          
          <Text style={styles.label}>Senha Atual</Text>
          <TextInput
            style={styles.input}
            value={senhaAtual}
            onChangeText={setSenhaAtual}
            secureTextEntry
            placeholder="Senha atual"
            placeholderTextColor="#888"
          />

          <Text style={styles.label}>Nova Senha</Text>
          <TextInput
            style={styles.input}
            value={novaSenha}
            onChangeText={setNovaSenha}
            secureTextEntry
            placeholder="Nova senha"
            placeholderTextColor="#888"
          />

          <Text style={styles.label}>Confirmar Senha</Text>
          <TextInput
            style={styles.input}
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
            secureTextEntry
            placeholder="Confirme a senha"
            placeholderTextColor="#888"
          />
        </View>

        <View style={styles.fileiraBotoes}>
          <TouchableOpacity 
            style={[styles.btnAcao, { backgroundColor: CORES.dourado }]} 
            onPress={handleSalvarPerfil}
            disabled={salvando}
          >
            {salvando ? (
              <ActivityIndicator color={CORES.marromEscuro} />
            ) : (
              <Text style={[styles.txtBtn, { color: CORES.marromEscuro }]}>Salvar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.btnAcao, { backgroundColor: CORES.vermelho }]} 
            onPress={efetuarLogout}
          >
            <Text style={styles.txtBtn}>Sair</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CORES.fundo },
  containerCentro: { justifyContent: 'center', alignItems: 'center' },
  barraTituloTela: { backgroundColor: CORES.marromDestaque, paddingVertical: 15, alignItems: 'center' },
  txtTituloTela: { color: CORES.branco, fontWeight: 'bold', fontSize: 20, letterSpacing: 2 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  containerAvatar: { alignItems: 'center', marginBottom: 20 },
  circuloAvatar: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: CORES.dourado,
    justify: 'center', alignItems: 'center', overflow: 'hidden', marginBottom: 10,
    borderWidth: 2, borderColor: CORES.dourado,
  },
  imagemAvatar: { width: '100%', height: '100%' },
  btnTrocarFoto: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: CORES.marromDestaque,
    paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, gap: 6,
  },
  txtBtnTrocarFoto: { color: CORES.branco, fontSize: 13, fontWeight: 'bold' },
  cardSecao: {
    backgroundColor: CORES.cinzaCard, borderRadius: 12, padding: 15, marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  tituloSecao: { color: CORES.dourado, fontSize: 14, fontWeight: 'bold', marginBottom: 15, letterSpacing: 1 },
  label: { color: CORES.dourado, fontSize: 13, fontWeight: 'bold', marginBottom: 6, marginTop: 4 },
  input: {
    backgroundColor: CORES.cinzaInput, color: CORES.branco, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, marginBottom: 12,
    borderWidth: 1, borderColor: '#3a3d40',
  },
  fileiraBotoes: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 10 },
  btnAcao: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  txtBtn: { color: CORES.branco, fontSize: 15, fontWeight: 'bold' },
});