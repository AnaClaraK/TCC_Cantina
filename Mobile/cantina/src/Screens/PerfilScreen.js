import React from 'react';
import { StyleSheet, Text, View, SafeAreaView } from 'react-native';
import { useNavigation } from "@react-navigation/native";

export default function PerfilScreen() {
    const navigation = useNavigation();

    return (
        /* SafeAreaView evita que o conteúdo suba para cima da barra de status ou entalhe do celular */
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                
                <Text style={styles.textoExemplo}>
                    Sua nova tela está pronta!
                </Text>

            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#242628', // Mantém o fundo padrão do seu app
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    textoExemplo: {
        color: '#efac4a',
        fontFamily: 'BebasNeue-Regular',
        fontSize: 30,
    }
});