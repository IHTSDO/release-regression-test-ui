import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { EnvService } from '../../services/environment/env.service';
import { User } from '../../models/user';
import { AuthenticationService } from '../../services/authentication/authentication.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-snomed-navbar',
    imports: [ReactiveFormsModule, CommonModule, FormsModule, RouterLink],
    templateUrl: './snomed-navbar.component.html',
    styleUrls: ['./snomed-navbar.component.scss']
})
export class SnomedNavbarComponent implements OnInit {

    environment: string;
    user: User;
    userSubscription: Subscription;

    constructor(private authenticationService: AuthenticationService,
                private envService: EnvService) {
        this.userSubscription = this.authenticationService.getUser().subscribe(data => this.user = data);
    }

    ngOnInit() {
        this.environment = this.envService.env;
        this.authenticationService.setUser();
    }

    logout() {
        this.authenticationService.logout();
    }
}
