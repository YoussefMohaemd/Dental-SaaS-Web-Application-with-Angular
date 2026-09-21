import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { OrderWorkflowComponent } from './order-workflow.component';

describe('OrderWorkflowComponent', () => {
  let component: OrderWorkflowComponent;
  let fixture: ComponentFixture<OrderWorkflowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderWorkflowComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(OrderWorkflowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose seven workflow stages', () => {
    expect(component.stages.length).toBe(7);
  });

  it('should classify stage states relative to current index', () => {
    const current = component.currentIndex();
    expect(component.isStageCurrent(current)).toBeTrue();
    if (current > 0) expect(component.isStageDone(0)).toBeTrue();
  });
});
