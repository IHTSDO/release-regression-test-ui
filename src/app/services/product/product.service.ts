import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { Product } from '../../models/product';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class ProductService {

    constructor(private http: HttpClient) {
    }

    getProducts(releaseCenterKey, pageNumber, pageSize): Observable<Product> {
        const params = new HttpParams()
                    .set('pageNumber', (pageNumber - 1).toString())
                    .set('pageSize', pageSize)
                    .set('sortField', 'name')
                    .set('sortDirection', 'asc');
        return this.http.get<Product>('/release/centers/' + releaseCenterKey + '/products', {params: params});
    }
}
