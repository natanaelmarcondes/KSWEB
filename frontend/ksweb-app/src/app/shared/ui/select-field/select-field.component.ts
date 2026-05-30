import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SelectFieldOption {
  label: string;
  value: string;
}

let nextSelectFieldId = 0;

@Component({
  selector: 'app-select-field',
  imports: [],
  templateUrl: './select-field.component.html',
  styleUrl: './select-field.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectFieldComponent),
      multi: true,
    },
  ],
})
export class SelectFieldComponent implements ControlValueAccessor {
  @Input({ required: true }) label = '';
  @Input() placeholder = 'Selecione';
  @Input() error = '';
  @Input() options: SelectFieldOption[] = [];
  @Input() inputId = `app-select-field-${++nextSelectFieldId}`;

  value = '';
  disabled = false;

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  handleChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.value = value;
    this.onChange(value);
  }

  handleBlur(): void {
    this.onTouched();
  }
}
