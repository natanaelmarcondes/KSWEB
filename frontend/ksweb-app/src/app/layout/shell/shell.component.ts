import { Component, computed, signal, DestroyRef, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/auth/auth.service';

type SubmenuKey = 'operacional' | 'cadastros' | 'sistema' | null;

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
})
export class ShellComponent {
  readonly usuario = computed(() => this.authService.usuario());
  readonly submenuAberto = signal<SubmenuKey>(null);
  readonly menuRecolhido = signal(false);
  readonly telaMobile = signal(window.matchMedia('(max-width: 920px)').matches);
  readonly menuVisivel = computed(() => this.telaMobile() ? this.menuMobileAberto() : !this.menuRecolhido());
  readonly ano = new Date().getFullYear();
  readonly horario = signal(new Date().toLocaleTimeString('pt-BR'));
  private readonly destroyRef = inject(DestroyRef);
  readonly menuMobileAberto = signal<boolean>(false);

  private rotaAtual = '';

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {
    const media = window.matchMedia('(max-width: 920px)');
    const atualizarTela = (event: MediaQueryListEvent) => this.telaMobile.set(event.matches);
    media.addEventListener('change', atualizarTela);
    this.destroyRef.onDestroy(() => media.removeEventListener('change', atualizarTela));
    const timer = setInterval(() => this.horario.set(new Date().toLocaleTimeString('pt-BR')), 1000);
    this.destroyRef.onDestroy(() => clearInterval(timer));
    this.rotaAtual = this.router.url;
    this.abrirSubmenuPorRota(this.rotaAtual);
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd), takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        this.rotaAtual = event.urlAfterRedirects;
        this.abrirSubmenuPorRota(this.rotaAtual);
      });
  }

  alternarMenu(): void {
    if (this.telaMobile()) this.menuMobileAberto.update(value => !value);
    else this.menuRecolhido.update(value => !value);
  }

  abrirMenuMobile(): void {
    this.menuMobileAberto.set(true);
  }

  fecharMenuMobile(): void {
    this.menuMobileAberto.set(false);
  }

  alternarSubmenu(menu: Exclude<SubmenuKey, null>): void {
    if (this.submenuAberto() === menu) {
      this.submenuAberto.set(null);
      return;
    }
    this.submenuAberto.set(menu);
  }

  menuAtivo(menu: Exclude<SubmenuKey, null>): boolean {
    return this.rotaPertenceAoMenu(menu) || this.submenuAberto() === menu;
  }

  sair(): void {
    this.authService.logout();
  }

  private rotaPertenceAoMenu(menu: Exclude<SubmenuKey, null>): boolean {
    switch (menu) {
      case 'operacional':
        return this.rotaAtual.startsWith('/ordens-servico') || this.rotaAtual.startsWith('/daily');
      case 'cadastros':
        return (
          this.rotaAtual.startsWith('/usuarios') ||
          this.rotaAtual.startsWith('/setores') ||
          this.rotaAtual.startsWith('/status')
        );
      case 'sistema':
        return this.rotaAtual.startsWith('/modelo-padrao');
      default:
        return false;
    }
  }

  private abrirSubmenuPorRota(url: string): void {
    if (url.startsWith('/ordens-servico') || url.startsWith('/daily')) {
      this.submenuAberto.set('operacional');
      return;
    }
    if (
      url.startsWith('/usuarios') ||
      url.startsWith('/setores') ||
      url.startsWith('/status')
    ) {
      this.submenuAberto.set('cadastros');
      return;
    }
    this.submenuAberto.set(null);
    if (url.startsWith('/modelo-padrao')) {
      this.submenuAberto.set('sistema');
      return;
    }
  }
}
