// FRAMEWORK IMPORTS
import { BrowserModule } from '@angular/platform-browser';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { HeaderInterceptor } from './interceptors/header.interceptor';
import { NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';
// import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
// import { NgxPaginationModule } from 'ngx-pagination';

// COMPONENT IMPORTS
import { SnomedNavbarComponent } from './components/snomed-navbar/snomed-navbar.component';
import { SnomedFooterComponent } from './components/snomed-footer/snomed-footer.component';

// PIPE IMPORTS
import { AuthenticationService } from './services/authentication/authentication.service';
import { HomeComponent } from './components/home/home.component';
import { ModalComponent } from './components/modal/modal.component';
import { ModalService } from './services/modal/modal.service';
import { ReleaseServerService } from './services/releaseServer/release-server.service';
import { AppRoutingModule } from './app-routing.module';
import { ProductService } from './services/product/product.service';
import { AuthenticationInterceptor } from './interceptors/authentication.interceptor';
import { EnvServiceProvider } from './providers/env.service.provider';
import { AuthoringService } from './services/authoring/authoring.service';
import { ToastrModule } from 'ngx-toastr';
import { MatPaginatorModule } from '@angular/material/paginator';
import { PermissionService } from './services/permission/permission.service';
import { MatTooltipModule } from '@angular/material/tooltip';

export function startupServiceFactory(permissionService: PermissionService): Function {
    return () => permissionService.getRoles();
}

@NgModule({
    declarations: [
        AppComponent,
        SnomedNavbarComponent,
        SnomedFooterComponent,
        HomeComponent,
        ModalComponent,
    ],
    imports: [
        BrowserModule,
        FormsModule,
        HttpClientModule,
        BrowserAnimationsModule,
        NgbTypeaheadModule,
        AppRoutingModule,
        ToastrModule.forRoot(),
        MatPaginatorModule,
        MatTooltipModule
        // BsDatepickerModule.forRoot()
    ],
    providers: [
        AuthenticationService,
        AuthoringService,
        ReleaseServerService,
        ProductService,
        ModalService,
        PermissionService,
        EnvServiceProvider,
        {
            provide: HTTP_INTERCEPTORS,
            useClass: HeaderInterceptor,
            multi: true
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: AuthenticationInterceptor,
            multi: true
        },
        {
            provide: APP_INITIALIZER,
            useFactory: startupServiceFactory,
            deps: [PermissionService],
            multi: true
          }
    ],
    bootstrap: [AppComponent]
})

export class AppModule {
}
