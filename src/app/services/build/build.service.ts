import { Injectable } from '@angular/core';
import { Build } from '../../models/build';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BuildService {

  constructor(private http: HttpClient) { }

  getBuild(releaseCenterKey, productKey, buildId, iclucdeBuildConfig, includeQAConfig): Observable<Build> {
      const params = new HttpParams()
            .set('includeBuildConfiguration', iclucdeBuildConfig)
            .set('includeQAConfiguration', includeQAConfig);
      return this.http.get<Build>('/release/centers/' + releaseCenterKey + '/products/' + productKey + '/builds/' + buildId,
                                {params: params});
  }

  getBuilds(releaseCenterKey, productKey, iclucdeBuildConfig, includeQAConfig, viewMode, visibility): Observable<Build[]> {
    let params;
    if (visibility) {
          params = new HttpParams()
            .set('includeBuildConfiguration', iclucdeBuildConfig)
            .set('includeQAConfiguration', includeQAConfig)
            .set('viewMode', viewMode)
            .set('visibility', visibility);
        } else {
          params = new HttpParams()
            .set('includeBuildConfiguration', iclucdeBuildConfig)
            .set('viewMode', viewMode)
            .set('includeQAConfiguration', includeQAConfig);
        }

      return this.http.get<Build[]>('/release/centers/' + releaseCenterKey + '/products/' + productKey + '/builds', {params: params});
  }

  getPublishedBuilds(releaseCenterKey, productKey): Observable<Build[]> {
    const params = new HttpParams()
    .set('includeProdPublishedReleases', 'true');
    return this.http.get<Build[]>('/release/centers/' + releaseCenterKey + '/products/' + productKey + '/builds/published',
                                  {params: params});
  }

  cloneBuild(releaseCenterKey, productKey, buildId):  Observable<Build> {
    return this.http.post<Build>('/release/centers/' + releaseCenterKey + '/products/' + productKey + '/builds/' + buildId + '/clone', {});
  }

  updateBuildVisibility(releaseCenterKey, productKey, buildId, visibility) {
    const params = new HttpParams()
                .set('visibility', visibility);
    return this.http.post('/release/centers/' + releaseCenterKey + '/products/' + productKey + '/builds/' + buildId + '/visibility', {},
                          {params: params});
  }
}
