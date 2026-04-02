import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput, Alert, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
import { Botao } from '../Components/Botoes';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';

export default function CadastroScreen() {
    // Hooks para todos os campos da imagem
    const [nome, setNome] = useState("");
    const [cpf, setCpf] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [confirmaSenha, setConfirmaSenha] = useState("");
    
    const [verSenha, setVerSenha] = useState(true);
    const [verConfirma, setVerConfirma] = useState(true);

    const navigation = useNavigation();

    async function CriarCadastro() {
        // Validações básicas
        if (nome.length < 3) return Alert.alert("Erro", "Digite seu nome completo");
        if (cpf.length < 11) return Alert.alert("Erro", "CPF inválido");
        if (!email.includes("@")) return Alert.alert("Erro", "E-mail inválido");
        if (senha.length < 5) return Alert.alert("Erro", "A senha deve ter no mínimo 5 caracteres");
        if (senha !== confirmaSenha) return Alert.alert("Erro", "As senhas não coincidem!");

        try {
            const resposta = await fetch(`http://10.111.9.96:3001/cadastrar`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nome: nome,
                    cpf: cpf,
                    email: email,
                    senha: senha
                })
            });
    
            const resultado = await resposta.json();
    
            if (resultado.resposta == "true" || resultado.resposta == true) {
                Alert.alert("Sucesso", "Cadastro realizado com sucesso!");
                navigation.navigate("LoginScreen");
            } else {
                Alert.alert("Erro", resultado.mensagem || "Erro ao cadastrar");
            }
        } catch (error) {
            Alert.alert("Erro", "Não foi possível conectar ao servidor.");
        }
    }

    return (
        // ScrollView é importante para telas com muitos inputs (o teclado não tampa o botão)
        <ScrollView contentContainerStyle={styles.container}>
            <StatusBar style="light" />
            
            <View style={styles.header}>
                <Image source={require('../../assets/images/logo.png')} style={styles.imagemLogo} />
                <Text style={styles.texto}>CANTINA</Text>
                <Image source={require('../../assets/images/logo_c.png')} style={styles.imagemTopo} />
            </View>

            <View style={styles.quadrado}>
                {/* NOME */}
                <View style={styles.inputArea}>
                    <Ionicons name="person-outline" size={24} color="#eeaf55" />
                    <TextInput style={styles.inputInterno} placeholder="Nome completo" onChangeText={setNome} value={nome} />
                </View>

                {/* CPF */}
                <View style={styles.inputArea}>
                    <Ionicons name="document-text-outline" size={24} color="#eeaf55" />
                    <TextInput style={styles.inputInterno} placeholder="CPF" keyboardType="numeric" onChangeText={setCpf} value={cpf} />
                </View>

                {/* EMAIL */}
                <View style={styles.inputArea}>
                    <Ionicons name="mail-outline" size={24} color="#eeaf55" />
                    <TextInput style={styles.inputInterno} placeholder="E-mail" onChangeText={setEmail} value={email} />
                </View>

                {/* SENHA */}
                <View style={styles.inputArea}>
                    <Ionicons name="lock-closed-outline" size={24} color="#eeaf55" />
                    <TextInput style={styles.inputInterno} placeholder="Senha" secureTextEntry={verSenha} onChangeText={setSenha} value={senha} />
                    <TouchableOpacity onPress={() => setVerSenha(!verSenha)}>
                        <Ionicons name={verSenha ? "eye-off-outline" : "eye-outline"} size={22} color="#888" />
                    </TouchableOpacity>
                </View>

                {/* REPITA A SENHA */}
                <View style={styles.inputArea}>
                    <Ionicons name="lock-closed-outline" size={24} color="#eeaf55" />
                    <TextInput style={styles.inputInterno} placeholder="Repita a senha" secureTextEntry={verConfirma} onChangeText={setConfirmaSenha} value={confirmaSenha} />
                    <TouchableOpacity onPress={() => setVerConfirma(!verConfirma)}>
                        <Ionicons name={verConfirma ? "eye-off-outline" : "eye-outline"} size={22} color="#888" />
                    </TouchableOpacity>
                </View>

                <Botao texto="CADASTRAR" acao={CriarCadastro} tamFonte={22} styleExtra={{ marginTop: 10 }} />
            </View>

            <TouchableOpacity onPress={() => navigation.navigate("LoginScreen")} style={{ marginTop: 20 }}>
                <Text style={{ color: '#efac4a', fontFamily: 'Montserrat' }}>Já tem uma conta? Faça login</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#242628',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40
    },
    header: { alignItems: 'center', marginBottom: 15 },
    texto: { color: '#efac4a', fontFamily: 'BebasNeue-Regular', fontSize: 70, lineHeight: 75 },
    imagemTopo: { height: 60, width: 250, resizeMode: 'contain', marginTop: -10 },
    imagemLogo: { height: 100, width: 100, resizeMode: 'contain' },
    quadrado: {
        backgroundColor: '#b0aead',
        width: '90%',
        padding: 20,
        borderRadius: 25,
        alignItems: 'center',
    },
    inputArea: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        width: '100%',
        height: 50,
        borderRadius: 15,
        alignItems: 'center',
        paddingHorizontal: 12,
        marginBottom: 12,
    },
    inputInterno: {
        flex: 1,
        marginLeft: 10,
        fontFamily: 'Montserrat',
        fontSize: 16,
        color: '#333',
    },
});