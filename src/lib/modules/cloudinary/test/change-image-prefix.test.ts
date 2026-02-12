// change-image-prefix.test.ts
/* #info - Jest test for Cloudinary changeImagePrefix */
// #section Imports
import { changeImagePrefix } from '../cloudinary';
import {	ConfigurationError,
	RenameImageError,
	NotFoundError,
	ValidationError,
} from '../cloudinary.errors';
import * as cloudinaryConfig from '../cloudinary.config';
// #end-section

// #section Tests
describe('Cloudinary - changeImagePrefix', () => {
	// #test - validaciones de entrada
	/**
	 * Valida errores de entrada en changeImagePrefix.
	 * @version 1.0.0
	 */
	test('validaciones de entrada', async () => {
		await expect(
			changeImagePrefix({ publicId: '', mode: 'replace', prefix: 'avatar' })
		).rejects.toBeInstanceOf(ValidationError);
		await expect(
			changeImagePrefix({ publicId: 'INVALID ID!!!', mode: 'replace', prefix: 'avatar' })
		).rejects.toBeInstanceOf(ValidationError);
		await expect(
			changeImagePrefix({ publicId: 'folder/avatar--user', mode: 'invalid' as any })
		).rejects.toBeInstanceOf(ValidationError);
		await expect(
			changeImagePrefix({ publicId: 'folder/avatar--user', mode: 'append' })
		).rejects.toBeInstanceOf(ValidationError);
		await expect(
			changeImagePrefix({ publicId: 'folder/avatar--user', mode: 'prepend' })
		).rejects.toBeInstanceOf(ValidationError);
		await expect(
			changeImagePrefix({ publicId: 'folder/avatar--user', mode: 'replace', prefix: 'bad/name' })
		).rejects.toBeInstanceOf(ValidationError);
		await expect(
			changeImagePrefix({ publicId: 'folder/avatar--user', mode: 'replace', prefix: 'bad name' })
		).rejects.toBeInstanceOf(ValidationError);
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

		await expect(
			changeImagePrefix({ publicId: 'folder/avatar--user', mode: 'replace', prefix: 'profile' })
		).rejects.toBeInstanceOf(ConfigurationError);

		spy.mockRestore();
	});
	// #end-test

	// #test - replace prefix
	/**
	 * Reemplaza prefijo y delega en rename.
	 * @version 1.0.0
	 */
	test('replace prefix genera publicId correcto', async () => {
		const rename = jest.fn().mockResolvedValue({});
		const apiResource = jest.fn().mockResolvedValue({
			public_id: 'folder/profile--user',
			url: 'http://example.com/a.jpg',
			secure_url: 'https://example.com/a.jpg',
			width: 100,
			height: 200,
			format: 'jpg',
			bytes: 10,
			resource_type: 'image',
			context: { custom: { name: 'user', folder: 'folder', prefix: 'avatar' } },
		});
		const update = jest.fn().mockResolvedValue({});
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ uploader: { rename }, api: { resource: apiResource, update } } as any);

		const result = await changeImagePrefix({
			publicId: 'folder/avatar--user',
			mode: 'replace',
			prefix: 'profile',
		});

		expect(rename).toHaveBeenCalledWith('folder/avatar--user', 'folder/profile--user', {
			resource_type: 'image',
			overwrite: false,
		});
		expect(result.publicId).toBe('folder/profile--user');

		spy.mockRestore();
	});
	// #end-test

	// #test - prepend sin duplicar
	/**
	 * No duplica prefijo cuando ya existe.
	 * @version 1.0.0
	 */
	test('prepend no duplica prefijo existente', async () => {
		const rename = jest.fn();
		const apiResource = jest.fn().mockResolvedValue({
			public_id: 'folder/avatar--user',
			url: 'http://example.com/a.jpg',
			secure_url: 'https://example.com/a.jpg',
			width: 100,
			height: 200,
			format: 'jpg',
			bytes: 10,
			resource_type: 'image',
			context: { custom: { name: 'user', folder: 'folder', prefix: 'avatar' } },
		});
		const update = jest.fn().mockResolvedValue({});
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ uploader: { rename }, api: { resource: apiResource, update } } as any);

		const result = await changeImagePrefix({
			publicId: 'folder/avatar--user',
			mode: 'prepend',
			prefix: 'avatar',
		});

		expect(rename).not.toHaveBeenCalled();
		expect(result.publicId).toBe('folder/avatar--user');

		spy.mockRestore();
	});
	// #end-test

	// #test - not found
	/**
	 * Mapea 404 a NotFoundError.
	 * @version 1.0.0
	 */
	test('falla si la imagen no existe', async () => {
		const rename = jest.fn().mockRejectedValue({ error: { http_code: 404 } });
		const apiResource = jest.fn().mockResolvedValue({
			public_id: 'folder/missing-image',
			url: 'http://example.com/a.jpg',
			secure_url: 'https://example.com/a.jpg',
			width: 100,
			height: 200,
			format: 'jpg',
			bytes: 10,
			resource_type: 'image',
			context: { custom: { name: 'missing-image', folder: 'folder', prefix: 'profile' } },
		});
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ uploader: { rename }, api: { resource: apiResource, update: jest.fn() } } as any);

		await expect(
			changeImagePrefix({
				publicId: 'folder/missing-image',
				mode: 'replace',
				prefix: 'profile',
			})
		).rejects.toBeInstanceOf(NotFoundError);

		spy.mockRestore();
	});
	// #end-test

	// #test - colisión de nombre
	/**
	 * Mapea colisión de destino a RenameImageError.
	 * @version 1.0.0
	 */
	test('falla si el target ya existe (overwrite=false)', async () => {
		const rename = jest.fn().mockRejectedValue({ error: { http_code: 409 } });
		const apiResource = jest.fn().mockResolvedValue({
			public_id: 'folder/avatar--user',
			url: 'http://example.com/a.jpg',
			secure_url: 'https://example.com/a.jpg',
			width: 100,
			height: 200,
			format: 'jpg',
			bytes: 10,
			resource_type: 'image',
			context: { custom: { name: 'user', folder: 'folder', prefix: 'avatar' } },
		});
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ uploader: { rename }, api: { resource: apiResource, update: jest.fn() } } as any);

		await expect(
			changeImagePrefix({
				publicId: 'folder/avatar--user',
				mode: 'replace',
				prefix: 'profile',
			})
		).rejects.toBeInstanceOf(RenameImageError);

		spy.mockRestore();
	});
	// #end-test

	// #test - append prefix
	/**
	 * Append agrega prefijo al final.
	 * @version 1.0.0
	 */
	test('append agrega prefijo al final', async () => {
		const rename = jest.fn().mockResolvedValue({});
		const apiResource = jest.fn().mockResolvedValue({
			public_id: 'folder/avatar--v2--user',
			url: 'http://example.com/a.jpg',
			secure_url: 'https://example.com/a.jpg',
			width: 100,
			height: 200,
			format: 'jpg',
			bytes: 10,
			resource_type: 'image',
			context: { custom: { name: 'user', folder: 'folder', prefix: 'avatar' } },
		});
		const update = jest.fn().mockResolvedValue({});
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ uploader: { rename }, api: { resource: apiResource, update } } as any);

		const result = await changeImagePrefix({
			publicId: 'folder/avatar--user',
			mode: 'append',
			prefix: 'v2',
		});

		expect(rename).toHaveBeenCalledWith('folder/avatar--user', 'folder/avatar--v2--user', {
			resource_type: 'image',
			overwrite: false,
		});
		expect(result.publicId).toBe('folder/avatar--v2--user');

		spy.mockRestore();
	});
	// #end-test

	// #test - no muta folder
	/**
	 * No modifica el folder del publicId.
	 * @version 1.0.0
	 */
	test('no modifica el folder del publicId', async () => {
		const rename = jest.fn().mockResolvedValue({});
		const apiResource = jest.fn().mockResolvedValue({
			public_id: 'folder/sub/profile--user',
			url: 'http://example.com/a.jpg',
			secure_url: 'https://example.com/a.jpg',
			width: 100,
			height: 200,
			format: 'jpg',
			bytes: 10,
			resource_type: 'image',
			context: { custom: { name: 'user', folder: 'folder/sub', prefix: 'avatar' } },
		});
		const update = jest.fn().mockResolvedValue({});
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ uploader: { rename }, api: { resource: apiResource, update } } as any);

		const result = await changeImagePrefix({
			publicId: 'folder/sub/avatar--user',
			mode: 'replace',
			prefix: 'profile',
		});

		expect(result.publicId.startsWith('folder/sub/')).toBe(true);

		spy.mockRestore();
	});
	// #end-test
});
// #end-section
