import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface KsSelectOption {
  label: string;
  value: string;
}

let nextSelectId = 0;

@Component({
  selector: 'app-ks-select',
  standalone: true,
  imports: [],
  templateUrl: './ks-select.component.html',
  styleUrl: './ks-select.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => KsSelectComponent),
      multi: true,
    },
  ],
})
export class KsSelectComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = 'Selecione';
  @Input() erro = '';
  @Input() options: KsSelectOption[] = [];
  @Input() inputId = `ks-select-${++nextSelectId}`;

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

  onChangeValue(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.value = value;
    this.onChange(value);
  }

  onBlur(): void {
    this.onTouched();
  }
}
