import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { FirebaseError } from "firebase/app";
import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import Colors from "../../constants/Colors";
import { auth } from "../../firebaseConfig";

const imagenLogin =
  "https://images.unsplash.com/photo-1656258220193-acdd513286d9?q=80&w=764&auto=format&fit=crop";

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const showMessage = (msg: string) => {
    if (Platform.OS === "web") {
      alert(msg);
    } else {
      Alert.alert(msg);
    }
  };

  const login = async () => {
    if (email === "" || password === "") {
      showMessage("Ingresa tu correo y contraseña");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);

      showMessage("Inicio de sesión correcto");
      router.replace("/inicio");
    } catch (error) {
      if (error instanceof FirebaseError) {
        if (error.code === "auth/invalid-email") {
          showMessage("El correo ingresado no es válido.");
        } else if (error.code === "auth/invalid-credential") {
          showMessage("Correo o contraseña incorrectos.");
        } else {
          showMessage(error.message);
        }
      } else {
        showMessage("Ocurrió un error al iniciar sesión.");
      }
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push("/inicio")}>
            <Ionicons name="chevron-back-outline" size={24} color={Colors.gold} />
          </TouchableOpacity>

          <Text style={styles.logo}>ModaStore</Text>

          <View style={styles.emptyBox} />
        </View>

        <Image source={{ uri: imagenLogin }} style={styles.image} />

        <Text style={styles.title}>Iniciar sesión</Text>

        <Text style={styles.label}>Correo electrónico</Text>

        <TextInput
          placeholder="ejemplo@gmail.com"
          placeholderTextColor="#B8B8B8"
          onChangeText={setEmail}
          value={email}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />

        <Text style={styles.label}>Contraseña</Text>

        <TextInput
          placeholder="Ingrese su contraseña"
          placeholderTextColor="#B8B8B8"
          secureTextEntry
          onChangeText={setPassword}
          value={password}
          style={styles.input}
        />

        <TouchableOpacity style={styles.button} onPress={login}>
          <Text style={styles.buttonText}>Ingresar</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/register")}>
          <Text style={styles.link}>Crear cuenta</Text>
        </TouchableOpacity>

        <TouchableOpacity>
          <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const titleFont = Platform.OS === "ios" ? "Georgia" : "serif";

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  container: {
    width: "100%",
    maxWidth: 360,
    alignSelf: "center",
    paddingHorizontal: 26,
    paddingTop: 22,
    backgroundColor: Colors.white,
    flex: 1,
  },
  header: {
    height: 45,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    fontSize: 26,
    color: Colors.black,
    fontWeight: "400",
    fontFamily: titleFont,
  },
  emptyBox: {
    width: 24,
  },
  image: {
    width: "100%",
    height: 205,
    borderRadius: 10,
    backgroundColor: Colors.lightGray,
    marginTop: 18,
    marginBottom: 38,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.black,
    marginBottom: 28,
    fontFamily: titleFont,
  },
  label: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.black,
    marginBottom: 14,
    fontFamily: titleFont,
  },
  input: {
    height: 38,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.beige,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 22,
    fontSize: 12,
    color: Colors.black,
  },
  button: {
    backgroundColor: Colors.gold,
    height: 45,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 22,
    fontWeight: "500",
  },
  link: {
    marginTop: 18,
    textAlign: "center",
    color: Colors.gold,
    fontSize: 14,
  },
  forgotText: {
    marginTop: 12,
    textAlign: "center",
    color: Colors.gray,
    fontSize: 11,
  },
});