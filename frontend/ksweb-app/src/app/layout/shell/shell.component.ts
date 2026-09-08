import { Component, computed, signal, DestroyRef, ElementRef, HostListener, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/auth/auth.service';

type SubmenuKey = 'cadastros' | 'sistema' | null;

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
  private readonly elementRef = inject(ElementRef<HTMLElement>);
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
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd), takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        this.rotaAtual = event.urlAfterRedirects;
        this.fecharMenuMobile();
      });
  }

  alternarMenu(): void {
    this.submenuAberto.set(null);
    if (this.telaMobile()) this.menuMobileAberto.update(value => !value);
    else this.menuRecolhido.update(value => !value);
  }

  abrirMenuMobile(): void {
    this.menuMobileAberto.set(true);
  }

  fecharMenuMobile(): void {
    this.submenuAberto.set(null);
    this.menuMobileAberto.set(false);
  }

  @HostListener('document:click', ['$event'])
  fecharSubmenuAoClicarFora(event: MouseEvent): void {
    const sidebar = this.elementRef.nativeElement.querySelector('.sidebar');
    if (event.target instanceof Node && !sidebar?.contains(event.target)) {
      this.submenuAberto.set(null);
    }
  }

  @HostListener('document:keydown.escape')
  fecharMenus(): void {
    this.fecharMenuMobile();
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

}
