import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { tv, desktop, checkmarkCircle, alertCircle, chevronForward } from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor() {
    addIcons({ tv, desktop, 'checkmark-circle': checkmarkCircle, 'alert-circle': alertCircle, 'chevron-forward': chevronForward });
  }
}
