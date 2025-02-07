import { BuildConfiguration } from './buildConfiguration';
import { Product } from './product';
import { QAConfiguration } from './qaConfiguration';

export class Build {
    id: string;
    url: string;
    buildUser: string;
    status: string;
    tags: string[];
    rvfURL: string;
    releaseCenterKey: string;
    productKey: string;
    configuration: BuildConfiguration;
    qaTestConfig: QAConfiguration;
    product: Product;
    preConditionCheckReports_url: string;
    postConditionCheckReports_url: string;
}
