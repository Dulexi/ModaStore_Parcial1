import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import { get, ref, remove, set, update } from "firebase/database";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Platform,
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
  destacado: boolean;
};

export default function FavoritosScreen() {
  const router = useRouter();

  const [usuario, setUsuario] = useState<User | null>(null);
  const [favoritos, setFavoritos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);

  const showMessage = (msg: string) => {
    if (Platform.OS === "web") {
      alert(msg);
    } else {
      Alert.alert(msg);
    }
  };

  const cargarFavoritos = async (uid: string) => {
    try {
      setCargando(true);

      const favoritosRef = ref(database, "favoritos/" + uid);
      const favoritosSnapshot = await get(favoritosRef);

      if (!favoritosSnapshot.exists()) {
        setFavoritos([]);
        return;
      }

      const favoritosData = favoritosSnapshot.val();

      const prendasRef = ref(database, "prendas");
      const prendasSnapshot = await get(prendasRef);

      if (!prendasSnapshot.exists()) {
        setFavoritos([]);
        return;
      }

      const prendasData = prendasSnapshot.val();

      const lista: Producto[] = Object.keys(favoritosData)
        .filter((idProducto) => favoritosData[idProducto] === true)
        .map((idProducto) => ({
          id: idProducto,
          ...prendasData[idProducto],
        }))
        .filter((producto) => producto.nombre);

      setFavoritos(lista);
    } catch (error) {
      showMessage("No se pudieron cargar los favoritos.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuario(user);

      if (user) {
        cargarFavoritos(user.uid);
      } else {
        setFavoritos([]);
        setCargando(false);
      }
    });

    return unsubscribe;
  }, []);

const agregarCarrito = async (producto: Producto) => {
  if (!usuario) {
    showMessage("Debes iniciar sesión para agregar productos al carrito.");
    router.push("/login");
    return;
  }

  try {
    const productoCarritoRef = ref(
      database,
      "carrito/" + usuario.uid + "/" + producto.id
    );

    const snapshot = await get(productoCarritoRef);

    if (snapshot.exists()) {
      const datos = snapshot.val();

      await update(productoCarritoRef, {
        cantidad: datos.cantidad + 1,
      });
    } else {
      await set(productoCarritoRef, {
        nombre: producto.nombre,
        precio: Number(producto.precio),
        imagen: producto.imagen,
        cantidad: 1,
      });
    }

    showMessage("Producto agregado al carrito.");
  } catch (error) {
    showMessage("No se pudo agregar el producto al carrito.");
  }
};


  const quitarFavorito = async (idProducto: string) => {
    if (!usuario) return;

    try {
      await remove(ref(database, "favoritos/" + usuario.uid + "/" + idProducto));

      setFavoritos((listaActual) =>
        listaActual.filter((producto) => producto.id !== idProducto)
      );

      showMessage("Producto eliminado de favoritos.");
    } catch (error) {
      showMessage("No se pudo quitar el favorito.");
    }
  };

  if (!usuario) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Favoritos</Text>

        <Text style={styles.text}>
          Debes iniciar sesión para guardar y ver tus prendas favoritas.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/login")}
        >
          <Text style={styles.buttonText}>Ir al login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (cargando) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Favoritos</Text>
        <Text style={styles.text}>Cargando favoritos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Mis favoritos</Text>

      {favoritos.length === 0 ? (
        <Text style={styles.text}>
          Todavía no tienes prendas favoritas.
        </Text>
      ) : (
        <FlatList
          data={favoritos}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.imageBox}>
                <Image source={{ uri: item.imagen }} style={styles.image} />

                <TouchableOpacity
                  style={styles.heartButton}
                  onPress={() => quitarFavorito(item.id)}
                >
                  <Ionicons name="heart" size={24} color={Colors.gold} />
                </TouchableOpacity>
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.productName}>{item.nombre}</Text>
                <Text style={styles.price}>S/ {item.precio.toFixed(2)}</Text>

                <Text style={styles.detail}>Tallas: {item.tallas.join(", ")}</Text>
                <Text style={styles.status}>Estado: {item.estado}</Text>

                <TouchableOpacity
                    style={styles.cartButton}
                    onPress={() => agregarCarrito(item)}
                    >
                    <Ionicons name="cart-outline" size={16} color={Colors.white} />
                    <Text style={styles.cartText}>Agregar al carrito</Text>
                    </TouchableOpacity>


                <TouchableOpacity
                  style={styles.detailButton}
                  onPress={() =>
                    router.push({
                      pathname: "/producto/[id]",
                      params: { id: item.id },
                    })
                  }
                >
                  <Text style={styles.detailText}>Ver detalle</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
    paddingTop: 40,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: Colors.black,
    textAlign: "center",
    marginBottom: 20,
  },
  text: {
    color: Colors.gray,
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
  },
  button: {
    backgroundColor: Colors.gold,
    padding: 15,
    borderRadius: 16,
    marginTop: 24,
  },
  buttonText: {
    color: Colors.white,
    fontWeight: "700",
    textAlign: "center",
  },
  list: {
    paddingBottom: 100,
  },
  row: {
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.beige,
  },
  imageBox: {
    height: 125,
    backgroundColor: Colors.lightGray,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  heartButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 4,
  },
  cardBody: {
    padding: 10,
  },
  productName: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.black,
  },
  price: {
    color: Colors.gold,
    fontWeight: "700",
    marginTop: 4,
  },
  detail: {
    color: Colors.gray,
    fontSize: 12,
    marginTop: 5,
  },
  status: {
    color: Colors.success,
    fontSize: 12,
    marginTop: 5,
  },

cartButton: {
  backgroundColor: Colors.gold,
  borderRadius: 10,
  paddingVertical: 8,
  marginTop: 10,
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
  gap: 6,
},
cartText: {
  color: Colors.white,
  fontWeight: "700",
  textAlign: "center",
  fontSize: 12,
},

  detailButton: {
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: 10,
    paddingVertical: 7,
    marginTop: 10,
  },
  detailText: {
    color: Colors.gold,
    fontWeight: "600",
    textAlign: "center",
    fontSize: 12,
  },
});