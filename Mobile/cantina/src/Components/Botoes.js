import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from "react-native";

const Botao = ({ texto, acao, tamFonte }) => {
    return (
        <TouchableOpacity onPress={acao} style={meuCss.botao}>
            {/* Usamos um Array no style para que, se você passar 'tamFonte' via props, 
              ele substitua o valor padrão de 20 
            */}
            <Text style={[meuCss.textoBotao, tamFonte ? { fontSize: tamFonte } : null]}>
                {texto}
            </Text>
        </TouchableOpacity>
    );
};

const meuCss = StyleSheet.create({
    botao: {
        width: 310,
        height: 45, // Aumentei um pouco (de 37 para 45) para o texto de 20px respirar melhor
        backgroundColor: '#eeaf55',
        borderRadius: 12,
        alignItems: "center",     // Centraliza horizontalmente
        justifyContent: "center",    // Centraliza verticalmente (essencial!)
        marginVertical: 7,       // Dá um espaço entre um botão e outro
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    textoBotao: {
        fontFamily: 'Montserrat', 
        color: '#ffffff',
        fontSize: 20,
        fontWeight: 'bold',       // Deixa o texto marcante como na foto
        textAlign: 'center',
    },
});

export { Botao };