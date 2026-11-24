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

  const textoExibido = oculto ? '•'.repeat(valor.length) : valor;

  const handleTextChange = (textoDigitado) => {
    if (!oculto) {
      onChangeText(textoDigitado);
      return;
    }

    const tamanhoAntigo = valor.length;
    const tamanhoNovo = textoDigitado.length;

    if (tamanhoNovo > tamanhoAntigo) {
      const novoCaractere = textoDigitado.slice(-1);
      const novaSenha = valor + novoCaractere;
      onChangeText(novaSenha);
      setPosicaoCursor({ start: novaSenha.length, end: novaSenha.length });
    } else if (tamanhoNovo < tamanhoAntigo) {
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
        secureTextEntry={false}
        autoCorrect={false}
        autoCapitalize="none"
        caretHidden={false}
        selection={posicaoCursor}
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
