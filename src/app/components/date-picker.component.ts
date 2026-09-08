import {
  Component,
  forwardRef,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  HostListener,
  OnInit,
  OnChanges,
  SimpleChanges,
  inject,
  computed,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { OverlayModule, ConnectedPosition } from '@angular/cdk/overlay';

export type DatePickerMode = 'single' | 'range';
export type DateThemeColor = 'indigo' | 'purple' | 'blue' | 'emerald' | 'rose' | 'amber';

export interface DateRangeValue {
  start: string | null;
  end: string | null;
}

export interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isDisabled: boolean;
  isSelected: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  isInRange: boolean;
  isInHoverRange: boolean;
}

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, OverlayModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePickerComponent),
      multi: true,
    },
  ],
  template: `
    <div class="relative w-full text-left" #container>
      <!-- Trigger Input Bar -->
      <div
        cdkOverlayOrigin
        #trigger="cdkOverlayOrigin"
        class="w-full flex items-center justify-between px-3 py-2 border rounded-lg transition-all duration-200 cursor-pointer select-none bg-white dark:bg-[#202020] text-gray-900 dark:text-gray-100 shadow-sm"
        [ngClass]="[
          invalid ? 'border-red-400 dark:border-red-500 focus-within:ring-2 focus-within:ring-red-300' : 'border-gray-200 dark:border-[#333333]',
          disabled ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-[#1a1a1a]' : 'hover:border-gray-300 dark:hover:border-gray-600',
          isOpen ? getThemeFocusRing() + ' border-transparent' : ''
        ]"
        (click)="toggleOpen()"
        (keydown.enter)="toggleOpen()"
        (keydown.space)="toggleOpen(); $event.preventDefault()"
        tabindex="0"
        role="combobox"
        [attr.aria-expanded]="isOpen"
        [attr.aria-haspopup]="'dialog'"
        [attr.aria-label]="placeholder || (mode === 'range' ? 'Select date range' : 'Select date')"
      >
        <div class="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
          @if (icon) {
            <mat-icon class="text-gray-400 dark:text-gray-500 text-[18px] w-[18px] h-[18px] flex-shrink-0">{{ icon }}</mat-icon>
          } @else {
            <mat-icon class="text-gray-400 dark:text-gray-500 text-[18px] w-[18px] h-[18px] flex-shrink-0">
              {{ mode === 'range' ? 'date_range' : 'calendar_today' }}
            </mat-icon>
          }

          <span class="text-sm truncate" [ngClass]="hasValue() ? 'text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-400 dark:text-gray-500'">
            {{ getDisplayText() }}
          </span>
        </div>

        <div class="flex items-center gap-1.5 ml-2 flex-shrink-0">
          @if (clearable && hasValue() && !disabled && !readonly) {
            <button
              type="button"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none"
              (click)="onClearClick($event)"
              title="Clear selection"
              aria-label="Clear selection"
            >
              <mat-icon class="text-[16px] w-[16px] h-[16px]">close</mat-icon>
            </button>
          }
          <mat-icon class="text-gray-400 dark:text-gray-500 text-[20px] w-[20px] h-[20px] transition-transform duration-200" [ngClass]="isOpen ? 'rotate-180' : ''">
            arrow_drop_down
          </mat-icon>
        </div>
      </div>

      <!-- Calendar Popover (Teleported to root via CDK Connected Overlay) -->
      <ng-template
        cdkConnectedOverlay
        [cdkConnectedOverlayOrigin]="trigger"
        [cdkConnectedOverlayOpen]="isOpen"
        [cdkConnectedOverlayPositions]="overlayPositions"
        [cdkConnectedOverlayHasBackdrop]="false"
        (overlayOutsideClick)="close()"
        (detach)="close()"
      >
        <div
          class="z-[1000] w-80 sm:w-84 max-w-[95vw] bg-white dark:bg-[#1f1f1f] rounded-xl shadow-2xl border border-gray-200 dark:border-[#333333] p-4 text-gray-900 dark:text-gray-100 transition-all duration-200 origin-top-left animate-in fade-in zoom-in-95"
          role="dialog"
          aria-modal="true"
          aria-label="Calendar date picker"
          (click)="$event.stopPropagation()"
          (keydown.escape)="close()"
        >
          <!-- Header: Month/Year navigation & selector -->
          <div class="flex items-center justify-between mb-3">
            <button
              type="button"
              class="p-1 rounded-lg text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2"
              [ngClass]="getThemeFocusRing()"
              (click)="prevMonth()"
              title="Previous month"
              aria-label="Previous month"
            >
              <mat-icon class="text-[20px] w-[20px] h-[20px]">chevron_left</mat-icon>
            </button>

            <!-- Month & Year Button toggles fast view -->
            <button
              type="button"
              class="px-2.5 py-1 rounded-lg text-sm font-semibold text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-1 focus:outline-none"
              (click)="toggleViewMode()"
              [title]="viewMode === 'days' ? 'Change month or year' : 'Return to calendar'"
            >
              <span>{{ getMonthName(viewMonth) }} {{ viewYear }}</span>
              <mat-icon class="text-[16px] w-[16px] h-[16px] text-gray-400">
                {{ viewMode === 'days' ? 'unfold_more' : 'expand_less' }}
              </mat-icon>
            </button>

            <button
              type="button"
              class="p-1 rounded-lg text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2"
              [ngClass]="getThemeFocusRing()"
              (click)="nextMonth()"
              title="Next month"
              aria-label="Next month"
            >
              <mat-icon class="text-[20px] w-[20px] h-[20px]">chevron_right</mat-icon>
            </button>
          </div>

          <!-- Month / Year Fast Jump View -->
          @if (viewMode === 'months') {
            <div class="grid grid-cols-3 gap-2 py-2">
              @for (m of monthsList; track m.index) {
                <button
                  type="button"
                  class="py-2 px-1 text-xs font-medium rounded-lg text-center transition-all duration-150"
                  [ngClass]="viewMonth === m.index ? getThemeBadgeClass() : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'"
                  (click)="selectMonth(m.index)"
                >
                  {{ m.shortName }}
                </button>
              }
            </div>
          } @else if (viewMode === 'years') {
            <div class="grid grid-cols-4 gap-2 py-2 max-h-52 overflow-y-auto notion-scrollbar">
              @for (yr of yearsList; track yr) {
                <button
                  type="button"
                  class="py-1.5 px-1 text-xs font-medium rounded-lg text-center transition-all duration-150"
                  [ngClass]="viewYear === yr ? getThemeBadgeClass() : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'"
                  (click)="selectYear(yr)"
                >
                  {{ yr }}
                </button>
              }
            </div>
          } @else {
            <!-- Days Grid View -->
            <!-- Weekday Headers -->
            <div class="grid grid-cols-7 gap-1 mb-1.5 text-center">
              @for (dayName of weekDays; track $index) {
                <span
                  class="text-[11px] font-semibold uppercase tracking-wider py-1"
                  [ngClass]="disabledDaysOfWeek.includes($index) ? 'text-red-400/80 dark:text-red-400/60' : 'text-gray-400 dark:text-gray-500'"
                  [title]="disabledDaysOfWeek.includes($index) ? dayName + ' (Disabled)' : dayName"
                >
                  {{ dayName.slice(0, 2) }}
                </span>
              }
            </div>

            <!-- Calendar Days Grid -->
            <div
              class="grid grid-cols-7 gap-y-1 gap-x-0 text-center"
              role="grid"
              (mouseleave)="onMouseLeaveDays()"
            >
              @for (item of calendarDays; track item.date.toISOString()) {
                <div class="relative py-0.5 flex items-center justify-center">
                  <!-- Continuous connected range highlight strip in range mode -->
                  @if (mode === 'range' && (item.isInRange || item.isInHoverRange)) {
                    <div
                      class="absolute inset-y-0.5 left-0 right-0"
                      [ngClass]="[
                        getThemeRangeBackground(),
                        item.isRangeStart ? 'rounded-l-full' : '',
                        item.isRangeEnd ? 'rounded-r-full' : ''
                      ]"
                    ></div>
                  }

                  <button
                    type="button"
                    class="relative z-10 w-8 h-8 rounded-full text-xs font-medium flex items-center justify-center transition-all duration-150 focus:outline-none"
                    [disabled]="item.isDisabled"
                    [ngClass]="getDayClasses(item)"
                    (click)="onDateClick(item)"
                    (mouseenter)="onDateHover(item)"
                    [attr.aria-label]="item.date.toDateString()"
                    [attr.aria-selected]="item.isSelected || item.isRangeStart || item.isRangeEnd"
                    [attr.aria-disabled]="item.isDisabled"
                  >
                    {{ item.dayNumber }}
                  </button>
                </div>
              }
            </div>
          }

          <!-- Range Info Bar (Only in range mode) -->
          @if (mode === 'range') {
            <div class="mt-3 pt-2.5 border-t border-gray-100 dark:border-[#2d2d2d] flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span class="truncate">
                @if (rangeStart && !rangeEnd) {
                  <span class="text-amber-600 dark:text-amber-400 font-medium">Click end date</span>
                } @else if (rangeStart && rangeEnd) {
                  <span>{{ formatDisplayDate(rangeStart) }} &rarr; {{ formatDisplayDate(rangeEnd) }}</span>
                } @else {
                  <span>Select start and end dates</span>
                }
              </span>
            </div>
          }

          <!-- Built-in Action Buttons: Today & Clear -->
          <div class="mt-3 pt-2.5 border-t border-gray-100 dark:border-[#2d2d2d] flex items-center justify-between gap-2">
            <div class="flex items-center gap-1.5">
              <button
                type="button"
                class="px-2.5 py-1 text-xs font-medium rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none"
                (click)="onClearAction()"
                title="Reset date selection"
              >
                Clear
              </button>
              <button
                type="button"
                class="px-2.5 py-1 text-xs font-medium rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none flex items-center gap-1"
                (click)="onTodayAction()"
                title="Select current date"
              >
                <mat-icon class="text-[14px] w-[14px] h-[14px]">today</mat-icon>
                Today
              </button>
            </div>

            <button
              type="button"
              class="px-3 py-1 text-xs font-semibold rounded-md transition-colors focus:outline-none"
              [ngClass]="getThemeButtonClass()"
              (click)="close()"
            >
              Done
            </button>
          </div>
        </div>
      </ng-template>
    </div>
  `,
})
export class DatePickerComponent implements OnInit, OnChanges, ControlValueAccessor {
  private elementRef = inject(ElementRef);

