import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UsuariosService } from '../../pages/usuarios/usuarios.service';
import { KsSelectComponent, KsSelectOption } from '../../shared/components/ks-select/ks-select.component';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/auth/auth.service';
import { KsButtonComponent } from '../../shared/components/ks-button/ks-button.component';

type SubmenuKey = 'operacional' | 'cadastros' | 'sistema' | null;

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, KsButtonComponent, KsSelectComponent, FormsModule],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
})
export class ShellComponent {
  usuariosOptions: KsSelectOption[] = [];
  usuarioSelecionado: string = '';
  readonly usuario = computed(() => this.authService.usuario());
  readonly submenuAberto = signal<SubmenuKey>('operacional');
  readonly menuMobileAberto = signal<boolean>(false);

  private rotaAtual = '';

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly usuariosService: UsuariosService
  ) {
    this.rotaAtual = this.router.url;
    this.abrirSubmenuPorRota(this.rotaAtual);
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.rotaAtual = event.urlAfterRedirects;
        this.abrirSubmenuPorRota(this.rotaAtual);
      });
    this.carregarUsuarios();
  }

  carregarUsuarios(): void {
    this.usuariosService.listar().subscribe({
      next: (usuarios: any[]) => {
        this.usuariosOptions = (usuarios ?? []).map((u: any) => ({
          label: u.usrNome,
          value: String(u.userId)
        }));
      },
      error: () => {
        this.usuariosOptions = [];
      }
    });
  }

  onUsuarioSelecionado(valor: string): void {
    this.usuarioSelecionado = valor;
    // Aqui você pode disparar ações ao selecionar um usuário
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
    if (url.startsWith('/modelo-padrao')) {
      this.submenuAberto.set('sistema');
      return;
    }
  }
}
