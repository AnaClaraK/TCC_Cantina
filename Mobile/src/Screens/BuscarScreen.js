import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  ActivityIndicator, 
  ScrollView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../config';

const CORES = {
  marromEscuro: '#341d04',
  marromDestaque: '#713b00',
  dourado: '#efac4a',
  creme: '#ebd5a6',
  cinza: '#adafb0',
  branco: '#FFFFFF',
  vermelho: '#ff4d4d',
  cinzaInput: '#2a2d30'
};

const LISTA_CATEGORIAS = ['Todos', 'Marmitas', 'Salgados', 'Lanches', 'Bebidas', 'Doces'];

const removerAcentos = (texto) => {
  if (!texto) return '';
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

const CardProdutoBusca = React.memo(({ item, temEstoque, adicionarAoCarrinho }) => {
  const [expandido, setExpandido] = useState(false);
  const podeExpandir = item.info && item.info.length > 50;

  return (
    <View style={[styles.card, !temEstoque && styles.cardSemEstoque]}>
      <View style={styles.topoCard}>
        <View style={styles.containerImagem}>
          <Image
            source={item.imagem}
            style={styles.fotoComida}
          />
          {!temEstoque && (
            <View style={styles.badgeEsgotado}>
              <Text style={styles.txtEsgotado}>ESGOTADO</Text>
            </View>
          )}
        </View>

        <View style={styles.containerTextoTop}>
          <View style={styles.linhaCategoriaEstoque}>
            <Text style={styles.categoriaTag}>{item.categoria.toUpperCase()}</Text>
            <Text style={styles.txtEstoque}>Estoque: {item.estoque}</Text>
          </View>
          <Text style={styles.tituloProduto} numberOfLines={2}>
            {item.titulo}
          </Text>
        </View>
      </View>

      <View style={styles.baseCard}>
        <TouchableOpacity 
          style={styles.boxSabor} 
          onPress={() => podeExpandir && setExpandido(!expandido)}
          activeOpacity={podeExpandir ? 0.85 : 1}
        >
          <View style={styles.headerSabor}>
            <Text style={styles.tituloSabor}>{item.detalheTitulo}</Text>
            {podeExpandir && (
              <Ionicons 
                name={expandido ? "chevron-up" : "chevron-down"} 
                size={16} 
                color={CORES.dourado} 
              />
            )}
          </View>
          
          <Text 
            style={styles.descricaoSabor} 
            numberOfLines={expandido ? undefined : 1}
          >
            {item.info}
          </Text>
          
          {podeExpandir && !expandido && (
            <Text style={styles.txtVerMais}>Ver mais</Text>
          )}
        </TouchableOpacity>

        <View style={styles.containerPrecoCarrinho}>
          <View style={styles.badgePreco}>
            <Text style={styles.textoPreco}>{item.preco}</Text>
          </View>

          <TouchableOpacity
            style={[styles.botaoAdicionarCarrinho, !temEstoque && styles.btnBloqueado]}
            onPress={() => adicionarAoCarrinho(item)}
            activeOpacity={0.8}
            disabled={!temEstoque}
          >
            <Ionicons name="cart-outline" size={20} color={temEstoque ? CORES.marromEscuro : '#999'} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

export default function BuscarScreen() {
  const [todosOsProdutos, setTodosOsProdutos] = useState([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('Todos');
  const [termoBusca, setTermoBusca] = useState('');
  const [carregando, setCarregando] = useState(true);

  const carregarProdutosDoBanco = async () => {
    try {
      setCarregando(true);
      const token = await AsyncStorage.getItem("token");

      const response = await fetch(`${BASE_URL}/produtos`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const lista = await response.json();

      const mapeados = lista
        .filter(p => p.status === 'ativo' || p.status === 1 || !p.status)
        .map(p => {
          let cat = 'Salgados';
          const catBanco = (p.nome_categoria || p.categoria || '').toLowerCase();
          
          if (catBanco.includes('bebida') || catBanco.includes('suco') || catBanco.includes('refrigerante')) cat = 'Bebidas';
          else if (catBanco.includes('marmita') || catBanco.includes('prato') || catBanco.includes('almoco')) cat = 'Marmitas';
          else if (catBanco.includes('doce') || catBanco.includes('sobremesa')) cat = 'Doces';
          else if (catBanco.includes('lanche') || catBanco.includes('hamburguer') || catBanco.includes('sanduiche')) cat = 'Lanches';

          let imagemValida = require('../../assets/imagens/img_ntf.png');
          if (p.imagem && typeof p.imagem === 'string' && p.imagem.trim() !== '') {
            const limpa = p.imagem
              .trim()
              .replace(/^.*(images|imagens|uploads)\//, '')
              .replace(/^\/+/, '');
            imagemValida = { uri: `${BASE_URL}/uploads/${limpa}` };
          }

          return {
            id: p.id_produto ? p.id_produto.toString() : Math.random().toString(),
            id_produto: p.id_produto,
            titulo: p.nome_produto || p.nome || 'Produto sem nome',
            info: p.descricao || 'Sem descrição detalhada.',
            detalheTitulo: 'Detalhes:',
            preco: `R$ ${parseFloat(p.preco || p.preco_unitario || 0).toFixed(2).replace('.', ',')}`,
            precoNumerico: parseFloat(p.preco || p.preco_unitario || 0),
            estoque: parseInt(p.quantidade || p.estoque || 0, 10),
            imagem: imagemValida,
            categoria: cat,
            vendas: parseInt(p.total_vendas || p.vendas || 0, 10)
          };
        });

      setTodosOsProdutos(mapeados);
    } catch (erro) {
      Alert.alert("Erro de Conexão", "Não foi possível carregar o catálogo de produtos.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarProdutosDoBanco();
  }, []);

  const produtosExibidos = useMemo(() => {
    let resultado = [...todosOsProdutos];

    if (categoriaSelecionada !== 'Todos') {
      resultado = resultado.filter(p => p.categoria === categoriaSelecionada);
    }

    if (termoBusca.trim()) {
      const buscaLimpa = removerAcentos(termoBusca);
      resultado = resultado.filter(p => 
        removerAcentos(p.titulo).includes(buscaLimpa) ||
        removerAcentos(p.categoria).includes(buscaLimpa) ||
        removerAcentos(p.info).includes(buscaLimpa)
      );
    }

    return resultado.sort((a, b) => {
      const aComEstoque = a.estoque > 0 ? 1 : 0;
      const bComEstoque = b.estoque > 0 ? 1 : 0;

      if (aComEstoque !== bComEstoque) {
        return bComEstoque - aComEstoque;
      }

      return (b.vendas || 0) - (a.vendas || 0);
    });
  }, [todosOsProdutos, termoBusca, categoriaSelecionada]);

  const adicionarAoCarrinho = useCallback(async (produto) => {
    if (produto.estoque <= 0) {
      Alert.alert("Esgotado", "Este produto está sem estoque.");
      return;
    }
    try {
      const carrinhoAtual = await AsyncStorage.getItem('@carrinho');
      let itens = carrinhoAtual ? JSON.parse(carrinhoAtual) : [];
      const index = itens.findIndex(i => i.id_produto === produto.id_produto);
      
      if (index > -1) {
        if (itens[index].qtd >= produto.estoque) {
          Alert.alert("Limite Máximo", `Estoque máximo atingido.`);
          return;
        }
        itens[index].qtd += 1;
      } else {
        itens.push({
          id_produto: produto.id_produto,
          codigo: produto.id.toString(),
          nome: produto.titulo,
          preco: produto.precoNumerico,
          qtd: 1,
          estoque: produto.estoque,
          imagem: produto.imagem,
          categoria: produto.categoria,
          origem: "App"
        });
      }
      await AsyncStorage.setItem('@carrinho', JSON.stringify(itens));
      Alert.alert("Adicionado", `${produto.titulo} foi inserido no carrinho.`);
    } catch (error) {
    }
  }, []);

  const renderCardItem = useCallback(({ item }) => (
    <CardProdutoBusca 
      item={item} 
      temEstoque={item.estoque > 0} 
      adicionarAoCarrinho={adicionarAoCarrinho} 
    />
  ), [adicionarAoCarrinho]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.containerBarraBusca}>
        <View style={styles.inputWrapper}>
          <Ionicons name="search-outline" size={20} color={CORES.dourado} style={styles.iconeBusca} />
          
          <TextInput
            style={[styles.inputBusca, { textAlign: 'center' }]}
            placeholder="Buscar por prato, bebida..."
            placeholderTextColor="#8e8e93"
            value={termoBusca}
            onChangeText={setTermoBusca}
            autoCorrect={false}
            returnKeyType="search"
          />

          {termoBusca.length > 0 && (
            <TouchableOpacity onPress={() => setTermoBusca('')} style={styles.btnLimpar}>
              <Ionicons name="close-circle" size={18} color={CORES.cinza} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.containerCategorias}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rowCategorias}
        >
          {LISTA_CATEGORIAS.map((cat) => {
            const ativa = categoriaSelecionada === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.btnCategoria, ativa && styles.btnCategoriaAtiva]}
                onPress={() => setCategoriaSelecionada(cat)}
                activeOpacity={0.8}
              >
                <Text style={[styles.txtCategoria, ativa && styles.txtCategoriaAtiva]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {carregando ? (
        <View style={styles.containerLoading}>
          <ActivityIndicator size="large" color={CORES.dourado} />
          <Text style={styles.txtLoading}>Buscando produtos...</Text>
        </View>
      ) : (
        <FlatList
          data={produtosExibidos}
          keyExtractor={item => item.id}
          renderItem={renderCardItem}
          contentContainerStyle={styles.listaConteudo}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.containerVazio}>
              <Ionicons name="search-outline" size={50} color={CORES.dourado} style={{ marginBottom: 10 }} />
              <Text style={styles.txtVazio}>Nenhum produto encontrado.</Text>
              <Text style={styles.subtxtVazio}>Tente pesquisar com outros termos ou categorias.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CORES.marromEscuro,
  },
  containerBarraBusca: {
    backgroundColor: CORES.dourado,
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CORES.cinzaInput,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: 'rgba(239, 172, 74, 0.3)',
  },
  iconeBusca: {
    marginRight: 8,
  },
  inputBusca: {
    flex: 1,
    color: CORES.branco,
    fontSize: 14,
    fontFamily: 'Montserrat',
  },
  btnLimpar: {
    padding: 4,
  },
  containerCategorias: { 
    backgroundColor: CORES.marromEscuro, 
    paddingVertical: 6, 
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(239, 172, 74, 0.15)',
  },
  rowCategorias: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4,
  },
  btnCategoria: { 
    paddingVertical: 5, 
    paddingHorizontal: 10, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderRadius: 6, 
  },
  btnCategoriaAtiva: { 
    backgroundColor: CORES.marromDestaque,
  },
  txtCategoria: { 
    color: CORES.branco, 
    fontFamily: 'Montserrat', 
    fontSize: 13, 
    fontWeight: 'bold', 
    textAlign: 'center',
  },
  txtCategoriaAtiva: { 
    color: CORES.branco,
  },
  listaConteudo: {
    backgroundColor: CORES.marromEscuro,
    padding: 15,
    paddingBottom: 90,
  },
  card: {
    backgroundColor: 'rgba(113, 59, 0, 0.15)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 172, 74, 0.1)',
  },
  cardSemEstoque: {
    opacity: 0.65,
  },
  topoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  containerImagem: {
    width: 90,
    height: 90,
    backgroundColor: '#4a2c0a',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: CORES.cinza,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  fotoComida: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  badgeEsgotado: {
    position: 'absolute',
    backgroundColor: CORES.vermelho,
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 2,
    alignItems: 'center',
  },
  txtEsgotado: {
    color: CORES.branco,
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'Montserrat',
  },
  containerTextoTop: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  linhaCategoriaEstoque: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 2,
  },
  categoriaTag: {
    color: CORES.dourado,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    flexShrink: 1,
  },
  txtEstoque: {
    color: CORES.creme,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
    flexShrink: 0,
  },
  tituloProduto: {
    color: CORES.branco,
    fontSize: 21,
    fontFamily: 'BebasNeue-Regular',
    lineHeight: 25,
  },
  baseCard: {
    width: '100%',
  },
  boxSabor: {
    backgroundColor: CORES.marromDestaque,
    borderRadius: 10,
    padding: 12,
    width: '100%',
    marginBottom: 12,
  },
  headerSabor: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tituloSabor: {
    color: CORES.branco,
    fontWeight: 'bold',
    fontSize: 14,
  },
  descricaoSabor: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  txtVerMais: {
    color: CORES.dourado,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'right',
  },
  containerPrecoCarrinho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  badgePreco: {
    backgroundColor: '#1a1002',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: CORES.creme,
  },
  textoPreco: {
    color: CORES.creme,
    fontSize: 18,
    fontWeight: 'bold',
  },
  botaoAdicionarCarrinho: {
    backgroundColor: CORES.dourado,
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: CORES.branco,
  },
  btnBloqueado: {
    backgroundColor: '#5c5c5c',
    borderColor: '#7a7a7a',
  },
  containerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txtLoading: {
    color: CORES.branco,
    marginTop: 10,
    fontFamily: 'Montserrat',
  },
  containerVazio: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  txtVazio: {
    color: CORES.branco,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtxtVazio: {
    color: CORES.cinza,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
});
