import { BuildConfiguration } from './buildConfiguration';
import { Product } from './product';
import { QAConfiguration } from './qaConfiguration';

export class Build {
    id: string;
    buildUser: string;
    status: string;
    tags: string[];
    rvfURL: string;
    configuration: BuildConfiguration;
    qaTestConfig: QAConfiguration;
    product: Product;

    // UI controls
    buildDownloadingLog: boolean;
    buildDownloadingPackage: boolean;
    buildPublishing: boolean;
    buildDeleting: boolean;
    buildCanceling: boolean;
    buildCreating: boolean;
}
