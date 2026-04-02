import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Image, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from '@expo/vector-icons'; 
import { Botao } from '../Components/Botoes';

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [verSenha, setVerSenha] = useState(true);

    const navigation = useNavigation();

    async function FazerLogin() {
        try {
            const resposta = await fetch(`http://10.111.9.96:3001/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email, senha: senha })
            });
            
            const resultado = await resposta.json();
            if (resultado.resposta === "true" || resultado.resposta === true) {
                Alert.alert("Sucesso", resultado.mensagem);
                navigation.navigate("HomeScreen");
            } else {
                Alert.alert("Erro", resultado.mensagem || "Credenciais inválidas");
            }
        } catch (error) {
            Alert.alert("Erro de Conexão", "Não foi possível falar com o servidor.");
        }
    }

    return (
        <View style={styles.container}>
            {/* Agrupamento do topo para garantir centralização vertical em relação ao fundo */}
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
        justifyContent: 'center', // Centraliza o conteúdo na tela inteira
    },
    header: {
        alignItems: 'center',
        marginBottom: 20, // Espaço entre o texto "Grano Vita" e o quadrado cinza
    },
    texto: {
        color: '#efac4a',
        fontFamily: 'BebasNeue-Regular',
        fontSize: 80,
        lineHeight: 85, // Ajuste para a fonte não cortar
        marginTop: -10, // Aproxima o texto do ícone de cima
    },
    imagemTopo: { 
        height: 80, 
        width: 300, 
        resizeMode: 'contain',
        marginTop: -10 // Aproxima o "Grano Vita" do nome "CANTINA"
    },
    imagemLogo: { 
        height: 120, 
        width: 120, 
        resizeMode: 'contain' 
    },
    quadrado: {
        backgroundColor: '#b0aead',
        width: '90%',
        paddingVertical: 30, // Espaço interno em cima e embaixo
        paddingHorizontal: 20,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center', // Centraliza os inputs e botões dentro do quadrado
    },
    inputArea: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        width: '100%',
        height: 55, // Aumentei um pouco para caber melhor o texto 18
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
        fontSize: 16 // Diminuí um pouco para não brigar com os inputs
    },
    ouTexto: { 
        marginVertical: 10, 
        color: '#444', 
        fontFamily: 'Montserrat',
        fontSize: 20
    }
});