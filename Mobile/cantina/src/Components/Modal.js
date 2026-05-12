import React, { useState } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function NotificacaoModal({ visivel, fechar }) {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visivel}
      onRequestClose={fechar}
    >
      <View style={styles.fundoEscuro}>
        <View style={styles.modalContainer}>
          
          {/* Botão de Fechar (X) */}
          <TouchableOpacity style={styles.botaoFechar} onPress={fechar}>
            <Ionicons name="close" size={28} color="#242628" />
          </TouchableOpacity>

          <Text style={styles.titulo}>
          Ative as notificações para receber avisos sobre novidades, notícias e atualizações assim que acontecerem.
          </Text>


          {/* Área da Logo (Quadrado Escuro) */}
          <View style={styles.areaLogo}>
          <Text style={styles.texto}>
                CANTINA
            </Text>
             <Image 
                source={require('../../assets/images/logo_c.png')}
                style={styles.imagemLogo}
                resizeMode="contain"
             />
          </View>

          {/* Botões de Ação */}
          <TouchableOpacity style={[styles.botao, styles.botaoPermitir]} onPress={fechar}>
            <Text style={styles.textoBotaoPermitir}>Permitir</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.botao, styles.botaoNegar]} onPress={fechar}>
            <Text style={styles.textoBotaoNegar}>Não permitir</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fundoEscuro: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)', // Deixa o fundo atrás meio transparente
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#F5F5F5', // Cor clara do fundo do card
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    elevation: 10,
  },
  botaoFechar: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  titulo: {
    color: '#444444',
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'Montserrat', // Ou a fonte que você estiver usando
    fontWeight: 'bold',
    marginBottom: 20,
    lineHeight: 22,
  },
  texto: {
        color: '#efac4a',
        fontFamily: 'BebasNeue-Regular',
        fontSize: 50,
        marginTop: -10, // Aproxima o texto do ícone de cima
        marginBottom: -20,
        fontWeight: '100',
    },
  areaLogo: {
    backgroundColor: '#242628',
    width: 300,
    height: 280,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  imagemLogo: {
    width: '80%',
    height: 80,
  },
  botao: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  botaoPermitir: {
    backgroundColor: '#efac4a',
  },
  botaoNegar: {
    backgroundColor: '#242628',
  },
  textoBotaoPermitir: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  textoBotaoNegar: {
    color: '#FFF',
    fontSize: 18,
  },
});