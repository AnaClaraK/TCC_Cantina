import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Image, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from '@expo/vector-icons'; 
import { Botao } from '../Components/Botoes';


export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [verSenha, setVerSenha] = useState(true);

    const navigation = useNavigation();

   
    const FazerLogin = async () => {
        const urlAPI = "http://10.111.9.34:3000/logar";
        
        console.log("\n========================================");
        console.log("🚀 [LOGIN] Botão clicado!");
        console.log(`📡 Tentando conectar em: ${urlAPI}`);
        console.log(`📧 Dados enviados -> Email: "${email}" | Senha: "${senha ? '******' : 'VAZIA'}"`);
        console.log("========================================");

        if (!email.trim() || !senha.trim()) {
            console.warn("⚠️ [AVISO] Usuário tentou logar com campos em branco.");
            Alert.alert("Campos Obrigatórios", "Por favor, preencha o e-mail e a senha.");
            return;
        }

        try {
            console.log("⏳ Aguardando resposta do servidor...");
            const resposta = await fetch(urlAPI, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: email,
                    senha: senha,
                }),
            });

            console.log(`📥 Resposta HTTP recebida! Status: ${resposta.status} (${resposta.statusText})`);
            
            const dados = await resposta.json();
            console.log("📦 Corpo da resposta da API:", dados);
        
            if (dados.resposta === "true") {
                console.log("✅ [SUCESSO] Login validado pelo servidor! Gravando dados de sessão...");
                
                // Grava todas as informações necessárias retornadas pelo back corrigido
                await AsyncStorage.setItem("token", dados.token); 
                await AsyncStorage.setItem("id_user", String(dados.id_user));
                await AsyncStorage.setItem("nome_user", dados.nome);

                console.log(`💾 Armazenado com Sucesso -> ID: ${dados.id_user} | Nome: ${dados.nome}`);
                console.log("🔀 Redirecionando para a tela MainApp.");
                
                navigation.replace("MainApp"); 
            } else {
                console.log(`❌ [NEGADO] Servidor recusou as credenciais. Motivo: ${dados.mensagem}`);
                Alert.alert("Erro de Autenticação", dados.mensagem || "Usuário ou senha inválidos.");
            }
        
        } catch (erro) {
            console.log("\n🛑====== ERRO CRÍTICO DE CONEXÃO ======");
            console.error(" Detalhes técnicos do erro:", erro.message);
            console.log("=========================================\n");

            Alert.alert(
                "Falha na Rede", 
                "Não foi possível conectar ao servidor.\n\nVerifique se o servidor está ligado e configurado na rede local."
            );
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

                <TouchableOpacity style={styles.esqueceuBtn}>
                    <Text style={styles.esqueceuTexto}>Esqueceu a senha?</Text>
                </TouchableOpacity>

                <Botao texto="ENTRAR" acao={FazerLogin} tamFonte={20} />

                <Text style={styles.ouTexto}>ou</Text>

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