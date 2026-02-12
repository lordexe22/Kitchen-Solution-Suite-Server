// delete-image.test.ts
/* #info - Jest test for Cloudinary deleteImage */
// #section Imports
import { createImage, deleteImage } from '../cloudinary';
import { DeleteError, NotFoundError, ValidationError } from '../cloudinary.errors';
import * as cloudinaryConfig from '../cloudinary.config';
// #end-section


// #describe Tests
describe('Cloudinary - deleteImage', () => {
	// #test - falla con publicId vacío
	/**
	 * Verifica validación de publicId vacío.
	 * @version 1.0.0
	 */
	test('falla con ValidationError si publicId es inválido', async () => {
		// #step 1 - Ejecutar con publicId inválido
		const action = () => deleteImage('');
		// #end-step

		// #step 2 - Validar error
		await expect(action()).rejects.toBeInstanceOf(ValidationError);
		// #end-step
	});
	// #end-test
  // #test - falla con formato inválido
  /**
   * Verifica validación de formato de publicId.
   * @version 1.0.0
   */
  test('falla con ValidationError si publicId tiene formato inválido', async () => {
    // #step 1 - Ejecutar con publicId inválido
    const action = () => deleteImage('INVALID ID!!!');
    // #end-step

    // #step 2 - Validar error
    await expect(action()).rejects.toBeInstanceOf(ValidationError);
    // #end-step
  });
  // #end-test

	// #test - inexistente falla consistentemente
  /**
	 * Verifica que borrar dos veces un inexistente falle consistentemente.
   * @version 1.0.0
   */
	test('borrar un inexistente falla consistentemente', async () => {
    // #step 1 - Eliminar publicId inexistente
    const publicId = `not-found-${Date.now()}`;
    await expect(deleteImage(publicId)).rejects.toBeInstanceOf(NotFoundError);
    // #end-step

    // #step 2 - Repetir eliminación
    await expect(deleteImage(publicId)).rejects.toBeInstanceOf(NotFoundError);
    // #end-step
  });
  // #end-test
  // #test - falla por error de red
  /**
   * Verifica DeleteError cuando falla la comunicación con Cloudinary.
   * @version 1.0.0
   */
  test('falla con DeleteError si hay error de red', async () => {
    // #step 1 - Mockear cliente con error
    const destroy = jest.fn().mockRejectedValue(new Error('Network error'));
    const spy = jest
      .spyOn(cloudinaryConfig, 'getCloudinaryClient')
      .mockReturnValue({ uploader: { destroy } } as any);
    // #end-step

    // #step 2 - Ejecutar y validar error
    await expect(deleteImage('some-public-id')).rejects.toBeInstanceOf(DeleteError);
    // #end-step

    // #step 3 - Restaurar mock
    spy.mockRestore();
    // #end-step
  });
  // #end-test
	// #test - elimina una imagen existente
	/**
	 * Crea una imagen temporal, la elimina y valida respuesta.
	 * @version 1.0.0
	 */
	test('elimina una imagen existente', async () => {
		// #step 1 - Crear imagen temporal
		const created = await createImage(
			{
				type: 'url',
				url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
			},
			{
				name: `delete-${Date.now()}`,
				folder: 'kitchen-solutions-suite/design-tests',
				overwrite: true,
			}
		);
		// #end-step

		// #step 2 - Eliminar por publicId
		const result = await deleteImage(created.publicId);
		// #end-step

		// #step 3 - Validar resultado
		expect(result.deleted).toBe(true);
		// #end-step
	}, 30000);
	// #end-test

	// #test - acepta publicId con folder/name
	/**
	 * Verifica que el formato folder/name es válido.
	 * @version 1.0.0
	 */
	test('acepta publicId con folder/name', async () => {
		// #step 1 - Mock de respuesta OK
		const destroy = jest.fn().mockResolvedValue({ result: 'ok' });
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ uploader: { destroy } } as any);
		// #end-step

		// #step 2 - Ejecutar con publicId válido
		const result = await deleteImage('folder/sub-folder/name_ok-1');
		// #end-step

		// #step 3 - Validar resultado
		expect(result.deleted).toBe(true);
		expect(destroy).toHaveBeenCalledWith('folder/sub-folder/name_ok-1', {
			resource_type: 'image',
		});
		// #end-step

		spy.mockRestore();
	});
	// #end-test

	// #test - mapea result not found
	/**
	 * Mapea result=not found a NotFoundError.
	 * @version 1.0.0
	 */
	test('mapea result=not found a NotFoundError', async () => {
		const destroy = jest.fn().mockResolvedValue({ result: 'not found' });
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ uploader: { destroy } } as any);

		await expect(deleteImage('some-id')).rejects.toBeInstanceOf(NotFoundError);

		spy.mockRestore();
	});
	// #end-test

	// #test - mapea result error
	/**
	 * Mapea result=error a DeleteError.
	 * @version 1.0.0
	 */
	test('mapea result=error a DeleteError', async () => {
		const destroy = jest.fn().mockResolvedValue({ result: 'error' });
		const spy = jest
			.spyOn(cloudinaryConfig, 'getCloudinaryClient')
			.mockReturnValue({ uploader: { destroy } } as any);

		await expect(deleteImage('some-id')).rejects.toBeInstanceOf(DeleteError);

		spy.mockRestore();
	});
	// #end-test
	// #test - eliminar dos veces retorna not found
	/**
	 * Elimina un recurso dos veces y valida NotFoundError en la segunda.
	 * @version 1.0.0
	 */
	test('segunda eliminación retorna NotFoundError', async () => {
		// #step 1 - Crear imagen
		const created = await createImage(
			{
				type: 'url',
				url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
			},
			{
				name: `delete-twice-${Date.now()}`,
				folder: 'kitchen-solutions-suite/design-tests',
				overwrite: true,
			}
		);
		// #end-step

		// #step 2 - Eliminar primera vez
		await deleteImage(created.publicId);
		// #end-step

		// #step 3 - Eliminar segunda vez y validar error
		await expect(deleteImage(created.publicId)).rejects.toBeInstanceOf(NotFoundError);
		// #end-step
	}, 30000);
	// #end-test
});
// #end-describe
