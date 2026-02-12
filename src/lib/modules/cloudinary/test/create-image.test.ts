// create-image.test.ts
/* #info - Jest test for Cloudinary createImage */
// #section Imports
import { createImage } from '../cloudinary';
import { ConfigurationError, UploadError, ValidationError } from '../cloudinary.errors';
import * as cloudinaryConfig from '../cloudinary.config';
// #end-section


// #describe Tests
describe('Cloudinary - createImage', () => {
  // #test - falla cuando faltan parámetros
  /**
   * Verifica validaciones de entrada en createImage.
   * @version 1.0.0
   */
  test('falla con ValidationError si faltan parámetros', async () => {
    // #step 1 - Ejecutar con datos inválidos
    const action = () =>
      createImage(
        {
          type: 'url',
          url: '',
        },
        {
          name: '',
          folder: '',
        }
      );
    // #end-step

    // #step 2 - Validar error
    await expect(action()).rejects.toBeInstanceOf(ValidationError);
    // #end-step
  });
  // #end-test
  // #test - falla con ruta inexistente
  /**
   * Verifica validación de ruta cuando type es file.
   * @version 1.0.0
   */
  test('falla con ValidationError si filePath no existe', async () => {
    // #step 1 - Ejecutar con filePath inválido
    const action = () =>
      createImage(
        {
          type: 'file',
          filePath: 'Z:/no-existe/imagen.jpg',
        },
        {
          name: 'file-test',
          folder: 'kitchen-solutions-suite/design-tests',
        }
      );
    // #end-step

    // #step 2 - Validar error
    await expect(action()).rejects.toBeInstanceOf(ValidationError);
    // #end-step
  });
  // #end-test
  // #test - falla con buffer inválido
  /**
   * Verifica validación cuando el buffer no es válido.
   * @version 1.0.0
   */
  test('falla con ValidationError si buffer es inválido', async () => {
    // #step 1 - Ejecutar con buffer inválido
    const action = () =>
      createImage(
        {
          type: 'buffer',
          buffer: null as unknown as Buffer,
        },
        {
          name: 'buffer-test',
          folder: 'kitchen-solutions-suite/design-tests',
        }
      );
    // #end-step

    // #step 2 - Validar error
    await expect(action()).rejects.toBeInstanceOf(ValidationError);
    // #end-step
  });
  // #end-test
  // #test - construye publicId sin prefix
  /**
   * Verifica construcción de publicId sin prefix.
   * @version 1.0.0
   */
  test('construye publicId sin prefix', async () => {
    // #step 1 - Ejecutar upload
    const result = await createImage(
      {
        type: 'url',
        url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      },
      {
        name: 'My Image',
        folder: 'My Folder/Design Tests',
        overwrite: true,
      }
    );
    // #end-step

    // #step 2 - Validar publicId
    expect(result.publicId).toBe('my-folder/design-tests/my-image');
    // #end-step
  }, 30000);
  // #end-test
  // #test - construye publicId con prefix
  /**
   * Verifica construcción de publicId con prefix.
   * @version 1.0.0
   */
  test('construye publicId con prefix', async () => {
    // #step 1 - Ejecutar upload
    const result = await createImage(
      {
        type: 'url',
        url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      },
      {
        name: 'My Image',
        folder: 'My Folder/Design Tests',
        prefix: 'Company Logo',
        overwrite: true,
      }
    );
    // #end-step

    // #step 2 - Validar publicId
    expect(result.publicId).toBe('my-folder/design-tests/company-logo--my-image');
    // #end-step
  }, 30000);
  // #end-test
  // #test - overwrite false con publicId existente
  /**
   * Verifica error cuando overwrite es false y el recurso ya existe.
   * @version 1.0.0
   */
  test('falla con UploadError si overwrite=false y publicId existe', async () => {
    // #step 1 - Crear recurso
    const name = `overwrite-${Date.now()}`;
    await createImage(
      {
        type: 'url',
        url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      },
      {
        name,
        folder: 'kitchen-solutions-suite/design-tests',
        overwrite: true,
      }
    );
    // #end-step

    // #step 2 - Intentar crear sin overwrite
    const action = () =>
      createImage(
        {
          type: 'url',
          url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        },
        {
          name,
          folder: 'kitchen-solutions-suite/design-tests',
          overwrite: false,
        }
      );
    // #end-step

    // #step 3 - Validar error
    await expect(action()).rejects.toBeInstanceOf(UploadError);
    // #end-step
  }, 30000);
  // #end-test
  // #test - overwrite true con publicId existente
  /**
   * Verifica que overwrite true reemplace el recurso.
   * @version 1.0.0
   */
  test('permite overwrite=true con publicId existente', async () => {
    // #step 1 - Crear recurso
    const name = `overwrite-true-${Date.now()}`;
    await createImage(
      {
        type: 'url',
        url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      },
      {
        name,
        folder: 'kitchen-solutions-suite/design-tests',
        overwrite: true,
      }
    );
    // #end-step

    // #step 2 - Reemplazar con overwrite true
    const result = await createImage(
      {
        type: 'url',
        url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      },
      {
        name,
        folder: 'kitchen-solutions-suite/design-tests',
        overwrite: true,
      }
    );
    // #end-step

    // #step 3 - Validar éxito
    expect(result.publicId).toBe(`kitchen-solutions-suite/design-tests/${name}`);
    // #end-step
  }, 30000);
  // #end-test
  // #test - upload exitoso desde filePath
  /**
   * Verifica upload exitoso desde filePath.
   * @version 1.0.0
   */
  test('sube imagen desde filePath', async () => {
    // #step 1 - Crear archivo temporal
    const base64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=';
    const buffer = Buffer.from(base64, 'base64');
    const fs = await import('fs');
    const path = await import('path');
    const tmpPath = path.join(process.cwd(), `tmp-${Date.now()}.png`);
    fs.writeFileSync(tmpPath, buffer);
    // #end-step

    // #step 2 - Ejecutar upload
    const result = await createImage(
      {
        type: 'file',
        filePath: tmpPath,
      },
      {
        name: `file-${Date.now()}`,
        folder: 'kitchen-solutions-suite/design-tests',
        overwrite: true,
      }
    );
    // #end-step

    // #step 3 - Limpiar archivo
    fs.unlinkSync(tmpPath);
    // #end-step

    // #step 4 - Validar éxito
    expect(result.publicId).toBeTruthy();
    // #end-step
  }, 30000);
  // #end-test
  // #test - upload exitoso desde buffer
  /**
   * Verifica upload exitoso desde buffer.
   * @version 1.0.0
   */
  test('sube imagen desde buffer', async () => {
    // #step 1 - Crear buffer
    const base64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=';
    const buffer = Buffer.from(base64, 'base64');
    // #end-step

    // #step 2 - Ejecutar upload
    const result = await createImage(
      {
        type: 'buffer',
        buffer,
      },
      {
        name: `buffer-${Date.now()}`,
        folder: 'kitchen-solutions-suite/design-tests',
        overwrite: true,
      }
    );
    // #end-step

    // #step 3 - Validar éxito
    expect(result.publicId).toBeTruthy();
    // #end-step
  }, 30000);
  // #end-test

  // #test - mismo name distinto folder
  /**
   * Verifica que mismo name en distinto folder no colisiona.
   * @version 1.0.0
   */
  test('mismo name en distinto folder genera publicId distinto', async () => {
    const name = `same-${Date.now()}`;

    const resultA = await createImage(
      {
        type: 'url',
        url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      },
      {
        name,
        folder: 'kitchen-solutions-suite/design-tests/a',
        overwrite: true,
      }
    );

    const resultB = await createImage(
      {
        type: 'url',
        url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      },
      {
        name,
        folder: 'kitchen-solutions-suite/design-tests/b',
        overwrite: true,
      }
    );

    expect(resultA.publicId).toBe(`kitchen-solutions-suite/design-tests/a/${name}`);
    expect(resultB.publicId).toBe(`kitchen-solutions-suite/design-tests/b/${name}`);
  }, 30000);
  // #end-test
  // #test - metadata vacío retorna objeto vacío
  /**
   * Verifica que metadata vacío se conserve en la respuesta.
   * @version 1.0.0
   */
  test('retorna metadata vacío cuando se envía un objeto vacío', async () => {
    // #step 1 - Ejecutar upload con metadata vacío
    const name = `create-${Date.now()}`;
    const result = await createImage(
      {
        type: 'url',
        url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      },
      {
        name,
        folder: 'kitchen-solutions-suite/design-tests',
        overwrite: true,
      },
      {}
    );
    // #end-step

    // #step 2 - Validar metadata
    expect(result.metadata).toEqual({
      name,
      folder: 'kitchen-solutions-suite/design-tests',
    });
    // #end-step
  }, 30000);
  // #end-test

  // #test - configuración inválida
  /**
   * Propaga ConfigurationError si el cliente no está configurado.
   * @version 1.0.0
   */
  test('falla si el cliente no está configurado', async () => {
    const spy = jest
      .spyOn(cloudinaryConfig, 'getCloudinaryClient')
      .mockImplementation(() => {
        throw new ConfigurationError('No credentials');
      });

    await expect(
      createImage(
        {
          type: 'url',
          url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        },
        {
          name: `create-${Date.now()}`,
          folder: 'kitchen-solutions-suite/design-tests',
          overwrite: true,
        }
      )
    ).rejects.toBeInstanceOf(ConfigurationError);

    spy.mockRestore();
  });
  // #end-test

  // #test - errores de upload mock
  /**
   * Verifica mapeo de errores de upload a UploadError.
   * @version 1.0.0
   */
  test('mapea errores de upload a UploadError', async () => {
    const upload = jest.fn().mockRejectedValue(new Error('Generic upload error'));
    const spy = jest
      .spyOn(cloudinaryConfig, 'getCloudinaryClient')
      .mockReturnValue({ uploader: { upload } } as any);

    await expect(
      createImage(
        {
          type: 'url',
          url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        },
        {
          name: `create-${Date.now()}`,
          folder: 'kitchen-solutions-suite/design-tests',
          overwrite: true,
        }
      )
    ).rejects.toBeInstanceOf(UploadError);

    const uploadBadRequest = jest.fn().mockRejectedValue({ error: { http_code: 400 } });
    spy.mockReturnValue({ uploader: { upload: uploadBadRequest } } as any);

    await expect(
      createImage(
        {
          type: 'url',
          url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        },
        {
          name: `create-${Date.now()}`,
          folder: 'kitchen-solutions-suite/design-tests',
          overwrite: true,
        }
      )
    ).rejects.toBeInstanceOf(UploadError);

    const uploadNetwork = jest
      .fn()
      .mockRejectedValue(Object.assign(new Error('Network error'), { code: 'ETIMEDOUT' }));
    spy.mockReturnValue({ uploader: { upload: uploadNetwork } } as any);

    await expect(
      createImage(
        {
          type: 'url',
          url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        },
        {
          name: `create-${Date.now()}`,
          folder: 'kitchen-solutions-suite/design-tests',
          overwrite: true,
        }
      )
    ).rejects.toBeInstanceOf(UploadError);

    spy.mockRestore();
  });
  // #end-test
  // #test - sube una imagen y retorna metadata + raw
  /**
   * Verifica que el upload funcione y que metadata/raw estén presentes.
   * @version 1.0.0
   */
  test('sube una imagen y retorna metadata + raw', async () => {
    // #step 1 - Ejecutar upload con metadata
    const result = await createImage(
      {
        type: 'url',
        url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      },
      {
        name: `create-${Date.now()}`,
        folder: 'kitchen-solutions-suite/design-tests',
        overwrite: true,
      },
      {
        source: 'create-image-test',
        module: 'cloudinary',
      }
    );
    // #end-step

    // #step 2 - Validar campos principales
    expect(result.publicId).toBeTruthy();
    expect(result.url).toBeTruthy();
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
    expect(result.metadata).toEqual(
      expect.objectContaining({
        source: 'create-image-test',
        module: 'cloudinary',
      })
    );
    expect(result.raw).toBeTruthy();
    // #end-step

    // #step 3 - Validar metadata desde raw
    const rawRecord = result.raw as Record<string, any>;
    expect(rawRecord?.context?.custom).toEqual(
      expect.objectContaining({
        source: 'create-image-test',
        module: 'cloudinary',
      })
    );
    // #end-step

    // #step 4 - Fin del test
    // #end-step
  }, 30000);
  // #end-test
});
// #end-describe
