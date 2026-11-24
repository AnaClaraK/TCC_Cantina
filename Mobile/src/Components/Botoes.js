import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from "react-native";

const Botao = ({ texto, acao, tamFonte }) => {
    return (
        <TouchableOpacity onPress={acao} style={meuCss.botao}>
            <Text style={[meuCss.textoBotao, tamFonte ? { fontSize: tamFonte } : null]}>
                {texto}
            </Text>
        </TouchableOpacity>
    );
};

const meuCss = StyleSheet.create({
    botao: {
        width: 310,
        height: 45,
        backgroundColor: '#eeaf55',
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginVertical: 7,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    textoBotao: {
        fontFamily: 'Montserrat', 
        color: '#ffffff',
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

export { Botao };
