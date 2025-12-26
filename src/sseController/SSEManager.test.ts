// #test SSEManager - Pruebas unitarias básicas
import { SSEManager, SSEMessage } from './SSEManager';

describe('SSEManager', () => {
  let sseManager: SSEManager;
  let mockRes: any;

  beforeEach(() => {
    sseManager = new SSEManager();
    mockRes = { write: jest.fn() };
  });

  it('agrega y elimina clientes correctamente', () => {
    sseManager.addClient('user1', mockRes);
    expect(sseManager.getClientCount()).toBe(1);
    sseManager.removeClient('user1');
    expect(sseManager.getClientCount()).toBe(0);
  });

  it('envía mensajes a destinatarios correctos', () => {
    sseManager.addClient('user1', mockRes);
    const message: SSEMessage = {
      type: 'test',
      payload: { foo: 'bar' },
      recipients: ['user1'],
    };
    sseManager.send(message);
    expect(mockRes.write).toHaveBeenCalledWith(
      expect.stringContaining('"type":"test"')
    );
  });

  it('no envía mensajes a usuarios no conectados', () => {
    const message: SSEMessage = {
      type: 'test',
      payload: { foo: 'bar' },
      recipients: ['user2'],
    };
    sseManager.send(message);
    expect(mockRes.write).not.toHaveBeenCalled();
  });
});
// #end-test
