import { Routes } from '@angular/router';

export const routes: Routes = [
  { 
    path: '', 
    redirectTo: 'scanner', 
    pathMatch: 'full' 
  },
  { 
    path: 'scanner', 
    loadComponent: () => import('../app/core/components/receipt-scanner.component/receipt-scanner.component')
      .then(m => m.ReceiptScannerComponent) 
  },
  { 
    path: '**', 
    redirectTo: 'scanner' 
  }
];