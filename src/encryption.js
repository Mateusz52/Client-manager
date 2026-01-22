import CryptoJS from 'crypto-js'

// ============================================
// SZYFROWANIE DANYCH DLA WYBRANYCH KLIENTÓW
// ============================================

// 🔑 SEKRETNY KLUCZ - ZMIEŃ TO NA SWÓJ WŁASNY!
const ENCRYPTION_KEY = '*******'

// 📧 LISTA EMAILI DO ZASZYFROWANIA
// Dodaj tutaj emaile klientów których dane mają być zaszyfrowane
const ENCRYPTED_CLIENTS = [
  'mateusz.kowalski2255@wp.pl',
  'tajny@firma.pl',
  // Dodaj więcej emaili tutaj...
]

/**
 * Sprawdza czy email jest na liście zaszyfrowanych klientów
 */
export function isEncryptedClient(email) {
  if (!email) return false
  return ENCRYPTED_CLIENTS.includes(email.toLowerCase())
}

/**
 * Szyfruje tekst
 */
export function encrypt(text) {
  if (!text) return text
  return CryptoJS.AES.encrypt(String(text), ENCRYPTION_KEY).toString()
}

/**
 * Deszyfruje tekst
 */
export function decrypt(encryptedText) {
  if (!encryptedText) return encryptedText
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY)
    return bytes.toString(CryptoJS.enc.Utf8)
  } catch (error) {
    console.error('Błąd deszyfrowania:', error)
    return encryptedText
  }
}

/**
 * Szyfruje obiekt zamówienia (tylko wybrane pola)
 */
export function encryptOrder(order, userEmail) {
  // Jeśli nie jest zaszyfrowanym klientem, zwróć bez zmian
  if (!isEncryptedClient(userEmail)) {
    return order
  }

  // Pola do zaszyfrowania
  const encryptedOrder = { ...order }
  
  // Szyfruj dane klienta
  if (encryptedOrder.client) {
    encryptedOrder.client = encrypt(encryptedOrder.client)
  }
  
  // Szyfruj szczegóły produktu
  if (encryptedOrder.productDetails) {
    const encryptedDetails = {}
    for (const [key, value] of Object.entries(encryptedOrder.productDetails)) {
      encryptedDetails[key] = encrypt(String(value))
    }
    encryptedOrder.productDetails = encryptedDetails
  }
  
  // Opcjonalnie: szyfruj typ produktu
  if (encryptedOrder.type) {
    encryptedOrder.type = encrypt(encryptedOrder.type)
  }
  
  // Opcjonalnie: szyfruj cenę (jeśli chcesz)
  // if (encryptedOrder.price) {
  //   encryptedOrder.price = encrypt(String(encryptedOrder.price))
  // }
  
  // Dodaj flagę że dane są zaszyfrowane
  encryptedOrder._encrypted = true
  
  return encryptedOrder
}

/**
 * Deszyfruje obiekt zamówienia
 */
export function decryptOrder(order, userEmail) {
  // Jeśli nie ma flagi szyfrowania, zwróć bez zmian
  if (!order._encrypted) {
    return order
  }

  // Jeśli nie jest zaszyfrowanym klientem, zwróć bez zmian
  if (!isEncryptedClient(userEmail)) {
    return order
  }

  const decryptedOrder = { ...order }
  
  // Deszyfruj dane klienta
  if (decryptedOrder.client) {
    decryptedOrder.client = decrypt(decryptedOrder.client)
  }
  
  // Deszyfruj szczegóły produktu
  if (decryptedOrder.productDetails) {
    const decryptedDetails = {}
    for (const [key, value] of Object.entries(decryptedOrder.productDetails)) {
      decryptedDetails[key] = decrypt(value)
    }
    decryptedOrder.productDetails = decryptedDetails
  }
  
  // Deszyfruj typ produktu
  if (decryptedOrder.type) {
    decryptedOrder.type = decrypt(decryptedOrder.type)
  }
  
  // Opcjonalnie: deszyfruj cenę
  // if (decryptedOrder.price) {
  //   decryptedOrder.price = decrypt(decryptedOrder.price)
  // }
  
  // Usuń flagę szyfrowania z widoku
  delete decryptedOrder._encrypted
  
  return decryptedOrder
}

/**
 * Szyfruje tablicę zamówień
 */
export function encryptOrders(orders, userEmail) {
  if (!Array.isArray(orders)) return orders
  return orders.map(order => encryptOrder(order, userEmail))
}

/**
 * Deszyfruje tablicę zamówień
 */
export function decryptOrders(orders, userEmail) {
  if (!Array.isArray(orders)) return orders
  return orders.map(order => decryptOrder(order, userEmail))
}

/**
 * Dodaj email do listy zaszyfrowanych klientów (helper function)
 */
export function addEncryptedClient(email) {
  const lowerEmail = email.toLowerCase()
  if (!ENCRYPTED_CLIENTS.includes(lowerEmail)) {
    ENCRYPTED_CLIENTS.push(lowerEmail)
    console.log(`✅ Dodano ${email} do listy zaszyfrowanych klientów`)
  }
}

/**
 * Usuń email z listy zaszyfrowanych klientów
 */
export function removeEncryptedClient(email) {
  const lowerEmail = email.toLowerCase()
  const index = ENCRYPTED_CLIENTS.indexOf(lowerEmail)
  if (index > -1) {
    ENCRYPTED_CLIENTS.splice(index, 1)
    console.log(`✅ Usunięto ${email} z listy zaszyfrowanych klientów`)
  }
}

export default {
  isEncryptedClient,
  encrypt,
  decrypt,
  encryptOrder,
  decryptOrder,
  encryptOrders,
  decryptOrders,
  addEncryptedClient,
  removeEncryptedClient
}
