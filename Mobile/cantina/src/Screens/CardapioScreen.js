import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from "@react-navigation/native";
import NotificacaoModal from '../Components/Modal'; // O seu componente que você editou

export default function CardapioScreen() {
    const [modalVisivel, setModalVisivel] = useState(true);
    const navigation = useNavigation();

    useEffect(() => {
        const verificarNotificacao = async () => {
            try {
                const aceitou = await AsyncStorage.getItem('@notificacao_aceita');
                if (aceitou !== 'true') {
                    setModalVisivel(true);
                }
            } catch (e) {
                setModalVisivel(true);
            }
        };
        verificarNotificacao();
    }, []);

    const fazerLogout = async () => {
        try {
            await AsyncStorage.removeItem('@usuario_logado');
            navigation.replace("LoginScreen");
        } catch (error) {
            console.log("Erro ao sair:", error);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={fazerLogout} style={styles.botaoSair}>
                    <Ionicons name="log-out-outline" size={30} color="#efac4a" />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <Text style={{color: '#fff'}}>Conteúdo do Cardápio...</Text>
            </View>

            {/* AQUI ESTÁ A MUDANÇA: Chamando o componente externo */}
            <NotificacaoModal 
                visivel={modalVisivel} 
                fechar={() => setModalVisivel(false)} 
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#242628' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
        backgroundColor: '#1e1f21'
    },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});