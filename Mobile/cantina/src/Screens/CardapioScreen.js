import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  FlatList, 
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from "@react-navigation/native";
import NotificacaoModal from '../Components/Modal'; 


const IP_SERVIDOR = "10.111.9.96"; 
const URL_API = `http://${IP_SERVIDOR}:3000`;

const CORES = {
  marromEscuro: '#341d04',
  marromDestaque: '#713b00',
  dourado: '#efac4a',
  creme: '#ebd5a6',
  cinza: '#adafb0',
  branco: '#FFFFFF',
  vermelho: '#ff4d4d'
};

const CardapioItem = React.memo(({ item, temEstoque, adicionarAoCarrinho }) => {
  const [expandido, setExpandido] = useState(false);
  const podeExpandir = item.info && item.info.length > 50;

  return (
    <View style={[styles.card, !temEstoque && styles.cardSemEstoque]}>
      <View style={styles.topoCard}>
        <View style={styles.containerImagem}>
          <Image
            source={item.imagem}
            style={styles.fotoComida}
            onError={() => console.log("ERRO IMG:", item.titulo, item.imagem)}
          />
          {!temEstoque && (
            <View style={styles.badgeEsgotado}>
              <Text style={styles.txtEsgotado}>ESGOTADO</Text>
            </View>
          )}
        </View>

        <View style={styles.containerTextoTop}>
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
            <Text style={styles.txtVerMais}>... Ver mais</Text>
          )}
        </TouchableOpacity>

        <View style={styles.containerPrecoCarrinho}>
          <View style={styles.badgePreco}>
            <Text style={styles.textoPreco}>R$ {item.preco}</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.botaoAdicionarCarrinho, !temEstoque && styles.btnBloqueado]}
            onPress={() => adicionarAoCarrinho(item)}
            activeOpacity={temEstoque ? 0.7 : 1}
            disabled={!temEstoque}
          >
            <Ionicons 
              name={temEstoque ? "cart" : "close-circle-outline"} 
              size={22} 
              color={temEstoque ? CORES.marromEscuro : CORES.branco} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

