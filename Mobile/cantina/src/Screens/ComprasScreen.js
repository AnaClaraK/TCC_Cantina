import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  FlatList, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// PALETA DE CORES DO SEU APP
const CORES = {
  marromEscuro: '#341d04',
  marromDestaque: '#713b00',
  dourado: '#efac4a',
  creme: '#ebd5a6',
  cinza: '#adafb0',
  branco: '#FFFFFF',
  vermelhoDeletar: '#d9534f'
};

export default function ComprasScreen() {
  // Simulando itens adicionados ao carrinho
  const [itensCarrinho, setItensCarrinho] = useState([
    { id: '1', titulo: 'Tamanho P', descricao: 'Marmita (500gramas) - Strogonoff de Frango', preco: 18.60, quantidade: 2 },
    { id: '2', titulo: 'Coca-Cola', descricao: 'Bebida (Lata 350ml)', preco: 5.00, quantidade: 1 },
    { id: '3', titulo: 'Pudim', descricao: 'Doce (Fatia 150g)', preco: 6.00, quantidade: 1 },
  ]);

  // Função para aumentar a quantidade (+ 1)
  const alterarQuantidade = (id, tipo) => {
    setItensCarrinho(itensAtuais =>
      itensAtuais.map(item => {
        if (item.id === id) {
          const novaQuantidade = tipo === 'aumentar' ? item.quantidade + 1 : item.quantidade - 1;
          return { ...item, quantidade: novaQuantidade > 0 ? novaQuantidade : 1 };
        }
        return item;
      })
    );
  };

  // Função para remover o produto do carrinho (Lixeira)
  const removerProduto = (id, nome) => {
    Alert.alert(
      "Remover item",
      `Deseja tirar "${nome}" do seu carrinho?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Remover", 
          style: "destructive", 
          onPress: () => {
            setItensCarrinho(itensAtuais => itensAtuais.filter(item => item.id !== id));
          } 
        }
      ]
    );
  };

  // Calcula o valor total do carrinho dinamicamente
  const calcularSubtotal = () => {
    const total = itensCarrinho.reduce((soma, item) => soma + (item.preco * item.quantidade), 0);
    return total.toFixed(2).replace('.', ',');
  };

  const renderItem = ({ item }) => (
    <View style={styles.cardItem}>
      {/* Imagem do Produto (Placeholder cinza igual ao cardápio) */}
      <View style={styles.containerImagem}>
        <Ionicons name="image" size={45} color={CORES.cinza} />
      </View>

      {/* Detalhes do Produto (Títulos e Textos) */}
      <View style={styles.containerDetalhes}>
        <View style={styles.linhaTituloAcao}>
          <Text style={styles.tituloProduto}>{item.titulo}</Text>
          {/* Botão de Lixeira para Deletar */}
          <TouchableOpacity onPress={() => removerProduto(item.id, item.titulo)} hitSlop={10}>
            <Ionicons name="trash-outline" size={22} color={CORES.dourado} />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.descricaoProduto} numberOfLines={1}>{item.descricao}</Text>

        {/* Linha de Baixo: Controladores de Qtd e o Preço Multiplicado */}
        <View style={styles.linhaPrecoQuantidade}>
          <View style={styles.controladorQtd}>
            <TouchableOpacity 
              style={styles.btnContador} 
              onPress={() => alterarQuantidade(item.id, 'diminuir')}
            >
              <Ionicons name="remove" size={18} color="#000" />
            </TouchableOpacity>
            
            <Text style={styles.txtQuantidade}>{item.quantidade}</Text>
            
            <TouchableOpacity 
              style={styles.btnContador} 
              onPress={() => alterarQuantidade(item.id, 'aumentar')}
            >
              <Ionicons name="add" size={18} color="#000" />
            </TouchableOpacity>
          </View>

          <Text style={styles.precoItem}>
            R$ ${(item.preco * item.quantidade).toFixed(2).replace('.', ',')}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* HEADER IDÊNTICO AO DO CARDÁPIO (AMARELO COM LOGO) */}
      <View style={styles.header}>
        <Image 
          source={require('../../assets/images/logo_m.png')} 
          style={styles.logo} 
        />
      </View>

      {/* TITULO DA TELA */}
      <View style={styles.barraTituloTela}>
        <Text style={styles.txtTituloTela}>CARRINHO</Text>
      </View>

      {/* LISTAGEM DOS ITENS ADICIONADOS */}
      <FlatList
        data={itensCarrinho}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listaConteudo}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.carrinhoVazio}>
            <Ionicons name="cart-outline" size={80} color={CORES.cinza} />
            <Text style={styles.txtCarrinhoVazio}>Seu carrinho está vazio!</Text>
          </View>
        }
      />

      {/* RODAPÉ FIXO: VALORES E BOTÃO DE FINALIZAR */}
      {itensCarrinho.length > 0 && (
        <View style={styles.rodapeCarrinho}>
          <View style={styles.linhaSubtotal}>
            <Text style={styles.txtSubtotalLabel}>Subtotal:</Text>
            <Text style={styles.txtSubtotalValor}>R$ {calcularSubtotal()}</Text>
          </View>

          <TouchableOpacity 
            style={styles.btnFinalizar}
            onPress={() => Alert.alert("Sucesso", "Pedido enviado para a cozinha!")}
            activeOpacity={0.8}
          >
            <Text style={styles.txtBtnFinalizar}>FINALIZAR COMPRA</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CORES.marromEscuro,
  },
  header: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#efac4a',
  },
  logo: {
    width: 170,
    height: 49,
    resizeMode: 'contain',
  },
  barraTituloTela: {
    backgroundColor: CORES.marromDestaque,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)'
  },
  txtTituloTela: {
    color: CORES.branco,
    fontFamily: 'BebasNeue-Regular',
    fontSize: 26,
    letterSpacing: 1.5,
  },
  listaConteudo: {
    padding: 15,
    paddingBottom: 30,
  },
  cardItem: {
    flexDirection: 'row',
    backgroundColor: '#4a2c0a', // Fundo ligeiramente mais claro do marrom para destacar
    borderRadius: 15,
    padding: 12,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  containerImagem: {
    width: 80,
    height: 80,
    backgroundColor: CORES.marromEscuro,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: CORES.cinza,
  },
  containerDetalhes: {
    flex: 1,
    marginLeft: 15,
  },
  linhaTituloAcao: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tituloProduto: {
    color: CORES.branco,
    fontSize: 20,
    fontFamily: 'BebasNeue-Regular',
  },
  descricaoProduto: {
    color: CORES.creme,
    fontSize: 12,
    fontFamily: 'Montserrat',
    marginVertical: 4,
  },
  linhaPrecoQuantidade: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  controladorQtd: {
    flexDirection: 'row',
    backgroundColor: CORES.branco,
    borderRadius: 8,
    alignItems: 'center',
    paddingHorizontal: 4,
    height: 30,
  },
  btnContador: {
    paddingHorizontal: 8,
    height: '100%',
    justifyContent: 'center',
  },
  txtQuantidade: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    paddingHorizontal: 6,
  },
  precoItem: {
    color: CORES.dourado,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Montserrat',
  },
  carrinhoVazio: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  txtCarrinhoVazio: {
    color: CORES.creme,
    fontSize: 16,
    marginTop: 15,
    fontFamily: 'Montserrat',
  },
  rodapeCarrinho: {
    backgroundColor: '#1e1002', // Fundo escuro fixo na base para o fechamento
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  linhaSubtotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  txtSubtotalLabel: {
    color: CORES.branco,
    fontSize: 18,
    fontFamily: 'Montserrat',
  },
  txtSubtotalValor: {
    color: CORES.branco,
    fontSize: 22,
    fontWeight: 'bold',
  },
  btnFinalizar: {
    backgroundColor: CORES.dourado,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txtBtnFinalizar: {
    color: CORES.marromEscuro,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Montserrat',
  }
});