/* src/utils/excelHelpers.ts */

// #section Imports
import * as XLSX from 'xlsx';
import type { Category, Product } from '../db/schema.types';
// #end-section

// #interface CategoryExportData
/**
 * Datos de categoría para exportación a Excel.
 */
export interface CategoryExportData {
  name: string;
  description: string | null;
  imageUrl: string | null;
  textColor: string;
  backgroundMode: 'solid' | 'gradient';
  backgroundColor: string;
  gradientType: string | null;
  gradientAngle: number | null;
  gradientColors: string | null; // Formato: "#FF6B6B,#4ECDC4"
}
// #end-interface

// #interface ProductExportData
/**
 * Datos de producto para exportación a Excel.
 */
export interface ProductExportData {
  name: string;
  description: string | null;
  images: string | null; // URLs separadas por coma
  tags: string | null; // JSON stringificado
  basePrice: number;
  discount: number | null;
  hasStockControl: boolean;
  currentStock: number | null;
  stockAlertThreshold: number | null;
  stockStopThreshold: number | null;
  isAvailable: boolean;
  sortOrder: number;
}
// #end-interface

// #interface ParsedCategoryData
/**
 * Datos de categoría parseados desde Excel.
 */
export interface ParsedCategoryData {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  textColor: string;
  backgroundMode: 'solid' | 'gradient';
  backgroundColor: string;
  gradientConfig?: string | null; // JSON string completo para DB
}
// #end-interface

// #interface ParsedProductData
/**
 * Datos de producto parseados desde Excel.
 */
export interface ParsedProductData {
  name: string;
  description?: string | null;
  images?: string | null;
  tags?: string | null;
  basePrice: number;
  discount?: number | null;
  hasStockControl: boolean;
  currentStock?: number | null;
  stockAlertThreshold?: number | null;
  stockStopThreshold?: number | null;
  isAvailable: boolean;
  sortOrder: number;
}
// #end-interface

// #function generateCategoryExcel
/**
 * Genera un archivo Excel con los datos de una categoría y sus productos.
 * 
 * El archivo contiene 2 hojas:
 * - "Categoría": Configuración de la categoría (1 fila)
 * - "Productos": Lista de productos (N filas)
 * 
 * @param category - Categoría a exportar
 * @param products - Productos de la categoría
 * @returns Buffer del archivo Excel
 * 
 * @example
 * const buffer = generateCategoryExcel(category, products);
 * res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
 * res.setHeader('Content-Disposition', `attachment; filename="categoria-${category.name}.xlsx"`);
 * res.send(buffer);
 */
export function generateCategoryExcel(
  category: Category,
  products: Product[]
): Buffer {
  // Crear workbook
  const workbook = XLSX.utils.book_new();

  // ========================================
  // HOJA 1: Categoría
  // ========================================
  
  // Parsear gradientConfig si existe
  let gradientData: {
    type?: string;
    angle?: number;
    colors?: string[];
  } = {};

  if (category.gradientConfig) {
    try {
      gradientData = JSON.parse(category.gradientConfig);
    } catch {
      // Ignorar error de parsing
    }
  }

  const categoryData: CategoryExportData = {
    name: category.name,
    description: category.description || null,
    imageUrl: category.imageUrl || null,
    textColor: category.textColor,
    backgroundMode: category.backgroundMode,
    backgroundColor: category.backgroundColor,
    gradientType: gradientData.type || null,
    gradientAngle: gradientData.angle || null,
    gradientColors: gradientData.colors?.join(',') || null,
  };

  const categorySheet = XLSX.utils.json_to_sheet([categoryData]);
  XLSX.utils.book_append_sheet(workbook, categorySheet, 'Categoría');

  // ========================================
  // HOJA 2: Productos
  // ========================================
  
  const productsData: ProductExportData[] = products.map(product => {
    // Parsear images (JSON array a string separado por comas)
    let imagesString: string | null = null;
    if (product.images) {
      try {
        const imagesArray = JSON.parse(product.images);
        imagesString = Array.isArray(imagesArray) ? imagesArray.join(',') : null;
      } catch {
        imagesString = null;
      }
    }

    return {
      name: product.name,
      description: product.description || null,
      images: imagesString,
      tags: product.tags || null, // Ya viene como JSON string
      basePrice: parseFloat(product.basePrice.toString()),
      discount: product.discount ? parseFloat(product.discount.toString()) : null,
      hasStockControl: product.hasStockControl,
      currentStock: product.currentStock || null,
      stockAlertThreshold: product.stockAlertThreshold || null,
      stockStopThreshold: product.stockStopThreshold || null,
      isAvailable: product.isAvailable,
      sortOrder: product.sortOrder,
    };
  });

  const productsSheet = XLSX.utils.json_to_sheet(productsData);
  XLSX.utils.book_append_sheet(workbook, productsSheet, 'Productos');

  // ========================================
  // Generar Buffer
  // ========================================
  
  const excelBuffer = XLSX.write(workbook, {
    type: 'buffer',
    bookType: 'xlsx',
  });

  return excelBuffer;
}
// #end-function

