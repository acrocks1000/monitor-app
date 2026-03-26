import { TestBed } from '@angular/core/testing';

import { MonitorApi } from './monitor-api';

describe('MonitorApi', () => {
  let service: MonitorApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MonitorApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
