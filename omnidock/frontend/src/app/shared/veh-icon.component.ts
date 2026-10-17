import { Component, Input } from '@angular/core';

/** Pictograma del tipo de vehículo: 1 bicicleta, 2 scooter. */
@Component({
  selector: 'app-veh-icon',
  standalone: true,
  template: `
    @if (tipo === 2) {
      <svg viewBox="0 0 24 24" [attr.width]="size" [attr.height]="size" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="5.5" cy="17.5" r="2.5"/><circle cx="18.5" cy="17.5" r="2.5"/>
        <path d="M8 17.5h8M16 17.5 14 5h-3"/>
      </svg>
    } @else {
      <svg viewBox="0 0 24 24" [attr.width]="size" [attr.height]="size" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="5.5" cy="16.5" r="3.5"/><circle cx="18.5" cy="16.5" r="3.5"/>
        <path d="M5.5 16.5 9 8h6l3.5 8.5M9 8l3.5 8.5h-7M15 8l-.8-2.5H12M7.5 8H10"/>
      </svg>
    }
  `,
  styles: [`:host { display: inline-flex; line-height: 0; }`],
})
export class VehIconComponent {
  @Input() tipo = 1;
  @Input() size = 22;
}
