import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReleaseCenter } from '../../models/releaseCenter';
import { CodeSystem } from '../../models/codeSystem';

@Injectable({
    providedIn: 'root'
})
export class ReleaseServerService {

    constructor(private http: HttpClient) {

    }

    getCenters(): Observable<ReleaseCenter[]> {
        return this.http.get<ReleaseCenter[]>('/release/centers');
    }
}
