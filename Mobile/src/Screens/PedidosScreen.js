import React, { useState, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  FlatList, 
  TouchableOpacity, 
  Modal, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

const CORES = {
  marromEscuro: '#341d04',
  marromDestaque: '#713b00',
  dourado: '#efac4a',
  creme: '#ebd5a6',
  branco: '#FFFFFF',
  cinzaCard: '#4a2c0a',
};

const IP_SERVIDOR = "10.111.9.11"; 
const URL_API = `http://${IP_SERVIDOR}:3000`;

// Função auxiliar para formatar a data/hora do agendamento
const formatarDataAgendada = (dataString) => {
  if (!dataString) return 'Retirada Imediata / Não agendado';

  try {
    const d = new Date(dataString);
    if (isNaN(d.getTime())) return 'Retirada Imediata';

    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    const hora = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');

    return `${dia}/${mes}/${ano} às ${hora}:${min}`;
  } catch (e) {
    return 'Retirada Imediata';
  }
};

export default function PedidosScreen() {
  const [pedidosPendentes, setPedidosPendentes] = useState([]);
  const [pedidosConcluidos, setPedidosConcluidos] = useState([]);
  const [carregando, setCarregando] = useState(false);
  
  const [modalVisible, setModalVisible] = useState(false);
  
  // Guardamos o objeto do pedido completo selecionado para a Modal
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);

  const buscarPedidosDoUsuario = async () => {
    try {
      setCarregando(true);
      const token = await AsyncStorage.getItem("token");
      const idUser = await AsyncStorage.getItem("id_user");
      
      const idCliente = idUser ? parseInt(idUser) : 1;

      const resposta = await fetch(`${URL_API}/historico-pedidos`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (!resposta.ok) {
        throw new Error(`Erro do servidor: Status ${resposta.status}`);
      }

      const todosPedidos = await resposta.json();

      const pedidosFiltrados = todosPedidos.filter(p => {
        return p && (parseInt(p.id_user) === idCliente);
      });

      const pendentes = pedidosFiltrados.filter(p => p.status && p.status.toLowerCase() === 'pendente');
      const concluidos = pedidosFiltrados.filter(p => p.status && (p.status.toLowerCase() === 'finalizado' || p.status.toLowerCase() === 'pago'));

      setPedidosPendentes(pendentes);
      setPedidosConcluidos(concluidos);
    } catch (erro) {
      console.error("Erro detalhado na requisição:", erro);
      Alert.alert("Erro de Sincronização", "Não foi possível carregar seus agendamentos.");
    } finally {
      setCarregando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      buscarPedidosDoUsuario();
    }, [])
  );

  // Apenas seleciona o pedido que já contém a propriedade 'itens' trazida do backend
  const abrirQrCodeComanda = (pedido) => {
    setPedidoSelecionado(pedido);
    setModalVisible(true);
  };

  const renderCardPedido = ({ item, isPendente }) => {
    const dataFormatada = new Date(item.data).toLocaleDateString('pt-BR');
    
    return (
      <TouchableOpacity 
        style={[styles.cardPedido, !isPendente && styles.cardDesativado]}
        onPress={() => isPendente && abrirQrCodeComanda(item)}
        disabled={!isPendente}
      >
        <View style={styles.topoCard}>
          <Text style={styles.txtNumeroPedido}>PEDIDO #{item.num_pedido || item.id_pedido}</Text>
          <View style={[styles.badgeStatus, { backgroundColor: isPendente ? CORES.dourado : '#4CD964' }]}>
            <Text style={styles.txtStatus}>{(item.status || 'PENDENTE').toUpperCase()}</Text>
          </View>
        </View>

        <Text style={styles.txtData}>Data: {dataFormatada}</Text>
        <Text style={styles.txtValorTotal}>Total: R$ {parseFloat(item.valor_total || 0).toFixed(2).replace('.', ',')}</Text>
        
        {isPendente && (
          <View style={styles.footerCardPendente}>
            <Ionicons name="qr-code-outline" size={16} color={CORES.dourado} />
            <Text style={styles.txtAvisoClique}>Toque para abrir a ficha de retirada</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const dadosUnificados = [
    { tipo: 'HEADER_PENDENTE', titulo: 'AGENDADOS / PENDENTES' },
    ...pedidosPendentes.map(p => ({ ...p, keyType: 'PENDENTE' })),
    { tipo: 'HEADER_CONCLUIDO', titulo: 'PEDIDOS CONCLUIDOS' },
    ...pedidosConcluidos.map(p => ({ ...p, keyType: 'CONCLUIDO' }))
  ];

  // Garante o array de itens para exibição na modal
  const itensDoModal = Array.isArray(pedidoSelecionado?.itens) ? pedidoSelecionado.itens : [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.barraTituloTela}>
        <Text style={styles.txtTituloTela}>MEUS PEDIDOS</Text>
      </View>

      {carregando && (
        <ActivityIndicator size="large" color={CORES.dourado} style={styles.loadingStyle} />
      )}

      <FlatList
        data={dadosUnificados}
        keyExtractor={(item, index) => String(item.id_pedido || index)}
        contentContainerStyle={styles.listaConteudo}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          if (item.tipo) {
            return <Text style={styles.tituloSecao}>{item.titulo}</Text>;
          }
          return renderCardPedido({ item, isPendente: item.keyType === 'PENDENTE' });
        }}
        ListEmptyComponent={!carregando && (
          <View style={styles.containerVazio}>
            <Ionicons name="reader-outline" size={60} color={CORES.creme} />
            <Text style={styles.txtVazio}>Nenhum agendamento encontrado.</Text>
          </View>
        )}
      />

      {/* MODAL FICHA DE RETIRADA */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.fundoModal}>
          <View style={styles.conteudoModal}>
            <Text style={styles.tituloModal}>FICHA DE RETIRADA</Text>
            
            <View style={styles.boxQrCode}>
              {pedidoSelecionado?.codigo_comanda ? (
                <QRCode 
                  value={String(pedidoSelecionado.codigo_comanda)} 
                  size={180} 
                  backgroundColor='#FFF' 
                  color='#000' 
                />
              ) : null}
            </View>

            <Text style={styles.textoCodigoComanda}>{pedidoSelecionado?.codigo_comanda}</Text>
            
            {/* DESTACADO: DATA E HORÁRIO DE AGENDAMENTO */}
            <View style={styles.boxAgendamentoModal}>
              <Ionicons name="time-outline" size={20} color={CORES.dourado} />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.labelAgendamentoModal}>Horário de Retirada:</Text>
                <Text style={styles.valorAgendamentoModal}>
                  {formatarDataAgendada(pedidoSelecionado?.data_ag)}
                </Text>
              </View>
            </View>

            <Text style={styles.txtSubtituloItens}>Itens do seu Agendamento:</Text>
            
            <View style={styles.containerListaItens}>
              {itensDoModal.length > 0 ? (
                itensDoModal.map((prod, idx) => (
                  <View key={idx} style={styles.linhaItemModal}>
                    <Text style={styles.txtNomeProdModal}>
                      {prod.qtd}x {prod.nome_produto || prod.nome || 'Produto'}
                    </Text>
                    <Text style={styles.txtHorarioProdModal}>
                      R$ {parseFloat(prod.preco_unitario || 0).toFixed(2).replace('.', ',')}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.txtSemItens}>Nenhum item listado.</Text>
              )}
            </View>

            <TouchableOpacity style={styles.btnFecharModal} onPress={() => setModalVisible(false)}>
              <Text style={styles.txtFecharModal}>VOLTAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#242628' 
  },
  barraTituloTela: { 
    backgroundColor: CORES.marromDestaque, 
    paddingVertical: 15, 
    alignItems: 'center' 
  },
  txtTituloTela: { 
    color: CORES.branco, 
    fontFamily: 'BebasNeue-Regular', 
    fontSize: 24, 
    letterSpacing: 2 
  },
  loadingStyle: {
    marginTop: 20
  },
  listaConteudo: { 
    padding: 20 
  },
  tituloSecao: { 
    color: CORES.dourado, 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginTop: 25, 
    marginBottom: 10, 
    letterSpacing: 0.5 
  },
  cardPedido: { 
    backgroundColor: CORES.cinzaCard, 
    borderRadius: 12, 
    padding: 15, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.05)' 
  },
  cardDesativado: {
    opacity: 0.5
  },
  topoCard: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  txtNumeroPedido: { 
    color: CORES.branco, 
    fontWeight: 'bold', 
    fontSize: 15 
  },
  badgeStatus: { 
    paddingHorizontal: 8, 
    paddingVertical: 3, 
    borderRadius: 6 
  },
  txtStatus: { 
    color: CORES.marromEscuro, 
    fontSize: 10, 
    fontWeight: 'bold' 
  },
  txtData: { 
    color: CORES.creme, 
    fontSize: 12, 
    marginBottom: 4 
  },
  txtValorTotal: { 
    color: CORES.branco, 
    fontSize: 14, 
    fontWeight: 'bold' 
  },
  footerCardPendente: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 10, 
    borderTopWidth: 1, 
    borderTopColor: 'rgba(255,255,255,0.1)', 
    paddingTop: 8, 
    gap: 5 
  },
  txtAvisoClique: { 
    color: CORES.dourado, 
    fontSize: 11, 
    fontWeight: 'bold' 
  },
  containerVazio: { 
    alignItems: 'center', 
    marginTop: 80 
  },
  txtVazio: { 
    color: CORES.creme, 
    fontSize: 14, 
    marginTop: 10 
  },
  fundoModal: { 
    flex: 1, 
    backgroundColor: 'rgba(0, 0, 0, 0.85)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  conteudoModal: { 
    width: '88%', 
    backgroundColor: '#4a2c0a', 
    borderRadius: 24, 
    padding: 22, 
    alignItems: 'center', 
    borderWidth: 2, 
    borderColor: CORES.dourado 
  },
  tituloModal: { 
    color: CORES.branco, 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginBottom: 15 
  },
  boxQrCode: { 
    backgroundColor: '#FFF', 
    padding: 12, 
    borderRadius: 16 
  },
  textoCodigoComanda: { 
    color: CORES.dourado, 
    fontSize: 26, 
    fontWeight: 'bold', 
    letterSpacing: 3, 
    marginTop: 10, 
    marginBottom: 10 
  },
  boxAgendamentoModal: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 172, 74, 0.15)',
    borderWidth: 1,
    borderColor: CORES.dourado,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    width: '100%',
    marginBottom: 12,
  },
  labelAgendamentoModal: {
    color: CORES.creme,
    fontSize: 11,
    fontWeight: 'bold',
  },
  valorAgendamentoModal: {
    color: CORES.branco,
    fontSize: 13,
    fontWeight: 'bold',
  },
  txtSubtituloItens: { 
    color: CORES.branco, 
    fontSize: 13, 
    alignSelf: 'flex-start', 
    marginBottom: 6, 
    fontWeight: 'bold' 
  },
  containerListaItens: { 
    width: '100%', 
    backgroundColor: 'rgba(0,0,0,0.2)', 
    borderRadius: 10, 
    padding: 10, 
    marginBottom: 20 
  },
  linhaItemModal: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginVertical: 4 
  },
  txtNomeProdModal: { 
    color: CORES.branco, 
    fontSize: 13,
    flex: 1,
    marginRight: 8
  },
  txtHorarioProdModal: { 
    color: CORES.dourado, 
    fontSize: 13, 
    fontWeight: 'bold' 
  },
  txtSemItens: {
    color: CORES.creme,
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic'
  },
  btnFecharModal: { 
    backgroundColor: CORES.dourado, 
    width: '100%', 
    paddingVertical: 12, 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  txtFecharModal: { 
    color: CORES.marromEscuro, 
    fontSize: 15, 
    fontWeight: 'bold' 
  }
});