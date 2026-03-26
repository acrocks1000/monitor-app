import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { Constants } from '../shared/constant';
import { from, map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MonitorApi {

  constructor(private http: HttpClient) {}

  switchToHDMI(): Observable<any> {
    return this.get('/api/input/hdmi');
  }

  switchToDisplayPort(): Observable<any> {
    return this.get('/api/input/dp');
  }

  private get(path: string): Observable<any> {
    const url = `${Constants.targetURL}${path}`;

    if (Capacitor.isNativePlatform()) {
      return from(CapacitorHttp.get({ url })).pipe(
        map((response) => response.data),
      );
    }

    return this.http.get(url);
  }

}
