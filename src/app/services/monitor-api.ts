import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { from, map, Observable, switchMap } from 'rxjs';
import { ServiceDiscoveryService } from './service-discovery';

@Injectable({
  providedIn: 'root',
})
export class MonitorApi {

  constructor(
    private http: HttpClient,
    private discovery: ServiceDiscoveryService,
  ) {}

  switchToHDMI(): Observable<any> {
    return this.get('/api/input/hdmi');
  }

  switchToDisplayPort(): Observable<any> {
    return this.get('/api/input/dp');
  }

  private get(path: string): Observable<any> {
    return from(this.discovery.discoverService()).pipe(
      switchMap((service) => {
        const url = `${service.url}${path}`;

        if (Capacitor.isNativePlatform()) {
          return from(CapacitorHttp.get({ url })).pipe(
            map((response) => response.data),
          );
        }

        return this.http.get(url);
      }),
    );
  }

}
