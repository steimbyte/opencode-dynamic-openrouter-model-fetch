import { describe, it, expect, vi, beforeEach } from 'vitest';
import PluginEntry from './main.js';

// Mock for client.app.log
const createMockLog = () => {
  const logs: Array<{ level: string; message: string; service: string }> = [];
  return {
    log: vi.fn().mockImplementation(async (body: { body: { service: string; level: string; message: string } }) => {
      logs.push(body.body);
    }),
    getLogs: () => logs,
    clearLogs: () => logs.splice(0, logs.length),
  };
};

describe('Logger Tests - opencode-dynamic-openrouter-model-fetch', () => {

  describe('Plugin Logging', () => {

    it('should log info message when starting model refresh', async () => {
      const mockLog = createMockLog();
      const mockClient = {
        app: {
          log: mockLog.log,
        },
      };

      // Get the plugin and execute the tool
      const plugin = await PluginEntry({ client: mockClient } as any);
      await plugin.tool['refresh-models'].execute({}, {});

      // Check that info log was called with starting message
      expect(mockLog.log).toHaveBeenCalled();
      const logs = mockLog.getLogs();
      const startLog = logs.find(log => log.message.includes('Starting model refresh'));
      expect(startLog).toBeDefined();
      expect(startLog?.level).toBe('info');
      expect(startLog?.service).toBe('refresh-models');
    });

    it('should log error when script not found', async () => {
      const mockLog = createMockLog();
      const mockClient = {
        app: {
          log: mockLog.log,
        },
      };

      // Get the plugin and execute the tool
      const plugin = await PluginEntry({ client: mockClient } as any);
      const result = await plugin.tool['refresh-models'].execute({}, {});

      // Check that error log was called for missing script
      const logs = mockLog.getLogs();
      const errorLog = logs.find(log => log.level === 'error' && log.message.includes('Script not found'));
      expect(errorLog).toBeDefined();
      expect(result).toContain('❌ Error:');
    });

    it('should log different levels appropriately', async () => {
      const mockLog = createMockLog();
      const mockClient = {
        app: {
          log: mockLog.log,
        },
      };

      const plugin = await PluginEntry({ client: mockClient } as any);
      await plugin.tool['refresh-models'].execute({}, {});

      const logs = mockLog.getLogs();

      // Check for presence of different log levels
      const infoLogs = logs.filter(log => log.level === 'info');
      const errorLogs = logs.filter(log => log.level === 'error');
      const warnLogs = logs.filter(log => log.level === 'warn');

      // At minimum, we should have info and error logs
      expect(infoLogs.length).toBeGreaterThan(0);
      expect(errorLogs.length).toBeGreaterThan(0);
    });

    it('should log with correct service name', async () => {
      const mockLog = createMockLog();
      const mockClient = {
        app: {
          log: mockLog.log,
        },
      };

      const plugin = await PluginEntry({ client: mockClient } as any);
      await plugin.tool['refresh-models'].execute({}, {});

      const logs = mockLog.getLogs();
      // All logs should have service 'refresh-models'
      logs.forEach(log => {
        expect(log.service).toBe('refresh-models');
      });
    });

    it('should log structured messages with service, level, and message', async () => {
      const mockLog = createMockLog();
      const mockClient = {
        app: {
          log: mockLog.log,
        },
      };

      const plugin = await PluginEntry({ client: mockClient } as any);
      await plugin.tool['refresh-models'].execute({}, {});

      const logs = mockLog.getLogs();

      // Verify all logs have required structure
      logs.forEach(log => {
        expect(log).toHaveProperty('service');
        expect(log).toHaveProperty('level');
        expect(log).toHaveProperty('message');
        expect(typeof log.service).toBe('string');
        expect(typeof log.level).toBe('string');
        expect(typeof log.message).toBe('string');
      });
    });

  });

});
