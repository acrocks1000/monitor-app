import { Injectable } from '@angular/core';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { BehaviorSubject } from 'rxjs';
import { NsdDiscovery } from './nsd-plugin';

export interface ServiceInfo {
  address: string;
  port: number;
  url: string;
}

export interface DiscoveryEvent {
  type: 'discovered' | 'ip-changed' | 'failed' | 'cached';
  method?: 'nsd' | 'hostname' | 'cached';
  serviceInfo?: ServiceInfo;
  error?: string;
  timestamp: number;
}

const SERVICE_NAME = 'Monitor Controller';
const SERVICE_TYPE = '_http._tcp.';
const CACHE_TTL = 30_000;
const NSD_TIMEOUT = 10_000;

const FALLBACK_HOSTS = [
  { host: '192.168.29.249', port: 3000 },
  { host: '192.168.1.3', port: 3000 },
];

@Injectable({ providedIn: 'root' })
export class ServiceDiscoveryService {

  private cache: { info: ServiceInfo; time: number } | null = null;
  private previousUrl = '';

  readonly discoveryEvent$ = new BehaviorSubject<DiscoveryEvent | null>(null);

  /** Discover the Monitor Controller service, returning its base URL. */
  async discoverService(): Promise<ServiceInfo> {
    // 1. Cached?
    if (this.cache && Date.now() - this.cache.time < CACHE_TTL) {
      this.emit('cached', this.cache.info, 'cached');
      return this.cache.info;
    }

    let info: ServiceInfo | null = null;
    let method: 'nsd' | 'hostname' = 'hostname';

    // 2. Try native NSD on Android
    if (Capacitor.isNativePlatform()) {
      try {
        const result = await NsdDiscovery.discoverService({
          serviceName: SERVICE_NAME,
          serviceType: SERVICE_TYPE,
          timeout: NSD_TIMEOUT,
        });
        if (result?.host && result?.port) {
          info = {
            address: result.host,
            port: result.port,
            url: `http://${result.host}:${result.port}`,
          };
          method = 'nsd';
        }
      } catch (e) {
        console.warn('NSD discovery failed, trying fallback hosts', e);
      }
    }

    // 3. Fallback: probe known hostnames
    if (!info) {
      info = await this.probeFallbackHosts();
    }

    if (!info) {
      const msg = 'Could not find Monitor Controller on the network';
      this.emit('failed', undefined, undefined, msg);
      throw new Error(msg);
    }

    // 4. Detect IP change vs first discovery
    const changed = this.previousUrl !== '' && this.previousUrl !== info.url;
    this.cache = { info, time: Date.now() };
    this.previousUrl = info.url;

    this.emit(changed ? 'ip-changed' : 'discovered', info, method);
    return info;
  }

  /** Invalidate cache so next call re-discovers. */
  clearCache(): void {
    this.cache = null;
  }

  // ── private ────────────────────────────────────────────

  private emit(
    type: DiscoveryEvent['type'],
    serviceInfo?: ServiceInfo,
    method?: DiscoveryEvent['method'],
    error?: string,
  ): void {
    this.discoveryEvent$.next({ type, serviceInfo, method, error, timestamp: Date.now() });
  }

  private async probeFallbackHosts(): Promise<ServiceInfo | null> {
    for (const { host, port } of FALLBACK_HOSTS) {
      try {
        const url = `http://${host}:${port}`;
        if (Capacitor.isNativePlatform()) {
          const resp = await CapacitorHttp.get({ url: `${url}/api/info`, connectTimeout: 3000, readTimeout: 3000 });
          if (resp.status >= 200 && resp.status < 400) {
            return { address: host, port, url };
          }
        } else {
          const ctrl = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), 3000);
          const resp = await fetch(`${url}/api/info`, { signal: ctrl.signal });
          clearTimeout(timer);
          if (resp.ok) {
            return { address: host, port, url };
          }
        }
      } catch {
        // next host
      }
    }
    return null;
  }
}
