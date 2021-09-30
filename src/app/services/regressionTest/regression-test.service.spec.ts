import { TestBed } from '@angular/core/testing';

import { HttpClientTestingModule } from '@angular/common/http/testing';

import { RegressionTestService } from './regression-test.service';

describe('RegressionTestService', () => {
  let service: RegressionTestService;

  beforeEach(() => {
    TestBed.configureTestingModule({
        imports: [HttpClientTestingModule]
      });
    service = TestBed.inject(RegressionTestService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
