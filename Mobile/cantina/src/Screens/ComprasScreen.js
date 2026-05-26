import React, { useState, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  FlatList, 
  TouchableOpacity, 
  Alert,
  Modal,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';

const CORES = {
  marromEscuro: '#341d04',
  marromDestaque: '#713b00',
  dourado: '#efac4a',
  creme: '#ebd5a6',
  cinza: '#adafb0',
  branco: '#FFFFFF',
};

const IP_SERVIDOR = "10.111.9.96"; 
const URL_API = `http://${IP_SERVIDOR}:3000`;

export default function ComprasScreen({ navigation }) {
  const [itensCarrinho, setItensCarrinho] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [modalComandaVisivel, setModalComandaVisivel] = useState(false);
  const [codigoComandaGerado, setCodigoComandaGerado] = useState('');

  const carregarCarrinho = async () => {
    try {
      const carrinho = await AsyncStorage.getItem('@carrinho');
      const itens = carrinho ? JSON.parse(carrinho) : [];
      
      const itensComHorario = itens.map(item => ({
        ...item,
        horario_retirada: item.horario_retirada || '10:00'
      }));
      
      setItensCarrinho(itensComHorario);
    } catch (e) {
      console.log("Erro ao ler carrinho do storage:", e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      carregarCarrinho();
    }, [])
  );

  const mudarHorarioItem = async (id, texto) => {
    const atualizado = itensCarrinho.map(item => {
      if (item.id_produto === id) {
        return { ...item, horario_retirada: texto };
      }
      return item;
    });
    setItensCarrinho(atualizado);
    await AsyncStorage.setItem('@carrinho', JSON.stringify(atualizado));
  };

  const alterarQuantidade = async (id, tipo) => {
    const atualizado = itensCarrinho.map(item => {
      if (item.id_produto === id) {
        if (tipo === 'aumentar' && item.estoque && item.qtd >= item.estoque) {
          Alert.alert("Limite atingido", "Não há mais unidades disponíveis em estoque.");
          return item;
        }

        const novaQtd = tipo === 'aumentar' ? item.qtd + 1 : item.qtd - 1;
        return {
          ...item,
          qtd: novaQtd > 0 ? novaQtd : 1
        };
      }
      return item;
    });

    setItensCarrinho(atualizado);
    await AsyncStorage.setItem('@carrinho', JSON.stringify(atualizado));
  };

  const removerProduto = async (id, nome) => {
    Alert.alert(
      "Remover item",
      `Deseja tirar "${nome}" do seu carrinho?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            const filtrado = itensCarrinho.filter(
              item => item.id_produto !== id
            );

            setItensCarrinho(filtrado);
            await AsyncStorage.setItem('@carrinho', JSON.stringify(filtrado));
          }
        }
      ]
    );
  };

  const calcularSubtotal = () => {
    const total = itensCarrinho.reduce(
      (soma, item) => soma + (item.preco * item.qtd),
      0
    );
    return total.toFixed(2).replace('.', ',');
  };

  const finalizarAgendamento = async () => {
    if (itensCarrinho.length === 0) return;

    const horarioInvalido = itensCarrinho.some(item => !item.horario_retirada || item.horario_retirada.trim() === '');
    if (horarioInvalido) {
      Alert.alert("Horario Obrigatorio", "Por favor, digite o horario de retirada para todos os itens.");
      return;
    }

    try {
      setCarregando(true);
      
      const idUsuarioSalvo = await AsyncStorage.getItem("id_user");
      const token = await AsyncStorage.getItem("token");

      const idDoUsuarioLogado = idUsuarioSalvo ? parseInt(idUsuarioSalvo) : 1;

      const totalNumerico = itensCarrinho.reduce((soma, item) => soma + (item.preco * item.qtd), 0);
      const quantidadeTotalItens = itensCarrinho.reduce((soma, item) => soma + item.qtd, 0);

      const resposta = await fetch(`${URL_API}/comandas`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_user: idDoUsuarioLogado, 
          carrinho: itensCarrinho,
          valor_total: totalNumerico,
          qtd_total: quantidadeTotalItens 
        })
      });

      const contentType = resposta.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("O servidor respondeu com um formato invalido. Verifique os logs do backend.");
      }

      const dados = await resposta.json();

      if (resposta.ok && dados.sucesso) {
        setCodigoComandaGerado(dados.codigo_comanda);
        
        await AsyncStorage.removeItem('@carrinho');
        setItensCarrinho([]);

        setModalComandaVisivel(true);
      } else {
        throw new Error(dados.erro || "Erro ao processar pedido.");
      }

    } catch (erro) {
      console.error(erro);
      Alert.alert("Erro ao Processar", erro.message || "Nao foi possivel enviar o carrinho para o banco do PDV.");
    } finally {
      setCarregando(false);
    }
  };

  const renderItem = ({ item }) => {
    const fonteImagem = item.imagem && (item.imagem.uri || typeof item.imagem === 'number')
      ? item.imagem 
      : require('../../assets/imagens/img_ntf.png');

    return (
      <View style={styles.cardItem}>
        <View style={styles.containerImagem}>
          <Image 
            source={fonteImagem}
            style={styles.imagemProduto}
            resizeMode="cover"
          />
        </View>

        <View style={styles.containerDetalhes}>
          <View style={styles.linhaTituloAcao}>
            <Text style={styles.tituloProduto}>{item.nome}</Text>
            
            <TouchableOpacity onPress={() => removerProduto(item.id_produto, item.nome)} hitSlop={10}>
              <Ionicons name="trash-outline" size={22} color={CORES.dourado} />
            </TouchableOpacity>
          </View>

          <View style={styles.boxInputHorario}>
            <Text style={styles.labelHorario}>Horario de Retirada:</Text>
            <TextInput
              style={styles.inputHorario}
              placeholder="Ex: 10:15"
              placeholderTextColor={CORES.cinza}
              value={item.horario_retirada}
              onChangeText={(texto) => mudarHorarioItem(item.id_produto, texto)}
            />
          </View>

          <View style={styles.linhaPrecoQuantidade}>
            <View style={styles.controladorQtd}>
              <TouchableOpacity 
                style={styles.btnContador} 
                onPress={() => alterarQuantidade(item.id_produto, 'diminuir')}
              >
                <Ionicons name="remove" size={18} color="#000" />
              </TouchableOpacity>

              <Text style={styles.txtQuantidade}>{item.qtd}</Text>

              <TouchableOpacity 
                style={styles.btnContador} 
                onPress={() => alterarQuantidade(item.id_produto, 'aumentar')}
              >
                <Ionicons name="add" size={18} color="#000" />
              </TouchableOpacity>
            </View>

            <Text style={styles.precoItem}>
              R$ {(item.preco * item.qtd).toFixed(2).replace('.', ',')}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require('../../assets/images/logo_m.png')}
          style={styles.logo}
        />
      </View>

      <View style={styles.barraTituloTela}>
        <Text style={styles.txtTituloTela}>CARRINHO</Text>
      </View>

      <FlatList
        data={itensCarrinho}
        keyExtractor={item => String(item.id_produto)}
        renderItem={renderItem}
        contentContainerStyle={styles.listaConteudo}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.carrinhoVazio}>
            <Ionicons name="cart-outline" size={80} color={CORES.cinza} />
            <Text style={styles.txtCarrinhoVazio}>Seu carrinho esta vazio!</Text>
          </View>
        }
      />

      {itensCarrinho.length > 0 && (
        <View style={styles.rodapeCarrinho}>
          <View style={styles.linhaSubtotal}>
            <Text style={styles.txtSubtotalLabel}>Subtotal:</Text>
            <Text style={styles.txtSubtotalValor}>R$ {calcularSubtotal()}</Text>
          </View>

          <TouchableOpacity 
            style={styles.btnFinalizar}
            onPress={finalizarAgendamento}
            activeOpacity={0.8}
            disabled={carregando}
          >
            {carregando ? (
              <ActivityIndicator size="small" color={CORES.marromEscuro} />
            ) : (
              <Text style={styles.txtBtnFinalizar}>AGENDAR RETIRADA</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalComandaVisivel}
        onRequestClose={() => setModalComandaVisivel(false)}
      >
        <View style={styles.fundoModal}>
          <View style={styles.conteudoModal}>
            <Ionicons name="checkmark-circle" size={54} color="#4CD964" style={{ marginBottom: 10 }} />
            
            <Text style={styles.tituloModal}>CODIGO DE COMPRA</Text>
            <Text style={styles.subtituloModal}>Apresente o codigo de texto ou o QR Code ao caixa para computar seus produtos e pagar.</Text>
            
            <View style={styles.boxQrCode}>
              {codigoComandaGerado ? (
                <QRCode
                  value={codigoComandaGerado}
                  size={170}
                  backgroundColor='#FFF'
                  color='#000'
                />
              ) : null}
            </View>

            <Text style={styles.textoCodigoComanda}>{codigoComandaGerado}</Text>

            <TouchableOpacity 
              style={styles.btnFecharModal}
              onPress={() => {
                setModalComandaVisivel(false);
                navigation.navigate('Pedidos');
              }}
            >
              <Text style={styles.txtFecharModal}>CONCLUIDO</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#4a2c0a', 
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
    overflow: 'hidden'
  },
  imagemProduto: {
    width: '100%',
    height: '100%',
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
  boxInputHorario: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 6,
    borderRadius: 8
  },
  labelHorario: {
    color: CORES.creme,
    fontSize: 12,
    marginRight: 6,
    fontFamily: 'Montserrat'
  },
  inputHorario: {
    flex: 1,
    color: CORES.dourado,
    fontSize: 13,
    fontWeight: 'bold',
    paddingVertical: 0,
    height: 22,
    borderBottomWidth: 1,
    borderBottomColor: CORES.dourado
  },
  linhaPrecoQuantidade: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
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
    backgroundColor: '#1e1002',
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
  },
  fundoModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  conteudoModal: {
    width: '90%',
    backgroundColor: '#4a2c0a',
    borderRadius: 24,
    padding: 25,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: CORES.dourado,
  },
  tituloModal: {
    color: CORES.branco,
    fontSize: 24,
    fontFamily: 'BebasNeue-Regular',
    letterSpacing: 1,
    marginBottom: 8,
  },
  subtituloModal: {
    color: CORES.creme,
    fontSize: 13,
    textAlign: 'center',
    fontFamily: 'Montserrat',
    lineHeight: 18,
    marginBottom: 20,
  },
  boxQrCode: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 16,
  },
  textoCodigoComanda: {
    color: CORES.dourado,
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 3,
    fontFamily: 'Montserrat',
    marginTop: 15,
    marginBottom: 20,
  },
  btnFecharModal: {
    backgroundColor: CORES.dourado,
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  txtFecharModal: {
    color: CORES.marromEscuro,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Montserrat',
  },
});