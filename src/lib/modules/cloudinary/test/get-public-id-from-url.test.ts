// get-public-id-from-url.test.ts
/* #info - Jest test for Cloudinary getPublicIdFromUrl */
// #section Imports
import { getPublicIdFromUrl } from '../cloudinary';
import { ValidationError } from '../cloudinary.errors';
// #end-section

// #section Tests
describe('Cloudinary - getPublicIdFromUrl', () => {
	// #test - URL vacía o inválida
	/**
	 * Verifica que lanza ValidationError si la URL es vacía, no string o no válida.
	 * @version 1.0.0
	 */
	test('falla con ValidationError si la URL es vacía o no válida', () => {
		// #step 1 - URL vacía
		expect(() => getPublicIdFromUrl('')).toThrow(ValidationError);
		// #end-step
		// #step 2 - Solo espacios
		expect(() => getPublicIdFromUrl('   ')).toThrow(ValidationError);
		// #end-step
		// #step 3 - Formato inválido (no es URL)
		expect(() => getPublicIdFromUrl('esto-no-es-una-url')).toThrow(ValidationError);
		// #end-step
	});
	// #end-test

	// #test - URL no Cloudinary
	/**
	 * Verifica que lanza ValidationError si la URL no es de Cloudinary.
	 * @version 1.0.0
	 */
	test('falla con ValidationError si la URL no es de Cloudinary', () => {
		expect(() => getPublicIdFromUrl('https://example.com/image.jpg')).toThrow(ValidationError);
		expect(() => getPublicIdFromUrl('https://images.unsplash.com/photo.jpg')).toThrow(ValidationError);
	});
	// #end-test

	// #test - URL sin /upload/
	/**
	 * Verifica que lanza ValidationError si la URL de Cloudinary no contiene /upload/.
	 * @version 1.0.0
	 */
	test('falla con ValidationError si la URL no contiene /upload/', () => {
		expect(() => getPublicIdFromUrl('https://res.cloudinary.com/demo/image/fetch/https://example.com/img.jpg')).toThrow(ValidationError);
	});
	// #end-test

	// #test - URL estándar con versión
	/**
	 * Verifica extracción correcta de una URL estándar con versión.
	 * @version 1.0.0
	 */
	test('extrae publicId de URL estándar con versión', () => {
		// #step 1 - Ejecutar
		const result = getPublicIdFromUrl(
			'https://res.cloudinary.com/demo/image/upload/v1234567890/my-folder/my-image.jpg'
		);
		// #end-step
		// #step 2 - Verificar
		expect(result).toEqual({
			publicId: 'my-folder/my-image',
			folder: 'my-folder',
			fileName: 'my-image',
			format: 'jpg',
		});
		// #end-step
	});
	// #end-test

	// #test - URL sin versión
	/**
	 * Verifica extracción correcta de una URL sin segmento de versión.
	 * @version 1.0.0
	 */
	test('extrae publicId de URL sin versión', () => {
		const result = getPublicIdFromUrl(
			'https://res.cloudinary.com/demo/image/upload/my-folder/my-image.png'
		);

		expect(result).toEqual({
			publicId: 'my-folder/my-image',
			folder: 'my-folder',
			fileName: 'my-image',
			format: 'png',
		});
	});
	// #end-test

	// #test - URL con transformaciones
	/**
	 * Verifica que las transformaciones son ignoradas correctamente.
	 * @version 1.0.0
	 */
	test('ignora segmentos de transformación en la URL', () => {
		const result = getPublicIdFromUrl(
			'https://res.cloudinary.com/demo/image/upload/w_400,h_300,c_fill/v1234567890/logos/company-logo.webp'
		);

		expect(result).toEqual({
			publicId: 'logos/company-logo',
			folder: 'logos',
			fileName: 'company-logo',
			format: 'webp',
		});
	});
	// #end-test

	// #test - URL con múltiples transformaciones
	/**
	 * Verifica que múltiples segmentos de transformación son ignorados.
	 * @version 1.0.0
	 */
	test('ignora múltiples segmentos de transformación', () => {
		const result = getPublicIdFromUrl(
			'https://res.cloudinary.com/demo/image/upload/w_400/c_fill,g_face/q_auto/v1234567890/products/photo.jpg'
		);

		expect(result).toEqual({
			publicId: 'products/photo',
			folder: 'products',
			fileName: 'photo',
			format: 'jpg',
		});
	});
	// #end-test

	// #test - URL con carpetas anidadas
	/**
	 * Verifica extracción correcta con carpetas profundamente anidadas.
	 * @version 1.0.0
	 */
	test('extrae publicId con carpetas anidadas', () => {
		const result = getPublicIdFromUrl(
			'https://res.cloudinary.com/demo/image/upload/v1234567890/companies/acme/logos/main-logo.svg'
		);

		expect(result).toEqual({
			publicId: 'companies/acme/logos/main-logo',
			folder: 'companies/acme/logos',
			fileName: 'main-logo',
			format: 'svg',
		});
	});
	// #end-test

	// #test - URL sin carpeta (archivo en raíz)
	/**
	 * Verifica extracción cuando la imagen está en la raíz (sin carpeta).
	 * @version 1.0.0
	 */
	test('extrae publicId de imagen en raíz (sin carpeta)', () => {
		const result = getPublicIdFromUrl(
			'https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg'
		);

		expect(result).toEqual({
			publicId: 'sample',
			folder: '',
			fileName: 'sample',
			format: 'jpg',
		});
	});
	// #end-test

	// #test - URL sin extensión
	/**
	 * Verifica extracción cuando la URL no tiene extensión.
	 * @version 1.0.0
	 */
	test('extrae publicId de URL sin extensión', () => {
		const result = getPublicIdFromUrl(
			'https://res.cloudinary.com/demo/image/upload/v1234567890/my-folder/image-without-ext'
		);

		expect(result).toEqual({
			publicId: 'my-folder/image-without-ext',
			folder: 'my-folder',
			fileName: 'image-without-ext',
			format: '',
		});
	});
	// #end-test

	// #test - URL con espacios en extremos
	/**
	 * Verifica que los espacios en extremos se recortan correctamente.
	 * @version 1.0.0
	 */
	test('recorta espacios en extremos de la URL', () => {
		const result = getPublicIdFromUrl(
			'  https://res.cloudinary.com/demo/image/upload/v1234567890/folder/image.jpg  '
		);

		expect(result).toEqual({
			publicId: 'folder/image',
			folder: 'folder',
			fileName: 'image',
			format: 'jpg',
		});
	});
	// #end-test

	// #test - URL con subdomain distinto de Cloudinary
	/**
	 * Verifica que funciona con otros subdominios de cloudinary.com.
	 * @version 1.0.0
	 */
	test('acepta URLs de cualquier subdominio de cloudinary.com', () => {
		const result = getPublicIdFromUrl(
			'https://api.cloudinary.com/demo/image/upload/v1234567890/folder/image.jpg'
		);

		expect(result).toEqual({
			publicId: 'folder/image',
			folder: 'folder',
			fileName: 'image',
			format: 'jpg',
		});
	});
	// #end-test

	// #test - Retorno inmutable
	/**
	 * Verifica que la estructura retornada tiene las propiedades correctas.
	 * @version 1.0.0
	 */
	test('retorna un objeto con las 4 propiedades esperadas', () => {
		const result = getPublicIdFromUrl(
			'https://res.cloudinary.com/demo/image/upload/v1/test/image.jpg'
		);

		expect(result).toHaveProperty('publicId');
		expect(result).toHaveProperty('folder');
		expect(result).toHaveProperty('fileName');
		expect(result).toHaveProperty('format');
		expect(Object.keys(result)).toHaveLength(4);
	});
	// #end-test
});
// #end-section
