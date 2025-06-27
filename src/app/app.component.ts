import {Component, Inject, OnInit} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {AuthoringService} from './services/authoring/authoring.service';
import {EnvService} from './services/environment/env.service';
import {DOCUMENT} from '@angular/common';
import { SnomedNavbarComponent } from './components/snomed-navbar/snomed-navbar.component';
import { SnomedFooterComponent } from './components/snomed-footer/snomed-footer.component';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, SnomedNavbarComponent, SnomedFooterComponent],
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

    constructor(private authoringService: AuthoringService,
                private envService: EnvService,
                private titleService: Title,
                @Inject(DOCUMENT) private document: Document) {
    }

    ngOnInit() {
        this.titleService.setTitle('SNOMED CT Release Regression Test UI');
        this.getUIConfiguration();
        this.assignFavicon();
    }

    getUIConfiguration() {
        this.authoringService.getUIConfiguration().subscribe(
            data => {
                this.authoringService.uiConfiguration = data;
            },
            error => {
                console.error('ERROR: UI Config failed to load');
            }
        );
    }

    assignFavicon() {
        switch (this.envService.env) {
            case 'local':
                this.document.getElementById('favicon').setAttribute('href', 'favicon_grey.ico');
                break;
            case 'dev':
                this.document.getElementById('favicon').setAttribute('href', 'favicon_red.ico');
                break;
            case 'uat':
                this.document.getElementById('favicon').setAttribute('href', 'favicon_green.ico');
                break;
            case 'training':
                this.document.getElementById('favicon').setAttribute('href', 'favicon_yellow.ico');
                break;
            default:
                this.document.getElementById('favicon').setAttribute('href', 'favicon.ico');
                break;
        }
    }
}
