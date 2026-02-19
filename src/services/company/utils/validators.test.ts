/**
 * Tests para validators de Company
 *
 * Cubre validateLogo (campo unificado): tipos, tamaño, magic bytes.
 * Los demás validators (name, description, id, pagination, state)
 * ya están cubiertos indirectamente por los tests de cada servicio.
 */

import {
  validateLogo,
  validateCompanyId,
  validateUserId,
  validateCompanyName,
  validateCompanyDescription,
  validatePagination,
  validateCompanyState,
} from './validators';

// #region Helpers

/** Crea un buffer PNG mínimo válido (8 bytes de header) */
const createPngBuffer = (extraBytes = 0): Buffer => {
  const header = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  if (extraBytes === 0) return header;
  return Buffer.concat([header, Buffer.alloc(extraBytes)]);
};

/** Crea un buffer JPEG mínimo válido */
const createJpegBuffer = (): Buffer => Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]);

/** Crea un buffer GIF mínimo válido */
const createGifBuffer = (): Buffer => Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);

/** Crea un buffer WebP mínimo válido (RIFF header) */
const createWebpBuffer = (): Buffer => Buffer.from([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00]);

/** Crea un buffer BMP mínimo válido */
const createBmpBuffer = (): Buffer => Buffer.from([0x42, 0x4D, 0x00, 0x00]);

/** Crea un buffer ICO mínimo válido */
const createIcoBuffer = (): Buffer => Buffer.from([0x00, 0x00, 0x01, 0x00, 0x01, 0x00]);

/** Crea un buffer SVG mínimo válido */
const createSvgBuffer = (): Buffer => Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>');

/** Crea un buffer SVG con declaración XML */
const createSvgXmlBuffer = (): Buffer =>
  Buffer.from('<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"></svg>');

/** Crea un buffer TIFF little-endian */
const createTiffLeBuffer = (): Buffer => Buffer.from([0x49, 0x49, 0x2A, 0x00]);

/** Crea un buffer TIFF big-endian */
const createTiffBeBuffer = (): Buffer => Buffer.from([0x4D, 0x4D, 0x00, 0x2A]);

/** Crea un buffer que NO es imagen (texto plano) */
const createNonImageBuffer = (): Buffer => Buffer.from('Hello, this is just text content');

/** Crea un buffer con bytes aleatorios que no coinciden con ningún magic byte */
const createRandomBuffer = (): Buffer => Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05]);

// #endregion

describe('validateLogo', () => {
  describe('Valores que no requieren validación (skip)', () => {
    it('should accept undefined (no logo / no change)', () => {
      expect(() => validateLogo(undefined)).not.toThrow();
    });

    it('should accept null (remove logo)', () => {
      expect(() => validateLogo(null)).not.toThrow();
    });
  });

  describe('String (URL directa)', () => {
    it('should accept a valid URL string', () => {
      expect(() => validateLogo('https://example.com/logo.png')).not.toThrow();
    });

    it('should accept an empty string', () => {
      // String vacío es válido: en create = sin logo, en update = eliminar
      expect(() => validateLogo('')).not.toThrow();
    });

    it('should accept a relative URL string', () => {
      expect(() => validateLogo('/images/logo.png')).not.toThrow();
    });

    it('should accept a data URI string', () => {
      expect(() => validateLogo('data:image/png;base64,iVBOR...')).not.toThrow();
    });
  });

  describe('Buffer - Formatos de imagen válidos', () => {
    it('should accept a valid PNG buffer', () => {
      expect(() => validateLogo(createPngBuffer())).not.toThrow();
    });

    it('should accept a valid JPEG buffer', () => {
      expect(() => validateLogo(createJpegBuffer())).not.toThrow();
    });

    it('should accept a valid GIF buffer', () => {
      expect(() => validateLogo(createGifBuffer())).not.toThrow();
    });

    it('should accept a valid WebP buffer', () => {
      expect(() => validateLogo(createWebpBuffer())).not.toThrow();
    });

    it('should accept a valid BMP buffer', () => {
      expect(() => validateLogo(createBmpBuffer())).not.toThrow();
    });

    it('should accept a valid ICO buffer', () => {
      expect(() => validateLogo(createIcoBuffer())).not.toThrow();
    });

    it('should accept a valid SVG buffer', () => {
      expect(() => validateLogo(createSvgBuffer())).not.toThrow();
    });

    it('should accept a valid SVG buffer with XML declaration', () => {
      expect(() => validateLogo(createSvgXmlBuffer())).not.toThrow();
    });

    it('should accept a valid TIFF buffer (little-endian)', () => {
      expect(() => validateLogo(createTiffLeBuffer())).not.toThrow();
    });

    it('should accept a valid TIFF buffer (big-endian)', () => {
      expect(() => validateLogo(createTiffBeBuffer())).not.toThrow();
    });
  });

  describe('Buffer - Validaciones de tamaño', () => {
    it('should reject an empty buffer', () => {
      expect(() => validateLogo(Buffer.alloc(0))).toThrow('Logo file cannot be empty');
    });

    it('should reject a buffer exceeding 5MB', () => {
      const oversized = createPngBuffer(5 * 1024 * 1024); // header + enough to exceed 5MB
      expect(() => validateLogo(oversized)).toThrow('Logo file exceeds maximum size of 5MB');
    });

    it('should accept a buffer just under 5MB', () => {
      // PNG header (8 bytes) + remaining to reach exactly 5MB - 1 byte
      const justUnder = createPngBuffer(5 * 1024 * 1024 - 8 - 1);
      expect(() => validateLogo(justUnder)).not.toThrow();
    });
  });

  describe('Buffer - Formato no soportado', () => {
    it('should reject a text buffer (not an image)', () => {
      expect(() => validateLogo(createNonImageBuffer())).toThrow(
        'Logo file is not a supported image format'
      );
    });

    it('should reject a buffer with random bytes', () => {
      expect(() => validateLogo(createRandomBuffer())).toThrow(
        'Logo file is not a supported image format'
      );
    });

    it('should reject a single-byte buffer (too short for any format)', () => {
      expect(() => validateLogo(Buffer.from([0xFF]))).toThrow(
        'Logo file is not a supported image format'
      );
    });
  });

  describe('Tipos inválidos', () => {
    it('should reject a number', () => {
      expect(() => validateLogo(42)).toThrow(
        'Logo must be a string URL, a file Buffer, or null'
      );
    });

    it('should reject a boolean', () => {
      expect(() => validateLogo(true)).toThrow(
        'Logo must be a string URL, a file Buffer, or null'
      );
    });

    it('should reject an object', () => {
      expect(() => validateLogo({ url: 'test.png' })).toThrow(
        'Logo must be a string URL, a file Buffer, or null'
      );
    });

    it('should reject an array', () => {
      expect(() => validateLogo([1, 2, 3])).toThrow(
        'Logo must be a string URL, a file Buffer, or null'
      );
    });
  });
});

