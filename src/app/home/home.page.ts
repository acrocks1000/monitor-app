import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonRange, IonCard, IonCardTitle, IonCardHeader, IonCardSubtitle, IonCardContent } from '@ionic/angular/standalone';
import { MonitorApi } from '../services/monitor-api';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonCard, IonCardTitle, IonCardHeader, IonCardContent],
})
export class HomePage {

  operationLog: any[] = [];

  constructor(private api: MonitorApi) {}

  hdmi() {
    this.api.switchToHDMI().subscribe({
      next: (result: any) => {
        this.operationLog.push(result);
      },
      error: (err) => {
        this.operationLog.push({
          message: 'Unable to perform switch to hdmi operation',
          details: err?.message ?? err,
          status: err?.status,
        });
      },
    });
  }

  dp() {
    this.api.switchToDisplayPort().subscribe({
      next: (result: any) => {
        this.operationLog.push(result);
      },
      error: (err) => {
        this.operationLog.push({
          message: 'Unable to perform switch to display port operation',
          details: err?.message ?? err,
          status: err?.status,
        })
      }
    });
  }
}
