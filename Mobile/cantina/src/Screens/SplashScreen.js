import { useNavigation } from "@react-navigation/native";
import { Dimensions, View } from "react-native";
import LottieView from "lottie-react-native";


const { width, height } = Dimensions.get("screen");

const SplashScreen = () => {
  const navigation = useNavigation();
  const animacacao = () => {
    navigation.navigate("LoginScreen");
  };


  return (
    <View>
      <LottieView
        source={require("../../assets/animacao.json")}
        style={{ width: width, height: height}}
        autoPlay
        loop={false}
        onAnimationFinish={animacacao}
      />
    </View>
  );
};


export default SplashScreen;