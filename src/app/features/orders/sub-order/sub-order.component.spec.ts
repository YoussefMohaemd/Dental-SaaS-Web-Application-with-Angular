import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { SubOrderComponent } from './sub-order.component';

describe('SubOrderComponent', () => {
  let component: SubOrderComponent;
  let fixture: ComponentFixture<SubOrderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubOrderComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(SubOrderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should resolve a sub-order and compute progress', () => {
    expect(component.subOrder()).toBeTruthy();
    expect(component.progress()).toBeGreaterThanOrEqual(0);
    expect(component.progress()).toBeLessThanOrEqual(100);
  });
});
