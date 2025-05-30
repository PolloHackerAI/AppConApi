"use client"

import { useState, useEffect } from "react"
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native"
import { StatusBar } from "expo-status-bar"
import { Ionicons } from "@expo/vector-icons"

// Sostituisci con il tuo endpoint MockAPI
const API_URL = "https://6826fabc397e48c913180c8d.mockapi.io/user"

// Dati di esempio da usare quando l'API non è disponibile
const SAMPLE_BOOKS = [
  {
    id: "1",
    title: "Il Nome della Rosa",
    author: "Umberto Eco",
    description: "Un'indagine in un'abbazia benedettina del XIV secolo.",
    publishedDate: "1980-01-01T00:00:00.000Z",
    coverImage: "https://picsum.photos/seed/book1/200/300",
    price: 12.99,
  },
  {
    id: "2",
    title: "1984",
    author: "George Orwell",
    description: "Un romanzo distopico ambientato in un futuro totalitario.",
    publishedDate: "1949-06-08T00:00:00.000Z",
    coverImage: "https://picsum.photos/seed/book2/200/300",
    price: 9.99,
  },
  {
    id: "3",
    title: "Il Piccolo Principe",
    author: "Antoine de Saint-Exupéry",
    description: "Un racconto poetico che affronta temi come l'amicizia e il senso della vita.",
    publishedDate: "1943-04-06T00:00:00.000Z",
    coverImage: "https://picsum.photos/seed/book3/200/300",
    price: 8.5,
  },
]

// URL dell'immagine placeholder
const PLACEHOLDER_IMAGE = "https://via.placeholder.com/80x120/cccccc/666666?text=Libro"

