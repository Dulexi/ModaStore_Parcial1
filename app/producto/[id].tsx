import { useLocalSearchParams, useRouter } from "expo-router";
import { get, ref, set } from "firebase/database";
import { onAuthStateChanged, User } from "firebase/auth";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import Colors from "../../constants/Colors";
import { auth, database } from "../../firebaseConfig";

type Producto = {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  tallas: string[];
  estado: string;
  color: string;
  descripcion: string;
  imagen: string;
  destacado?: boolean;
};

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const idProducto = String(id);

  const [producto, setProducto] = useState<Producto | null>(null);
  const [usuario, setUsuario] = useState<User | null>(null);
  const [rol, setRol] = useState("");

  const showMessage = (msg: string) => {
    if (Platform.OS === "web") {
      alert(msg);
    } else {
      Alert.alert(msg);
    }
  };

  useEffect(() => {
    cargarProducto();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUsuario(user);

      if (user) {
        const usuarioRef = ref(database, "usuarios/" + user.uid);
        const snapshot = await get(usuarioRef);

        if (snapshot.exists()) {
          const datos = snapshot.val();
          setRol(datos.rol || "cliente");
        }
      } else {
        setRol("");
      }
    });

    return unsubscribe;
  }, []);

  const cargarProducto = async () => {
    try {
      const productoRef = ref(database, "prendas/" + idProducto);
      const snapshot = await get(productoRef);

      if (snapshot.exists()) {
        const data = snapshot.val();

        setProducto({
          id: idProducto,
          ...data,
        });
      } else {
        showMessage("Producto no encontrado.");
      }
    } catch (error) {
      showMessage("No se pudo cargar el producto.");
    }
  };

  const agregarFavorito = async () => {
    if (!usuario) {
      showMessage("Debes iniciar sesión para agregar favoritos.");
      router.push("/login");
      return;
    }

    if (rol === "admin") {
      showMessage("El administrador no puede agregar favoritos.");
      return;
    }

    try {
      await set(
        ref(database, "favoritos/" + usuario.uid + "/" + idProducto),
        true
      );

      showMessage("Producto agregado a favoritos.");
    } catch (error) {
      showMessage("No se pudo agregar a favoritos.");
    }
  };

  if (!producto) {
    return (
      <View style={styles.center}>
        <Text style={styles.loading}>Cargando producto...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen}>
      <View style={styles.container}>
        <Image source={{ uri: producto.imagen }} style={styles.image} />

        <View style={styles.card}>
          <Text style={styles.name}>{producto.nombre}</Text>

          <Text style={styles.price}>
            S/ {Number(producto.precio).toFixed(2)}
          </Text>

          <View style={styles.infoBox}>
            <Text style={styles.label}>Categoría</Text>
            <Text style={styles.value}>{producto.categoria}</Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.label}>Tallas disponibles</Text>
            <Text style={styles.value}>
              {Array.isArray(producto.tallas)
                ? producto.tallas.join(", ")
                : producto.tallas}
            </Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.label}>Color</Text>
            <Text style={styles.value}>{producto.color}</Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.label}>Estado</Text>
            <Text style={styles.available}>{producto.estado}</Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.label}>Descripción</Text>
            <Text style={styles.description}>{producto.descripcion}</Text>
          </View>

          {rol !== "admin" && (
            <TouchableOpacity style={styles.button} onPress={agregarFavorito}>
              <Text style={styles.buttonText}>Agregar a favoritos</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.secondaryText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    padding: 20,
    paddingBottom: 100,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  loading: {
    color: Colors.gray,
    fontSize: 16,
  },
  image: {
    width: "100%",
    height: 300,
    borderRadius: 20,
    backgroundColor: Colors.lightGray,
    marginBottom: 20,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.beige,
  },
  name: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.black,
    marginBottom: 8,
  },
  price: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.gold,
    marginBottom: 20,
  },
  infoBox: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    color: Colors.gray,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: Colors.black,
    fontWeight: "600",
  },
  available: {
    fontSize: 16,
    color: Colors.success,
    fontWeight: "600",
  },
  description: {
    fontSize: 15,
    color: Colors.black,
    lineHeight: 22,
  },
  button: {
    backgroundColor: Colors.gold,
    padding: 15,
    borderRadius: 16,
    marginTop: 10,
  },
  buttonText: {
    color: Colors.white,
    fontWeight: "700",
    textAlign: "center",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: Colors.gold,
    padding: 15,
    borderRadius: 16,
    marginTop: 12,
  },
  secondaryText: {
    color: Colors.gold,
    fontWeight: "700",
    textAlign: "center",
  },
});