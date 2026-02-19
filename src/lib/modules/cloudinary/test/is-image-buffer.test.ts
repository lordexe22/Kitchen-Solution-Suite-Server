// is-image-buffer.test.ts
/* #info - Jest test for Cloudinary isImageBuffer */
// #section Imports
import { isImageBuffer } from '../cloudinary';
// #end-section

// #region Helpers - Buffers de imágenes válidas

/** PNG mínimo (8 bytes de header) */
const pngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

/** JPEG mínimo */
const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]);

/** GIF89a */
const gifBuffer = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);

/** WebP (RIFF container) */
const webpBuffer = Buffer.from([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00]);

/** BMP */
const bmpBuffer = Buffer.from([0x42, 0x4D, 0x00, 0x00]);

/** ICO */
const icoBuffer = Buffer.from([0x00, 0x00, 0x01, 0x00, 0x01, 0x00]);

/** TIFF little-endian */
const tiffLeBuffer = Buffer.from([0x49, 0x49, 0x2A, 0x00]);

/** TIFF big-endian */
const tiffBeBuffer = Buffer.from([0x4D, 0x4D, 0x00, 0x2A]);

/** SVG con tag de apertura */
const svgBuffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>');

/** SVG con declaración XML */
const svgXmlBuffer = Buffer.from('<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"></svg>');

/** SVG con whitespace al inicio */
const svgWhitespaceBuffer = Buffer.from('   \n  <svg xmlns="http://www.w3.org/2000/svg"></svg>');

// #endregion

// #section Tests
describe('Cloudinary - isImageBuffer', () => {
	// #test - Formatos binarios soportados
	describe('formatos binarios soportados', () => {
		test('detecta PNG', () => {
			expect(isImageBuffer(pngBuffer)).toBe(true);
		});

		test('detecta JPEG', () => {
			expect(isImageBuffer(jpegBuffer)).toBe(true);
		});

		test('detecta GIF', () => {
			expect(isImageBuffer(gifBuffer)).toBe(true);
		});

		test('detecta WebP (RIFF)', () => {
			expect(isImageBuffer(webpBuffer)).toBe(true);
		});

		test('detecta BMP', () => {
			expect(isImageBuffer(bmpBuffer)).toBe(true);
		});

		test('detecta ICO', () => {
			expect(isImageBuffer(icoBuffer)).toBe(true);
		});

		test('detecta TIFF little-endian', () => {
			expect(isImageBuffer(tiffLeBuffer)).toBe(true);
		});

		test('detecta TIFF big-endian', () => {
			expect(isImageBuffer(tiffBeBuffer)).toBe(true);
		});
	});
	// #end-test

	// #test - SVG (formato basado en texto)
	describe('SVG (formato basado en texto)', () => {
		test('detecta SVG con tag <svg>', () => {
			expect(isImageBuffer(svgBuffer)).toBe(true);
		});

		test('detecta SVG con declaración <?xml>', () => {
			expect(isImageBuffer(svgXmlBuffer)).toBe(true);
		});

		test('detecta SVG con whitespace al inicio', () => {
			expect(isImageBuffer(svgWhitespaceBuffer)).toBe(true);
		});
	});
	// #end-test

	// #test - Buffer con contenido más grande (headers válidos + datos)
	describe('buffers con datos adicionales después del header', () => {
		test('PNG con datos extra', () => {
			const large = Buffer.concat([pngBuffer, Buffer.alloc(1024)]);
			expect(isImageBuffer(large)).toBe(true);
		});

		test('JPEG con datos extra', () => {
			const large = Buffer.concat([jpegBuffer, Buffer.alloc(2048)]);
			expect(isImageBuffer(large)).toBe(true);
		});
	});
	// #end-test

	// #test - Buffers que NO son imágenes
	describe('buffers que NO son imágenes', () => {
		test('texto plano', () => {
			const text = Buffer.from('Hello, this is just text content');
			expect(isImageBuffer(text)).toBe(false);
		});

		test('JSON', () => {
			const json = Buffer.from('{"key": "value"}');
			expect(isImageBuffer(json)).toBe(false);
		});

		test('HTML (no SVG)', () => {
			const html = Buffer.from('<html><body>Not an image</body></html>');
			expect(isImageBuffer(html)).toBe(false);
		});

		test('bytes aleatorios', () => {
			const random = Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05]);
			expect(isImageBuffer(random)).toBe(false);
		});

		test('PDF', () => {
			const pdf = Buffer.from('%PDF-1.4');
			expect(isImageBuffer(pdf)).toBe(false);
		});

		test('ZIP', () => {
			const zip = Buffer.from([0x50, 0x4B, 0x03, 0x04]);
			expect(isImageBuffer(zip)).toBe(false);
		});

		test('EXE/DLL (MZ header)', () => {
			const exe = Buffer.from([0x4D, 0x5A, 0x90, 0x00]);
			expect(isImageBuffer(exe)).toBe(false);
		});
	});
	// #end-test

	// #test - Edge cases
	describe('edge cases', () => {
		test('buffer vacío retorna false', () => {
			expect(isImageBuffer(Buffer.alloc(0))).toBe(false);
		});

		test('buffer de 1 byte retorna false', () => {
			expect(isImageBuffer(Buffer.from([0xFF]))).toBe(false);
		});

		test('no falla con input inválido (no-Buffer)', () => {
			// TypeScript previene esto, pero defensivamente retorna false
			expect(isImageBuffer(null as any)).toBe(false);
			expect(isImageBuffer(undefined as any)).toBe(false);
			expect(isImageBuffer('string' as any)).toBe(false);
			expect(isImageBuffer(42 as any)).toBe(false);
		});
	});
	// #end-test
});
// #end-section
