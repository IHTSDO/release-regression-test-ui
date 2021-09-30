import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { EnvService } from './services/environment/env.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

    constructor(private envService: EnvService,
                private titleService: Title) {
    }

    ngOnInit() {
        this.titleService.setTitle('SNOMED CT Release Regression Test UI');
        this.assignFavicon();
    }

    assignFavicon() {
        const favicon = $('#favicon');
        switch (this.envService.env) {
            case 'local':
                favicon.attr('href', 'favicon_grey.ico');
                break;
            case 'dev':
                favicon.attr('href', 'favicon_red.ico');
                break;
            case 'uat':
                favicon.attr('href', 'favicon_green.ico');
                break;
            case 'training':
                favicon.attr('href', 'favicon_yellow.ico');
                break;
            default:
                favicon.attr('href', 'favicon.ico');
                break;
        }
    }
}
