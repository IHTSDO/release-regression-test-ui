import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FileDiffReport } from 'src/app/models/fileDiffReport';

@Injectable({
    providedIn: 'root'
})
export class RegressionTestService {

    constructor(private http: HttpClient) {

    }

    getTestReports(): Observable<Object[]> {
        return this.http.get<Object[]>('/release/regression-test/test-reports');
    }

    getTestReport(centerKey, productKey, comparedId): Observable<Object> {
        return this.http.get<Object>('/release/centers/' + centerKey + '/products/' + productKey + '/builds/compare/' + comparedId);
    }

    deleteTestReport(centerKey, productKey, comparedId) {
        return this.http.delete('/release/centers/' + centerKey + '/products/' + productKey + '/builds/compare/' + comparedId);
    }

    compareBuilds(centerKey, productKey, leftBuildId, rightBuildId) {
          const params = new HttpParams()
          .set('leftBuildId', leftBuildId)
          .set('rightBuildId', rightBuildId);
        return this.http.post<Object>('/release/centers/' + centerKey + '/products/' + productKey + '/builds/compare',
                                        {}, {params: params});
    }

    findDiff(centerKey, productKey, leftBuildId, rightBuildId, fileName, compareId, ignoreIdComparison) {
        const params = new HttpParams()
        .set('leftBuildId', leftBuildId)
        .set('rightBuildId', rightBuildId)
        .set('fileName', fileName)
        .set('compareId', compareId)
        .set('ignoreIdComparison', ignoreIdComparison);
        return this.http.post<Object>('/release/centers/' + centerKey + '/products/' + productKey + '/files/find-diff',
                                      {}, {params: params});
    }

    retrieveDiff(centerKey, productKey, compareId, fileName, ignoreIdComparison): Observable<FileDiffReport> {
        const params = new HttpParams()
        .set('fileName', fileName)
        .set('ignoreIdComparison', ignoreIdComparison);
        return this.http.get<FileDiffReport>('/release/centers/' + centerKey + '/products/' + productKey + '/files/find-diff/' + compareId,
                                      {params: params});
    }
}