export default function CardapioScreen() {
 
  const [todosOsProdutos, setTodosOsProdutos] = useState([]); 
  const [carregando, setCarregando] = useState(true); 
  const [categoriaAtiva, setCategoriaAtiva] = useState('Marmitas');
  
  const categoriasApp = ['Marmitas', 'Bebidas', 'Doces', 'Salgados', 'Lanches'];
  const navigation = useNavigation();

  const mapearCategoriaDoBanco = (categoriaNome, idCategoria) => {
    const nome = String(categoriaNome || idCategoria || '').toLowerCase().trim();
    if (nome.includes('marmita') || nome === '2') return 'Marmitas';
    if (nome.includes('bebida') || nome.includes('quente') || nome === '1' || nome === '8') return 'Bebidas';
    if (nome.includes('guloseima') || nome.includes('trufa') || nome.includes('doce') || nome === '6' || nome === '7') return 'Doces';
    if (nome.includes('salgado') || nome === '4') return 'Salgados';
    if (nome.includes('lanche') || nome === '5') return 'Lanches';
    if (nome.includes('picolé') || nome.includes('sorvete') || nome === '3') return 'Doces';
    return 'Marmitas'; 
  };

  const carregarProdutosDoBanco = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const resposta = await fetch(`${URL_API}/produtos`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
  
      if (!resposta.ok) throw new Error(`Erro HTTP: ${resposta.status}`);
      const dados = await resposta.json();
  
      const produtosFormatados = dados.map((p) => {
        const qtdDisponivel = parseInt(p.qtd !== undefined ? p.qtd : 0, 10);
        let imagemDefinida;
        const img = p.img ? String(p.img).trim() : "";
  
        let nomeArquivo = img
          .replace(/^.*(images|imagens|uploads)\//, '')
          .replace(/^\/+/, '')
          .trim();
        
        const nomeSemExt = nomeArquivo.replace(/\.(png|jpg|jpeg|webp)$/i, '');
        const urlFinal = `${URL_API}/images/${encodeURIComponent(nomeSemExt)}`;
        
        imagemDefinida = { uri: urlFinal };

        return {
          id_produto: p.id_produto,
          id: p.id_produto.toString(),
          categoria: mapearCategoriaDoBanco(p.categoria_nome, p.id_categoria),
          titulo: p.nome,
          estoque: qtdDisponivel,
          preco: parseFloat(p.preco || 0).toFixed(2).replace(".", ","),
          precoNumerico: parseFloat(p.preco || 0),
          detalheTitulo: "Sabor do dia:",
          info: p.descricao && p.descricao.trim() !== "" ? p.descricao : "Sem descrição cadastrada.",
          imagem: imagemDefinida,
        };
      });
  
      setTodosOsProdutos(produtosFormatados);
    } catch (erro) {
      console.error("❌ Erro ao buscar produtos:", erro);
      Alert.alert("Erro de Conexão", "Não foi possível carregar os produtos.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarProdutosDoBanco();
  }, []);

  const fazerLogout = async () => {
    try {
        await AsyncStorage.removeItem('token');
        navigation.replace("LoginScreen");
    } catch (error) {
        console.log(error);
    }
  };

  const produtosFiltrados = useMemo(() => {
    return todosOsProdutos
      .filter(item => item.categoria.toLowerCase() === categoriaAtiva.toLowerCase())
      .sort((a, b) => (a.estoque > 0 && b.estoque <= 0 ? -1 : b.estoque > 0 && a.estoque <= 0 ? 1 : 0));
  }, [todosOsProdutos, categoriaAtiva]);

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
          categoria: produto.categoria, // 💡 Adicione essa linha aqui!
          origem: "App"
        });
      }
      await AsyncStorage.setItem('@carrinho', JSON.stringify(itens));
      Alert.alert("Adicionado", `${produto.titulo} foi inserido no carrinho.`);
    } catch (error) {
      console.log(error);
    }
  }, []);

  const renderCardapioItem = useCallback(({ item }) => (
    <CardapioItem 
      item={item} 
      temEstoque={item.estoque > 0} 
      adicionarAoCarrinho={adicionarAoCarrinho} 
    />
  ), [adicionarAoCarrinho]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ width: 40 }} /> 
        <Image source={require('../../assets/images/logo_m.png')} style={styles.logo} />
        <TouchableOpacity onPress={fazerLogout} style={styles.botaoSair}>
          <Ionicons name="log-out-outline" size={30} color={CORES.marromEscuro} />
        </TouchableOpacity>
      </View>

      <View style={styles.containerCategorias}>
        <View style={styles.rowCategorias}>
          {categoriasApp.map((cat) => (
            <TouchableOpacity 
              key={cat} 
              onPress={() => setCategoriaAtiva(cat)}
              style={[styles.btnCategoria, categoriaAtiva === cat && styles.btnCategoriaAtiva]}
              activeOpacity={1}
            >
              <Text style={[styles.txtCategoria, categoriaAtiva === cat && styles.txtCategoriaAtiva]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {carregando ? (
        <View style={styles.containerLoading}>
          <ActivityIndicator size="large" color={CORES.dourado} />
          <Text style={styles.txtLoading}>Sincronizando cardápio...</Text>
        </View>
      ) : (
        <FlatList
          data={produtosFiltrados}
          keyExtractor={item => item.id}
          renderItem={renderCardapioItem}
          contentContainerStyle={styles.listaConteudo}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={false}
          getItemLayout={(data, index) => ({
            length: 220,
            offset: 220 * index,
            index,
          })}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          ListEmptyComponent={
            <Text style={styles.txtVazio}>Nenhum produto cadastrado nesta categoria.</Text>
          }
        />
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: CORES.marromEscuro 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 15, 
    paddingVertical: 10, 
    backgroundColor: '#efac4a' 
  },
  logo: { 
    width: 170, 
    height: 49, 
    resizeMode: 'contain', 
    marginLeft: -220 
  },
  botaoSair: { 
    padding: 5 
  },
  containerCategorias: { 
    backgroundColor: CORES.marromDestaque, 
    paddingVertical: 14, 
    paddingHorizontal: 2 
  },
  rowCategorias: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    width: '100%' 
  },
  btnCategoria: { 
    flex: 1, 
    paddingVertical: 8, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderRadius: 6, 
    marginHorizontal: 0.5 
  },
  btnCategoriaAtiva: { 
    backgroundColor: 'rgba(235, 213, 166, 0.2)' 
  },
  txtCategoria: { 
    color: CORES.branco, 
    fontFamily: 'Montserrat', 
    fontSize: 16, 
    fontWeight: 'bold', 
    textAlign: 'center' 
  },
  txtCategoriaAtiva: { 
    color: CORES.dourado 
  },
  listaConteudo: { 
    padding: 15, 
    paddingBottom: 90 
  },
  card: { 
    backgroundColor: 'rgba(113, 59, 0, 0.15)', 
    borderRadius: 16, 
    padding: 12, 
    marginBottom: 20, 
    borderWidth: 1, 
    borderColor: 'rgba(239, 172, 74, 0.1)' 
  },
  cardSemEstoque: { 
    opacity: 0.65 
  }, 
  topoCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12 
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
    position: 'relative' 
  },
  fotoComida: { 
    width: '100%', 
    height: '100%', 
    resizeMode: 'cover' 
  },
  badgeEsgotado: { 
    position: 'absolute', 
    backgroundColor: CORES.vermelho, 
    bottom: 0, 
    left: 0, 
    right: 0, 
    paddingVertical: 2, 
    alignItems: 'center' 
  },
  txtEsgotado: { 
    color: CORES.branco, 
    fontSize: 10, 
    fontWeight: 'bold', 
    fontFamily: 'Montserrat' 
  },
  containerTextoTop: { 
    flex: 1, 
    marginLeft: 14, 
    justifyContent: 'center' 
  },
  tituloProduto: { 
    color: CORES.branco, 
    fontSize: 21, 
    fontFamily: 'BebasNeue-Regular', 
    lineHeight: 25 
  },
  baseCard: { 
    width: '100%' 
  },
  boxSabor: { 
    backgroundColor: CORES.marromDestaque, 
    borderRadius: 10, 
    padding: 12, 
    width: '100%', 
    marginBottom: 12 
  },
  headerSabor: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 4 
  },
  tituloSabor: { 
    color: CORES.branco, 
    fontWeight: 'bold', 
    fontSize: 14 
  },
  descricaoSabor: { 
    color: 'rgba(255, 255, 255, 0.9)', 
    fontSize: 13, 
    fontWeight: '600', 
    lineHeight: 18 
  },
  txtVerMais: { 
    color: CORES.dourado, 
    fontSize: 12, 
    fontWeight: '700', 
    marginTop: 4, 
    textAlign: 'right' 
  },
  containerPrecoCarrinho: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    width: '100%' 
  },
  badgePreco: { 
    backgroundColor: '#1a1002', 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20, 
    borderWidth: 1.5, 
    borderColor: CORES.creme 
  },
  textoPreco: { 
    color: CORES.creme, 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  botaoAdicionarCarrinho: { 
    backgroundColor: CORES.dourado, 
    width: 42, 
    height: 42, 
    borderRadius: 21, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1.5, 
    borderColor: CORES.branco 
  },
  btnBloqueado: { 
    backgroundColor: '#5c5c5c', 
    borderColor: '#7a7a7a' 
  }, 
  containerLoading: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  txtLoading: { 
    color: '#fff', 
    marginTop: 10 
  },
  txtVazio: { 
    color: '#fff', 
    textAlign: 'center', 
    marginTop: 40, 
    fontFamily: 'Montserrat', 
    fontSize: 16 
  }
});