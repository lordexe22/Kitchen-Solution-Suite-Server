// get-image.test.ts
/* #info - Jest test for Cloudinary getImage */
// #section Imports
import { createImage, getImage } from '../cloudinary';
import {	ConfigurationError,
	FetchImageError,
	NotFoundError,
	ValidationError,
} from '../cloudinary.errors';
import * as cloudinaryConfig from '../cloudinary.config';
// #end-section


// #section Tests
describe('Cloudinary - getImage', () => {
	// #test - validaciones de input
	/**
	 * Verifica validaciones de input.
	 * @version 1.0.0
	 */
	test('falla con ValidationError si publicId es inválido', async () => {
		await expect(getImage('')).rejects.toBeInstanceOf(ValidationError);
		await expect(getImage('INVALID ID!!!')).rejects.toBeInstanceOf(ValidationError);
		await expect(getImage(' valid-id ')).rejects.toBeInstanceOf(ValidationError);
		await expect(getImage('folder//image')).rejects.toBeInstanceOf(ValidationError);
		await expect(getImage('folder/../image')).rejects.toBeInstanceOf(ValidationError);
	});
	// #end-test

	// #test - invocación a Cloudinary
	/**
	 * Verifica parámetros enviados a cloudinary.api.resource.
	 * @version 1.0.0
	 */
	test('llama a cloudinary.api.resource con parámetros correctos', async () => {
		const apiResource = jest.fn().mockResolvedValue({
			public_id: 'my-id',
			url: 'http://example.com/a.jpg',
			secure_url: 'https://example.com/a.jpg',
			width: 100,
			height: 200,
			format: 'jpg',
			bytes: 10,
			resource_type: 'image',
		});
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ api: { resource: apiResource } } as any);

		await getImage('my-id');

		expect(apiResource).toHaveBeenCalledWith(
			'my-id',
			expect.objectContaining({
				resource_type: 'image',
				context: true,
			})
		);

		spy.mockRestore();
	});
	// #end-test

	// #test - publicId intacto
	/**
	 * Verifica que publicId válido no se modifica.
	 * @version 1.0.0
	 */
	test('no modifica un publicId válido', async () => {
		const apiResource = jest.fn().mockResolvedValue({
			public_id: 'folder/sub-folder/image_01',
			url: 'http://example.com/a.jpg',
			secure_url: 'https://example.com/a.jpg',
			width: 100,
			height: 200,
			format: 'jpg',
			bytes: 10,
			resource_type: 'image',
		});
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ api: { resource: apiResource } } as any);

		await getImage('folder/sub-folder/image_01');

		expect(apiResource.mock.calls[0][0]).toBe('folder/sub-folder/image_01');

		spy.mockRestore();
	});
	// #end-test

	// #test - not found por error 404
	/**
	 * Mapea 404 a NotFoundError.
	 * @version 1.0.0
	 */
	test('falla con NotFoundError si no existe (404)', async () => {
		const apiResource = jest.fn().mockRejectedValue({ error: { http_code: 404 } });
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ api: { resource: apiResource } } as any);

		await expect(getImage('some-id')).rejects.toBeInstanceOf(NotFoundError);

		spy.mockRestore();
	});
	// #end-test

	// #test - not found por result not found
	/**
	 * Mapea result=not found a NotFoundError.
	 * @version 1.0.0
	 */
	test('falla con NotFoundError si result=not found', async () => {
		const apiResource = jest.fn().mockResolvedValue({ result: 'not found' });
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ api: { resource: apiResource } } as any);

		await expect(getImage('some-id')).rejects.toBeInstanceOf(NotFoundError);

		spy.mockRestore();
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

		await expect(getImage('valid-id')).rejects.toBeInstanceOf(ConfigurationError);

		spy.mockRestore();
	});
	// #end-test

	// #test - error de red
	/**
	 * Mapea errores de red a FetchImageError.
	 * @version 1.0.0
	 */
	test('mapea error de red a FetchImageError', async () => {
		const apiResource = jest
			.fn()
			.mockRejectedValue(Object.assign(new Error('Network error'), { code: 'ETIMEDOUT' }));
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ api: { resource: apiResource } } as any);

		await expect(getImage('some-id')).rejects.toBeInstanceOf(FetchImageError);

		spy.mockRestore();
	});
	// #end-test

	// #test - error http >= 500
	/**
	 * Mapea error 500 a FetchImageError.
	 * @version 1.0.0
	 */
	test('mapea error http 500 a FetchImageError', async () => {
		const apiResource = jest.fn().mockRejectedValue({ error: { http_code: 500 } });
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ api: { resource: apiResource } } as any);

		await expect(getImage('some-id')).rejects.toBeInstanceOf(FetchImageError);

		spy.mockRestore();
	});
	// #end-test

	// #test - error http 401/403
	/**
	 * Mapea error 401/403 a FetchImageError.
	 * @version 1.0.0
	 */
	test('mapea error http 401/403 a FetchImageError', async () => {
		const apiResource401 = jest.fn().mockRejectedValue({ error: { http_code: 401 } });
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ api: { resource: apiResource401 } } as any);

		await expect(getImage('some-id')).rejects.toBeInstanceOf(FetchImageError);

		const apiResource403 = jest.fn().mockRejectedValue({ error: { http_code: 403 } });
		spy.mockReturnValue({ api: { resource: apiResource403 } } as any);

		await expect(getImage('some-id')).rejects.toBeInstanceOf(FetchImageError);

		spy.mockRestore();
	});
	// #end-test

	// #test - resource_type no soportado
	/**
	 * Falla con FetchImageError si resource_type no es image.
	 * @version 1.0.0
	 */
	test('falla con FetchImageError si resource_type no es image', async () => {
		const apiResourceVideo = jest.fn().mockResolvedValue({
			public_id: 'my-video',
			url: 'http://example.com/a.mp4',
			secure_url: 'https://example.com/a.mp4',
			width: 1920,
			height: 1080,
			format: 'mp4',
			bytes: 10,
			resource_type: 'video',
		});
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ api: { resource: apiResourceVideo } } as any);

		await expect(getImage('my-video')).rejects.toBeInstanceOf(FetchImageError);

		const apiResourceRaw = jest.fn().mockResolvedValue({
			public_id: 'my-raw',
			url: 'http://example.com/a.bin',
			secure_url: 'https://example.com/a.bin',
			bytes: 10,
			resource_type: 'raw',
		});
		spy.mockReturnValue({ api: { resource: apiResourceRaw } } as any);

		await expect(getImage('my-raw')).rejects.toBeInstanceOf(FetchImageError);

		spy.mockRestore();
	});
	// #end-test

	// #test - respuesta inválida
	/**
	 * Mapea respuestas inválidas a FetchImageError.
	 * @version 1.0.0
	 */
	test('falla con FetchImageError si la respuesta es inválida', async () => {
		const apiResourceNull = jest.fn().mockResolvedValue(null);
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ api: { resource: apiResourceNull } } as any);

		await expect(getImage('my-id')).rejects.toBeInstanceOf(FetchImageError);

		const apiResourceUndefined = jest.fn().mockResolvedValue(undefined);
		spy.mockReturnValue({ api: { resource: apiResourceUndefined } } as any);

		await expect(getImage('my-id')).rejects.toBeInstanceOf(FetchImageError);

		const apiResourceEmpty = jest.fn().mockResolvedValue({});
		spy.mockReturnValue({ api: { resource: apiResourceEmpty } } as any);

		await expect(getImage('my-id')).rejects.toBeInstanceOf(FetchImageError);

		spy.mockRestore();
	});
	// #end-test

	// #test - error desconocido
	/**
	 * Mapea errores desconocidos a FetchImageError.
	 * @version 1.0.0
	 */
	test('mapea error desconocido a FetchImageError', async () => {
		const apiResourceString = jest.fn().mockRejectedValue('boom');
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ api: { resource: apiResourceString } } as any);

		await expect(getImage('some-id')).rejects.toBeInstanceOf(FetchImageError);

		const apiResourceNumber = jest.fn().mockRejectedValue(123);
		spy.mockReturnValue({ api: { resource: apiResourceNumber } } as any);

		await expect(getImage('some-id')).rejects.toBeInstanceOf(FetchImageError);

		const apiResourceObject = jest.fn().mockRejectedValue({});
		spy.mockReturnValue({ api: { resource: apiResourceObject } } as any);

		await expect(getImage('some-id')).rejects.toBeInstanceOf(FetchImageError);

		spy.mockRestore();
	});
	// #end-test


	// #test - metadata por defecto
	/**
	 * Si no hay context, metadata debe ser {} y no undefined.
	 * @version 1.0.0
	 */
	test('metadata por defecto es {}', async () => {
		const apiResource = jest.fn().mockResolvedValue({
			public_id: 'my-id',
			url: 'http://example.com/a.jpg',
			secure_url: 'https://example.com/a.jpg',
			width: 100,
			height: 200,
			format: 'jpg',
			bytes: 10,
			resource_type: 'image',
		});
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ api: { resource: apiResource } } as any);

		const result = await getImage('my-id');
		expect(result.metadata).toEqual({});
		expect(result.raw).toBeTruthy();

		spy.mockRestore();
	});
	// #end-test

	// #test - no muta metadata interna
	/**
	 * Modificar result.metadata no debe mutar raw.context.custom.
	 * @version 1.0.0
	 */
	test('no muta metadata interna', async () => {
		const apiResource = jest.fn().mockResolvedValue({
			public_id: 'my-id',
			url: 'http://example.com/a.jpg',
			secure_url: 'https://example.com/a.jpg',
			width: 100,
			height: 200,
			format: 'jpg',
			bytes: 10,
			resource_type: 'image',
			context: { custom: { foo: 'bar' } },
		});
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ api: { resource: apiResource } } as any);

		const result = await getImage('my-id');
		result.metadata.foo = 'changed';
		expect((result.raw as Record<string, any>).context.custom.foo).toBe('bar');

		spy.mockRestore();
	});
	// #end-test

	// #test - context.custom inválido
	/**
	 * Si context.custom no es objeto, metadata debe ser {}.
	 * @version 1.0.0
	 */
	test('context.custom inválido devuelve metadata vacía', async () => {
		const apiResource = jest.fn().mockResolvedValue({
			public_id: 'my-id',
			url: 'http://example.com/a.jpg',
			secure_url: 'https://example.com/a.jpg',
			width: 100,
			height: 200,
			format: 'jpg',
			bytes: 10,
			resource_type: 'image',
			context: { custom: 'invalid' },
		});
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ api: { resource: apiResource } } as any);

		const result = await getImage('my-id');
		expect(result.metadata).toEqual({});

		spy.mockRestore();
	});
	// #end-test

	// #test - payload incompleto
	/**
	 * Respuesta parcial falla con FetchImageError.
	 * @version 1.0.0
	 */
	test('falla con FetchImageError ante payload incompleto', async () => {
		const apiResource = jest.fn().mockResolvedValue({
			public_id: 'my-id',
			url: 'http://example.com/a.jpg',
			resource_type: 'image',
		});
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ api: { resource: apiResource } } as any);

		await expect(getImage('my-id')).rejects.toBeInstanceOf(FetchImageError);

		const apiResourceMissingSecure = jest.fn().mockResolvedValue({
			public_id: 'my-id',
			url: 'http://example.com/a.jpg',
			width: 100,
			height: 200,
			resource_type: 'image',
		});
		spy.mockReturnValue({ api: { resource: apiResourceMissingSecure } } as any);

		await expect(getImage('my-id')).rejects.toBeInstanceOf(FetchImageError);

		spy.mockRestore();
	});
	// #end-test

	// #section Integration
	describe('[integration] getImage', () => {
		// #test - lectura exitosa
		/**
		 * Retorna imagen existente con campos normalizados.
		 * @version 1.0.0
		 */
		test('retorna imagen con campos normalizados', async () => {
			const created = await createImage(
				{
					type: 'url',
					url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
				},
				{
					name: `get-${Date.now()}`,
					folder: 'kitchen-solutions-suite/design-tests',
					overwrite: true,
				},
				{ source: 'get-image', module: 'cloudinary' }
			);

			const result = await getImage(created.publicId);

			expect(result.publicId).toBe(created.publicId);
			expect(result.url).toBeTruthy();
			expect(result.secureUrl).toBeTruthy();
			expect(result.width).toBeGreaterThan(0);
			expect(result.height).toBeGreaterThan(0);
			expect(result.format).toBeTruthy();
			expect(result.bytes).toBeGreaterThan(0);
			expect(result.metadata).toEqual(
				expect.objectContaining({ source: 'get-image', module: 'cloudinary' })
			);
			expect(result.raw).toBeTruthy();
			expect(result.raw.public_id).toBe(created.publicId);
			expect(result.raw.resource_type).toBe('image');
		}, 30000);
		// #end-test

		// #test - idempotencia semántica
		/**
		 * getImage llamado dos veces retorna el mismo resultado.
		 * @version 1.0.0
		 */
		test('getImage es idempotente (misma salida)', async () => {
			const created = await createImage(
				{
					type: 'url',
					url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
				},
				{
					name: `get-twice-${Date.now()}`,
					folder: 'kitchen-solutions-suite/design-tests',
					overwrite: true,
				},
				{ source: 'twice', module: 'cloudinary' }
			);

		const resultA = await getImage(created.publicId);
		const resultB = await getImage(created.publicId);

		// Excluir rate_limit_remaining del raw porque cambia entre llamadas
		const { raw: rawA, ...restA } = resultA;
		const { raw: rawB, ...restB } = resultB;
		const { rate_limit_remaining: _a, ...rawAWithoutRate } = rawA;
		const { rate_limit_remaining: _b, ...rawBWithoutRate } = rawB;

		expect(restA).toEqual(restB);
		expect(rawAWithoutRate).toEqual(rawBWithoutRate);
	}, 30000);
	// #end-test

	// #test - coherencia create -> get
	/**
	 * createImage seguido de getImage retorna mismo publicId y metadata.
	 * @version 1.0.0
	 */
	test('create -> get mantiene publicId y metadata', async () => {
			const created = await createImage(
				{
					type: 'url',
					url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
				},
				{
					name: `get-consistency-${Date.now()}`,
					folder: 'kitchen-solutions-suite/design-tests',
					overwrite: true,
				},
				{ source: 'consistency', module: 'cloudinary' }
			);

			const result = await getImage(created.publicId);

			expect(result.publicId).toBe(created.publicId);
			expect(result.metadata).toEqual(
				expect.objectContaining({ source: 'consistency', module: 'cloudinary' })
			);
		}, 30000);
		// #end-test
	});
	// #end-section
});
// #end-section
