import { Injectable, inject, signal } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable({ providedIn: 'root' })
export class KsConfirmService {
  readonly mensagem = signal<string | null>(null);
  private resolver?: (confirmado: boolean) => void;

  constructor() {
    inject(Router).events.pipe(takeUntilDestroyed()).subscribe(event => {
      if (event instanceof NavigationStart) this.responder(false);
    });
  }

  confirmar(mensagem: string): Promise<boolean> {
    if (this.resolver) return Promise.resolve(false);
    return new Promise(resolve => {
      this.resolver = resolve;
      this.mensagem.set(mensagem);
    });
  }

  responder(confirmado: boolean): void {
    const resolver = this.resolver;
    this.resolver = undefined;
    this.mensagem.set(null);
    resolver?.(confirmado);
  }
}