describe('validateCompanyId', () => {
  it('should accept a valid positive integer', () => {
    expect(() => validateCompanyId(1)).not.toThrow();
    expect(() => validateCompanyId(999)).not.toThrow();
  });

  it('should reject zero', () => {
    expect(() => validateCompanyId(0)).toThrow('Invalid company ID');
  });

  it('should reject negative numbers', () => {
    expect(() => validateCompanyId(-1)).toThrow('Invalid company ID');
  });

  it('should reject NaN', () => {
    expect(() => validateCompanyId(NaN)).toThrow('Invalid company ID');
  });

  it('should reject Infinity', () => {
    expect(() => validateCompanyId(Infinity)).toThrow('Invalid company ID');
  });
});

describe('validateUserId', () => {
  it('should accept a valid positive integer', () => {
    expect(() => validateUserId(1)).not.toThrow();
  });

  it('should reject zero', () => {
    expect(() => validateUserId(0)).toThrow('Invalid user ID');
  });

  it('should reject negative numbers', () => {
    expect(() => validateUserId(-5)).toThrow('Invalid user ID');
  });
});

describe('validateCompanyName', () => {
  it('should accept a valid name', () => {
    expect(() => validateCompanyName('My Company')).not.toThrow();
  });

  it('should reject empty or whitespace-only name', () => {
    expect(() => validateCompanyName('   ')).toThrow('Company name cannot be empty');
  });

  it('should reject a name exceeding 255 characters', () => {
    expect(() => validateCompanyName('a'.repeat(256))).toThrow(
      'Company name must be 255 characters or less'
    );
  });

  it('should reject non-string values', () => {
    expect(() => validateCompanyName(null as any)).toThrow(
      'Company name is required and must be a string'
    );
  });
});

describe('validateCompanyDescription', () => {
  it('should accept null or undefined', () => {
    expect(() => validateCompanyDescription(null)).not.toThrow();
    expect(() => validateCompanyDescription(undefined)).not.toThrow();
  });

  it('should accept a valid description', () => {
    expect(() => validateCompanyDescription('A great company')).not.toThrow();
  });

  it('should reject description exceeding 1000 characters', () => {
    expect(() => validateCompanyDescription('x'.repeat(1001))).toThrow(
      'Company description must be 1000 characters or less'
    );
  });
});

describe('validatePagination', () => {
  it('should accept valid page and limit', () => {
    expect(() => validatePagination(1, 10)).not.toThrow();
  });

  it('should accept undefined values', () => {
    expect(() => validatePagination()).not.toThrow();
  });

  it('should reject page < 1', () => {
    expect(() => validatePagination(0)).toThrow('Page must be a positive number');
  });

  it('should reject limit < 1', () => {
    expect(() => validatePagination(1, 0)).toThrow('Limit must be a positive number');
  });
});

describe('validateCompanyState', () => {
  it('should accept "active"', () => {
    expect(() => validateCompanyState('active')).not.toThrow();
  });

  it('should accept "archived"', () => {
    expect(() => validateCompanyState('archived')).not.toThrow();
  });

  it('should accept null or undefined', () => {
    expect(() => validateCompanyState(null)).not.toThrow();
    expect(() => validateCompanyState(undefined)).not.toThrow();
  });

  it('should reject invalid state', () => {
    expect(() => validateCompanyState('deleted')).toThrow('Invalid state value');
  });
});
