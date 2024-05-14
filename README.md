# if-electricitymaps

## Usage

To run the `ElectricityMaps`, an instance of `PluginInterface` must be created. Then, the plugin's `execute()` method can be called, passing required arguments to it.

This is how you could run the model in Typescript:

```typescript
async function runPlugin() {
  const newModel = await new ElectricityMaps().configure(params);
  const usage = await newModel.calculate([
    {
      timestamp: '2024-01-01T00:00:00Z',
      duration: 86400
      cloud/vendor: aws
      cloud/instance-type: t4g.micro
      location: us-east-1
      geolocation: 38.8809212,-77.1845565
      cloud/service: ec2
      memory/utilization: 0
      cpu/utilization: 0
      energy: 0.022764583333333335
      carbon-embodied: 28.534246575342465
    },
    {
      timestamp: '2024-01-01T00:00:15Z',
      duration: 86400
      cloud/vendor: aws
      cloud/instance-type: t4g.micro
      location: us-east-1
      geolocation: 38.8809212,-77.1845565
      cloud/service: ec2
      memory/utilization: 0
      cpu/utilization: 0
      energy: 0.022764583333333335
      carbon-embodied: 28.534246575342465
    },
  ]);

  console.log(usage);
}

runPlugin();
```

## Testing model integration

### Install plugin

1. On the root level of a locally developed model run `npm run build`.
2. Then use npm link to create a package that can be installed into IF: `npm link`.
3. Now your plugin is ready to run in IF. First install your plugin by navigating to the if project folder and running:
  
  ``npm link if-electricitymaps``

4. Use the linked model in impl by specifying `name`, `method`, `path` in initialize models section. 

```yaml
name: plugin-demo-link
description: loads plugin
tags: null
initialize:
  plugins:
    if-electricitymaps:
      method: ElectricityMaps
      path: 'if-electricitymaps'
      global-config:
        token: "your token"
  outputs: ['yaml']
tree:
  children:
    vm: # Separate child and pipeline for VM (EC2)
      pipeline:
        - if-electricitymaps
      inputs:
        - timestamp: '2024-03-26T14:08:00.000Z'
          duration: 86400
          cloud/vendor: aws
          cloud/instance-type: t4g.micro
          location: us-east-1
          geolocation: 38.8809212,-77.1845565  # IMPORTANT: format long,lat
          cloud/service: ec2
          memory/utilization: 0
          cpu/utilization: 0
          energy: 0.022764583333333335
          carbon-embodied: 28.534246575342465
          ...
...
```

### Using directly from Github

You can simply push your model to the public Github repository and pass the path to it in your impl.

```
npm install -g https://github.com/Julasoft-Dev/if-electricitymaps
```

Then, in your `impl`, provide the path in the model instantiation. You also need to specify which class the model instantiates.

```yaml
name: plugin-demo-git
description: loads plugin
tags: null
initialize:
  plugins:
    if-electricitymaps:
      method: ElectricityMaps
      path: https://github.com/Julasoft-Dev/if-electricitymaps
      global-config:
        token: "your token"
  outputs: ['yaml']
tree:
  children:
    vm: # Separate child and pipeline for VM (EC2)
      pipeline:
        - if-electricitymaps
      inputs:
        - timestamp: '2024-03-26T14:08:00.000Z'
          duration: 86400
          cloud/vendor: aws
          cloud/instance-type: t4g.micro
          location: us-east-1
          geolocation: 38.8809212,-77.1845565  # IMPORTANT: format long,lat
          cloud/service: ec2
          memory/utilization: 0
          cpu/utilization: 0
          energy: 0.022764583333333335
          carbon-embodied: 28.534246575342465
          ...
...
```

### Running the manifest

Now, when you run the `manifest` using the IF CLI, it will load the model automatically. Run using:

```sh
ie --manifest <path-to-your-impl> --output <path-to-save-output>
```
