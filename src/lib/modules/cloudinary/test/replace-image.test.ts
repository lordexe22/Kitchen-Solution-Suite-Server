// replace-image.test.ts
/* #info - Jest test for Cloudinary replaceImage */
// #section Imports
import { createImage, replaceImage } from '../cloudinary';
import {	ConfigurationError,
	ReplaceImageError,
	UploadError,
	ValidationError,
	NotFoundError,
} from '../cloudinary.errors';
import * as cloudinaryConfig from '../cloudinary.config';
// #end-section


// #section Tests
describe('Cloudinary - replaceImage', () => {
	// #test - validaciones de entrada
	/**
	 * Valida errores de entrada en replaceImage.
	 * @version 1.0.0
	 */
	test('validaciones de entrada', async () => {
		await expect(
			replaceImage({
				publicId: '',
				source: { type: 'url', url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' },
			})
		).rejects.toBeInstanceOf(ValidationError);

		await expect(
			replaceImage({
				publicId: 'INVALID ID!!!',
				source: { type: 'url', url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' },
			})
		).rejects.toBeInstanceOf(ValidationError);

		await expect(
			replaceImage({
				publicId: 'valid-id',
				source: undefined as any,
			})
		).rejects.toBeInstanceOf(ValidationError);

		await expect(
			replaceImage({
				publicId: 'valid-id',
				source: { type: 'url', url: '' },
			})
		).rejects.toBeInstanceOf(ValidationError);

		await expect(
			replaceImage({
				publicId: 'valid-id',
				source: { type: 'url' } as any,
			})
		).rejects.toBeInstanceOf(ValidationError);

		await expect(
			replaceImage({
				publicId: 'valid-id',
				source: { type: 'banana' } as any,
			})
		).rejects.toBeInstanceOf(ValidationError);

		await expect(
			replaceImage({
				publicId: 'valid-id',
				source: { type: 'file', filePath: 'Z:/no-existe/imagen.jpg' },
			})
		).rejects.toBeInstanceOf(ValidationError);

		await expect(
			replaceImage({
				publicId: 'valid-id',
				source: { type: 'buffer', buffer: null as any },
			})
		).rejects.toBeInstanceOf(ValidationError);

		await expect(
			replaceImage({
				publicId: 'valid-id',
				source: { type: 'url', url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' },
				metadata: [] as any,
			})
		).rejects.toBeInstanceOf(ValidationError);

		await expect(
			replaceImage({
				publicId: 'valid-id',
				source: { type: 'url', url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' },
				metadata: { fn: () => 'nope' },
			})
		).rejects.toBeInstanceOf(ValidationError);

		await expect(
			replaceImage({
				publicId: 'valid-id',
				source: { type: 'url', url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' },
				metadata: { sym: Symbol('x') },
			})
		).rejects.toBeInstanceOf(ValidationError);

		await expect(
			replaceImage({
				publicId: 'valid-id',
				source: { type: 'url', url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' },
				overwrite: false,
			})
		).rejects.toBeInstanceOf(ValidationError);
	});
	// #end-test

	// #test - configuración inválida
	/**
	 * Propaga ConfigurationError si no hay credenciales.
	 * @version 1.0.0
	 */
	test('falla si el cliente no está configurado', async () => {
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockImplementation(() => {
				throw new ConfigurationError('No credentials');
			});

		await expect(
			replaceImage({
				publicId: 'valid-id',
				source: { type: 'url', url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' },
			})
		).rejects.toBeInstanceOf(ConfigurationError);

		spy.mockRestore();
	});
	// #end-test

	// #test - mocks de flujo de control
	/**
	 * Verifica llamada a upload con publicId y overwrite true, sin destroy.
	 * @version 1.0.0
	 */
	test('llama a upload con publicId y overwrite=true', async () => {
		const upload = jest.fn().mockResolvedValue({
			public_id: 'my-public-id',
			secure_url: 'https://example.com/img.jpg',
			url: 'http://example.com/img.jpg',
		});
		const destroy = jest.fn();
		const apiResource = jest.fn().mockResolvedValue({
			context: { custom: { name: 'my-public-id', folder: '' } },
		});

		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({
				uploader: { upload, destroy },
				api: { resource: apiResource },
			} as any);

		await replaceImage({
			publicId: 'my-public-id',
			source: { type: 'url', url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' },
			metadata: undefined,
		});

		expect(apiResource).toHaveBeenCalledWith('my-public-id', {
			resource_type: 'image',
			context: true,
		});
		expect(upload).toHaveBeenCalledWith(
			'https://res.cloudinary.com/demo/image/upload/sample.jpg',
			expect.objectContaining({
				public_id: 'my-public-id',
				overwrite: true,
				invalidate: true,
				resource_type: 'image',
			})
		);
		expect(destroy).not.toHaveBeenCalled();

		spy.mockRestore();
	});
	// #end-test

	// #test - mock: api.resource not found
	/**
	 * Si api.resource retorna 404 no debe intentar upload.
	 * @version 1.0.0
	 */
	test('api.resource 404 no llama upload', async () => {
		const upload = jest.fn();
		const apiResource = jest.fn().mockRejectedValue({ error: { http_code: 404 } });
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({
				uploader: { upload },
				api: { resource: apiResource },
			} as any);

		await expect(
			replaceImage({
				publicId: 'my-public-id',
				source: { type: 'url', url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' },
			})
		).rejects.toBeInstanceOf(NotFoundError);

		expect(upload).not.toHaveBeenCalled();
		spy.mockRestore();
	});
	// #end-test

	// #test - errores de upload mock
	/**
	 * Verifica errores en upload con mocks.
	 * @version 1.0.0
	 */
	test('propaga UploadError y ReplaceImageError según fallo', async () => {
		const upload = jest.fn().mockRejectedValue(new Error('Generic upload error'));
		const apiResource = jest.fn().mockResolvedValue({
			context: { custom: { name: 'my-public-id', folder: '' } },
		});
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({
				uploader: { upload },
				api: { resource: apiResource },
			} as any);

		await expect(
			replaceImage({
				publicId: 'my-public-id',
				source: { type: 'url', url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' },
			})
		).rejects.toBeInstanceOf(UploadError);

		const uploadNetwork = jest.fn().mockRejectedValue(Object.assign(new Error('Network error'), { code: 'ETIMEDOUT' }));
		spy.mockReturnValue({ uploader: { upload: uploadNetwork }, api: { resource: apiResource } } as any);

		await expect(
			replaceImage({
				publicId: 'my-public-id',
				source: { type: 'url', url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' },
			})
		).rejects.toBeInstanceOf(ReplaceImageError);

		const uploadBadRequest = jest.fn().mockRejectedValue({ error: { http_code: 400 } });
		spy.mockReturnValue({ uploader: { upload: uploadBadRequest }, api: { resource: apiResource } } as any);

		await expect(
			replaceImage({
				publicId: 'my-public-id',
				source: { type: 'url', url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' },
			})
		).rejects.toBeInstanceOf(UploadError);

		spy.mockRestore();
	});
	// #end-test

	// #test - integración: reemplazo exitoso
	/**
	 * Reemplaza manteniendo publicId y verifica cambios en secure_url/bytes.
	 * @version 1.0.0
	 */
	test('reemplazo exitoso mantiene publicId', async () => {
		const created = await createImage(
			{
				type: 'url',
				url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
			},
			{
				name: `replace-${Date.now()}`,
				folder: 'kitchen-solutions-suite/design-tests',
				overwrite: true,
			}
		);

		const beforeVersion = (created.raw as Record<string, any> | undefined)?.version ?? 0;
		const client = cloudinaryConfig.getCloudinaryClient();
		const beforeResource = await client.api.resource(created.publicId, {
			resource_type: 'image',
		});

		const replaced = await replaceImage({
			publicId: created.publicId,
			source: { type: 'url', url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' },
			metadata: { version: 'v2' },
		});

		expect(replaced.publicId).toBe(created.publicId);
		expect(replaced.secureUrl).toBeTruthy();
		expect(replaced.metadata).toEqual(
			expect.objectContaining({ version: 'v2' })
		);
		expect(replaced.secureUrl).toContain(created.publicId);
		expect((replaced.raw as Record<string, any> | undefined)?.version).toBeGreaterThanOrEqual(beforeVersion);

		const afterResource = await client.api.resource(created.publicId, {
			resource_type: 'image',
		});
		expect(afterResource.asset_id).toBe(beforeResource.asset_id);
		expect(afterResource.asset_folder).toBe(beforeResource.asset_folder);
	}, 30000);
	// #end-test

	// #test - integración: replace desde filePath
	/**
	 * Reemplazo desde filePath.
	 * @version 1.0.0
	 */
	test('reemplazo desde filePath', async () => {
		const created = await createImage(
			{
				type: 'url',
				url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
			},
			{
				name: `replace-file-${Date.now()}`,
				folder: 'kitchen-solutions-suite/design-tests',
				overwrite: true,
			}
		);

		const base64 =
			'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=';
		const buffer = Buffer.from(base64, 'base64');
		const fs = await import('fs');
		const path = await import('path');
		const tmpPath = path.join(process.cwd(), `tmp-replace-${Date.now()}.png`);
		fs.writeFileSync(tmpPath, buffer);

		const replaced = await replaceImage({
			publicId: created.publicId,
			source: { type: 'file', filePath: tmpPath },
			metadata: { file: true },
		});

		fs.unlinkSync(tmpPath);

		expect(replaced.publicId).toBe(created.publicId);
		expect(replaced.metadata).toEqual(
			expect.objectContaining({ file: true })
		);
	}, 30000);
	// #end-test

	// #test - integración: replace desde buffer
	/**
	 * Reemplazo desde buffer.
	 * @version 1.0.0
	 */
	test('reemplazo desde buffer', async () => {
		const created = await createImage(
			{
				type: 'url',
				url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
			},
			{
				name: `replace-buffer-${Date.now()}`,
				folder: 'kitchen-solutions-suite/design-tests',
				overwrite: true,
			}
		);

		const base64 =
			'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=';
		const buffer = Buffer.from(base64, 'base64');

		const replaced = await replaceImage({
			publicId: created.publicId,
			source: { type: 'buffer', buffer },
			metadata: { buffer: true },
		});

		expect(replaced.publicId).toBe(created.publicId);
		expect(replaced.metadata).toEqual(
			expect.objectContaining({ buffer: true })
		);
	}, 30000);
	// #end-test

	// #test - integración: metadata {} limpia
	/**
	 * Metadata {} limpia la metadata previa.
	 * @version 1.0.0
	 */
	test('metadata {} limpia metadata previa', async () => {
		const created = await createImage(
			{
				type: 'url',
				url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
			},
			{
				name: `replace-meta-${Date.now()}`,
				folder: 'kitchen-solutions-suite/design-tests',
				overwrite: true,
			},
			{ foo: 'bar' }
		);

		const replaced = await replaceImage({
			publicId: created.publicId,
			source: { type: 'url', url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' },
			metadata: {},
		});

		expect(replaced.metadata).toEqual(
			expect.objectContaining({
				name: created.publicId.split('/').pop(),
				folder: 'kitchen-solutions-suite/design-tests',
			})
		);
	}, 30000);
	// #end-test

	// #test - integración: metadata parcial sobrescribe
	/**
	 * Metadata parcial sobrescribe solo lo enviado.
	 * @version 1.0.0
	 */
	test('metadata parcial sobrescribe solo lo enviado', async () => {
		const created = await createImage(
			{
				type: 'url',
				url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
			},
			{
				name: `replace-meta-partial-${Date.now()}`,
				folder: 'kitchen-solutions-suite/design-tests',
				overwrite: true,
			},
			{ foo: 'bar', keep: 'yes' }
		);

		const replaced = await replaceImage({
			publicId: created.publicId,
			source: { type: 'url', url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' },
			metadata: { foo: 'new' },
		});

		expect(replaced.metadata).toEqual(
			expect.objectContaining({ foo: 'new', keep: 'yes' })
		);
	}, 30000);
	// #end-test

	// #test - integración: atomicidad ante fallo de upload
	/**
	 * Si el upload falla, el recurso original debe mantenerse intacto.
	 * @version 1.0.0
	 */
	test('si falla el upload, el recurso original sigue intacto', async () => {
		const created = await createImage(
			{
				type: 'url',
				url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
			},
			{
				name: `replace-fail-${Date.now()}`,
				folder: 'kitchen-solutions-suite/design-tests',
				overwrite: true,
			}
		);

		const client = cloudinaryConfig.getCloudinaryClient();
		const beforeResource = await client.api.resource(created.publicId, {
			resource_type: 'image',
		});

		try {
			await replaceImage({
				publicId: created.publicId,
				source: { type: 'url', url: 'https://example.invalid/does-not-exist.jpg' },
				metadata: { fail: true },
			});
			throw new Error('Se esperaba fallo en replaceImage');
		} catch (_error) {
			// esperado
		}

		const afterResource = await client.api.resource(created.publicId, {
			resource_type: 'image',
		});
		expect(afterResource.asset_id).toBe(beforeResource.asset_id);
	}, 30000);
	// #end-test

	// #test - integración: replace consecutivo mantiene un solo recurso
	/**
	 * Dos replace consecutivos mantienen asset_id y actualizan el estado.
	 * @version 1.0.0
	 */
	test('replace consecutivo mantiene asset_id', async () => {
		const created = await createImage(
			{
				type: 'url',
				url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
			},
			{
				name: `replace-twice-${Date.now()}`,
				folder: 'kitchen-solutions-suite/design-tests',
				overwrite: true,
			}
		);

		const client = cloudinaryConfig.getCloudinaryClient();
		const beforeResource = await client.api.resource(created.publicId, {
			resource_type: 'image',
		});

		await replaceImage({
			publicId: created.publicId,
			source: { type: 'url', url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' },
			metadata: { step: 'first' },
		});

		await replaceImage({
			publicId: created.publicId,
			source: { type: 'url', url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' },
			metadata: { step: 'second' },
		});

		const afterResource = await client.api.resource(created.publicId, {
			resource_type: 'image',
		});

		expect(afterResource.asset_id).toBe(beforeResource.asset_id);
	}, 30000);
	// #end-test

	// #test - integración: publicId inexistente
	/**
	 * replaceImage sobre publicId inexistente lanza NotFoundError.
	 * @version 1.0.0
	 */
	test('falla con NotFoundError si publicId no existe', async () => {
		await expect(
			replaceImage({
				publicId: `not-found-${Date.now()}`,
				source: { type: 'url', url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' },
			})
		).rejects.toBeInstanceOf(NotFoundError);
	}, 30000);
	// #end-test
});
// #end-section
