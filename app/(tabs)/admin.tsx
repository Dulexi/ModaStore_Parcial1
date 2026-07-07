import { useRouter } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import { get, push, ref, set } from "firebase/database";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import Colors from "../../constants/Colors";
import { auth, database } from "../../firebaseConfig";

export default function AdminScreen() {
  const router = useRouter();

  const [usuario, setUsuario] = useState<User | null>(null);
  const [esAdmin, setEsAdmin] = useState(false);

  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("");
  const [precio, setPrecio] = useState("");
  const [tallas, setTallas] = useState("");
  const [estado, setEstado] = useState("Disponible");
  const [color, setColor] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imagen, setImagen] = useState("");
  const [destacado, setDestacado] = useState(false);

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
          setEsAdmin(datos.rol === "admin");
        }
      }
    });

    return unsubscribe;
  }, []);

  const limpiarFormulario = () => {
    setNombre("");
    setCategoria("");
    setPrecio("");
    setTallas("");
    setEstado("Disponible");
    setColor("");
    setDescripcion("");
    setImagen("");
    setDestacado(false);
  };

  const guardarProducto = async () => {
    if (
      nombre === "" ||
      categoria === "" ||
      precio === "" ||
      tallas === "" ||
      estado === "" ||
      color === "" ||
      descripcion === ""
    ) {
      showMessage("Completa los campos obligatorios.");
      return;
    }

    const precioNumero = parseFloat(precio);

    if (isNaN(precioNumero) || precioNumero <= 0) {
      showMessage("Ingresa un precio válido.");
      return;
    }

    const tallasArray = tallas.split(",").map((item) => item.trim());

    try {
      const nuevoProducto = push(ref(database, "prendas"));

      await set(nuevoProducto, {
        nombre: nombre,
        categoria: categoria,
        precio: precioNumero,
        tallas: tallasArray,
        estado: estado,
        color: color,
        descripcion: descripcion,
        imagen:
          imagen ||
          "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600",
        destacado: destacado,
      });

      showMessage("Producto agregado correctamente.");
      limpiarFormulario();
      router.push("/catalogo");
    } catch (error) {
      showMessage("No se pudo guardar el producto.");
    }
  };

  if (!usuario) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.title}>Administrador</Text>
        <Text style={styles.text}>Debes iniciar sesión para acceder.</Text>
      </View>
    );
  }

  if (!esAdmin) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.title}>Acceso denegado</Text>
        <Text style={styles.text}>
          Esta sección solo está disponible para administradores.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen}>
      <View style={styles.container}>
        <Text style={styles.title}>Agregar producto</Text>

        <TextInput
          style={styles.input}
          placeholder="Nombre del producto"
          value={nombre}
          onChangeText={setNombre}
        />

        <TextInput
          style={styles.input}
          placeholder="Categoría. Ejemplo: Camisas"
          value={categoria}
          onChangeText={setCategoria}
        />

        <TextInput
          style={styles.input}
          placeholder="Precio. Ejemplo: 59.90"
          value={precio}
          onChangeText={setPrecio}
          keyboardType="numeric"
        />

        <TextInput
          style={styles.input}
          placeholder="Tallas separadas por coma. Ejemplo: S,M,L"
          value={tallas}
          onChangeText={setTallas}
        />

        <TextInput
          style={styles.input}
          placeholder="Estado"
          value={estado}
          onChangeText={setEstado}
        />

        <TextInput
          style={styles.input}
          placeholder="Color"
          value={color}
          onChangeText={setColor}
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Descripción"
          value={descripcion}
          onChangeText={setDescripcion}
          multiline
        />

        <TextInput
          style={styles.input}
          placeholder="URL de imagen"
          value={imagen}
          onChangeText={setImagen}
        />

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Producto destacado</Text>
          <Switch value={destacado} onValueChange={setDestacado} />
        </View>

        <TouchableOpacity style={styles.button} onPress={guardarProducto}>
          <Text style={styles.buttonText}>Guardar producto</Text>
        </TouchableOpacity>
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
    padding: 24,
    paddingBottom: 100,
  },
  centerContainer: {
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
    lineHeight: 22,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.beige,
    borderRadius: 12,
    padding: 13,
    marginBottom: 14,
  },
  textArea: {
    height: 90,
    textAlignVertical: "top",
  },
  switchRow: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchText: {
    color: Colors.black,
    fontWeight: "600",
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