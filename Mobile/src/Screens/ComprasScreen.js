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
  TextInput,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import { Calendar, LocaleConfig } from 'react-native-calendars';

// Configuração em Português para o Calendário
LocaleConfig.locales['pt-br'] = {
  monthNames: ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],
  monthNamesShort: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'],
  dayNames: ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'],
  dayNamesShort: ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'],
  today: 'Hoje'
};
LocaleConfig.defaultLocale = 'pt-br';

const CORES = {
  marromEscuro: '#341d04',
  marromDestaque: '#713b00',
  dourado: '#efac4a',
  creme: '#ebd5a6',
  cinza: '#adafb0',
  branco: '#FFFFFF',
};

const OPCOES_PAGAMENTO = [
  { id: 'DINHEIRO', label: 'Dinheiro', icon: 'cash-outline' },
  { id: 'PIX', label: 'PIX', icon: 'qr-code-outline' },
  { id: 'CREDITO', label: 'Cartão de Crédito', icon: 'card-outline' },
  { id: 'DEBITO', label: 'Cartão de Débito', icon: 'card-outline' },
];

const IP_SERVIDOR = "10.111.9.34"; 
const URL_API = `http://${IP_SERVIDOR}:3000`;

export default function ComprasScreen({ navigation }) {
  const [itensCarrinho, setItensCarrinho] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [modalComandaVisivel, setModalComandaVisivel] = useState(false);
  const [codigoComandaGerado, setCodigoComandaGerado] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('');

  // Estados para o Modal de Calendário
  const [modalCalendarioVisivel, setModalCalendarioVisivel] = useState(false);
  const [itemSelecionadoParaData, setItemSelecionadoParaData] = useState(null);

  const dataHoje = new Date().toISOString().split('T')[0];

  const carregarCarrinho = async () => {
    try {
      const carrinho = await AsyncStorage.getItem('@carrinho');
      const itens = carrinho ? JSON.parse(carrinho) : [];
      
      const itensComAgendamento = itens.map(item => ({
        ...item,
        horario_retirada: item.horario_retirada || '10:00',
        data_agendamento: item.data_agendamento || dataHoje
      }));
      
      setItensCarrinho(itensComAgendamento);
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

  const selecionarDataProduto = (day) => {
    if (!itemSelecionadoParaData) return;

    const atualizado = itensCarrinho.map(item => {
      if (item.id_produto === itemSelecionadoParaData) {
        return { ...item, data_agendamento: day.dateString };
      }
      return item;
    });

    setItensCarrinho(atualizado);
    AsyncStorage.setItem('@carrinho', JSON.stringify(atualizado));
    setModalCalendarioVisivel(false);
    setItemSelecionadoParaData(null);
  };

  const abrirCalendarioPara = (idProduto) => {
    setItemSelecionadoParaData(idProduto);
    setModalCalendarioVisivel(true);
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

  const formatarDataExibicao = (dataISO) => {
    if (!dataISO) return 'Selecionar Data';
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const finalizarAgendamento = async () => {
    if (itensCarrinho.length === 0) return;

    const horarioInvalido = itensCarrinho.some(item => !item.horario_retirada || item.horario_retirada.trim() === '');
    if (horarioInvalido) {
      Alert.alert("Horário Obrigatório", "Por favor, digite o horário de retirada para todos os itens.");
      return;
    }

    if (!formaPagamento) {
      Alert.alert("Forma de Pagamento", "Por favor, selecione como deseja pagar antes de agendar.");
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
          qtd_total: quantidadeTotalItens,
          forma_pagamento: formaPagamento
        })
      });

      const contentType = resposta.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("O servidor respondeu com um formato inválido. Verifique os logs do backend.");
      }

      const dados = await resposta.json();

      if (resposta.ok && dados.sucesso) {
        setCodigoComandaGerado(dados.codigo_comanda);
        
        await AsyncStorage.removeItem('@carrinho');
        setItensCarrinho([]);
        setFormaPagamento('');

        setModalComandaVisivel(true);
      } else {
        throw new Error(dados.erro || "Erro ao processar pedido.");
      }

    } catch (erro) {
      console.error(erro);
      Alert.alert("Erro ao Processar", erro.message || "Não foi possível enviar o carrinho para o banco do PDV.");
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

          {/* Seletor de Data com Calendário */}
          <TouchableOpacity 
            style={styles.boxSeletorData} 
            onPress={() => abrirCalendarioPara(item.id_produto)}
          >
            <Ionicons name="calendar-outline" size={16} color={CORES.dourado} />
            <Text style={styles.txtDataAgendada}>
              Dia: {formatarDataExibicao(item.data_agendamento)}
            </Text>
          </TouchableOpacity>

          {/* Campo de Horário */}
          <View style={styles.boxInputHorario}>
            <Ionicons name="time-outline" size={16} color={CORES.dourado} style={{ marginRight: 4 }} />
            <Text style={styles.labelHorario}>Hora:</Text>
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
            <Text style={styles.txtCarrinhoVazio}>Seu carrinho está vazio!</Text>
          </View>
        }
      />

      {itensCarrinho.length > 0 && (
        <View style={styles.rodapeCarrinho}>
          <View style={styles.linhaSubtotal}>
            <Text style={styles.txtSubtotalLabel}>Subtotal:</Text>
            <Text style={styles.txtSubtotalValor}>R$ {calcularSubtotal()}</Text>
          </View>

          <Text style={styles.tituloSecaoPagamento}>FORMA DE PAGAMENTO</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.containerOpcoesPagamento}
          >
            {OPCOES_PAGAMENTO.map((opcao) => {
              const selecionado = formaPagamento === opcao.id;
              return (
                <TouchableOpacity
                  key={opcao.id}
                  style={[
                    styles.cardPagamento,
                    selecionado && styles.cardPagamentoSelecionado
                  ]}
                  onPress={() => setFormaPagamento(opcao.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={opcao.icon} 
                    size={20} 
                    color={selecionado ? CORES.marromEscuro : CORES.creme} 
                  />
                  <Text style={[
                    styles.txtPagamento,
                    selecionado && styles.txtPagamentoSelecionado
                  ]}>
                    {opcao.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

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

      {/* Modal do Calendário */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalCalendarioVisivel}
        onRequestClose={() => setModalCalendarioVisivel(false)}
      >
        <View style={styles.fundoModal}>
          <View style={styles.conteudoModalCalendario}>
            <Text style={styles.tituloModalCalendario}>SELECIONE O DIA DA RETIRADA</Text>
            
            <Calendar
              minDate={dataHoje}
              onDayPress={selecionarDataProduto}
              theme={{
                calendarBackground: '#4a2c0a',
                textSectionTitleColor: CORES.creme,
                selectedDayBackgroundColor: CORES.dourado,
                selectedDayTextColor: CORES.marromEscuro,
                todayTextColor: CORES.dourado,
                dayTextColor: '#FFF',
                textDisabledColor: '#888',
                arrowColor: CORES.dourado,
                monthTextColor: CORES.dourado,
              }}
            />

            <TouchableOpacity 
              style={styles.btnCancelarCalendario}
              onPress={() => setModalCalendarioVisivel(false)}
            >
              <Text style={styles.txtCancelarCalendario}>CANCELAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Confirmação da Comanda */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalComandaVisivel}
        onRequestClose={() => setModalComandaVisivel(false)}
      >
        <View style={styles.fundoModal}>
          <View style={styles.conteudoModal}>
            <Ionicons name="checkmark-circle" size={54} color="#4CD964" style={{ marginBottom: 10 }} />
            <Text style={styles.tituloModal}>CÓDIGO DE COMPRA</Text>
            <Text style={styles.subtituloModal}>Apresente o código de texto ou o QR Code ao caixa para computar seus produtos e pagar.</Text>
            
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
              <Text style={styles.txtFecharModal}>CONCLUÍDO</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CORES.marromEscuro },
  header: { justifyContent: 'center', alignItems: 'center', paddingVertical: 10, backgroundColor: '#efac4a' },
  logo: { width: 170, height: 49, resizeMode: 'contain' },
  barraTituloTela: { backgroundColor: CORES.marromDestaque, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  txtTituloTela: { color: CORES.branco, fontFamily: 'BebasNeue-Regular', fontSize: 26, letterSpacing: 1.5 },
  listaConteudo: { padding: 15, paddingBottom: 30 },
  cardItem: { flexDirection: 'row', backgroundColor: '#4a2c0a', borderRadius: 15, padding: 12, marginBottom: 15, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  containerImagem: { width: 80, height: 80, backgroundColor: CORES.marromEscuro, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: CORES.cinza, overflow: 'hidden' },
  imagemProduto: { width: '100%', height: '100%' },
  containerDetalhes: { flex: 1, marginLeft: 15 },
  linhaTituloAcao: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tituloProduto: { color: CORES.branco, fontSize: 20, fontFamily: 'BebasNeue-Regular' },
  
  boxSeletorData: { flexDirection: 'row', alignItems: 'center', marginTop: 6, backgroundColor: 'rgba(0,0,0,0.3)', padding: 6, borderRadius: 8, gap: 6 },
  txtDataAgendada: { color: CORES.creme, fontSize: 12, fontWeight: 'bold' },

  boxInputHorario: { flexDirection: 'row', alignItems: 'center', marginTop: 6, backgroundColor: 'rgba(0,0,0,0.2)', padding: 6, borderRadius: 8 },
  labelHorario: { color: CORES.creme, fontSize: 12, marginRight: 6 },
  inputHorario: { flex: 1, color: CORES.dourado, fontSize: 13, fontWeight: 'bold', paddingVertical: 0, height: 22, borderBottomWidth: 1, borderBottomColor: CORES.dourado },
  
  linhaPrecoQuantidade: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  controladorQtd: { flexDirection: 'row', backgroundColor: CORES.branco, borderRadius: 8, alignItems: 'center', paddingHorizontal: 4, height: 30 },
  btnContador: { paddingHorizontal: 8, height: '100%', justifyContent: 'center' },
  txtQuantidade: { fontSize: 14, fontWeight: 'bold', color: '#000', paddingHorizontal: 6 },
  precoItem: { color: CORES.dourado, fontSize: 16, fontWeight: 'bold' },
  
  carrinhoVazio: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  txtCarrinhoVazio: { color: CORES.creme, fontSize: 16, marginTop: 15 },
  
  rodapeCarrinho: { backgroundColor: '#1e1002', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  linhaSubtotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  txtSubtotalLabel: { color: CORES.branco, fontSize: 18 },
  txtSubtotalValor: { color: CORES.branco, fontSize: 22, fontWeight: 'bold' },
  
  tituloSecaoPagamento: { color: CORES.dourado, fontSize: 14, fontFamily: 'BebasNeue-Regular', letterSpacing: 1, marginBottom: 8 },
  containerOpcoesPagamento: { paddingBottom: 15, gap: 10 },
  cardPagamento: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#341d04', borderWidth: 1, borderColor: CORES.creme, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginRight: 8, gap: 6 },
  cardPagamentoSelecionado: { backgroundColor: CORES.dourado, borderColor: CORES.dourado },
  txtPagamento: { color: CORES.creme, fontSize: 13, fontWeight: '600' },
  txtPagamentoSelecionado: { color: CORES.marromEscuro, fontWeight: 'bold' },

  btnFinalizar: { backgroundColor: CORES.dourado, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 5 },
  txtBtnFinalizar: { color: CORES.marromEscuro, fontSize: 18, fontWeight: 'bold' },
  
  fundoModal: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  conteudoModal: { width: '90%', backgroundColor: '#4a2c0a', borderRadius: 24, padding: 25, alignItems: 'center', borderWidth: 2, borderColor: CORES.dourado },
  conteudoModalCalendario: { width: '95%', backgroundColor: '#4a2c0a', borderRadius: 20, padding: 15, borderWidth: 2, borderColor: CORES.dourado },
  tituloModalCalendario: { color: CORES.dourado, fontSize: 18, fontFamily: 'BebasNeue-Regular', textAlign: 'center', marginBottom: 10 },
  btnCancelarCalendario: { marginTop: 15, paddingVertical: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, alignItems: 'center' },
  txtCancelarCalendario: { color: CORES.creme, fontWeight: 'bold' },

  tituloModal: { color: CORES.branco, fontSize: 24, fontFamily: 'BebasNeue-Regular', letterSpacing: 1, marginBottom: 8 },
  subtituloModal: { color: CORES.creme, fontSize: 13, textAlign: 'center', lineHeight: 18, marginBottom: 20 },
  boxQrCode: { backgroundColor: '#FFF', padding: 12, borderRadius: 16 },
  textoCodigoComanda: { color: CORES.dourado, fontSize: 24, fontWeight: 'bold', letterSpacing: 3, marginTop: 15, marginBottom: 20 },
  btnFecharModal: { backgroundColor: CORES.dourado, width: '100%', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  txtFecharModal: { color: CORES.marromEscuro, fontSize: 16, fontWeight: 'bold' },
});