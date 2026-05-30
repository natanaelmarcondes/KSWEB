import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let nextCheckboxId = 0;

@Component({
  selector: 'app-checkbox',
  imports: [],
  templateUrl: './checkbox.component.html',
  styleUrl: './checkbox.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxComponent),
      multi: true,
    },
  ],
})
export class CheckboxComponent implements ControlValueAccessor {
  @Input({ required: true }) label = '';
  @Input() inputId = `app-checkbox-${++nextCheckboxId}`;

  checked = false;
  disabled = false;

  private onChange: (value: boolean) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: boolean | null): void {
    this.checked = Boolean(value);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  handleChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.checked = checked;
    this.onChange(checked);
  }

  handleBlur(): void {
    this.onTouched();
  }
}
