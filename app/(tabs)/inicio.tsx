import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import { onValue, ref } from "firebase/database";
import { useEffect, useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Colors from "../../constants/Colors";
import { auth, database } from "../../firebaseConfig";

type Banner = {
  titulo: string;
  imagen: string;
};

type Producto = {
  id: string;
  nombre: string;
  precio: number;
  tallas: string[] | string;
  estado: string;
  imagen: string;
  destacado?: boolean;
};

const banners: Banner[] = [
  {
    titulo: "Encuentra\nprendas modernas\npara tu estilo",
    imagen:
      "https://images.unsplash.com/photo-1656258220193-acdd513286d9?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    titulo: "Nueva moda\ncasual para\ncada ocasión",
    imagen:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=720&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    titulo: "Renueva tu\nlook con prendas\nmodernas",
    imagen:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600",
  },
];

export default function HomeScreen() {
  const [bannerIndex, setBannerIndex] = useState(0);
  const [productosDestacados, setProductosDestacados] = useState<Producto[]>([]);
  const [usuario, setUsuario] = useState<User | null>(null);
  const [cantidadCarrito, setCantidadCarrito] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setBannerIndex((actual) => (actual + 1) % banners.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const productosRef = ref(database, "prendas");

    const unsubscribe = onValue(productosRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();

        const lista: Producto[] = Object.keys(data)
          .map((id) => ({
            id: id,
            ...data[id],
          }))
          .filter((producto) => producto.destacado === true)
          .slice(0, 2);

        setProductosDestacados(lista);
      } else {
        setProductosDestacados([]);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let unsubscribeCarrito: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUsuario(user);

      if (unsubscribeCarrito) {
        unsubscribeCarrito();
        unsubscribeCarrito = null;
      }

      if (user) {
        const carritoRef = ref(database, "carrito/" + user.uid);

        unsubscribeCarrito = onValue(carritoRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();

            const totalCantidad = Object.keys(data).reduce((suma, id) => {
              return suma + Number(data[id].cantidad || 0);
            }, 0);

            setCantidadCarrito(totalCantidad);
          } else {
            setCantidadCarrito(0);
          }
        });
      } else {
        setCantidadCarrito(0);
      }
    });

    return () => {
      unsubscribeAuth();

      if (unsubscribeCarrito) {
        unsubscribeCarrito();
      }
    };
  }, []);

  const bannerActual = banners[bannerIndex];

  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.iconButton}>
            <Ionicons name="menu-outline" size={28} color={Colors.black} />
          </Pressable>

          <Text style={styles.logo}>ModaStore</Text>

          <View style={styles.headerRight}>
            <Pressable>
              <Ionicons name="logo-whatsapp" size={24} color="#18A84A" />
            </Pressable>

            <Pressable
              style={styles.cartBox}
              onPress={() => {
                if (usuario) {
                  router.push("/carrito");
                } else {
                  router.push("/login");
                }
              }}
            >
              <Ionicons name="cart-outline" size={24} color={Colors.black} />

              {cantidadCarrito > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{cantidadCarrito}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        <View style={styles.banner}>
          <View style={styles.bannerTextBox}>
            <Text style={styles.bannerTitle}>{bannerActual.titulo}</Text>

            <View style={styles.line} />

            <Pressable
              style={styles.bannerButton}
              onPress={() => router.push("/catalogo")}
            >
              <Text style={styles.bannerButtonText}>Descubre ahora</Text>
            </Pressable>
          </View>

          <Image
            source={{ uri: bannerActual.imagen }}
            style={styles.bannerImage}
          />
        </View>

        <View style={styles.dots}>
          {banners.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, bannerIndex === index && styles.dotActive]}
            />
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nueva colección</Text>

          <Pressable onPress={() => router.push("/catalogo")}>
            <Text style={styles.viewAll}>Ver todo &gt;</Text>
          </Pressable>
        </View>

        {productosDestacados.length === 0 ? (
          <Text style={styles.emptyText}>
            No hay productos destacados para mostrar.
          </Text>
        ) : (
          <View style={styles.productRow}>
            {productosDestacados.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.imageBox}>
                  <Image
                    source={{ uri: item.imagen }}
                    style={styles.productImage}
                  />

                  <View style={styles.heartButton}>
                    <Ionicons
                      name="heart-outline"
                      size={24}
                      color={Colors.black}
                    />
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.productName}>{item.nombre}</Text>

                  <Text style={styles.price}>
                    S/ {Number(item.precio).toFixed(2)}
                  </Text>

                  <View style={styles.sizeRow}>
                    <Text style={styles.label}>Tallas:</Text>

                    {Array.isArray(item.tallas) ? (
                      item.tallas.slice(0, 3).map((talla) => (
                        <View key={talla} style={styles.sizeCircle}>
                          <Text style={styles.sizeText}>{talla}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.label}>{item.tallas}</Text>
                    )}
                  </View>

                  <View style={styles.statusRow}>
                    <Text style={styles.label}>Estado:</Text>
                    <Text style={styles.status}>{item.estado}</Text>
                  </View>

                  <Pressable
                    style={styles.detailButton}
                    onPress={() =>
                      router.push({
                        pathname: "/producto/[id]",
                        params: { id: item.id },
                      })
                    }
                  >
                    <Text style={styles.detailText}>Ver detalle</Text>
                    <Text style={styles.detailText}>&gt;</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.bottomBanner}>
          <View style={styles.bottomTextBox}>
            <Text style={styles.bottomTitle}>Renueva tu estilo hoy</Text>

            <Text style={styles.bottomText}>
              Explora nuevas prendas y crea combinaciones únicas.
            </Text>
          </View>

          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=720&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            }}
            style={styles.bottomImage}
          />
        </View>
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
    paddingHorizontal: 8,
    paddingTop: 18,
    paddingBottom: 95,
    backgroundColor: Colors.white,
  },
  header: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconButton: {
    width: 42,
    alignItems: "flex-start",
  },
  logo: {
    fontSize: 25,
    color: Colors.black,
    fontWeight: "400",
    fontFamily: titleFont,
  },
  headerRight: {
    width: 78,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 12,
  },
  cartBox: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -7,
    backgroundColor: Colors.gold,
    width: 15,
    height: 15,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: "700",
  },
  banner: {
    backgroundColor: Colors.beige,
    borderRadius: 14,
    marginTop: 10,
    height: 190,
    overflow: "hidden",
    flexDirection: "row",
  },
  bannerTextBox: {
    width: "55%",
    paddingLeft: 18,
    paddingRight: 6,
    justifyContent: "center",
  },
  bannerTitle: {
    fontSize: 22,
    color: Colors.black,
    lineHeight: 27,
    fontWeight: "400",
    fontFamily: titleFont,
  },
  line: {
    width: 42,
    height: 2,
    backgroundColor: Colors.gold,
    marginVertical: 14,
  },
  bannerButton: {
    backgroundColor: Colors.gold,
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 16,
    alignSelf: "flex-start",
  },
  bannerButtonText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 12,
  },
  bannerImage: {
    width: "45%",
    height: "100%",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 10,
    backgroundColor: "#D7D7D7",
  },
  dotActive: {
    backgroundColor: Colors.gold,
  },
  sectionHeader: {
    marginTop: 13,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    color: Colors.black,
    fontWeight: "400",
  },
  viewAll: {
    color: Colors.gold,
    fontSize: 12,
  },
  productRow: {
    flexDirection: "row",
    gap: 18,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EFEFEF",
    elevation: 3,
    shadowColor: Colors.black,
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  imageBox: {
    height: 108,
    backgroundColor: "#E2E2E2",
    position: "relative",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  heartButton: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  cardBody: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
  },
  productName: {
    fontWeight: "700",
    color: Colors.black,
    fontSize: 13,
  },
  price: {
    color: Colors.gold,
    fontWeight: "700",
    marginTop: 4,
    fontSize: 13,
  },
  sizeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
  },
  label: {
    color: Colors.black,
    fontSize: 12,
  },
  sizeCircle: {
    borderWidth: 1,
    borderColor: Colors.black,
    width: 20,
    height: 20,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  sizeText: {
    fontSize: 10,
    color: Colors.black,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 5,
  },
  status: {
    color: Colors.success,
    fontSize: 12,
  },
  detailButton: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailText: {
    color: Colors.gold,
    fontSize: 12,
    fontWeight: "600",
  },
  emptyText: {
    color: Colors.gray,
    textAlign: "center",
    marginVertical: 20,
    fontSize: 13,
  },
  bottomBanner: {
    backgroundColor: Colors.beige,
    borderRadius: 10,
    height: 92,
    marginTop: 18,
    marginHorizontal: 0,
    overflow: "hidden",
    flexDirection: "row",
  },
  bottomTextBox: {
    flex: 1,
    paddingLeft: 14,
    paddingRight: 8,
    justifyContent: "center",
  },
  bottomTitle: {
    color: Colors.black,
    fontWeight: "700",
    fontSize: 15,
  },
  bottomText: {
    color: Colors.black,
    fontWeight: "700",
    fontSize: 13,
    marginTop: 3,
    lineHeight: 16,
  },
  bottomImage: {
    width: 115,
    height: "100%",
  },
});