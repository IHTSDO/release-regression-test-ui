import { QAConfiguration } from './qaConfiguration';
import { BuildConfiguration } from './buildConfiguration';
import { ReleaseCenter } from './releaseCenter';

export class Product {
    id: string;
    name: string;
    latestBuildStatus: string;
    latestTag: string;
    qaTestConfig: QAConfiguration;
    buildConfiguration: BuildConfiguration;
    releaseCenter: ReleaseCenter;
}
