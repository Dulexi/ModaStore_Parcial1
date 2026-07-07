import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import { onValue, ref, remove, update } from "firebase/database";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
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

type ItemCarrito = {
  id: string;
  nombre: string;
  precio: number;
  imagen: string;
  cantidad: number;
};

export default function CarritoScreen() {
  const router = useRouter();

  const [usuario, setUsuario] = useState<User | null>(null);
  const [productos, setProductos] = useState<ItemCarrito[]>([]);
  const [cargando, setCargando] = useState(true);

  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [modalCompra, setModalCompra] = useState(false);

  const showMessage = (msg: string) => {
    if (Platform.OS === "web") {
      alert(msg);
    } else {
      Alert.alert(msg);
    }
  };

  useEffect(() => {
    let unsubscribeCarrito: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUsuario(user);

      if (unsubscribeCarrito) {
        unsubscribeCarrito();
        unsubscribeCarrito = null;
      }

      if (user) {
        setCargando(true);

        const carritoRef = ref(database, "carrito/" + user.uid);

        unsubscribeCarrito = onValue(carritoRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();

            const lista: ItemCarrito[] = Object.keys(data).map((id) => ({
              id: id,
              ...data[id],
            }));

            setProductos(lista);
          } else {
            setProductos([]);
          }

          setCargando(false);
        });
      } else {
        setProductos([]);
        setCargando(false);
      }
    });

    return () => {
      unsubscribeAuth();

      if (unsubscribeCarrito) {
        unsubscribeCarrito();
      }
    };
  }, []);

  const aumentarCantidad = async (item: ItemCarrito) => {
    if (!usuario) return;

    try {
      await update(ref(database, "carrito/" + usuario.uid + "/" + item.id), {
        cantidad: item.cantidad + 1,
      });
    } catch (error) {
      showMessage("No se pudo actualizar la cantidad.");
    }
  };

  const disminuirCantidad = async (item: ItemCarrito) => {
    if (!usuario) return;

    if (item.cantidad === 1) {
      eliminarProducto(item.id);
      return;
    }

    try {
      await update(ref(database, "carrito/" + usuario.uid + "/" + item.id), {
        cantidad: item.cantidad - 1,
      });
    } catch (error) {
      showMessage("No se pudo actualizar la cantidad.");
    }
  };

  const eliminarProducto = async (idProducto: string) => {
    if (!usuario) return;

    try {
      await remove(ref(database, "carrito/" + usuario.uid + "/" + idProducto));
      showMessage("Producto eliminado del carrito.");
    } catch (error) {
      showMessage("No se pudo eliminar el producto.");
    }
  };

  const finalizarCompra = () => {
    if (productos.length === 0) {
      showMessage("Tu carrito está vacío.");
      return;
    }

    if (direccion === "" || telefono === "") {
      showMessage("Completa la dirección y el teléfono.");
      return;
    }

    setModalCompra(true);
  };

  const vaciarCarrito = async () => {
    if (!usuario) return;

    try {
      await remove(ref(database, "carrito/" + usuario.uid));
      setProductos([]);
    } catch (error) {
      showMessage("No se pudo vaciar el carrito.");
    }
  };

  const volverInicio = async () => {
    await vaciarCarrito();
    setModalCompra(false);
    router.push("/inicio");
  };

  const seguirComprando = async () => {
    await vaciarCarrito();
    setModalCompra(false);
    router.push("/catalogo");
  };

  const subtotal = productos.reduce((suma, item) => {
    return suma + Number(item.precio) * item.cantidad;
  }, 0);

  const envio = productos.length > 0 ? 9.9 : 0;
  const total = subtotal + envio;

  if (!usuario) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.title}>Confirmar pedido</Text>

        <Text style={styles.text}>
          Debes iniciar sesión para usar el carrito de compras.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push("/login")}
        >
          <Text style={styles.primaryText}>Ir al login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (cargando) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.text}>Cargando carrito...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons
                name="chevron-back-outline"
                size={24}
                color={Colors.gold}
              />
            </TouchableOpacity>

            <Text style={styles.logo}>ModaStore</Text>

            <View style={styles.cartIconBox}>
              <Ionicons name="cart-outline" size={24} color={Colors.black} />

              {productos.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{productos.length}</Text>
                </View>
              )}
            </View>
          </View>

          <Text style={styles.title}>Confirmar pedido</Text>
          <View style={styles.line} />

          <Text style={styles.subtitle}>
            Revisa los detalles de tu pedido antes de confirmar
          </Text>

          {productos.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.text}>Tu carrito está vacío.</Text>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => router.push("/catalogo")}
              >
                <Text style={styles.primaryText}>Ver catálogo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {productos.map((item) => (
                <View key={item.id} style={styles.productCard}>
                  <Image source={{ uri: item.imagen }} style={styles.image} />

                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{item.nombre}</Text>

                    <Text style={styles.price}>
                      S/ {Number(item.precio).toFixed(2)}
                    </Text>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Cantidad:</Text>

                      <TouchableOpacity
                        style={styles.qtyButton}
                        onPress={() => disminuirCantidad(item)}
                      >
                        <Text style={styles.qtyText}>-</Text>
                      </TouchableOpacity>

                      <Text style={styles.quantity}>{item.cantidad}</Text>

                      <TouchableOpacity
                        style={styles.qtyButton}
                        onPress={() => aumentarCantidad(item)}
                      >
                        <Text style={styles.qtyText}>+</Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => eliminarProducto(item.id)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color={Colors.danger}
                      />
                      <Text style={styles.deleteText}>Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <View style={styles.summaryBox}>
                <Text style={styles.summaryTitle}>Resumen del pedido</Text>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>
                    S/ {subtotal.toFixed(2)}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Envío</Text>
                  <Text style={styles.summaryValue}>
                    S/ {envio.toFixed(2)}
                  </Text>
                </View>

                <View style={styles.separator} />

                <View style={styles.summaryRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>S/ {total.toFixed(2)}</Text>
                </View>
              </View>

              <Text style={styles.sectionLabel}>Dirección de envío</Text>

              <TextInput
                style={styles.input}
                placeholder="tu dirección"
                placeholderTextColor="#777"
                value={direccion}
                onChangeText={setDireccion}
              />

              <Text style={styles.sectionLabel}>Teléfono de contacto</Text>

              <TextInput
                style={styles.input}
                placeholder="número de telefono"
                placeholderTextColor="#777"
                value={telefono}
                onChangeText={setTelefono}
                keyboardType="phone-pad"
              />

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={finalizarCompra}
              >
                <Text style={styles.primaryText}>Confirmar pedido</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.outlineButton}
                onPress={() => router.push("/catalogo")}
              >
                <Text style={styles.outlineText}>Cancelar</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      <Modal visible={modalCompra} animationType="fade" transparent>
        <View style={styles.modalBackground}>
          <View style={styles.confirmCard}>
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark-outline" size={80} color={Colors.gold} />
            </View>

            <Text style={styles.confirmTitle}>¡Pedido confirmado!</Text>

            <View style={styles.confirmLine} />

            <Text style={styles.confirmText}>
              Gracias por tu compra en ModaStore.
            </Text>

            <Text style={styles.confirmSubText}>
              En unos instantes nos estaremos comunicando contigo por WhatsApp
              para coordinar tu pedido.
            </Text>

            <View style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>Resumen del pedido</Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>
                  S/ {subtotal.toFixed(2)}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Envío</Text>
                <Text style={styles.summaryValue}>S/ {envio.toFixed(2)}</Text>
              </View>

              <View style={styles.separator} />

              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>S/ {total.toFixed(2)}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={volverInicio}>
              <Text style={styles.primaryText}>Volver a inicio</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.outlineButton}
              onPress={seguirComprando}
            >
              <Text style={styles.outlineText}>Seguir comprando</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 120,
    backgroundColor: Colors.white,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
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
  cartIconBox: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -7,
    right: -8,
    width: 15,
    height: 15,
    borderRadius: 20,
    backgroundColor: Colors.gold,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: "700",
  },
  title: {
    fontSize: 25,
    fontWeight: "700",
    color: Colors.black,
    marginTop: 22,
    fontFamily: titleFont,
  },
  line: {
    width: 90,
    height: 2,
    backgroundColor: Colors.gold,
    marginBottom: 18,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.black,
    marginBottom: 28,
  },
  emptyBox: {
    marginTop: 40,
    alignItems: "center",
  },
  text: {
    textAlign: "center",
    color: Colors.gray,
    marginBottom: 20,
  },
  productCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.beige,
    borderRadius: 10,
    padding: 10,
    marginBottom: 18,
    flexDirection: "row",
  },
  image: {
    width: 110,
    height: 130,
    borderRadius: 8,
    backgroundColor: Colors.lightGray,
  },
  productInfo: {
    flex: 1,
    marginLeft: 14,
  },
  productName: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.black,
    marginBottom: 8,
  },
  price: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.gold,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: Colors.black,
    fontWeight: "600",
  },
  qtyButton: {
    width: 22,
    height: 22,
    borderRadius: 20,
    backgroundColor: Colors.gold,
    justifyContent: "center",
    alignItems: "center",
  },
  qtyText: {
    color: Colors.white,
    fontWeight: "700",
  },
  quantity: {
    fontSize: 14,
    color: Colors.black,
    fontWeight: "700",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
  },
  deleteText: {
    color: Colors.danger,
    fontSize: 12,
    fontWeight: "600",
  },
  summaryBox: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.beige,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 15,
    color: Colors.black,
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    color: Colors.black,
    fontSize: 12,
  },
  summaryValue: {
    color: Colors.black,
    fontSize: 12,
    fontWeight: "700",
  },
  separator: {
    height: 1,
    backgroundColor: Colors.beige,
    marginVertical: 5,
  },
  totalLabel: {
    color: Colors.black,
    fontSize: 12,
    fontWeight: "700",
  },
  totalValue: {
    color: Colors.gold,
    fontSize: 12,
    fontWeight: "700",
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.black,
    marginBottom: 8,
    fontFamily: titleFont,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.beige,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 16,
    color: Colors.black,
  },
  primaryButton: {
    backgroundColor: Colors.gold,
    padding: 15,
    borderRadius: 10,
    marginTop: 6,
    marginBottom: 18,
    width: "100%",
  },
  primaryText: {
    color: Colors.white,
    fontWeight: "700",
    textAlign: "center",
    fontSize: 16,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: Colors.gold,
    padding: 15,
    borderRadius: 10,
    width: "100%",
  },
  outlineText: {
    color: Colors.gold,
    fontWeight: "700",
    textAlign: "center",
    fontSize: 16,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  confirmCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  checkCircle: {
    width: 135,
    height: 135,
    borderRadius: 100,
    borderWidth: 7,
    borderColor: Colors.gold,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  confirmTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: Colors.black,
    textAlign: "center",
    fontFamily: titleFont,
  },
  confirmLine: {
    width: 50,
    height: 2,
    backgroundColor: Colors.gold,
    marginVertical: 12,
  },
  confirmText: {
    fontSize: 14,
    color: Colors.black,
    textAlign: "center",
    marginBottom: 12,
  },
  confirmSubText: {
    fontSize: 12,
    color: Colors.black,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 18,
  },
});