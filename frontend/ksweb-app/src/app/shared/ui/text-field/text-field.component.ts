import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let nextTextFieldId = 0;

@Component({
  selector: 'app-text-field',
  imports: [],
  templateUrl: './text-field.component.html',
  styleUrl: './text-field.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextFieldComponent),
      multi: true,
    },
  ],
})
export class TextFieldComponent implements ControlValueAccessor {
  @Input({ required: true }) label = '';
  @Input() type = 'text';
  @Input() placeholder = '';
  @Input() autocomplete = '';
  @Input() error = '';
  @Input() maxlength?: string | number;
  @Input() inputId = `app-text-field-${++nextTextFieldId}`;

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

  handleInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.value = value;
    this.onChange(value);
  }

  handleBlur(): void {
    this.onTouched();
  }
}
