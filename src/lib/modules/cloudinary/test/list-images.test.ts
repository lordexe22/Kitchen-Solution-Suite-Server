// list-images.test.ts
/* #info - Jest test for Cloudinary listImages */
// #section Imports
import { listImages } from '../cloudinary';
import {
	ConfigurationError,
	FetchImageError,
	ValidationError,
} from '../cloudinary.errors';
import * as cloudinaryConfig from '../cloudinary.config';
// #end-section

// #section Tests
describe('Cloudinary - listImages', () => {
	// #test - validaciones de entrada
	/**
	 * Valida errores de entrada en listImages.
	 * @version 1.0.0
	 */
	test('validaciones de entrada', async () => {
		await expect(listImages({ folder: '' }))
			.rejects.toBeInstanceOf(ValidationError);
		await expect(listImages({ folder: 'INVALID!!!' }))
			.rejects.toBeInstanceOf(ValidationError);
		await expect(listImages({ folder: '/bad' }))
			.rejects.toBeInstanceOf(ValidationError);
		await expect(listImages({ folder: 'bad/' }))
			.rejects.toBeInstanceOf(ValidationError);
		await expect(listImages({ folder: 'bad//folder' }))
			.rejects.toBeInstanceOf(ValidationError);
		await expect(listImages({ folder: 'folder', limit: 0 }))
			.rejects.toBeInstanceOf(ValidationError);
		await expect(listImages({ folder: 'folder', limit: 101 }))
			.rejects.toBeInstanceOf(ValidationError);
	});
	// #end-test

	// #test - folder con trailing slash es inválido
	/**
	 * Folder con trailing slash es inválido (contrato explícito).
	 * Input NO puede terminar en /, listImages agrega el / internamente.
	 * @version 1.0.0
	 */
	test('folder con trailing slash es inválido', async () => {
		await expect(listImages({ folder: 'folder/' }))
			.rejects.toBeInstanceOf(ValidationError);
		await expect(listImages({ folder: 'nested/folder/' }))
			.rejects.toBeInstanceOf(ValidationError);
	});
	// #end-test

	// #test - cliente mal configurado
	/**
	 * Propaga ConfigurationError.
	 * @version 1.0.0
	 */
	test('propaga ConfigurationError si el cliente falla', async () => {
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockImplementation(() => {
				throw new ConfigurationError('No credentials');
			});

		await expect(listImages({ folder: 'test-folder' }))
			.rejects.toBeInstanceOf(ConfigurationError);

		spy.mockRestore();
	});
	// #end-test

	// #test - llamada a api.resources
	/**
	 * Verifica llamada a api.resources con parámetros correctos.
	 * @version 1.0.0
	 */
	test('llama a api.resources con parámetros correctos', async () => {
		const apiResources = jest.fn().mockResolvedValue({
			resources: [],
			next_cursor: undefined,
		});
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ api: { resources: apiResources } } as any);

		await listImages({ folder: 'test-folder' });

		expect(apiResources).toHaveBeenCalledWith({
			type: 'upload',
			resource_type: 'image',
			prefix: 'test-folder/',
			max_results: 20,
			context: true,
		});

		spy.mockRestore();
	});
	// #end-test

	// #test - default limit es 20
	/**
	 * Usa limit 20 por defecto.
	 * @version 1.0.0
	 */
	test('usa limit 20 por defecto', async () => {
		const apiResources = jest.fn().mockResolvedValue({
			resources: [],
			next_cursor: undefined,
		});
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ api: { resources: apiResources } } as any);

		await listImages({ folder: 'test-folder' });

		const call = apiResources.mock.calls[0][0];
		expect(call.max_results).toBe(20);

		spy.mockRestore();
	});
	// #end-test

	// #test - limit efectivo respeta contrato aunque Cloudinary devuelva más
	/**
	 * Respeta limit aunque Cloudinary devuelva más recursos (blindaje de contrato).
	 * Cloudinary a veces ignora max_results en ciertos escenarios.
	 * @version 1.0.0
	 */
	test('respeta limit aunque Cloudinary devuelva más recursos', async () => {
		// Cloudinary devuelve 5 recursos, pero limit es 3
		const apiResources = jest.fn().mockResolvedValue({
			resources: [
				{
					public_id: 'folder/image1',
					url: 'http://example.com/image1.jpg',
					secure_url: 'https://example.com/image1.jpg',
					width: 100,
					height: 200,
					resource_type: 'image',
				},
				{
					public_id: 'folder/image2',
					url: 'http://example.com/image2.jpg',
					secure_url: 'https://example.com/image2.jpg',
					width: 100,
					height: 200,
					resource_type: 'image',
				},
				{
					public_id: 'folder/image3',
					url: 'http://example.com/image3.jpg',
					secure_url: 'https://example.com/image3.jpg',
					width: 100,
					height: 200,
					resource_type: 'image',
				},
				{
					public_id: 'folder/image4',
					url: 'http://example.com/image4.jpg',
					secure_url: 'https://example.com/image4.jpg',
					width: 100,
					height: 200,
					resource_type: 'image',
				},
				{
					public_id: 'folder/image5',
					url: 'http://example.com/image5.jpg',
					secure_url: 'https://example.com/image5.jpg',
					width: 100,
					height: 200,
					resource_type: 'image',
				},
			],
			next_cursor: 'next-page',
		});
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ api: { resources: apiResources } } as any);

		const result = await listImages({ folder: 'folder', limit: 3 });

		// Solo devuelve 3, no 5
		expect(result.items).toHaveLength(3);
		expect(result.items[0].publicId).toBe('folder/image1');
		expect(result.items[1].publicId).toBe('folder/image2');
		expect(result.items[2].publicId).toBe('folder/image3');
		expect(result.nextCursor).toBe('next-page');

		spy.mockRestore();
	});
	// #end-test

	// #test - cursor se pasa correctamente
	/**
	 * Pasa cursor a Cloudinary sin modificarlo.
	 * @version 1.0.0
	 */
	test('pasa cursor a Cloudinary sin modificarlo', async () => {
		const apiResources = jest.fn().mockResolvedValue({
			resources: [],
			next_cursor: undefined,
		});
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ api: { resources: apiResources } } as any);

		await listImages({ folder: 'test-folder', cursor: 'opaque-cursor-123' });

		const call = apiResources.mock.calls[0][0];
		expect(call.next_cursor).toBe('opaque-cursor-123');

		spy.mockRestore();
	});
	// #end-test

	// #test - nextCursor undefined cuando Cloudinary no lo devuelve
	/**
	 * Cuando Cloudinary no devuelve next_cursor, nextCursor es undefined (no null ni '').
	 * Crítico para paginación aguas abajo.
	 * @version 1.0.0
	 */
	test('nextCursor es undefined cuando Cloudinary no devuelve next_cursor', async () => {
		const apiResources = jest.fn().mockResolvedValue({
			resources: [
				{
					public_id: 'folder/image',
					url: 'http://example.com/image.jpg',
					secure_url: 'https://example.com/image.jpg',
					width: 100,
					height: 200,
					resource_type: 'image',
				},
			],
			next_cursor: undefined,
		});
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ api: { resources: apiResources } } as any);

		const result = await listImages({ folder: 'folder' });

		expect(result.nextCursor).toBeUndefined();
		expect(result.nextCursor).not.toBe(null);
		expect(result.nextCursor).not.toBe('');

		spy.mockRestore();
	});
	// #end-test

	// #test - cursor con recursos vacíos preserva nextCursor
	/**
	 * Recursos vacíos pero con nextCursor preserva el cursor (páginas vacías intermedias).
	 * Escenario real: Cloudinary devuelve resources: [] pero next_cursor existe.
	 * @version 1.0.0
	 */
	test('recursos vacíos con nextCursor preserva cursor', async () => {
		const apiResources = jest.fn().mockResolvedValue({
			resources: [],
			next_cursor: 'abc123',
		});
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ api: { resources: apiResources } } as any);

		const result = await listImages({ folder: 'folder' });

		expect(result.items).toEqual([]);
		expect(result.nextCursor).toBe('abc123'); // NO se pierde

		spy.mockRestore();
	});
	// #end-test

	// #test - folder vacío devuelve array vacío
	/**
	 * Folder vacío no es error, devuelve items vacíos.
	 * @version 1.0.0
	 */
	test('folder vacío devuelve array vacío', async () => {
		const apiResources = jest.fn().mockResolvedValue({
			resources: [],
			next_cursor: undefined,
		});
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ api: { resources: apiResources } } as any);

		const result = await listImages({ folder: 'empty-folder' });

		expect(result.items).toEqual([]);
		expect(result.nextCursor).toBeUndefined();

		spy.mockRestore();
	});
	// #end-test

	// #test - folder válido pero sin recursos
	/**
	 * Folder válido que existe pero no tiene recursos devuelve vacío, no error.
	 * Diferencia entre input inválido (ValidationError) y estado del sistema (array vacío).
	 * @version 1.0.0
	 */
	test('folder válido pero sin recursos devuelve vacío, no error', async () => {
		const apiResources = jest.fn().mockResolvedValue({
			resources: [],
			next_cursor: undefined,
		});
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ api: { resources: apiResources } } as any);

		const result = await listImages({ folder: 'valid-folder-no-resources' });

		expect(result.items).toEqual([]);
		expect(result.nextCursor).toBeUndefined();
		expect(apiResources).toHaveBeenCalled();

		spy.mockRestore();
	});
	// #end-test

	// #test - 404 devuelve array vacío
	/**
	 * 404 de Cloudinary devuelve items vacíos, no error.
	 * @version 1.0.0
	 */
	test('404 devuelve array vacío, no error', async () => {
		const apiResources = jest.fn().mockRejectedValue({ error: { http_code: 404 } });
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ api: { resources: apiResources } } as any);

		const result = await listImages({ folder: 'missing-folder' });

		expect(result.items).toEqual([]);
		expect(result.nextCursor).toBeUndefined();

		spy.mockRestore();
	});
	// #end-test

	// #test - normaliza recursos correctamente
	/**
	 * Normaliza recursos a GetImageResult con metadata siempre.
	 * @version 1.0.0
	 */
	test('normaliza recursos correctamente', async () => {
		const apiResources = jest.fn().mockResolvedValue({
			resources: [
				{
					public_id: 'folder/image1',
					url: 'http://example.com/image1.jpg',
					secure_url: 'https://example.com/image1.jpg',
					width: 100,
					height: 200,
					format: 'jpg',
					bytes: 1024,
					resource_type: 'image',
					context: { custom: { source: 'test' } },
				},
				{
					public_id: 'folder/image2',
					url: 'http://example.com/image2.jpg',
					secure_url: 'https://example.com/image2.jpg',
					width: 150,
					height: 250,
					format: 'png',
					bytes: 2048,
					resource_type: 'image',
					// Sin context.custom
				},
			],
			next_cursor: 'next-page',
		});
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ api: { resources: apiResources } } as any);

		const result = await listImages({ folder: 'folder' });

		expect(result.items).toHaveLength(2);
		expect(result.items[0].publicId).toBe('folder/image1');
		expect(result.items[0].metadata).toEqual({ source: 'test' });
		expect(result.items[1].publicId).toBe('folder/image2');
		expect(result.items[1].metadata).toEqual({}); // metadata siempre objeto
		expect(result.nextCursor).toBe('next-page');

		spy.mockRestore();
	});
	// #end-test

	// #test - filtra recursos incompletos
	/**
	 * Descarta recursos sin campos obligatorios.
	 * @version 1.0.0
	 */
	test('filtra recursos incompletos', async () => {
		const apiResources = jest.fn().mockResolvedValue({
			resources: [
				{
					public_id: 'folder/complete',
					url: 'http://example.com/complete.jpg',
					secure_url: 'https://example.com/complete.jpg',
					width: 100,
					height: 200,
					format: 'jpg',
					bytes: 1024,
					resource_type: 'image',
				},
				{
					// Sin public_id
					url: 'http://example.com/incomplete1.jpg',
					secure_url: 'https://example.com/incomplete1.jpg',
					width: 100,
					height: 200,
					resource_type: 'image',
				},
				{
					public_id: 'folder/incomplete2',
					// Sin url ni secure_url
					width: 100,
					height: 200,
					resource_type: 'image',
				},
				{
					public_id: 'folder/incomplete3',
					url: 'http://example.com/incomplete3.jpg',
					// Sin width
					height: 200,
					resource_type: 'image',
				},
				{
					public_id: 'folder/incomplete4',
					url: 'http://example.com/incomplete4.jpg',
					width: 100,
					// Sin height
					resource_type: 'image',
				},
			],
			next_cursor: undefined,
		});
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ api: { resources: apiResources } } as any);

		const result = await listImages({ folder: 'folder' });

		expect(result.items).toHaveLength(1);
		expect(result.items[0].publicId).toBe('folder/complete');

		spy.mockRestore();
	});
	// #end-test

	// #test - recursos incompletos no rompen listado completo
	/**
	 * Recursos incompletos se filtran sin explotar, cortar listado ni mezclar errores.
	 * Garantiza que datos corruptos no afectan datos válidos.
	 * @version 1.0.0
	 */
	test('recursos incompletos no rompen el listado completo', async () => {
		const apiResources = jest.fn().mockResolvedValue({
			resources: [
				{
					public_id: 'folder/image1',
					url: 'http://example.com/image1.jpg',
					secure_url: 'https://example.com/image1.jpg',
					width: 100,
					height: 200,
					resource_type: 'image',
				},
				{
					// corrupto
					url: 'http://example.com/corrupt.jpg',
					width: 100,
					resource_type: 'image',
				},
				{
					public_id: 'folder/image2',
					url: 'http://example.com/image2.jpg',
					secure_url: 'https://example.com/image2.jpg',
					width: 150,
					height: 250,
					resource_type: 'image',
				},
				{
					// otro corrupto
					public_id: 'folder/corrupt2',
					url: 'http://example.com/corrupt2.jpg',
					resource_type: 'image',
				},
				{
					public_id: 'folder/image3',
					url: 'http://example.com/image3.jpg',
					secure_url: 'https://example.com/image3.jpg',
					width: 200,
					height: 300,
					resource_type: 'image',
				},
			],
			next_cursor: 'next',
		});
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ api: { resources: apiResources } } as any);

		const result = await listImages({ folder: 'folder' });

		// No explota, devuelve solo los válidos, preserva nextCursor
		expect(result.items).toHaveLength(3);
		expect(result.items[0].publicId).toBe('folder/image1');
		expect(result.items[1].publicId).toBe('folder/image2');
		expect(result.items[2].publicId).toBe('folder/image3');
		expect(result.nextCursor).toBe('next');

		spy.mockRestore();
	});
	// #end-test

	// #test - filtra non-images
	/**
	 * Filtra recursos que no son images.
	 * @version 1.0.0
	 */
	test('filtra recursos que no son images', async () => {
		const apiResources = jest.fn().mockResolvedValue({
			resources: [
				{
					public_id: 'folder/image',
					url: 'http://example.com/image.jpg',
					secure_url: 'https://example.com/image.jpg',
					width: 100,
					height: 200,
					resource_type: 'image',
				},
				{
					public_id: 'folder/video',
					url: 'http://example.com/video.mp4',
					secure_url: 'https://example.com/video.mp4',
					width: 100,
					height: 200,
					resource_type: 'video',
				},
			],
			next_cursor: undefined,
		});
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ api: { resources: apiResources } } as any);

		const result = await listImages({ folder: 'folder' });

		expect(result.items).toHaveLength(1);
		expect(result.items[0].publicId).toBe('folder/image');

		spy.mockRestore();
	});
	// #end-test

	// #test - recursive false filtra subdirectorios
	/**
	 * recursive: false solo devuelve items directos del folder.
	 * @version 1.0.0
	 */
	test('recursive false filtra subdirectorios', async () => {
		const apiResources = jest.fn().mockResolvedValue({
			resources: [
				{
					public_id: 'folder/direct-image',
					url: 'http://example.com/direct.jpg',
					secure_url: 'https://example.com/direct.jpg',
					width: 100,
					height: 200,
					resource_type: 'image',
				},
				{
					public_id: 'folder/sub/nested-image',
					url: 'http://example.com/nested.jpg',
					secure_url: 'https://example.com/nested.jpg',
					width: 100,
					height: 200,
					resource_type: 'image',
				},
			],
			next_cursor: undefined,
		});
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ api: { resources: apiResources } } as any);

		const result = await listImages({ folder: 'folder', recursive: false });

		expect(result.items).toHaveLength(1);
		expect(result.items[0].publicId).toBe('folder/direct-image');

		spy.mockRestore();
	});
	// #end-test

	// #test - recursive false con folder anidado
	/**
	 * recursive: false en folder anidado (folder/sub) filtra correctamente.
	 * folder/sub/image → válido, folder/sub/nested/image → inválido.
	 * @version 1.0.0
	 */
	test('recursive false con folder anidado filtra correctamente', async () => {
		const apiResources = jest.fn().mockResolvedValue({
			resources: [
				{
					public_id: 'folder/sub/direct-image',
					url: 'http://example.com/direct.jpg',
					secure_url: 'https://example.com/direct.jpg',
					width: 100,
					height: 200,
					resource_type: 'image',
				},
				{
					public_id: 'folder/sub/nested/deep-image',
					url: 'http://example.com/deep.jpg',
					secure_url: 'https://example.com/deep.jpg',
					width: 100,
					height: 200,
					resource_type: 'image',
				},
			],
			next_cursor: undefined,
		});
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ api: { resources: apiResources } } as any);

		const result = await listImages({ folder: 'folder/sub', recursive: false });

		expect(result.items).toHaveLength(1);
		expect(result.items[0].publicId).toBe('folder/sub/direct-image');

		spy.mockRestore();
	});
	// #end-test

	// #test - recursive true incluye subdirectorios
	/**
	 * recursive: true incluye items en subdirectorios.
	 * @version 1.0.0
	 */
	test('recursive true incluye subdirectorios', async () => {
		const apiResources = jest.fn().mockResolvedValue({
			resources: [
				{
					public_id: 'folder/direct-image',
					url: 'http://example.com/direct.jpg',
					secure_url: 'https://example.com/direct.jpg',
					width: 100,
					height: 200,
					resource_type: 'image',
				},
				{
					public_id: 'folder/sub/nested-image',
					url: 'http://example.com/nested.jpg',
					secure_url: 'https://example.com/nested.jpg',
					width: 100,
					height: 200,
					resource_type: 'image',
				},
			],
			next_cursor: undefined,
		});
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ api: { resources: apiResources } } as any);

		const result = await listImages({ folder: 'folder', recursive: true });

		expect(result.items).toHaveLength(2);
		expect(result.items[0].publicId).toBe('folder/direct-image');
		expect(result.items[1].publicId).toBe('folder/sub/nested-image');

		spy.mockRestore();
	});
	// #end-test

	// #test - error de red mapea a FetchImageError
	/**
	 * Mapea error de red a FetchImageError.
	 * @version 1.0.0
	 */
	test('error de red mapea a FetchImageError', async () => {
		const apiResources = jest.fn().mockRejectedValue({ code: 'ECONNREFUSED' });
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ api: { resources: apiResources } } as any);

		await expect(listImages({ folder: 'folder' }))
			.rejects.toBeInstanceOf(FetchImageError);

		spy.mockRestore();
	});
	// #end-test

	// #test - error 401/403 mapea a FetchImageError
	/**
	 * Mapea error de autenticación a FetchImageError.
	 * @version 1.0.0
	 */
	test('error 401/403 mapea a FetchImageError', async () => {
		const apiResources = jest.fn().mockRejectedValue({ error: { http_code: 401 } });
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ api: { resources: apiResources } } as any);

		await expect(listImages({ folder: 'folder' }))
			.rejects.toBeInstanceOf(FetchImageError);

		spy.mockRestore();
	});
	// #end-test

	// #test - error 5xx mapea a FetchImageError
	/**
	 * Mapea error de servidor a FetchImageError.
	 * @version 1.0.0
	 */
	test('error 5xx mapea a FetchImageError', async () => {
		const apiResources = jest.fn().mockRejectedValue({ error: { http_code: 500 } });
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ api: { resources: apiResources } } as any);

		await expect(listImages({ folder: 'folder' }))
			.rejects.toBeInstanceOf(FetchImageError);

		spy.mockRestore();
	});
	// #end-test

	// #test - error sin http_code mapea a FetchImageError
	/**
	 * Mapea error con message pero sin http_code a FetchImageError.
	 * Cloudinary frecuentemente responde así.
	 * @version 1.0.0
	 */
	test('error sin http_code mapea a FetchImageError', async () => {
		const apiResources = jest.fn().mockRejectedValue({
			error: { message: 'API rate limit exceeded' },
		});
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ api: { resources: apiResources } } as any);

		await expect(listImages({ folder: 'folder' }))
			.rejects.toBeInstanceOf(FetchImageError);

		spy.mockRestore();
	});
	// #end-test

	// #test - prefix tiene / al final
	/**
	 * Prefix siempre termina en /.
	 * @version 1.0.0
	 */
	test('prefix tiene slash al final', async () => {
		const apiResources = jest.fn().mockResolvedValue({
			resources: [],
			next_cursor: undefined,
		});
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ api: { resources: apiResources } } as any);

		await listImages({ folder: 'test-folder' });

		const call = apiResources.mock.calls[0][0];
		expect(call.prefix).toBe('test-folder/');

		spy.mockRestore();
	});
	// #end-test

	// #test - preserva orden de Cloudinary
	/**
	 * Preserva el orden exacto entregado por Cloudinary (orden estable).
	 * Decisión explícita: listImages no reordena recursos.
	 * @version 1.0.0
	 */
	test('preserva el orden entregado por Cloudinary', async () => {
		const apiResources = jest.fn().mockResolvedValue({
			resources: [
				{
					public_id: 'folder/z-image',
					url: 'http://example.com/z.jpg',
					secure_url: 'https://example.com/z.jpg',
					width: 100,
					height: 200,
					resource_type: 'image',
				},
				{
					public_id: 'folder/a-image',
					url: 'http://example.com/a.jpg',
					secure_url: 'https://example.com/a.jpg',
					width: 150,
					height: 250,
					resource_type: 'image',
				},
				{
					public_id: 'folder/m-image',
					url: 'http://example.com/m.jpg',
					secure_url: 'https://example.com/m.jpg',
					width: 200,
					height: 300,
					resource_type: 'image',
				},
			],
			next_cursor: undefined,
		});
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ api: { resources: apiResources } } as any);

		const result = await listImages({ folder: 'folder' });

		expect(result.items).toHaveLength(3);
		expect(result.items[0].publicId).toBe('folder/z-image');
		expect(result.items[1].publicId).toBe('folder/a-image');
		expect(result.items[2].publicId).toBe('folder/m-image');

		spy.mockRestore();
	});
	// #end-test
});
// #end-section
