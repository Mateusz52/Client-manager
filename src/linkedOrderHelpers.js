/* ================================
   HELPER FUNCTIONS - ZAMÓWIENIA ŁĄCZONE
   ================================ */

/**
 * Oblicza całkowitą wartość zamówienia (główny produkt + linked products)
 * @param {Object} order - Obiekt zamówienia
 * @returns {number} - Całkowita wartość
 */
export const getOrderTotalValue = (order) => {
	// Wartość głównego produktu
	let total = order.quantity * order.price
	
	// Dodaj wartości dodatkowych produktów
	if (order.isLinked && order.linkedProducts && Array.isArray(order.linkedProducts)) {
		order.linkedProducts.forEach(product => {
			total += (product.quantity * product.price)
		})
	}
	
	return total
}

/**
 * Oblicza całkowitą ilość różnych produktów w zamówieniu
 * @param {Object} order - Obiekt zamówienia
 * @returns {number} - Liczba produktów
 */
export const getTotalProductsCount = (order) => {
	let count = 1 // główny produkt
	
	if (order.isLinked && order.linkedProducts && Array.isArray(order.linkedProducts)) {
		count += order.linkedProducts.length
	}
	
	return count
}

/**
 * Zwraca tablicę wszystkich produktów (główny + linked)
 * @param {Object} order - Obiekt zamówienia
 * @returns {Array} - Tablica produktów
 */
export const getAllProducts = (order) => {
	const products = [
		{
			type: order.type,
			quantity: order.quantity,
			price: order.price,
			currency: order.currency,
			unit: order.unit,
			productDetails: order.productDetails || {}
		}
	]
	
	if (order.isLinked && order.linkedProducts && Array.isArray(order.linkedProducts)) {
		products.push(...order.linkedProducts)
	}
	
	return products
}

/**
 * Sprawdza czy zamówienie jest łączone
 * @param {Object} order - Obiekt zamówienia
 * @returns {boolean}
 */
export const isLinkedOrder = (order) => {
	return order.isLinked === true && 
	       order.linkedProducts && 
	       Array.isArray(order.linkedProducts) && 
	       order.linkedProducts.length > 0
}

/**
 * Formatuje cenę z walutą
 * @param {number} value - Wartość
 * @param {string} currency - Waluta
 * @returns {string}
 */
export const formatPrice = (value, currency = 'PLN') => {
	return `${value.toFixed(2)} ${currency}`
}

// ================================
// UŻYCIE W STATISTICS
// ================================

/*
// W Statistics.jsx zamiast:
const totalRevenue = filteredOrders
	.filter(o => o.transactionType === 'sprzedaz')
	.reduce((sum, order) => sum + (order.quantity * order.price), 0)

// Użyj:
import { getOrderTotalValue } from './linkedOrderHelpers'

const totalRevenue = filteredOrders
	.filter(o => o.transactionType === 'sprzedaz')
	.reduce((sum, order) => sum + getOrderTotalValue(order), 0)
*/

// ================================
// UŻYCIE W PDFEXPORT
// ================================

/*
// W PDFExport.js:
import { getAllProducts, getOrderTotalValue } from './linkedOrderHelpers'

// Zamiast pojedynczego produktu:
doc.text(`Produkt: ${order.type}`, 20, yPosition)
doc.text(`Ilość: ${order.quantity} ${order.unit}`, 20, yPosition + 7)

// Użyj:
const products = getAllProducts(order)
products.forEach((product, index) => {
	doc.text(`Produkt ${index + 1}: ${product.type}`, 20, yPosition)
	yPosition += 7
	doc.text(`Ilość: ${product.quantity} ${product.unit}`, 25, yPosition)
	yPosition += 7
	doc.text(`Cena: ${product.price} ${product.currency}/${product.unit}`, 25, yPosition)
	yPosition += 7
	doc.text(`Wartość: ${(product.quantity * product.price).toFixed(2)} ${product.currency}`, 25, yPosition)
	yPosition += 10
})

// Łączna wartość
const totalValue = getOrderTotalValue(order)
doc.text(`ŁĄCZNA WARTOŚĆ: ${totalValue.toFixed(2)} ${order.currency}`, 20, yPosition)
*/

// ================================
// UŻYCIE W ORDERSTABLE
// ================================

/*
// W OrdersTable.jsx:
import { getOrderTotalValue, getTotalProductsCount } from './linkedOrderHelpers'

// W szczegółach zamówienia:
<div className='total-value-section'>
	<strong>Łączna wartość zamówienia:</strong>
	<span className='total-value'>
		{getOrderTotalValue(order).toFixed(2)} {order.currency}
	</span>
</div>

// W kolumnie produktów:
{order.isLinked ? (
	<div className='linked-products-badge'>
		🔗 {order.type} +{getTotalProductsCount(order) - 1} więcej
	</div>
) : (
	order.type
)}
*/
