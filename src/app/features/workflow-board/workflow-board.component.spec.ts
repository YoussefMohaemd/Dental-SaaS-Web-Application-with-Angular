import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { WorkflowBoardComponent } from './workflow-board.component';

describe('WorkflowBoardComponent', () => {
  let component: WorkflowBoardComponent;
  let fixture: ComponentFixture<WorkflowBoardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkflowBoardComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(WorkflowBoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose seven workflow columns', () => {
    expect(component.columns.length).toBe(7);
  });

  it('should track drag active state', () => {
    expect(component.isDragActive()).toBeFalse();
    component.onDragStart('ord-1');
    expect(component.dragId()).toBe('ord-1');
    expect(component.isDragActive()).toBeTrue();
    component.onDragEnd();
    expect(component.dragId()).toBeNull();
    expect(component.isDragActive()).toBeFalse();
  });

  it('should use order id as track key', () => {
    expect(component.trackByOrderId(0, { id: 'ord-9' } as never)).toBe('ord-9');
  });
});
