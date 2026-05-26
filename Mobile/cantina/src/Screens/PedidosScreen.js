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

const IP_SERVIDOR = "10.111.9.96"; 
const URL_API = `http://${IP_SERVIDOR}:3000`;

export default function PedidosScreen() {
  const [pedidosPendentes, setPedidosPendentes] = useState([]);
  const [pedidosConcluidos, setPedidosConcluidos] = useState([]);
  const [carregando, setCarregando] = useState(false);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [codigoSelecionado, setCodigoSelecionado] = useState('');
  const [itensDoPedido, setItensDoPedido] = useState([]);

  const buscarPedidosDoUsuario = async () => {
    try {
      setCarregando(true);
      const token = await AsyncStorage.getItem("token");
      const idUser = await AsyncStorage.getItem("id_user");
      
      const idCliente = idUser ? parseInt(idUser) : 1;
      
      console.log("=== TESTE DE CONEXÃO ===");
      console.log("Buscando pedidos para o ID de Usuário:", idCliente);
      console.log("Endereço da Requisição:", `${URL_API}/historico-pedidos`);

      const resposta = await fetch(`${URL_API}/historico-pedidos`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (!resposta.ok) {
        throw new Error(`Erro do servidor: Status ${resposta.status}`);
      }

      const todosPedidos = await resposta.json();
      
      console.log("Pedidos brutos recebidos do Backend:", todosPedidos);

      // Garante que o filtro não quebre caso venha nulo ou sem o id_user correto
      const pedidosFiltrados = todosPedidos.filter(p => {
        return p && (parseInt(p.id_user) === idCliente);
      });

      console.log("Pedidos após filtrar pelo ID do usuário:", pedidosFiltrados);

      const pendentes = pedidosFiltrados.filter(p => p.status && p.status.toLowerCase() === 'pendente');
      const concluidos = pedidosFiltrados.filter(p => p.status && (p.status.toLowerCase() === 'finalizado' || p.status.toLowerCase() === 'pago'));

      setPedidosPendentes(pendentes);
      setPedidosConcluidos(concluidos);
    } catch (erro) {
      console.error("Erro detalhado na requisição:", erro);
      Alert.alert("Erro de Sincronizacao", "Nao foi possivel carregar seus agendamentos.");
    } finally {
      setCarregando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      buscarPedidosDoUsuario();
    }, [])
  );

  const abrirQrCodeComanda = async (codigoComanda) => {
    try {
      setCodigoSelecionado(codigoComanda);
      setModalVisible(true);
      setItensDoPedido([]); 
      
      const resposta = await fetch(`${URL_API}/comandas/${codigoComanda}`);
      if (resposta.ok) {
        const dados = await resposta.json();
        setItensDoPedido(dados.carrinho || []);
      }
    } catch (err) {
      console.log("Erro ao detalhar comanda:", err);
    }
  };

  const renderCardPedido = ({ item, isPendente }) => {
    const dataFormatada = new Date(item.data).toLocaleDateString('pt-BR');
    
    return (
      <TouchableOpacity 
        style={[styles.cardPedido, !isPendente && styles.cardDesativado]}
        onPress={() => isPendente && abrirQrCodeComanda(item.codigo_comanda)}
        disabled={!isPendente}
      >
        <View style={styles.topoCard}>
          <Text style={styles.txtNumeroPedido}>PEDIDO #{item.num_pedido || item.id_pedido}</Text>
          <View style={[styles.badgeStatus, { backgroundColor: isPendente ? CORES.dourado : '#4CD964' }]}>
            <Text style={styles.txtStatus}>{item.status.toUpperCase()}</Text>
          </View>
        </View>

        <Text style={styles.txtData}>Data: {dataFormatada}</Text>
        <Text style={styles.txtValorTotal}>Total: R$ {parseFloat(item.valor_total).toFixed(2).replace('.', ',')}</Text>
        
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
              {codigoSelecionado ? (
                <QRCode value={codigoSelecionado} size={180} backgroundColor='#FFF' color='#000' />
              ) : null}
            </View>

            <Text style={styles.textoCodigoComanda}>{codigoSelecionado}</Text>
            
            <Text style={styles.txtSubtituloItens}>Itens do seu Agendamento:</Text>
            
            <View style={styles.containerListaItens}>
              {itensDoPedido.map((prod, idx) => (
                <View key={idx} style={styles.linhaItemModal}>
                  <Text style={styles.txtNomeProdModal}>{prod.qtd}x {prod.nome}</Text>
                  <Text style={styles.txtHorarioProdModal}>as {prod.horario_retirada || '10:00'}</Text>
                </View>
              ))}
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
    fontSize: 13 
  },
  txtHorarioProdModal: { 
    color: CORES.dourado, 
    fontSize: 13, 
    fontWeight: 'bold' 
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