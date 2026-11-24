import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  Image, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from '@expo/vector-icons'; 
import { Botao } from '../Components/Botoes';
import { BASE_URL } from '../../config';
import CampoSenhaProtegida from '../Components/CampoSenhaProtegida';

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [verSenha, setVerSenha] = useState(true);
    const [carregando, setCarregando] = useState(false);
    const [senhaEmFoco, setSenhaEmFoco] = useState(false);

    const navigation = useNavigation();

    const FazerLogin = async () => {
        const urlAPI = `${BASE_URL}/logar`;

        if (!email.trim() || !senha.trim()) {
            Alert.alert("Campos Obrigatórios", "Por favor, preencha o e-mail e a senha.");
            return;
        }

        try {
            setCarregando(true);

            const resposta = await fetch(urlAPI, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: email.trim(),
                    senha: senha,
                }),
            });

            const dados = await resposta.json();

            if (dados.resposta === "true") {
                const idLogado = dados.id_user ? String(dados.id_user) : "";
                const donoFotoSalva = await AsyncStorage.getItem("foto_owner_id");

                if (dados.foto) {
                    await AsyncStorage.setItem("foto_user", dados.foto);
                    if (idLogado) await AsyncStorage.setItem("foto_owner_id", idLogado);
                } else if (idLogado && donoFotoSalva && donoFotoSalva !== idLogado) {
                    await AsyncStorage.multiRemove(["foto_user", "foto_owner_id"]);
                }

                if (dados.token) await AsyncStorage.setItem("token", dados.token); 
                if (idLogado) await AsyncStorage.setItem("id_user", idLogado);
                if (dados.nome) await AsyncStorage.setItem("nome_user", dados.nome);
                await AsyncStorage.setItem("email_user", dados.email || email);
                await AsyncStorage.setItem("senha_user", String(senha));

                navigation.replace("MainApp"); 
            } else {
                Alert.alert("Erro de Autenticação", dados.mensagem || "Usuário ou senha inválidos.");
            }
        } catch (erro) {
            Alert.alert("Falha na Rede", "Não foi possível conectar ao servidor.");
        } finally {
            setCarregando(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Image source={require('../../assets/images/logo.png')} style={styles.imagemLogo} />
                <Text style={styles.texto}>CANTINA</Text>
                <Image source={require('../../assets/images/logo_c.png')} style={styles.imagemTopo} />
            </View>

            <View style={styles.quadrado}>
                <View style={styles.inputArea}>
                    <Ionicons name="mail-outline" size={28} color="#eeaf55" />
                    <TextInput 
                        style={styles.inputInterno} 
                        placeholder="E-mail"
                        placeholderTextColor="#888"
                        onChangeText={setEmail}
                        value={email}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                <View style={[styles.inputArea, senhaEmFoco && styles.inputAreaFoco]}>
                    <Ionicons name="lock-closed-outline" size={28} color="#eeaf55" />
                    <CampoSenhaProtegida
                        valor={senha}
                        onChangeText={setSenha}
                        placeholder="Senha"
                        oculto={verSenha}
                        setOculto={setVerSenha}
                        inputStyle={[styles.inputInterno, { marginLeft: 0 }]}
                        fontSize={18}
                        onFocus={() => setSenhaEmFoco(true)}
                        onBlur={() => setSenhaEmFoco(false)}
                    />
                </View>

                <TouchableOpacity 
                    style={styles.esqueceuBtn}
                    onPress={() => navigation.navigate("RecuperarScreen")}
                >
                    <Text style={styles.esqueceuTexto}>Esqueceu a senha?</Text>
                </TouchableOpacity>

                {carregando ? (
                    <ActivityIndicator size="large" color="#efac4a" style={{ marginVertical: 15 }} />
                ) : (
                    <Botao texto="ENTRAR" acao={FazerLogin} tamFonte={20} />
                )}

                <Botao 
                    texto="CADASTRE-SE" 
                    acao={() => navigation.navigate("CadastroScreen")} 
                    tamFonte={18}
                    styleExtra={{ backgroundColor: '#eeaf55' }} 
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#242628',
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 20, 
    },
    texto: {
        color: '#efac4a',
        fontFamily: 'BebasNeue-Regular',
        fontSize: 80,
        lineHeight: 85, 
        marginTop: -10, 
    },
    imagemTopo: { 
        height: 80, 
        width: 300, 
        resizeMode: 'contain',
        marginTop: -10 
    },
    imagemLogo: { 
        height: 120, 
        width: 120, 
        resizeMode: 'contain' 
    },
    quadrado: {
        backgroundColor: '#b0aead',
        width: '90%',
        paddingVertical: 30, 
        paddingHorizontal: 20,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
    inputAreaFoco: { borderColor: "#efac4a", borderWidth: 2 },
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
        fontSize: 18,
    },
    esqueceuBtn: { 
        alignSelf: 'flex-end', 
        marginBottom: 25 
    },
    esqueceuTexto: { 
        color: '#3b5998', 
        textDecorationLine: 'underline',
        fontSize: 16 
    },
});
