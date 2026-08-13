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
import Constants from 'expo-constants';
import { Botao } from '../Components/Botoes';

// IP Dinâmico do Expo Go
const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.developer?.manifest?.debuggerHost;
const IP_SERVIDOR = hostUri ? hostUri.split(':')[0] : '10.111.9.55';
const URL_API = `http://${IP_SERVIDOR}:3000`;

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [verSenha, setVerSenha] = useState(true);
    const [carregando, setCarregando] = useState(false);

    const navigation = useNavigation();

    const FazerLogin = async () => {
        const urlAPI = `${URL_API}/logar`;
        
        console.log("\n========================================");
        console.log("🚀 [LOGIN] Botão clicado!");
        console.log(`📡 Conectando em: ${urlAPI}`);
        console.log(`📧 Email: "${email}"`);
        console.log("========================================");

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

            console.log(`📥 Status HTTP: ${resposta.status}`);
            
            const dados = await resposta.json();
            console.log("📦 Resposta do servidor:", dados);
        
            if (dados.resposta === "true") {
                console.log("✅ Login realizado com sucesso! Gravando sessão...");
                
                if (dados.token) await AsyncStorage.setItem("token", dados.token); 
                if (dados.id_user) await AsyncStorage.setItem("id_user", String(dados.id_user));
                if (dados.nome) await AsyncStorage.setItem("nome_user", dados.nome);
                await AsyncStorage.setItem("email_user", dados.email || email);
                await AsyncStorage.setItem("senha_user", String(senha));
                if (dados.foto) await AsyncStorage.setItem("foto_user", dados.foto);
                const emailSalvo = await AsyncStorage.getItem("email_user");
const senhaSalva = await AsyncStorage.getItem("senha_user");

if (emailSalvo) setEmail(emailSalvo);
if (senhaSalva) setSenha(senhaSalva);

                console.log("🔀 Redirecionando para MainApp...");
                
                // Redireciona para o TabNavigator registrado no App.js como "MainApp"
                navigation.replace("MainApp"); 
            } else {
                Alert.alert("Erro de Autenticação", dados.mensagem || "Usuário ou senha inválidos.");
            }
        
        } catch (erro) {
            console.error("🛑 ERRO DE CONEXÃO:", erro.message);
            Alert.alert(
                "Falha na Rede", 
                "Não foi possível conectar ao servidor."
            );
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
                {/* Campo E-mail */}
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

                {/* Campo Senha */}
                <View style={styles.inputArea}>
                    <Ionicons name="lock-closed-outline" size={28} color="#eeaf55" />
                    <TextInput 
                        style={styles.inputInterno} 
                        placeholder="Senha"
                        placeholderTextColor="#888"
                        onChangeText={setSenha}
                        value={senha}
                        secureTextEntry={verSenha}
                    />
                    <TouchableOpacity onPress={() => setVerSenha(!verSenha)}>
                        <Ionicons 
                            name={verSenha ? "eye-off-outline" : "eye-outline"} 
                            size={24} 
                            color="#888" 
                        />
                    </TouchableOpacity>
                </View>

                {/* Botão Esqueceu a Senha */}
                <TouchableOpacity 
                    style={styles.esqueceuBtn}
                    onPress={() => {
                        console.log("👉 [NAVEGAÇÃO] Indo para RecuperarScreen");
                        navigation.navigate("RecuperarScreen");
                    }}
                >
                    <Text style={styles.esqueceuTexto}>Esqueceu a senha?</Text>
                </TouchableOpacity>

                {/* Botão Entrar */}
                {carregando ? (
                    <ActivityIndicator size="large" color="#efac4a" style={{ marginVertical: 15 }} />
                ) : (
                    <Botao texto="ENTRAR" acao={FazerLogin} tamFonte={20} />
                )}

                

                {/* Botão Cadastre-se */}
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
    ouTexto: { 
        marginVertical: 10, 
        color: '#444', 
        fontFamily: 'Montserrat',
        fontSize: 20
    }
});