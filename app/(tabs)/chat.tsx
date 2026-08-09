import { Ionicons } from "@expo/vector-icons";
import { onAuthStateChanged, User } from "firebase/auth";
import { get, ref } from "firebase/database";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import Colors from "../../constants/Colors";
import { auth, database, firestore } from "../../firebaseConfig";

type Mensaje = {
  id: string;
  texto: string;
  emisorId: string;
  emisorRol: string;
  emisorNombre: string;
  fecha: number;
};

type Chat = {
  id: string;
  clienteId: string;
  clienteNombre: string;
  clienteCorreo: string;
  ultimoMensaje: string;
  ultimaFecha: number;
};

export default function ChatScreen() {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [rol, setRol] = useState("");
  const [nombre, setNombre] = useState("");
  const [texto, setTexto] = useState("");
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [chatSeleccionado, setChatSeleccionado] = useState("");

  const showMessage = (mensaje: string) => {
    if (Platform.OS === "web") {
      alert(mensaje);
    } else {
      Alert.alert(mensaje);
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
          setNombre(datos.nombre || "Usuario");
        } else {
          setRol("cliente");
          setNombre("Usuario");
        }
      } else {
        setRol("");
        setNombre("");
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!usuario || rol !== "admin") return;

    const chatsRef = collection(firestore, "mensajes");

    const unsubscribe = onSnapshot(chatsRef, (snapshot) => {
      const lista: Chat[] = snapshot.docs.map((documento) => {
        const data = documento.data();

        return {
          id: documento.id,
          clienteId: data.clienteId || "",
          clienteNombre: data.clienteNombre || "Cliente",
          clienteCorreo: data.clienteCorreo || "",
          ultimoMensaje: data.ultimoMensaje || "",
          ultimaFecha: data.ultimaFecha || 0,
        };
      });

      lista.sort((a, b) => b.ultimaFecha - a.ultimaFecha);
      setChats(lista);
    });

    return unsubscribe;
  }, [usuario, rol]);

  useEffect(() => {
    if (!usuario) return;

    const idChat = rol === "admin" ? chatSeleccionado : usuario.uid;

    if (!idChat) return;

    const mensajesRef = collection(
      firestore,
      "mensajes",
      idChat,
      "conversacion"
    );

    const mensajesQuery = query(mensajesRef, orderBy("fecha", "asc"));

    const unsubscribe = onSnapshot(mensajesQuery, (snapshot) => {
      const lista: Mensaje[] = snapshot.docs.map((documento) => {
        const data = documento.data();

        return {
          id: documento.id,
          texto: data.texto || "",
          emisorId: data.emisorId || "",
          emisorRol: data.emisorRol || "",
          emisorNombre: data.emisorNombre || "",
          fecha: data.fecha || 0,
        };
      });

      setMensajes(lista);
    });

    return unsubscribe;
  }, [usuario, rol, chatSeleccionado]);

  const enviarMensaje = async () => {
    if (!usuario) {
      showMessage("Debes iniciar sesión para usar el chat.");
      return;
    }

    if (texto.trim() === "") {
      showMessage("Escribe un mensaje.");
      return;
    }

    const idChat = rol === "admin" ? chatSeleccionado : usuario.uid;

    if (!idChat) {
      showMessage("Selecciona un chat.");
      return;
    }

    const fechaActual = Date.now();
    const textoMensaje = texto.trim();

    const chatRef = doc(firestore, "mensajes", idChat);

    await setDoc(
      chatRef,
      {
        clienteId: rol === "cliente" ? usuario.uid : idChat,
        clienteNombre: rol === "cliente" ? nombre : "",
        clienteCorreo: rol === "cliente" ? usuario.email : "",
        ultimoMensaje: textoMensaje,
        ultimaFecha: fechaActual,
        creadoEn: fechaActual,
      },
      { merge: true }
    );

    await addDoc(collection(firestore, "mensajes", idChat, "conversacion"), {
      texto: textoMensaje,
      emisorId: usuario.uid,
      emisorRol: rol,
      emisorNombre: rol === "admin" ? "Administrador" : nombre,
      fecha: fechaActual,
    });

    setTexto("");
  };

  const formatearHora = (fecha: number) => {
    if (!fecha) return "";

    return new Date(fecha).toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!usuario) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Chat</Text>
        <Text style={styles.text}>Debes iniciar sesión para usar el chat.</Text>
      </View>
    );
  }

  if (rol === "admin" && chatSeleccionado === "") {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Mensajes de clientes</Text>

        {chats.length === 0 ? (
          <Text style={styles.text}>Aún no hay mensajes.</Text>
        ) : (
          <FlatList
            data={chats}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.chatCard}
                onPress={() => setChatSeleccionado(item.id)}
              >
                <Text style={styles.chatName}>{item.clienteNombre}</Text>
                <Text style={styles.chatEmail}>{item.clienteCorreo}</Text>
                <Text style={styles.chatMessage}>{item.ultimoMensaje}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        {rol === "admin" && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setChatSeleccionado("");
              setMensajes([]);
            }}
          >
            <Ionicons
              name="chevron-back-outline"
              size={24}
              color={Colors.gold}
            />
          </TouchableOpacity>
        )}

        <Text style={styles.title}>
          {rol === "admin" ? "Responder cliente" : "Chat con la tienda"}
        </Text>
      </View>

      <FlatList
        data={mensajes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        renderItem={({ item }) => {
          const esMio = item.emisorId === usuario.uid;

          return (
            <View
              style={[
                styles.messageBox,
                esMio ? styles.messageRight : styles.messageLeft,
              ]}
            >
              <Text style={styles.messageAuthor}>{item.emisorNombre}</Text>
              <Text style={styles.messageText}>{item.texto}</Text>
              <Text style={styles.messageTime}>{formatearHora(item.fecha)}</Text>
            </View>
          );
        }}
      />

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Escribe un mensaje..."
          placeholderTextColor={Colors.gray}
          value={texto}
          onChangeText={setTexto}
          style={styles.input}
        />

        <TouchableOpacity style={styles.sendButton} onPress={enviarMensaje}>
          <Ionicons name="send" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
  },
  center: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  backButton: {
    marginRight: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.black,
    marginBottom: 14,
  },
  text: {
    color: Colors.gray,
    textAlign: "center",
  },
  chatCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.beige,
  },
  chatName: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.black,
  },
  chatEmail: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 2,
  },
  chatMessage: {
    fontSize: 14,
    color: Colors.black,
    marginTop: 8,
  },
  messageList: {
    paddingBottom: 14,
  },
  messageBox: {
    maxWidth: "78%",
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
  },
  messageLeft: {
    backgroundColor: Colors.white,
    alignSelf: "flex-start",
  },
  messageRight: {
    backgroundColor: Colors.beige,
    alignSelf: "flex-end",
  },
  messageAuthor: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.gray,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: Colors.black,
  },
  messageTime: {
    fontSize: 10,
    color: Colors.gray,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  inputContainer: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.beige,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    color: Colors.black,
  },
  sendButton: {
    backgroundColor: Colors.gold,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
});