// move-image.test.ts
/* #info - Jest test for Cloudinary moveImage */
// #section Imports
import { createImage, getImage, moveImage } from '../cloudinary';
import {	ConfigurationError,
	MoveImageError,
	NotFoundError,
	ValidationError,
} from '../cloudinary.errors';
import * as cloudinaryConfig from '../cloudinary.config';
// #end-section


// #section Tests
describe('Cloudinary - moveImage', () => {
	// #test - validaciones de entrada
	/**
	 * Valida errores de entrada en moveImage.
	 * @version 1.0.0
	 */
	test('validaciones de entrada', async () => {
		await expect(moveImage({ publicId: '', targetFolder: 'target-folder' }))
			.rejects.toBeInstanceOf(ValidationError);
		await expect(moveImage({ publicId: 'INVALID ID!!!', targetFolder: 'target-folder' }))
			.rejects.toBeInstanceOf(ValidationError);
		await expect(moveImage({ publicId: 'folder/name', targetFolder: '' }))
			.rejects.toBeInstanceOf(ValidationError);
		await expect(moveImage({ publicId: 'folder/name', targetFolder: '/bad' }))
			.rejects.toBeInstanceOf(ValidationError);
		await expect(moveImage({ publicId: 'folder/name', targetFolder: 'bad//folder' }))
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

		await expect(moveImage({ publicId: 'folder/name', targetFolder: 'target-folder' }))
			.rejects.toBeInstanceOf(ConfigurationError);

		spy.mockRestore();
	});
	// #end-test

	// #test - llamada a rename
	/**
	 * Verifica llamada a uploader.rename con overwrite=false.
	 * @version 1.0.0
	 */
	test('llama a uploader.rename con overwrite=false', async () => {
		const rename = jest.fn().mockResolvedValue({});
		const apiResource = jest.fn().mockResolvedValue({
			public_id: 'target-folder/name',
			url: 'http://example.com/a.jpg',
			secure_url: 'https://example.com/a.jpg',
			width: 100,
			height: 200,
			format: 'jpg',
			bytes: 10,
			resource_type: 'image',
			context: { custom: { name: 'name', folder: 'folder' } },
		});
		const update = jest.fn().mockResolvedValue({});
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ uploader: { rename }, api: { resource: apiResource, update } } as any);

		await moveImage({ publicId: 'folder/name', targetFolder: 'target-folder' });

		expect(rename).toHaveBeenCalledWith('folder/name', 'target-folder/name', {
			resource_type: 'image',
			overwrite: false,
		});

		spy.mockRestore();
	});
	// #end-test

	// #test - devuelve resultado de api.resource
	/**
	 * moveImage devuelve el resultado normalizado de api.resource, no de uploader.rename.
	 * @version 1.0.0
	 */
	test('devuelve resultado de api.resource, no de uploader.rename', async () => {
		// uploader.rename devuelve basura (no es confiable)
		const rename = jest.fn().mockResolvedValue({ garbage: 'data', result: 'ok' });
		// api.resource devuelve datos válidos (fuente de verdad)
		const apiResource = jest.fn().mockResolvedValue({
			public_id: 'target-folder/name',
			url: 'http://example.com/a.jpg',
			secure_url: 'https://example.com/a.jpg',
			width: 100,
			height: 200,
			format: 'jpg',
			bytes: 10,
			resource_type: 'image',
			context: { custom: { source: 'test', name: 'name', folder: 'folder' } },
		});
		const update = jest.fn().mockResolvedValue({});
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ uploader: { rename }, api: { resource: apiResource, update } } as any);

		const result = await moveImage({ publicId: 'folder/name', targetFolder: 'target-folder' });

		// El resultado final coincide con api.resource, no con rename
		expect(result.publicId).toBe('target-folder/name');
		expect(result.url).toBe('http://example.com/a.jpg');
		expect(result.secureUrl).toBe('https://example.com/a.jpg');
		expect(result.width).toBe(100);
		expect(result.height).toBe(200);
		expect(result.format).toBe('jpg');
		expect(result.bytes).toBe(10);
		expect(apiResource).toHaveBeenCalledTimes(2);
		expect(apiResource).toHaveBeenNthCalledWith(1, 'folder/name', { resource_type: 'image', context: true });
		expect(apiResource).toHaveBeenNthCalledWith(2, 'target-folder/name', { resource_type: 'image', context: true });

		spy.mockRestore();
	});
	// #end-test

	// #test - idempotencia por path completo
	/**
	 * Falla si el targetFolder es el mismo (path completo con subfolder).
	 * @version 1.0.0
	 */
	test('no mueve si el path completo del targetFolder es idéntico', async () => {
		const rename = jest.fn();
		const apiResource = jest.fn().mockResolvedValue({
			public_id: 'folder/sub/name',
			url: 'http://example.com/a.jpg',
			secure_url: 'https://example.com/a.jpg',
			width: 100,
			height: 200,
			format: 'jpg',
			bytes: 10,
			resource_type: 'image',
			context: { custom: { name: 'name', folder: 'folder/sub' } },
		});
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ uploader: { rename }, api: { resource: apiResource, update: jest.fn() } } as any);

		await expect(
			moveImage({ publicId: 'folder/sub/name', targetFolder: 'folder/sub' })
		).rejects.toBeInstanceOf(ValidationError);

		expect(rename).not.toHaveBeenCalled();

		spy.mockRestore();
	});
	// #end-test

	// #test - not found
	/**
	 * Mapea 404 a NotFoundError.
	 * @version 1.0.0
	 */
	test('falla con NotFoundError si el recurso no existe', async () => {
		const rename = jest.fn().mockRejectedValue({ error: { http_code: 404 } });
		const apiResource = jest.fn().mockResolvedValue({
			public_id: 'folder/name',
			url: 'http://example.com/a.jpg',
			secure_url: 'https://example.com/a.jpg',
			width: 100,
			height: 200,
			format: 'jpg',
			bytes: 10,
			resource_type: 'image',
			context: { custom: { name: 'name', folder: 'folder' } },
		});
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ uploader: { rename }, api: { resource: apiResource, update: jest.fn() } } as any);

		await expect(moveImage({ publicId: 'folder/name', targetFolder: 'target-folder' }))
			.rejects.toBeInstanceOf(NotFoundError);

		spy.mockRestore();
	});
	// #end-test

	// #test - target existe
	/**
	 * Mapea colisión de destino a MoveImageError.
	 * @version 1.0.0
	 */
	test('falla con MoveImageError si el target existe', async () => {
		const rename = jest.fn().mockRejectedValue({ error: { message: 'already exists' } });
		const apiResource = jest.fn().mockResolvedValue({
			public_id: 'folder/name',
			url: 'http://example.com/a.jpg',
			secure_url: 'https://example.com/a.jpg',
			width: 100,
			height: 200,
			format: 'jpg',
			bytes: 10,
			resource_type: 'image',
			context: { custom: { name: 'name', folder: 'folder' } },
		});
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ uploader: { rename }, api: { resource: apiResource, update: jest.fn() } } as any);

		await expect(moveImage({ publicId: 'folder/name', targetFolder: 'target-folder' }))
			.rejects.toBeInstanceOf(MoveImageError);

		spy.mockRestore();
	});
	// #end-test

	// #section Integration
	describe('[integration] moveImage', () => {
		// #test - move exitoso
		/**
		 * Move conserva metadata y nombre.
		 * @version 1.0.0
		 */
		test('mueve y conserva metadata', async () => {
			const timestamp = Date.now();
			const name = `move-${timestamp}`;

			const created = await createImage(
				{
					type: 'url',
					url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
				},
				{
					name,
					folder: 'kitchen-solutions-suite/design-tests',
					overwrite: true,
				},
				{ source: 'move', module: 'cloudinary' }
			);

			const before = await getImage(created.publicId);
			const moved = await moveImage({
				publicId: created.publicId,
				targetFolder: 'kitchen-solutions-suite/design-tests-moved',
			});

			// Validar que el publicId final es exactamente el esperado
			const expectedPublicId = `kitchen-solutions-suite/design-tests-moved/${name}`;
			expect(moved.publicId).toBe(expectedPublicId);
			expect(moved.publicId).not.toBe(created.publicId);
			// Validar que el nombre se conserva
			expect(moved.publicId.split('/').pop()).toBe(created.publicId.split('/').pop());
			// Validar metadata
			expect(moved.metadata).toEqual(
				expect.objectContaining({ source: 'move', module: 'cloudinary' })
			);
			expect(moved.raw.context.custom).toEqual(
				expect.objectContaining({ source: 'move', module: 'cloudinary' })
			);
			// Validar dimensiones
			expect(moved.width).toBe(before.width);
			expect(moved.height).toBe(before.height);
			expect(moved.bytes).toBe(before.bytes);
		}, 30000);
		// #end-test
	});
	// #end-section
});
// #end-section
