import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

const CardPedidos = ({ item, onConcluirPedido }) => {

  // Formatação segura de Data/Hora (Criado em e Agendamento)
  const formatarDataHora = (dataString) => {
    if (!dataString) return null;

    try {
      const d = new Date(dataString);
      if (isNaN(d.getTime())) return null;

      const dia = String(d.getDate()).padStart(2, '0');
      const mes = String(d.getMonth() + 1).padStart(2, '0');
      const ano = d.getFullYear();
      const hora = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');

      return `${dia}/${mes}/${ano} às ${hora}:${min}`;
    } catch (e) {
      return null;
    }
  };

  const dataCriacao = formatarDataHora(item?.data);
  const dataAgendada = formatarDataHora(item?.data_ag);

  // Garante que 'itens' seja sempre uma lista válida
  const itensDoPedido = Array.isArray(item?.itens) ? item.itens : [];

  return (
    <View style={styles.card}>
      {/* CABEÇALHO */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.numPedido}>
            Pedido #{item?.num_pedido && item.num_pedido !== 0 ? item.num_pedido : item?.id_pedido}
          </Text>
          <Text style={styles.dataTexto}>Criado em: {dataCriacao || 'Data N/A'}</Text>
        </View>

        <View style={[
          styles.badgeStatus,
          (item?.status || '').toLowerCase() === 'finalizado' ? styles.statusFinalizado : styles.statusPendente
        ]}>
          <Text style={styles.statusTexto}>{item?.status || 'Pendente'}</Text>
        </View>
      </View>

      {/* BOTÃO DA COMANDA DE FÁCIL ACESSO */}
      {item?.codigo_comanda ? (
        <TouchableOpacity 
          style={styles.botaoComanda}
          activeOpacity={0.7}
          onPress={() => {
            Alert.alert(
              "Comanda para Retirada", 
              `Código: ${item.codigo_comanda}\nCliente: ${item.nome || 'Consumidor'}`
            );
          }}
        >
          <Text style={styles.labelComanda}>CÓDIGO DA COMANDA</Text>
          <Text style={styles.codigoComanda}>{item.codigo_comanda}</Text>
        </TouchableOpacity>
      ) : null}

      {/* BLOCAGEM DE DIA E HORÁRIO AGENDADO */}
      {dataAgendada ? (
        <View style={styles.boxAgendamento}>
          <Text style={styles.labelAgendamento}>⏰ Agendado para Retirada:</Text>
          <Text style={styles.valorAgendamento}>{dataAgendada}</Text>
        </View>
      ) : null}

      <View style={styles.divisor} />

      {/* LISTA DE ITENS DO PEDIDO */}
      <Text style={styles.tituloSecao}>Itens do Pedido:</Text>

      {itensDoPedido.length > 0 ? (
        itensDoPedido.map((prod, index) => {
          const nomeProd = prod?.nome_produto || 'Produto indisponível';
          const quantidade = Number(prod?.qtd || 1);
          const precoUnitario = Number(prod?.preco_unitario || 0);
          const valorSubtotal = precoUnitario * quantidade;

          return (
            <View key={index} style={styles.linhaItem}>
              <Text style={styles.nomeProduto}>
                {quantidade}x {nomeProd}
              </Text>
              <Text style={styles.precoItem}>
                R$ {valorSubtotal.toFixed(2)}
              </Text>
            </View>
          );
        })
      ) : (
        <Text style={styles.semItens}>Nenhum item vinculado a este pedido.</Text>
      )}

      <View style={styles.divisor} />

      {/* RODAPÉ DO CARD */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.pagamentoLabel}>Forma de Pagamento:</Text>
          <Text style={styles.formaPagamento}>{item?.form_pag || 'Não informada'}</Text>
          <Text style={styles.valorTotal}>Total: R$ {Number(item?.valor_total || 0).toFixed(2)}</Text>
        </View>

        {/* BOTÃO PARA CONCLUIR POSTERIORMENTE */}
        {(item?.status || '').toLowerCase() !== 'finalizado' && (
          <TouchableOpacity 
            style={styles.botaoConcluir}
            onPress={() => onConcluirPedido && onConcluirPedido(item)}
          >
            <Text style={styles.textoBotaoConcluir}>Concluir</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  numPedido: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  dataTexto: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  badgeStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusFinalizado: { backgroundColor: '#D4EDDA' },
  statusPendente: { backgroundColor: '#FFF3CD' },
  statusTexto: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  botaoComanda: {
    backgroundColor: '#EBF3FE',
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 12,
    alignItems: 'center',
  },
  labelComanda: {
    fontSize: 10,
    color: '#1D4ED8',
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  codigoComanda: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  boxAgendamento: {
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  labelAgendamento: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#92400E',
  },
  valorAgendamento: {
    fontSize: 14,
    fontWeight: '600',
    color: '#78350F',
    marginTop: 2,
  },
  divisor: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  tituloSecao: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#4B5563',
    marginBottom: 6,
  },
  linhaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  nomeProduto: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
    paddingRight: 8,
  },
  precoItem: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  semItens: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  pagamentoLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  formaPagamento: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  valorTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#15803D',
  },
  botaoConcluir: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  textoBotaoConcluir: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
});

export default CardPedidos;