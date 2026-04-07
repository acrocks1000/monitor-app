import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardTitle, IonCardHeader, IonCardContent, IonIcon } from '@ionic/angular/standalone';
import { MonitorApi } from '../services/monitor-api';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface LogEntry {
  shortMessage: string;
  details?: string;
  isError: boolean;
  expanded: boolean;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardTitle, IonCardHeader, IonCardContent, IonIcon],
})
export class HomePage implements OnInit, OnDestroy {

  operationLog: LogEntry[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private api: MonitorApi,
  ) {}

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private getErrorDetailMessage(status: number | null, errorMessage: string): string {
    if (status === 404) {
      return 'Endpoint not found. Check if the service is running.';
    } else if (status === 0 || !status) {
      return 'Unable to reach endpoint. Check if on the same network.';
    } else if (status === 500 || status >= 500) {
      return 'Server error. Try again later or check service logs.';
    } else if (status === 401 || status === 403) {
      return 'Access denied. Check permissions.';
    }
    return errorMessage || 'Unknown error occurred.';
  }

  private addLogEntry(shortMessage: string, isError: boolean, details?: string) {
    this.operationLog.unshift({
      shortMessage,
      details,
      isError,
      expanded: false,
    });
  }

  toggleExpanded(index: number) {
    if (this.operationLog[index]?.details) {
      this.operationLog[index].expanded = !this.operationLog[index].expanded;
    }
  }

  hdmi() {
    this.api.switchToHDMI().subscribe({
      next: (result: any) => {
        this.addLogEntry('Switched to HDMI', false);
      },
      error: (err) => {
        const errorDetail = this.getErrorDetailMessage(err?.status, err?.message);
        this.addLogEntry('Switch to HDMI failed', true, errorDetail);
      },
    });
  }

  dp() {
    this.api.switchToDisplayPort().subscribe({
      next: (result: any) => {
        this.addLogEntry('Switched to DisplayPort', false);
      },
      error: (err) => {
        const errorDetail = this.getErrorDetailMessage(err?.status, err?.message);
        this.addLogEntry('Switch to DisplayPort failed', true, errorDetail);
      },
    });
  }
}