export default function App() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [addModalVisible, setAddModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [apiError, setApiError] = useState(false)
  const [currentBook, setCurrentBook] = useState(null)
  const [newBook, setNewBook] = useState({
    title: "",
    author: "",
    description: "",
    coverImage: "https://picsum.photos/200/300",
    price: "",
  })

  const fetchBooks = async () => {
    setLoading(true)
    setApiError(false)

    try {
      console.log("Fetching books from:", API_URL)
      const response = await fetch(API_URL)

      if (!response.ok) {
        console.error("API response not OK:", response.status, response.statusText)
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      const responseText = await response.text()
      console.log("Response text (first 100 chars):", responseText.substring(0, 100))

      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error("JSON parse error:", parseError)
        throw new Error("Impossibile interpretare la risposta come JSON")
      }

      if (!Array.isArray(data)) {
        console.error("API did not return an array:", typeof data)
        throw new Error("L'API non ha restituito un array di libri")
      }

      setBooks(data)
    } catch (error) {
      console.error("Error fetching books:", error)
      setBooks(SAMPLE_BOOKS)
      setApiError(true)

      Alert.alert(
        "Errore di connessione",
        "Impossibile connettersi all'API. Verranno mostrati dati di esempio. Dettaglio: " + error.message,
        [{ text: "OK" }],
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBooks()
  }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchBooks()
    setRefreshing(false)
  }

  const deleteBook = async (id) => {
    if (apiError) {
      setBooks(books.filter((book) => book.id !== id))
      return
    }

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`Errore HTTP: ${response.status}`)
      }

      setBooks(books.filter((book) => book.id !== id))
    } catch (error) {
      console.error("Errore nella cancellazione del libro:", error)
      Alert.alert("Errore", "Impossibile cancellare il libro: " + error.message)
    }
  }

  const addBook = async () => {
    if (!newBook.title || !newBook.author) {
      Alert.alert("Errore", "Titolo e autore sono obbligatori")
      return
    }

    const price = Number.parseFloat(newBook.price)
    if (isNaN(price) || price < 0) {
      Alert.alert("Errore", "Inserisci un prezzo valido")
      return
    }

    if (apiError) {
      const newId = (Math.max(...books.map((b) => Number.parseInt(b.id))) + 1).toString()
      const addedBook = {
        ...newBook,
        id: newId,
        publishedDate: new Date().toISOString(),
        price: Number.parseFloat(newBook.price),
      }
      setBooks([...books, addedBook])
      setAddModalVisible(false)
      setNewBook({
        title: "",
        author: "",
        description: "",
        coverImage: "https://picsum.photos/200/300",
        price: "",
      })
      return
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newBook,
          publishedDate: new Date().toISOString(),
          price: Number.parseFloat(newBook.price),
        }),
      })

      if (!response.ok) {
        throw new Error(`Errore HTTP: ${response.status}`)
      }

      const responseText = await response.text()
      let addedBook

      try {
        addedBook = JSON.parse(responseText)
      } catch (parseError) {
        throw new Error("Impossibile interpretare la risposta come JSON")
      }

      setBooks([...books, addedBook])
      setAddModalVisible(false)
      setNewBook({
        title: "",
        author: "",
        description: "",
        coverImage: "https://picsum.photos/200/300",
        price: "",
      })
    } catch (error) {
      console.error("Errore nell'aggiunta del libro:", error)
      Alert.alert("Errore", "Impossibile aggiungere il libro: " + error.message)
    }
  }

  const editBook = async () => {
    if (!currentBook.title || !currentBook.author) {
      Alert.alert("Errore", "Titolo e autore sono obbligatori")
      return
    }

    const price = Number.parseFloat(currentBook.price)
    if (isNaN(price) || price < 0) {
      Alert.alert("Errore", "Inserisci un prezzo valido")
      return
    }

    if (apiError) {
      setBooks(
        books.map((book) =>
          book.id === currentBook.id
            ? {
                ...currentBook,
                price: Number.parseFloat(currentBook.price),
              }
            : book,
        ),
      )
      setEditModalVisible(false)
      setCurrentBook(null)
      return
    }

    try {
      const response = await fetch(`${API_URL}/${currentBook.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...currentBook,
          price: Number.parseFloat(currentBook.price),
        }),
      })

      if (!response.ok) {
        throw new Error(`Errore HTTP: ${response.status}`)
      }

      const responseText = await response.text()
      let updatedBook

      try {
        updatedBook = JSON.parse(responseText)
      } catch (parseError) {
        throw new Error("Impossibile interpretare la risposta come JSON")
      }

      setBooks(books.map((book) => (book.id === updatedBook.id ? updatedBook : book)))
      setEditModalVisible(false)
      setCurrentBook(null)
    } catch (error) {
      console.error("Errore nella modifica del libro:", error)
      Alert.alert("Errore", "Impossibile modificare il libro: " + error.message)
    }
  }

  const openEditModal = (book) => {
    setCurrentBook({
      ...book,
      price: book.price ? book.price.toString() : "0",
    })
    setEditModalVisible(true)
  }

  const filteredBooks = books.filter((book) => {
    const searchTermLower = searchTerm.toLowerCase()
    return book.title.toLowerCase().includes(searchTermLower) || book.author.toLowerCase().includes(searchTermLower)
  })

  const formatPrice = (price) => {
    if (price === undefined || price === null) return "N/D"
    return `€${Number.parseFloat(price).toFixed(2)}`
  }

  const renderItem = ({ item }) => (
    <View style={styles.bookItem}>
      <Image
        source={{ uri: item.coverImage || PLACEHOLDER_IMAGE }}
        style={styles.coverImage}
        onError={() => {
          console.log("Errore caricamento immagine per:", item.title)
        }}
      />
      <View style={styles.bookInfo}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.author}>di {item.author}</Text>
        <Text style={styles.date}>Pubblicato: {new Date(item.publishedDate).toLocaleDateString()}</Text>
        <Text style={styles.price}>{formatPrice(item.price)}</Text>
        <Text numberOfLines={2} style={styles.description}>
          {item.description}
        </Text>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.editButton} onPress={() => openEditModal(item)}>
          <Ionicons name="pencil-outline" size={24} color="#3498db" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
            Alert.alert("Conferma", `Vuoi davvero eliminare "${item.title}"?`, [
              { text: "Annulla", style: "cancel" },
              { text: "Elimina", onPress: () => deleteBook(item.id), style: "destructive" },
            ])
          }}
        >
          <Ionicons name="trash-outline" size={24} color="red" />
        </TouchableOpacity>
      </View>
    </View>
  )

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Caricamento in corso...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>La Mia Libreria</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setAddModalVisible(true)}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {apiError && (
        <View style={styles.errorBanner}>
          <Ionicons name="warning-outline" size={20} color="white" />
          <Text style={styles.errorText}>Modalità offline: utilizzo dati di esempio</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
            <Text style={styles.retryText}>Riprova</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cerca per titolo o autore..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          clearButtonMode="while-editing"
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity onPress={() => setSearchTerm("")} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredBooks}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#3498db"]} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {books.length === 0 ? "Nessun libro disponibile" : "Nessun risultato trovato"}
            </Text>
          </View>
        }
      />

      {/* Modal per aggiungere un nuovo libro */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={addModalVisible}
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Aggiungi Nuovo Libro</Text>

            <TextInput
              style={styles.input}
              placeholder="Titolo"
              value={newBook.title}
              onChangeText={(text) => setNewBook({ ...newBook, title: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Autore"
              value={newBook.author}
              onChangeText={(text) => setNewBook({ ...newBook, author: text })}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Descrizione"
              multiline
              numberOfLines={4}
              value={newBook.description}
              onChangeText={(text) => setNewBook({ ...newBook, description: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="URL Immagine di copertina"
              value={newBook.coverImage}
              onChangeText={(text) => setNewBook({ ...newBook, coverImage: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Prezzo (€)"
              value={newBook.price}
              onChangeText={(text) => setNewBook({ ...newBook, price: text })}
              keyboardType="decimal-pad"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setAddModalVisible(false)}
              >
                <Text style={styles.buttonText}>Annulla</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={addBook}>
                <Text style={styles.buttonText}>Salva</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal per modificare un libro esistente */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Modifica Libro</Text>

            {currentBook && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Titolo"
                  value={currentBook.title}
                  onChangeText={(text) => setCurrentBook({ ...currentBook, title: text })}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Autore"
                  value={currentBook.author}
                  onChangeText={(text) => setCurrentBook({ ...currentBook, author: text })}
                />

                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Descrizione"
                  multiline
                  numberOfLines={4}
                  value={currentBook.description}
                  onChangeText={(text) => setCurrentBook({ ...currentBook, description: text })}
                />

                <TextInput
                  style={styles.input}
                  placeholder="URL Immagine di copertina"
                  value={currentBook.coverImage}
                  onChangeText={(text) => setCurrentBook({ ...currentBook, coverImage: text })}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Prezzo (€)"
                  value={currentBook.price}
                  onChangeText={(text) => setCurrentBook({ ...currentBook, price: text })}
                  keyboardType="decimal-pad"
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setEditModalVisible(false)}
                  >
                    <Text style={styles.buttonText}>Annulla</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={editBook}>
                    <Text style={styles.buttonText}>Aggiorna</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: "#3498db",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e74c3c",
    padding: 10,
    paddingHorizontal: 16,
  },
  errorText: {
    color: "white",
    flex: 1,
    marginLeft: 8,
  },
  retryButton: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  retryText: {
    color: "white",
    fontWeight: "bold",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 8,
    margin: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  list: {
    padding: 16,
  },
  bookItem: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  coverImage: {
    width: 80,
    height: 120,
    borderRadius: 4,
    backgroundColor: "#f0f0f0",
  },
  bookInfo: {
    flex: 1,
    marginLeft: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  author: {
    fontSize: 16,
    color: "#666",
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: "#888",
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    color: "#2ecc71",
    fontWeight: "bold",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#444",
  },
  actionButtons: {
    justifyContent: "center",
  },
  editButton: {
    padding: 8,
    marginBottom: 8,
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#e74c3c",
  },
  saveButton: {
    backgroundColor: "#3498db",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
})
