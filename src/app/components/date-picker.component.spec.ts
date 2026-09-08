import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DatePickerComponent, CalendarDay } from './date-picker.component';
import { ReactiveFormsModule } from '@angular/forms';
import { vi } from 'vitest';

describe('DatePickerComponent', () => {
  let component: DatePickerComponent;
  let fixture: ComponentFixture<DatePickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatePickerComponent, ReactiveFormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(DatePickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the date picker component', () => {
    expect(component).toBeTruthy();
    expect(component.isOpen).toBe(false);
    expect(component.mode).toBe('single');
  });

  it('should toggle dropdown open and close', () => {
    component.toggleOpen();
    expect(component.isOpen).toBe(true);
    component.close();
    expect(component.isOpen).toBe(false);
  });

  it('should select single date and emit ISO formatted string', () => {
    const emitSpy = vi.spyOn(component.dateChange, 'emit');
    let emittedValue: any = null;
    component.registerOnChange((val: any) => {
      emittedValue = val;
    });

    const testDate = new Date(2026, 8, 15); // Sep 15, 2026
    const dayItem: CalendarDay = {
      date: testDate,
      dayNumber: 15,
      isCurrentMonth: true,
      isToday: false,
      isDisabled: false,
      isSelected: false,
      isRangeStart: false,
      isRangeEnd: false,
      isInRange: false,
      isInHoverRange: false,
    };

    component.onDateClick(dayItem);

    expect(component.selectedDate).toBeTruthy();
    expect(component.selectedDate?.getDate()).toBe(15);
    expect(emittedValue).toBe('2026-09-15');
    expect(emitSpy).toHaveBeenCalledWith('2026-09-15');
    expect(component.isOpen).toBe(false); // Auto closes in single mode
  });

  it('should select date range in range mode', () => {
    component.mode = 'range';
    let emittedValue: any = null;
    component.registerOnChange((val: any) => {
      emittedValue = val;
    });

    const startDate = new Date(2026, 8, 10);
    const endDate = new Date(2026, 8, 20);

    const startItem: CalendarDay = {
      date: startDate,
      dayNumber: 10,
      isCurrentMonth: true,
      isToday: false,
      isDisabled: false,
      isSelected: false,
      isRangeStart: false,
      isRangeEnd: false,
      isInRange: false,
      isInHoverRange: false,
    };

    const endItem: CalendarDay = {
      date: endDate,
      dayNumber: 20,
      isCurrentMonth: true,
      isToday: false,
      isDisabled: false,
      isSelected: false,
      isRangeStart: false,
      isRangeEnd: false,
      isInRange: false,
      isInHoverRange: false,
    };

    // First click sets start
    component.onDateClick(startItem);
    expect(component.rangeStart).toBeTruthy();
    expect(component.rangeEnd).toBeNull();

    // Second click sets end
    component.onDateClick(endItem);
    expect(component.rangeStart).toBeTruthy();
    expect(component.rangeEnd).toBeTruthy();
    expect(emittedValue).toEqual({ start: '2026-09-10', end: '2026-09-20' });
  });

  it('should correctly disable dates matching disabledDaysOfWeek (0-6)', () => {
    // 0 = Sunday, 6 = Saturday
    component.disabledDaysOfWeek = [0, 6];

    // Sunday (e.g. Sep 6, 2026 is Sunday)
    const sunday = new Date(2026, 8, 6);
    expect(sunday.getDay()).toBe(0);
    expect(component.isDateDisabled(sunday)).toBe(true);

    // Saturday (e.g. Sep 12, 2026 is Saturday)
    const saturday = new Date(2026, 8, 12);
    expect(saturday.getDay()).toBe(6);
    expect(component.isDateDisabled(saturday)).toBe(true);

    // Wednesday (e.g. Sep 9, 2026 is Wednesday)
    const wednesday = new Date(2026, 8, 9);
    expect(wednesday.getDay()).toBe(3);
    expect(component.isDateDisabled(wednesday)).toBe(false);
  });

  it('should enforce minDate and maxDate boundaries', () => {
    component.minDate = '2026-09-10';
    component.maxDate = '2026-09-20';

    const beforeMin = new Date(2026, 8, 5);
    const inRange = new Date(2026, 8, 15);
    const afterMax = new Date(2026, 8, 25);

    expect(component.isDateDisabled(beforeMin)).toBe(true);
    expect(component.isDateDisabled(inRange)).toBe(false);
    expect(component.isDateDisabled(afterMax)).toBe(true);
  });

  it('should handle Today action button in single mode', () => {
    let emittedValue: any = null;
    component.registerOnChange((val: any) => {
      emittedValue = val;
    });

    component.onTodayAction();

    expect(component.selectedDate).toBeTruthy();
    const today = new Date();
    expect(component.selectedDate?.getDate()).toBe(today.getDate());
    expect(component.selectedDate?.getMonth()).toBe(today.getMonth());
    expect(typeof emittedValue).toBe('string');
  });

  it('should handle Clear action button', () => {
    component.selectedDate = new Date();
    let emittedValue: any = 'something';
    component.registerOnChange((val: any) => {
      emittedValue = val;
    });

    component.onClearAction();

    expect(component.selectedDate).toBeNull();
    expect(emittedValue).toBeNull();
  });

  it('should implement ControlValueAccessor writeValue correctly', () => {
    component.mode = 'single';
    component.writeValue('2026-05-18');
    expect(component.selectedDate).toBeTruthy();
    expect(component.selectedDate?.getFullYear()).toBe(2026);
    expect(component.selectedDate?.getMonth()).toBe(4); // 0-indexed May
    expect(component.selectedDate?.getDate()).toBe(18);

    component.mode = 'range';
    component.writeValue({ start: '2026-06-01', end: '2026-06-15' });
    expect(component.rangeStart).toBeTruthy();
    expect(component.rangeEnd).toBeTruthy();
    expect(component.rangeStart?.getDate()).toBe(1);
    expect(component.rangeEnd?.getDate()).toBe(15);
  });

  it('should support customized theme color palettes', () => {
    component.themeColor = 'emerald';
    expect(component.getThemeButtonClass()).toContain('bg-emerald-600');
    expect(component.getThemeRangeBackground()).toContain('bg-emerald-100');

    component.themeColor = 'rose';
    expect(component.getThemeButtonClass()).toContain('bg-rose-600');
  });
});
