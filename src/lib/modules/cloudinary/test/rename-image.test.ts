// rename-image.test.ts
/* #info - Jest test for Cloudinary renameImage */
// #section Imports
import { createImage, getImage, renameImage } from '../cloudinary';
import {	ConfigurationError,
	RenameImageError,
	NotFoundError,
	ValidationError,
} from '../cloudinary.errors';
import * as cloudinaryConfig from '../cloudinary.config';
// #end-section


// #section Tests
describe('Cloudinary - renameImage', () => {
	// #test - validaciones de entrada
	/**
	 * Valida errores de entrada en renameImage.
	 * @version 1.0.0
	 */
	test('validaciones de entrada', async () => {
		await expect(renameImage({ publicId: '', newName: 'new-name' }))
			.rejects.toBeInstanceOf(ValidationError);
		await expect(renameImage({ publicId: 'INVALID ID!!!', newName: 'new-name' }))
			.rejects.toBeInstanceOf(ValidationError);
		await expect(renameImage({ publicId: 'folder/name', newName: '' }))
			.rejects.toBeInstanceOf(ValidationError);
		await expect(renameImage({ publicId: 'folder/name', newName: 'bad/name' }))
			.rejects.toBeInstanceOf(ValidationError);
		await expect(renameImage({ publicId: 'folder/name', newName: 'bad name' }))
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

		await expect(renameImage({ publicId: 'folder/name', newName: 'new-name' }))
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
			public_id: 'folder/new-name',
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

		await renameImage({ publicId: 'folder/name', newName: 'new-name' });

		expect(rename).toHaveBeenCalledTimes(1);
		expect(rename).toHaveBeenCalledWith('folder/name', 'folder/new-name', {
			resource_type: 'image',
			overwrite: false,
		});

		spy.mockRestore();
	});
	// #end-test

	// #test - devuelve resultado de api.resource
	/**
	 * renameImage devuelve el resultado normalizado de api.resource, no de uploader.rename.
	 * @version 1.0.0
	 */
	test('devuelve resultado de api.resource, no de uploader.rename', async () => {
		// uploader.rename devuelve basura (no es confiable)
		const rename = jest.fn().mockResolvedValue({ garbage: 'data', result: 'ok' });
		// api.resource devuelve datos válidos (fuente de verdad)
		const apiResource = jest.fn().mockResolvedValue({
			public_id: 'folder/new-name',
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

		const result = await renameImage({ publicId: 'folder/name', newName: 'new-name' });

		// El resultado final coincide con api.resource, no con rename
		expect(result.publicId).toBe('folder/new-name');
		expect(result.url).toBe('http://example.com/a.jpg');
		expect(result.secureUrl).toBe('https://example.com/a.jpg');
		expect(result.width).toBe(100);
		expect(result.height).toBe(200);
		expect(result.format).toBe('jpg');
		expect(result.bytes).toBe(10);
		expect(apiResource).toHaveBeenCalledTimes(2);
		expect(apiResource).toHaveBeenNthCalledWith(1, 'folder/name', { resource_type: 'image', context: true });
		expect(apiResource).toHaveBeenNthCalledWith(2, 'folder/new-name', { resource_type: 'image', context: true });

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
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ uploader: { rename }, api: { resource: jest.fn().mockResolvedValue({
				public_id: 'folder/name',
				url: 'http://example.com/a.jpg',
				secure_url: 'https://example.com/a.jpg',
				width: 100,
				height: 200,
				format: 'jpg',
				bytes: 10,
				resource_type: 'image',
				context: { custom: { name: 'name', folder: 'folder' } },
			}), update: jest.fn() } } as any);

		await expect(renameImage({ publicId: 'folder/name', newName: 'new-name' }))
			.rejects.toBeInstanceOf(NotFoundError);

		spy.mockRestore();
	});
	// #end-test

	// #test - target existe
	/**
	 * Mapea colisión de destino a RenameImageError.
	 * @version 1.0.0
	 */
	test('falla con RenameImageError si el target existe', async () => {
		const rename = jest.fn().mockRejectedValue({ error: { message: 'already exists' } });
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ uploader: { rename }, api: { resource: jest.fn().mockResolvedValue({
				public_id: 'folder/name',
				url: 'http://example.com/a.jpg',
				secure_url: 'https://example.com/a.jpg',
				width: 100,
				height: 200,
				format: 'jpg',
				bytes: 10,
				resource_type: 'image',
				context: { custom: { name: 'name', folder: 'folder' } },
			}), update: jest.fn() } } as any);

		await expect(renameImage({ publicId: 'folder/name', newName: 'new-name' }))
			.rejects.toBeInstanceOf(RenameImageError);

		spy.mockRestore();
	});
	// #end-test

	// #test - idempotencia negativa
	/**
	 * Renombrar dos veces el mismo publicId debe fallar (recurso original desaparece).
	 * @version 1.0.0
	 */
	test('falla al intentar renombrar dos veces el mismo publicId', async () => {
		const rename = jest.fn()
			.mockResolvedValueOnce({}) // Primera llamada exitosa
			.mockRejectedValueOnce({ error: { http_code: 404 } }); // Segunda llamada falla
		const apiResource = jest.fn().mockResolvedValue({
			public_id: 'folder/new-name',
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

		// Primera llamada exitosa
		await renameImage({ publicId: 'folder/name', newName: 'new-name' });

		// Segunda llamada debe fallar con NotFoundError (el original desapareció)
		await expect(renameImage({ publicId: 'folder/name', newName: 'another-name' }))
			.rejects.toBeInstanceOf(NotFoundError);

		expect(rename).toHaveBeenCalledTimes(2);

		spy.mockRestore();
	});
	// #end-test

	// #section Integration
	describe('[integration] renameImage', () => {
		// #test - renombre exitoso
		/**
		 * Renombre conserva metadata y dimensiones.
		 * @version 1.0.0
		 */
		test('renombra y conserva metadata', async () => {
			const timestamp = Date.now();
			const originalName = `rename-${timestamp}`;
			const newName = `renamed-${timestamp}`;

			const created = await createImage(
				{
					type: 'url',
					url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
				},
				{
					name: originalName,
					folder: 'kitchen-solutions-suite/design-tests',
					overwrite: true,
				},
				{ source: 'rename', module: 'cloudinary' }
			);

			const before = await getImage(created.publicId);
			const renamed = await renameImage({
				publicId: created.publicId,
				newName,
			});

			// Validar que el publicId final es exactamente el esperado
			const expectedPublicId = `kitchen-solutions-suite/design-tests/${newName}`;
			expect(renamed.publicId).toBe(expectedPublicId);
			expect(renamed.publicId).not.toBe(created.publicId);
			// Validar que el folder se mantiene
			expect(renamed.publicId.split('/').slice(0, -1).join('/'))
				.toBe(created.publicId.split('/').slice(0, -1).join('/'));
			// Validar metadata
			expect(renamed.metadata).toEqual(
				expect.objectContaining({ source: 'rename', module: 'cloudinary' })
			);
			expect(renamed.raw.context.custom).toEqual(
				expect.objectContaining({ source: 'rename', module: 'cloudinary' })
			);
			// Validar dimensiones
			expect(renamed.width).toBe(before.width);
			expect(renamed.height).toBe(before.height);
			expect(renamed.bytes).toBe(before.bytes);
		}, 30000);
		// #end-test
	});
	// #end-section
});
// #end-section
