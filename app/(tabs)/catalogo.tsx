import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import { get, ref, remove, set, update } from "firebase/database";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
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

type Producto = {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  tallas: string[] | string;
  estado: string;
  color: string;
  descripcion: string;
  imagen: string;
  destacado?: boolean;
};

export default function CatalogoScreen() {
  const router = useRouter();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("Todos");
  const [usuario, setUsuario] = useState<User | null>(null);
  const [rol, setRol] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
  const [editId, setEditId] = useState("");

  const [editNombre, setEditNombre] = useState("");
  const [editCategoria, setEditCategoria] = useState("");
  const [editPrecio, setEditPrecio] = useState("");
  const [editTallas, setEditTallas] = useState("");
  const [editEstado, setEditEstado] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editDescripcion, setEditDescripcion] = useState("");
  const [editImagen, setEditImagen] = useState("");
  const [editDestacado, setEditDestacado] = useState(false);

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
          setRol(datos.rol || "cliente");
        } else {
          setRol("cliente");
        }
      } else {
        setRol("");
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      const productosRef = ref(database, "prendas");
      const snapshot = await get(productosRef);

      if (snapshot.exists()) {
        const data = snapshot.val();

        const listaProductos: Producto[] = Object.keys(data).map((id) => ({
          id: id,
          ...data[id],
        }));

        setProductos(listaProductos);
      } else {
        setProductos([]);
      }
    } catch (error) {
      showMessage("No se pudieron cargar los productos.");
    }
  };

  const agregarFavorito = async (idProducto: string) => {
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

  const agregarCarrito = async (producto: Producto) => {
    if (!usuario) {
      showMessage("Debes iniciar sesión para agregar productos al carrito.");
      router.push("/login");
      return;
    }

    if (rol === "admin") {
      showMessage("El administrador no puede usar carrito.");
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

  const cambiarDestacado = async (idProducto: string, valor: boolean) => {
    if (rol !== "admin") {
      showMessage("Solo el administrador puede modificar destacados.");
      return;
    }

    try {
      await update(ref(database, "prendas/" + idProducto), {
        destacado: valor,
      });

      setProductos((listaActual) =>
        listaActual.map((producto) =>
          producto.id === idProducto
            ? { ...producto, destacado: valor }
            : producto
        )
      );

      showMessage(
        valor
          ? "Producto agregado a destacados."
          : "Producto quitado de destacados."
      );
    } catch (error) {
      showMessage("No se pudo actualizar el producto.");
    }
  };

  const abrirEditar = (producto: Producto) => {
    setEditId(producto.id);
    setEditNombre(producto.nombre);
    setEditCategoria(producto.categoria);
    setEditPrecio(String(producto.precio));
    setEditTallas(
      Array.isArray(producto.tallas)
        ? producto.tallas.join(",")
        : producto.tallas
    );
    setEditEstado(producto.estado);
    setEditColor(producto.color || "");
    setEditDescripcion(producto.descripcion || "");
    setEditImagen(producto.imagen || "");
    setEditDestacado(producto.destacado === true);

    setModalVisible(true);
  };

  const guardarEdicion = async () => {
    if (
      editNombre === "" ||
      editCategoria === "" ||
      editPrecio === "" ||
      editTallas === "" ||
      editEstado === "" ||
      editColor === "" ||
      editDescripcion === ""
    ) {
      showMessage("Completa los campos obligatorios.");
      return;
    }

    const precioNumero = parseFloat(editPrecio);

    if (isNaN(precioNumero) || precioNumero <= 0) {
      showMessage("Ingresa un precio válido.");
      return;
    }

    const tallasArray = editTallas
      .split(",")
      .map((talla) => talla.trim())
      .filter((talla) => talla !== "");

    const datosActualizados = {
      nombre: editNombre,
      categoria: editCategoria,
      precio: precioNumero,
      tallas: tallasArray,
      estado: editEstado,
      color: editColor,
      descripcion: editDescripcion,
      imagen:
        editImagen ||
        "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600",
      destacado: editDestacado,
    };

    try {
      await update(ref(database, "prendas/" + editId), datosActualizados);

      setProductos((listaActual) =>
        listaActual.map((producto) =>
          producto.id === editId
            ? {
                id: editId,
                ...datosActualizados,
              }
            : producto
        )
      );

      setModalVisible(false);
      showMessage("Producto actualizado correctamente.");
    } catch (error) {
      showMessage("No se pudo actualizar el producto.");
    }
  };

  const confirmarEliminar = (idProducto: string) => {
    if (rol !== "admin") {
      showMessage("Solo el administrador puede eliminar productos.");
      return;
    }

    if (Platform.OS === "web") {
      const confirmar = confirm("¿Deseas eliminar este producto?");
      if (confirmar) {
        eliminarProducto(idProducto);
      }
    } else {
      Alert.alert("Eliminar producto", "¿Deseas eliminar este producto?", [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => eliminarProducto(idProducto),
        },
      ]);
    }
  };

  const eliminarProducto = async (idProducto: string) => {
    try {
      await remove(ref(database, "prendas/" + idProducto));

      setProductos((listaActual) =>
        listaActual.filter((producto) => producto.id !== idProducto)
      );

      showMessage("Producto eliminado correctamente.");
    } catch (error) {
      showMessage("No se pudo eliminar el producto.");
    }
  };

  const categorias = [
    "Todos",
    ...Array.from(new Set(productos.map((producto) => producto.categoria))),
  ];

  const productosFiltrados = productos.filter((producto) => {
    const textoBusqueda = busqueda.toLowerCase();

    const coincideNombre = producto.nombre
      .toLowerCase()
      .includes(textoBusqueda);

    const coincideCategoriaBusqueda = producto.categoria
      .toLowerCase()
      .includes(textoBusqueda);

    const coincideCategoria =
      categoria === "Todos" || producto.categoria === categoria;

    return (coincideNombre || coincideCategoriaBusqueda) && coincideCategoria;
  });

  return (
    <View style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity>
            <Ionicons name="menu-outline" size={28} color={Colors.black} />
          </TouchableOpacity>

          <Text style={styles.logo}>ModaStore</Text>

          <View style={styles.headerRight}>
            <Ionicons name="logo-whatsapp" size={24} color="#18A84A" />

            {rol !== "admin" && (
              <TouchableOpacity
                onPress={() => {
                  if (usuario) {
                    router.push("/carrito");
                  } else {
                    router.push("/login");
                  }
                }}
              >
                <Ionicons name="cart-outline" size={24} color={Colors.black} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Text style={styles.title}>Catálogo</Text>

        <View style={styles.searchBox}>
          <TextInput
            style={styles.input}
            placeholder="Buscar prendas, categorías o estilos..."
            placeholderTextColor="#B8B8B8"
            value={busqueda}
            onChangeText={setBusqueda}
          />

          <Ionicons name="search-outline" size={22} color={Colors.gray} />
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterText}>Filtrar</Text>
            <Ionicons name="options-outline" size={14} color={Colors.gold} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterText}>Categorías</Text>
            <Ionicons
              name="chevron-down-outline"
              size={14}
              color={Colors.gold}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterText}>Tallas</Text>
            <Ionicons
              name="chevron-down-outline"
              size={14}
              color={Colors.gold}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.orderButton}>
            <Text style={styles.filterText}>Ordenar</Text>
            <Ionicons
              name="swap-vertical-outline"
              size={15}
              color={Colors.gold}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.resultText}>
          {productosFiltrados.length} productos encontrados
        </Text>

       
        {productosFiltrados.length === 0 ? (
          <Text style={styles.emptyText}>No hay productos para mostrar.</Text>
        ) : (
          <FlatList
            data={productosFiltrados}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.productList}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.imageBox}>
                  <Image source={{ uri: item.imagen }} style={styles.image} />

                  {rol !== "admin" && (
                    <TouchableOpacity
                      style={styles.heartButton}
                      onPress={() => agregarFavorito(item.id)}
                    >
                      <Ionicons
                        name="heart-outline"
                        size={24}
                        color={Colors.black}
                      />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.productName} numberOfLines={1}>
                    {item.nombre}
                  </Text>

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

                  {rol === "admin" && (
                    <>
                      <View style={styles.destacadoBox}>
                        <Text style={styles.destacadoText}>Destacado</Text>

                        <Switch
                          value={item.destacado === true}
                          onValueChange={(valor) =>
                            cambiarDestacado(item.id, valor)
                          }
                        />
                      </View>

                      <View style={styles.adminActions}>
                        <TouchableOpacity
                          style={styles.editButton}
                          onPress={() => abrirEditar(item)}
                        >
                          <Text style={styles.editText}>Editar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => confirmarEliminar(item.id)}
                        >
                          <Text style={styles.deleteText}>Eliminar</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}

                  {rol !== "admin" && (
                    <TouchableOpacity
                      style={styles.cartButton}
                      onPress={() => agregarCarrito(item)}
                    >
                      <Ionicons
                        name="cart-outline"
                        size={15}
                        color={Colors.white}
                      />
                      <Text style={styles.cartText}>Agregar al carrito</Text>
                    </TouchableOpacity>
                  )}

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
                    <Text style={styles.detailText}>&gt;</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Editar producto</Text>

              <TextInput
                style={styles.modalInput}
                placeholder="Nombre"
                value={editNombre}
                onChangeText={setEditNombre}
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Categoría"
                value={editCategoria}
                onChangeText={setEditCategoria}
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Precio"
                value={editPrecio}
                onChangeText={setEditPrecio}
                keyboardType="numeric"
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Tallas separadas por coma"
                value={editTallas}
                onChangeText={setEditTallas}
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Estado"
                value={editEstado}
                onChangeText={setEditEstado}
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Color"
                value={editColor}
                onChangeText={setEditColor}
              />

              <TextInput
                style={[styles.modalInput, styles.textArea]}
                placeholder="Descripción"
                value={editDescripcion}
                onChangeText={setEditDescripcion}
                multiline
              />

              <TextInput
                style={styles.modalInput}
                placeholder="URL de imagen"
                value={editImagen}
                onChangeText={setEditImagen}
              />

              <View style={styles.switchRow}>
                <Text style={styles.switchText}>Producto destacado</Text>

                <Switch
                  value={editDestacado}
                  onValueChange={setEditDestacado}
                />
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={guardarEdicion}
              >
                <Text style={styles.saveText}>Guardar cambios</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
            </ScrollView>
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
    flex: 1,
    width: "100%",
    maxWidth: 360,
    alignSelf: "center",
    paddingHorizontal: 8,
    paddingTop: 18,
    backgroundColor: Colors.white,
  },
  header: {
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    fontSize: 25,
    color: Colors.black,
    fontWeight: "400",
    fontFamily: titleFont,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "400",
    color: Colors.black,
    marginTop: 2,
    marginBottom: 10,
    textAlign: "left",
    fontFamily: titleFont,
  },
  searchBox: {
    height: 42,
    borderWidth: 1,
    borderColor: Colors.beige,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
    backgroundColor: Colors.white,
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    fontSize: 12,
    color: Colors.black,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 9,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.beige,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: Colors.white,
  },
  orderButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 4,
    paddingVertical: 5,
  },
  filterText: {
    fontSize: 11,
    color: Colors.black,
  },
  resultText: {
    color: Colors.black,
    fontSize: 11,
    marginBottom: 8,
  },
  categoryList: {
    gap: 8,
    paddingBottom: 12,
  },
  categoryButton: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: Colors.beige,
    marginRight: 8,
  },
  categoryActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  categoryText: {
    color: Colors.black,
    fontSize: 11,
    fontWeight: "600",
  },
  categoryTextActive: {
    color: Colors.white,
  },
  productList: {
    paddingBottom: 110,
  },
  row: {
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    backgroundColor: Colors.white,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EFEFEF",
    elevation: 3,
    shadowColor: Colors.black,
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  imageBox: {
    height: 115,
    backgroundColor: "#E2E2E2",
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
  },
  cardBody: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
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
  destacadoBox: {
    marginTop: 10,
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  destacadoText: {
    color: Colors.black,
    fontSize: 12,
    fontWeight: "600",
  },
  adminActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 9,
  },
  editButton: {
    flex: 1,
    backgroundColor: Colors.gold,
    borderRadius: 8,
    paddingVertical: 7,
  },
  editText: {
    color: Colors.white,
    fontWeight: "700",
    textAlign: "center",
    fontSize: 12,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: Colors.danger,
    borderRadius: 8,
    paddingVertical: 7,
  },
  deleteText: {
    color: Colors.white,
    fontWeight: "700",
    textAlign: "center",
    fontSize: 12,
  },
  cartButton: {
    backgroundColor: Colors.gold,
    borderRadius: 8,
    paddingVertical: 7,
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },
  cartText: {
    color: Colors.white,
    fontWeight: "700",
    textAlign: "center",
    fontSize: 11,
  },
  detailButton: {
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailText: {
    color: Colors.gold,
    fontSize: 12,
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    color: Colors.gray,
    marginTop: 40,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    padding: 20,
    maxHeight: "90%",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.black,
    textAlign: "center",
    marginBottom: 18,
  },
  modalInput: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.beige,
    borderRadius: 12,
    padding: 13,
    marginBottom: 12,
  },
  textArea: {
    height: 90,
    textAlignVertical: "top",
  },
  switchRow: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchText: {
    color: Colors.black,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: Colors.gold,
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  saveText: {
    color: Colors.white,
    fontWeight: "700",
    textAlign: "center",
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: Colors.gold,
    padding: 14,
    borderRadius: 14,
  },
  cancelText: {
    color: Colors.gold,
    fontWeight: "700",
    textAlign: "center",
  },
});