  @Input() mode: DatePickerMode = 'single';
  @Input() id = '';
  @Input() placeholder = '';
  @Input() minDate: string | Date | null = null;
  @Input() maxDate: string | Date | null = null;
  @Input() disabledDaysOfWeek: number[] = []; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  @Input() dateFilter?: (date: Date) => boolean;
  @Input() themeColor: DateThemeColor = 'indigo';
  @Input() dateFormat = 'YYYY-MM-DD';
  @Input() clearable = true;
  @Input() disabled = false;
  @Input() readonly = false;
  @Input() invalid = false;
  @Input() icon?: string;
  @Input() defaultValue?: string | DateRangeValue;

  @Output() dateChange = new EventEmitter<string | DateRangeValue | null>();

  isOpen = false;
  viewMonth = new Date().getMonth();
  viewYear = new Date().getFullYear();
  viewMode: 'days' | 'months' | 'years' = 'days';

  readonly overlayPositions: ConnectedPosition[] = [
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
      offsetY: 6,
    },
    {
      originX: 'start',
      originY: 'top',
      overlayX: 'start',
      overlayY: 'bottom',
      offsetY: -6,
    },
    {
      originX: 'end',
      originY: 'bottom',
      overlayX: 'end',
      overlayY: 'top',
      offsetY: 6,
    },
    {
      originX: 'end',
      originY: 'top',
      overlayX: 'end',
      overlayY: 'bottom',
      offsetY: -6,
    },
  ];

  // Selection states
  selectedDate: Date | null = null;
  rangeStart: Date | null = null;
  rangeEnd: Date | null = null;
  hoverDate: Date | null = null;

  calendarDays: CalendarDay[] = [];

  readonly weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  readonly monthsList = [
    { index: 0, shortName: 'Jan', fullName: 'January' },
    { index: 1, shortName: 'Feb', fullName: 'February' },
    { index: 2, shortName: 'Mar', fullName: 'March' },
    { index: 3, shortName: 'Apr', fullName: 'April' },
    { index: 4, shortName: 'May', fullName: 'May' },
    { index: 5, shortName: 'Jun', fullName: 'June' },
    { index: 6, shortName: 'Jul', fullName: 'July' },
    { index: 7, shortName: 'Aug', fullName: 'August' },
    { index: 8, shortName: 'Sep', fullName: 'September' },
    { index: 9, shortName: 'Oct', fullName: 'October' },
    { index: 10, shortName: 'Nov', fullName: 'November' },
    { index: 11, shortName: 'Dec', fullName: 'December' },
  ];

  yearsList: number[] = [];

  // ControlValueAccessor callbacks
  private onChange: (val: any) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit() {
    this.initYearsList();
    this.applyDefaultValueIfNeeded();
    this.computeCalendarDays();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes['minDate'] ||
      changes['maxDate'] ||
      changes['disabledDaysOfWeek'] ||
      changes['mode']
    ) {
      this.computeCalendarDays();
    }
  }

  toggleOpen() {
    if (this.disabled || this.readonly) return;
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.viewMode = 'days';
      this.alignViewToSelection();
      this.computeCalendarDays();
    } else {
      this.onTouched();
    }
  }

  close() {
    this.isOpen = false;
    this.viewMode = 'days';
    this.hoverDate = null;
    this.onTouched();
  }

  // --- ControlValueAccessor Implementation ---

  writeValue(val: any): void {
    if (this.mode === 'single') {
      if (val) {
        this.selectedDate = this.parseDate(val);
        if (this.selectedDate) {
          this.viewMonth = this.selectedDate.getMonth();
          this.viewYear = this.selectedDate.getFullYear();
        }
      } else {
        this.selectedDate = null;
      }
    } else {
      if (val && typeof val === 'object') {
        this.rangeStart = val.start ? this.parseDate(val.start) : null;
        this.rangeEnd = val.end ? this.parseDate(val.end) : null;
        if (this.rangeStart) {
          this.viewMonth = this.rangeStart.getMonth();
          this.viewYear = this.rangeStart.getFullYear();
        }
      } else {
        this.rangeStart = null;
        this.rangeEnd = null;
      }
    }
    this.computeCalendarDays();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  // --- Navigation & Views ---

  prevMonth() {
    if (this.viewMonth === 0) {
      this.viewMonth = 11;
      this.viewYear--;
    } else {
      this.viewMonth--;
    }
    this.computeCalendarDays();
  }

  nextMonth() {
    if (this.viewMonth === 11) {
      this.viewMonth = 0;
      this.viewYear++;
    } else {
      this.viewMonth++;
    }
    this.computeCalendarDays();
  }

  toggleViewMode() {
    if (this.viewMode === 'days') {
      this.viewMode = 'months';
    } else if (this.viewMode === 'months') {
      this.viewMode = 'years';
    } else {
      this.viewMode = 'days';
    }
  }

  selectMonth(monthIndex: number) {
    this.viewMonth = monthIndex;
    this.viewMode = 'days';
    this.computeCalendarDays();
  }

  selectYear(year: number) {
    this.viewYear = year;
    this.viewMode = 'months';
  }

  getMonthName(monthIndex: number): string {
    return this.monthsList[monthIndex]?.fullName || '';
  }

  // --- Date Selection ---

  onDateClick(item: CalendarDay) {
    if (item.isDisabled) return;

    if (this.mode === 'single') {
      this.selectedDate = new Date(item.date);
      const formatted = this.formatIso(this.selectedDate);
      this.onChange(formatted);
      this.dateChange.emit(formatted);
      this.close();
    } else {
      // Range mode selection logic
      if (!this.rangeStart || (this.rangeStart && this.rangeEnd)) {
        // Start new range selection
        this.rangeStart = new Date(item.date);
        this.rangeEnd = null;
      } else if (this.rangeStart && !this.rangeEnd) {
        // Complete range selection
        if (item.date < this.rangeStart) {
          this.rangeEnd = new Date(this.rangeStart);
          this.rangeStart = new Date(item.date);
        } else {
          this.rangeEnd = new Date(item.date);
        }

        const rangeVal: DateRangeValue = {
          start: this.formatIso(this.rangeStart),
          end: this.formatIso(this.rangeEnd),
        };
        this.onChange(rangeVal);
        this.dateChange.emit(rangeVal);
      }
    }

    this.computeCalendarDays();
  }

  onDateHover(item: CalendarDay) {
    if (this.mode === 'range' && this.rangeStart && !this.rangeEnd && !item.isDisabled) {
      this.hoverDate = item.date;
      this.computeCalendarDays();
    }
  }

  onMouseLeaveDays() {
    if (this.hoverDate) {
      this.hoverDate = null;
      this.computeCalendarDays();
    }
  }

  // --- Built-in Action Buttons ---

  onTodayAction() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (this.isDateDisabled(today)) return;

    this.viewMonth = today.getMonth();
    this.viewYear = today.getFullYear();

    if (this.mode === 'single') {
      this.selectedDate = today;
      const formatted = this.formatIso(today);
      this.onChange(formatted);
      this.dateChange.emit(formatted);
      this.close();
    } else {
      this.rangeStart = today;
      this.rangeEnd = today;
      const rangeVal: DateRangeValue = {
        start: this.formatIso(today),
        end: this.formatIso(today),
      };
      this.onChange(rangeVal);
      this.dateChange.emit(rangeVal);
    }
    this.computeCalendarDays();
  }

  onClearAction() {
    if (this.mode === 'single') {
      this.selectedDate = null;
      this.onChange(null);
      this.dateChange.emit(null);
    } else {
      this.rangeStart = null;
      this.rangeEnd = null;
      this.hoverDate = null;
      const emptyRange: DateRangeValue = { start: null, end: null };
      this.onChange(emptyRange);
      this.dateChange.emit(emptyRange);
    }
    this.computeCalendarDays();
  }

  onClearClick(event: MouseEvent) {
    event.stopPropagation();
    this.onClearAction();
  }

  // --- Display & Calculations ---

  hasValue(): boolean {
    if (this.mode === 'single') {
      return !!this.selectedDate;
    }
    return !!(this.rangeStart || this.rangeEnd);
  }

  getDisplayText(): string {
    if (this.mode === 'single') {
      if (this.selectedDate) {
        return this.formatDisplayDate(this.selectedDate);
      }
      return this.placeholder || 'Select date';
    } else {
      if (this.rangeStart && this.rangeEnd) {
        return `${this.formatDisplayDate(this.rangeStart)} - ${this.formatDisplayDate(this.rangeEnd)}`;
      }
      if (this.rangeStart) {
        return `${this.formatDisplayDate(this.rangeStart)} - ...`;
      }
      return this.placeholder || 'Select date range';
    }
  }

  private computeCalendarDays() {
    const year = this.viewYear;
    const month = this.viewMonth;

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: CalendarDay[] = [];

    // Leading days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, daysInPrevMonth - i);
      d.setHours(0, 0, 0, 0);
      days.push(this.buildCalendarDay(d, false, today));
    }

    // Days in current month
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      d.setHours(0, 0, 0, 0);
      days.push(this.buildCalendarDay(d, true, today));
    }

    // Trailing days from next month to complete 6-row (42 cells) or 5-row grid
    const totalFilled = days.length;
    const targetCount = totalFilled <= 35 ? 35 : 42;
    const remaining = targetCount - totalFilled;
    for (let day = 1; day <= remaining; day++) {
      const d = new Date(year, month + 1, day);
      d.setHours(0, 0, 0, 0);
      days.push(this.buildCalendarDay(d, false, today));
    }

    this.calendarDays = days;
  }

  private buildCalendarDay(date: Date, isCurrentMonth: boolean, today: Date): CalendarDay {
    const isToday = this.isSameDay(date, today);
    const isDisabled = this.isDateDisabled(date);
    const isSelected = this.mode === 'single' && !!this.selectedDate && this.isSameDay(date, this.selectedDate);

    let isRangeStart = false;
    let isRangeEnd = false;
    let isInRange = false;
    let isInHoverRange = false;

    if (this.mode === 'range') {
      isRangeStart = !!this.rangeStart && this.isSameDay(date, this.rangeStart);
      isRangeEnd = !!this.rangeEnd && this.isSameDay(date, this.rangeEnd);

      if (this.rangeStart && this.rangeEnd) {
        isInRange = date >= this.rangeStart && date <= this.rangeEnd;
      } else if (this.rangeStart && this.hoverDate && !this.rangeEnd) {
        const hStart = this.rangeStart <= this.hoverDate ? this.rangeStart : this.hoverDate;
        const hEnd = this.rangeStart <= this.hoverDate ? this.hoverDate : this.rangeStart;
        isInHoverRange = date >= hStart && date <= hEnd;
        if (this.isSameDay(date, this.hoverDate)) {
          isRangeEnd = true;
        }
      }
    }

    return {
      date,
      dayNumber: date.getDate(),
      isCurrentMonth,
      isToday,
      isDisabled,
      isSelected,
      isRangeStart,
      isRangeEnd,
      isInRange,
      isInHoverRange,
    };
  }

  isDateDisabled(date: Date): boolean {
    const dayOfWeek = date.getDay(); // 0 (Sun) to 6 (Sat)
    if (this.disabledDaysOfWeek && this.disabledDaysOfWeek.includes(dayOfWeek)) {
      return true;
    }

    if (this.minDate) {
      const min = this.parseDate(this.minDate);
      if (min) {
        min.setHours(0, 0, 0, 0);
        if (date < min) return true;
      }
    }

    if (this.maxDate) {
      const max = this.parseDate(this.maxDate);
      if (max) {
        max.setHours(23, 59, 59, 999);
        if (date > max) return true;
      }
    }

    if (this.dateFilter && !this.dateFilter(date)) {
      return true;
    }

    return false;
  }

  private alignViewToSelection() {
    if (this.mode === 'single' && this.selectedDate) {
      this.viewMonth = this.selectedDate.getMonth();
      this.viewYear = this.selectedDate.getFullYear();
    } else if (this.mode === 'range' && this.rangeStart) {
      this.viewMonth = this.rangeStart.getMonth();
      this.viewYear = this.rangeStart.getFullYear();
    }
  }

  private applyDefaultValueIfNeeded() {
    if (!this.hasValue() && this.defaultValue) {
      this.writeValue(this.defaultValue);
    }
  }

  private initYearsList() {
    const current = new Date().getFullYear();
    const startYear = current - 60;
    const endYear = current + 30;
    this.yearsList = [];
    for (let y = endYear; y >= startYear; y--) {
      this.yearsList.push(y);
    }
  }

  // --- Theme Utility Methods ---

  getThemeFocusRing(): string {
    switch (this.themeColor) {
      case 'purple':
        return 'ring-2 ring-purple-500 border-purple-500';
      case 'blue':
        return 'ring-2 ring-blue-500 border-blue-500';
      case 'emerald':
        return 'ring-2 ring-emerald-500 border-emerald-500';
      case 'rose':
        return 'ring-2 ring-rose-500 border-rose-500';
      case 'amber':
        return 'ring-2 ring-amber-500 border-amber-500';
      case 'indigo':
      default:
        return 'ring-2 ring-indigo-500 border-indigo-500';
    }
  }

  getThemeBadgeClass(): string {
    switch (this.themeColor) {
      case 'purple':
        return 'bg-purple-600 text-white font-bold';
      case 'blue':
        return 'bg-blue-600 text-white font-bold';
      case 'emerald':
        return 'bg-emerald-600 text-white font-bold';
      case 'rose':
        return 'bg-rose-600 text-white font-bold';
      case 'amber':
        return 'bg-amber-600 text-white font-bold';
      case 'indigo':
      default:
        return 'bg-indigo-600 text-white font-bold';
    }
  }

  getThemeButtonClass(): string {
    switch (this.themeColor) {
      case 'purple':
        return 'bg-purple-600 hover:bg-purple-700 text-white';
      case 'blue':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      case 'emerald':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white';
      case 'rose':
        return 'bg-rose-600 hover:bg-rose-700 text-white';
      case 'amber':
        return 'bg-amber-600 hover:bg-amber-700 text-white';
      case 'indigo':
      default:
        return 'bg-indigo-600 hover:bg-indigo-700 text-white';
    }
  }

  getThemeRangeBackground(): string {
    switch (this.themeColor) {
      case 'purple':
        return 'bg-purple-100 dark:bg-purple-950/60';
      case 'blue':
        return 'bg-blue-100 dark:bg-blue-950/60';
      case 'emerald':
        return 'bg-emerald-100 dark:bg-emerald-950/60';
      case 'rose':
        return 'bg-rose-100 dark:bg-rose-950/60';
      case 'amber':
        return 'bg-amber-100 dark:bg-amber-950/60';
      case 'indigo':
      default:
        return 'bg-indigo-100 dark:bg-indigo-950/60';
    }
  }

  getDayClasses(item: CalendarDay): string {
    if (item.isDisabled) {
      return 'text-gray-300 dark:text-gray-600 cursor-not-allowed line-through opacity-40';
    }

    const isHighlight =
      item.isSelected ||
      (this.mode === 'range' && (item.isRangeStart || item.isRangeEnd));

    if (isHighlight) {
      return this.getThemeBadgeClass() + ' shadow-sm transform scale-105';
    }

    if (this.mode === 'range' && (item.isInRange || item.isInHoverRange)) {
      return 'text-gray-900 dark:text-gray-100 font-semibold hover:bg-white/40';
    }

    if (!item.isCurrentMonth) {
      return 'text-gray-400 dark:text-gray-500 opacity-60 hover:bg-gray-100 dark:hover:bg-gray-800';
    }

    if (item.isToday) {
      return 'border border-gray-400 dark:border-gray-500 font-bold text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800';
    }

    return 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800';
  }

  // --- Date Formatting & Parsing ---

  private isSameDay(d1: Date, d2: Date): boolean {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  private parseDate(val: any): Date | null {
    if (!val) return null;
    if (val instanceof Date && !isNaN(val.getTime())) {
      const d = new Date(val);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    if (typeof val === 'string') {
      const parsed = new Date(val);
      if (!isNaN(parsed.getTime())) {
        // Correct timezone offset shift if YYYY-MM-DD
        const parts = val.split('-');
        if (parts.length === 3) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          const d = parseInt(parts[2], 10);
          return new Date(y, m, d);
        }
        parsed.setHours(0, 0, 0, 0);
        return parsed;
      }
    }
    return null;
  }

  private formatIso(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  formatDisplayDate(d: Date): string {
    if (!d) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    if (this.dateFormat === 'MM/DD/YYYY') {
      return `${m}/${day}/${y}`;
    }
    if (this.dateFormat === 'DD/MM/YYYY') {
      return `${day}/${m}/${y}`;
    }
    if (this.dateFormat === 'MMM D, YYYY') {
      const monthShort = this.monthsList[d.getMonth()]?.shortName || '';
      return `${monthShort} ${d.getDate()}, ${y}`;
    }
    return `${y}-${m}-${day}`;
  }
}