// #function parseCategoryExcel
/**
 * Parsea un archivo Excel y extrae los datos de categoría y productos.
 * 
 * Espera un archivo con 2 hojas:
 * - "Categoría": Configuración de la categoría (1 fila)
 * - "Productos": Lista de productos (N filas)
 * 
 * @param fileBuffer - Buffer del archivo Excel
 * @returns Objeto con categoría y productos parseados
 * @throws Error si el formato del Excel es inválido
 * 
 * @example
 * const { category, products } = parseCategoryExcel(req.file.buffer);
 */
export function parseCategoryExcel(fileBuffer: Buffer): {
  category: ParsedCategoryData;
  products: ParsedProductData[];
} {
  // Leer workbook desde buffer
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

  // Validar que existan las hojas necesarias
  if (!workbook.SheetNames.includes('Categoría')) {
    throw new Error('El archivo Excel debe contener una hoja llamada "Categoría"');
  }

  if (!workbook.SheetNames.includes('Productos')) {
    throw new Error('El archivo Excel debe contener una hoja llamada "Productos"');
  }

  // ========================================
  // PARSEAR HOJA 1: Categoría
  // ========================================
  
  const categorySheet = workbook.Sheets['Categoría'];
  const categoryRows = XLSX.utils.sheet_to_json<CategoryExportData>(categorySheet);

  if (categoryRows.length === 0) {
    throw new Error('La hoja "Categoría" está vacía');
  }

  const categoryRaw = categoryRows[0];

  // Validar campos obligatorios
  if (!categoryRaw.name || typeof categoryRaw.name !== 'string') {
    throw new Error('La categoría debe tener un nombre válido');
  }

  if (!categoryRaw.textColor || typeof categoryRaw.textColor !== 'string') {
    throw new Error('La categoría debe tener un color de texto válido');
  }

  if (!categoryRaw.backgroundMode || !['solid', 'gradient'].includes(categoryRaw.backgroundMode)) {
    throw new Error('El modo de fondo debe ser "solid" o "gradient"');
  }

  if (!categoryRaw.backgroundColor || typeof categoryRaw.backgroundColor !== 'string') {
    throw new Error('La categoría debe tener un color de fondo válido');
  }

  // Construir gradientConfig si es modo gradient
  let gradientConfig: string | null = null;

  if (categoryRaw.backgroundMode === 'gradient') {
    if (!categoryRaw.gradientType || !categoryRaw.gradientColors) {
      throw new Error('Para modo gradient se requieren gradientType y gradientColors');
    }

    const gradientObject = {
      type: categoryRaw.gradientType,
      angle: categoryRaw.gradientAngle || 135,
      colors: categoryRaw.gradientColors.split(',').map(c => c.trim()),
    };

    gradientConfig = JSON.stringify(gradientObject);
  }

  const category: ParsedCategoryData = {
    name: categoryRaw.name.trim(),
    description: categoryRaw.description?.trim() || null,
    imageUrl: categoryRaw.imageUrl?.trim() || null,
    textColor: categoryRaw.textColor.trim(),
    backgroundMode: categoryRaw.backgroundMode,
    backgroundColor: categoryRaw.backgroundColor.trim(),
    gradientConfig,
  };

  // ========================================
  // PARSEAR HOJA 2: Productos
  // ========================================
  
  const productsSheet = workbook.Sheets['Productos'];
  const productsRows = XLSX.utils.sheet_to_json<ProductExportData>(productsSheet);

  if (productsRows.length === 0) {
    throw new Error('La hoja "Productos" está vacía. Debe haber al menos un producto.');
  }

  const products: ParsedProductData[] = productsRows.map((productRaw, index) => {
    // Validar campos obligatorios
    if (!productRaw.name || typeof productRaw.name !== 'string') {
      throw new Error(`Producto en fila ${index + 2}: debe tener un nombre válido`);
    }

    if (typeof productRaw.basePrice !== 'number' || productRaw.basePrice < 0) {
      throw new Error(`Producto "${productRaw.name}": debe tener un precio base válido`);
    }

    // Convertir images (string separado por comas a JSON array)
    let imagesJson: string | null = null;
    if (productRaw.images && typeof productRaw.images === 'string') {
      const imagesArray = productRaw.images.split(',').map(url => url.trim()).filter(url => url);
      imagesJson = JSON.stringify(imagesArray);
    }

    return {
      name: productRaw.name.trim(),
      description: productRaw.description?.trim() || null,
      images: imagesJson,
      tags: productRaw.tags || null,
      basePrice: productRaw.basePrice,
      discount: productRaw.discount || null,
      hasStockControl: productRaw.hasStockControl || false,
      currentStock: productRaw.currentStock || null,
      stockAlertThreshold: productRaw.stockAlertThreshold || null,
      stockStopThreshold: productRaw.stockStopThreshold || null,
      isAvailable: productRaw.isAvailable !== false, // Default true
      sortOrder: productRaw.sortOrder || 0,
    };
  });

  return { category, products };
}
// #end-function