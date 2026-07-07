import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { FirebaseError } from "firebase/app";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set } from "firebase/database";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import Colors from "../../constants/Colors";
import { auth, database } from "../../firebaseConfig";

const imagenRegistro =
  "https://images.unsplash.com/photo-1656258220193-acdd513286d9?q=80&w=764&auto=format&fit=crop";

export default function RegisterScreen() {
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const showMessage = (msg: string) => {
    if (Platform.OS === "web") {
      alert(msg);
    } else {
      Alert.alert(msg);
    }
  };

  const register = async () => {
    if (nombre === "" || email === "" || password === "") {
      showMessage("Completa todos los campos");
      return;
    }

    if (password.length < 6) {
      showMessage("La contraseña debe tener mínimo 6 caracteres");
      return;
    }

    try {
      const credenciales = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const uid = credenciales.user.uid;

      await set(ref(database, "usuarios/" + uid), {
        nombre: nombre,
        correo: email,
        rol: "cliente",
      });

      showMessage("Usuario creado correctamente");
      router.replace("/inicio");
    } catch (error) {
      if (error instanceof FirebaseError) {
        if (error.code === "auth/email-already-in-use") {
          showMessage("Este correo ya está registrado.");
        } else if (error.code === "auth/invalid-email") {
          showMessage("El correo ingresado no es válido.");
        } else if (error.code === "auth/weak-password") {
          showMessage("La contraseña es muy débil.");
        } else {
          showMessage(error.message);
        }
      } else {
        showMessage("Ocurrió un error al registrar el usuario.");
      }
    }
  };

  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push("/login")}>
            <Ionicons
              name="chevron-back-outline"
              size={24}
              color={Colors.gold}
            />
          </TouchableOpacity>

          <Text style={styles.logo}>ModaStore</Text>

          <View style={styles.emptyBox} />
        </View>

        <Image source={{ uri: imagenRegistro }} style={styles.image} />

        <Text style={styles.title}>Crear Cuenta</Text>

        <Text style={styles.label}>Nombre completo</Text>
        <TextInput
          placeholder="Ingresa tu nombre completo"
          placeholderTextColor="#B8B8B8"
          onChangeText={setNombre}
          value={nombre}
          style={styles.input}
        />

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

        <TouchableOpacity style={styles.button} onPress={register}>
          <Text style={styles.buttonText}>Registrarme</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push("/login")}
        >
          <Text style={styles.secondaryText}>Ya tengo cuenta</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
    paddingBottom: 40,
    backgroundColor: Colors.white,
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
    marginBottom: 26,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.black,
    marginBottom: 20,
    fontFamily: titleFont,
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.black,
    marginBottom: 8,
    fontFamily: titleFont,
  },
  input: {
    height: 38,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.beige,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
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
  secondaryButton: {
    height: 45,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.gold,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 26,
  },
  secondaryText: {
    color: Colors.gold,
    fontSize: 15,
    fontWeight: "500",
  },
});