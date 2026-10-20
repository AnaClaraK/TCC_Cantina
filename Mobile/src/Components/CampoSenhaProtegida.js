import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CampoSenhaProtegida({
  valor,
  onChangeText,
  placeholder,
  oculto,
  setOculto,
  inputStyle,
  fontSize,
  onFocus,
  onBlur,
}) {
  const [posicaoCursor, setPosicaoCursor] = useState({ start: valor.length, end: valor.length });

  // Transforma instantaneamente todos os caracteres em bolinhas quando oculta
  const textoExibido = oculto ? '•'.repeat(valor.length) : valor;

  const handleTextChange = (textoDigitado) => {
    if (!oculto) {
      onChangeText(textoDigitado);
      return;
    }

    // Calcula a diferença para atualizar a senha real
    const tamanhoAntigo = valor.length;
    const tamanhoNovo = textoDigitado.length;

    if (tamanhoNovo > tamanhoAntigo) {
      // Caractere adicionado
      const novoCaractere = textoDigitado.slice(-1);
      const novaSenha = valor + novoCaractere;
      onChangeText(novaSenha);
      setPosicaoCursor({ start: novaSenha.length, end: novaSenha.length });
    } else if (tamanhoNovo < tamanhoAntigo) {
      // Caractere apagado
      const novaSenha = valor.slice(0, tamanhoNovo);
      onChangeText(novaSenha);
      setPosicaoCursor({ start: novaSenha.length, end: novaSenha.length });
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, inputStyle, { fontSize: fontSize || 18 }]}
        value={textoExibido}
        onChangeText={handleTextChange}
        placeholder={placeholder}
        placeholderTextColor="#888"
        secureTextEntry={false} // Desativa a mascara nativa bugada do Android
        autoCorrect={false}
        autoCapitalize="none"
        caretHidden={false} // Mantém o cursor '|' sempre visível
        selection={posicaoCursor} // Mantém o cursor no final do texto
        onSelectionChange={(e) => setPosicaoCursor(e.nativeEvent.selection)}
        onFocus={(e) => {
          setPosicaoCursor({ start: valor.length, end: valor.length });
          if (onFocus) onFocus(e);
        }}
        onBlur={onBlur}
      />

      <TouchableOpacity
        onPress={() => setOculto(!oculto)}
        style={styles.iconeArea}
      >
        <Ionicons
          name={oculto ? "eye-off-outline" : "eye-outline"}
          size={24}
          color="#888"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    color: '#333',
    fontFamily: 'Montserrat',
  },
  iconeArea: {
    padding: 5,
  },
});