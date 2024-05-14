import {ElectricityMaps} from '../../../lib/if-electricitymaps';

describe('lib/my-custom-plugin: ', () => {
  describe('ElectricityMaps(): ', () => {
    it('has metadata field.', () => {
      const pluginInstance = ElectricityMaps({});

      expect(pluginInstance).toHaveProperty('metadata');
      expect(pluginInstance).toHaveProperty('execute');
      expect(pluginInstance.metadata).toHaveProperty('kind');
      expect(typeof pluginInstance.execute).toBe('function');
    });

    describe('execute(): ', () => {
      it('applies logic on provided inputs array.', async () => {
        const pluginInstance = ElectricityMaps({});
        const inputs = [{}];

        const response = await pluginInstance.execute(inputs, {});
        expect(response).toEqual(inputs);
      });
    });
  });
});