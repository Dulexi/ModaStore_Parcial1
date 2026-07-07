import { useRouter } from "expo-router";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { get, ref } from "firebase/database";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import Colors from "../../constants/Colors";
import { auth, database } from "../../firebaseConfig";

export default function PerfilScreen() {
  const router = useRouter();

  const [usuario, setUsuario] = useState<User | null>(null);
  const [nombre, setNombre] = useState("");
  const [cargando, setCargando] = useState(true);

  const showMessage = (msg: string) => {
    if (Platform.OS === "web") {
      alert(msg);
    } else {
      Alert.alert(msg);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUsuario(user);

      if (user) {
        const usuarioRef = ref(database, "usuarios/" + user.uid);
        const snapshot = await get(usuarioRef);

        if (snapshot.exists()) {
          const datos = snapshot.val();
          setNombre(datos.nombre || "Usuario");
        }
      } else {
        router.replace("/login");
      }

      setCargando(false);
    });

    return unsubscribe;
  }, []);

  const cerrarSesion = async () => {
    try {
      await signOut(auth);
      showMessage("Sesión cerrada correctamente");
      router.replace("/inicio");
    } catch (error) {
      showMessage("No se pudo cerrar sesión");
    }
  };

  if (cargando) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Cargando...</Text>
      </View>
    );
  }

  if (!usuario) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mi perfil</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Nombre</Text>
        <Text style={styles.value}>{nombre}</Text>

        <Text style={styles.label}>Correo</Text>
        <Text style={styles.value}>{usuario.email}</Text>

      </View>

      <TouchableOpacity style={styles.button} onPress={cerrarSesion}>
        <Text style={styles.buttonText}>Cerrar sesión</Text>
      </TouchableOpacity>
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
  title: {
    fontSize: 30,
    fontWeight: "700",
    textAlign: "center",
    color: Colors.black,
    marginBottom: 24,
  },
  text: {
    textAlign: "center",
    color: Colors.gray,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 20,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: Colors.beige,
  },
  label: {
    color: Colors.gray,
    fontSize: 13,
    marginTop: 8,
  },
  value: {
    color: Colors.black,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  button: {
    backgroundColor: Colors.gold,
    padding: 15,
    borderRadius: 16,
  },
  buttonText: {
    color: Colors.white,
    textAlign: "center",
    fontWeight: "700",
  },
});