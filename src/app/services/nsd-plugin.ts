import { registerPlugin } from '@capacitor/core';

export interface NsdServiceResult {
  host: string;
  port: number;
  serviceName: string;
  serviceType: string;
}

export interface DiscoverOptions {
  serviceName?: string;
  serviceType?: string;
  timeout?: number;
}

export interface NsdDiscoveryPlugin {
  discoverService(options: DiscoverOptions): Promise<NsdServiceResult>;
  stopDiscovery(): Promise<void>;
  getResolvedService(): Promise<NsdServiceResult>;
}

export const NsdDiscovery = registerPlugin<NsdDiscoveryPlugin>('NsdDiscovery');
