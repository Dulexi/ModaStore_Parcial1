import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Colors from "../../constants/Colors";

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>ModaStore</Text>

      <Text style={styles.title}>
        Encuentra prendas modernas para tu estilo
      </Text>

      <Pressable
        style={styles.primaryButton}
        onPress={() => router.push("/login")}
      >
        <Text style={styles.primaryText}>Iniciar sesión</Text>
      </Pressable>

      <Pressable
        style={styles.secondaryButton}
        onPress={() => router.push("/register")}
      >
        <Text style={styles.secondaryText}>Crear cuenta</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    padding: 24,
  },
  logo: {
    fontSize: 38,
    fontWeight: "700",
    color: Colors.black,
    textAlign: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    color: Colors.black,
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 30,
  },
  primaryButton: {
    backgroundColor: Colors.gold,
    paddingVertical: 15,
    borderRadius: 18,
    marginBottom: 14,
  },
  primaryText: {
    color: Colors.white,
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: Colors.gold,
    paddingVertical: 15,
    borderRadius: 18,
  },
  secondaryText: {
    color: Colors.gold,
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
  },
});