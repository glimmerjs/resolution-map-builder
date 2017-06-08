declare namespace ResolutionMapBuilder {
  interface BuildMapOptions {
    moduleConfig: object;
    modulePrefix: string;
    projectDir: string;
    srcDir?: string;
  }

  interface BuildSourceOptions extends BuildMapOptions {
    configPath?: string;
    resolutionMap?: ResolutionMap;
  }

  interface ResolutionMap {
    [specifier: string]: string;
  }

  function buildResolutionMap(options: BuildMapOptions): ResolutionMap;
  function buildResolutionMapSource(): string;
  function buildResolutionMapTypeDefinitions(): string;
}

declare class ResolutionMapBuilder {
  constructor(src: string, config: any, options?: ResolutionMapBuilder.BuildMapOptions);
  build(): void;
}

export = ResolutionMapBuilder;
