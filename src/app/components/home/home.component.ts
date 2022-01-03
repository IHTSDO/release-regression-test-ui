import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ProductService } from '../../services/product/product.service';
import { ReleaseCenter } from '../../models/releaseCenter';
import { ModalService } from '../../services/modal/modal.service';
import { Product } from '../../models/product';
import { RegressionTestService } from 'src/app/services/regressionTest/regression-test.service';
import { TestRequest } from 'src/app/models/testRequest';
import { ReleaseServerService } from 'src/app/services/releaseServer/release-server.service';
import { BuildService } from 'src/app/services/build/build.service';
import { DiffRow } from 'src/app/models/diffRow';
import { FileDiffReport } from 'src/app/models/fileDiffReport';
import { Build } from 'src/app/models/build';


@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {

    interval: any;
    viewDetails = false;
    testReportsLoading = false;

    allTestReports: Object[]; // hold all test reports
    testRequests: TestRequest[]; // hold all test requests
    releaseCenters: ReleaseCenter[];
    products: Product[];
    buildMap: Object;
    buildLoadingMap: Object;
    includeHiddenBuildsFlag: Object;
    selectedReport: Object;
    selectedFileName: string;
    leftBuild: Build;
    rightBuild: Build;

    // Diff file report
    diffReport: FileDiffReport;
    changeRows: DiffRow[];
    deleteRows: DiffRow[];
    insertRows: DiffRow[];

    // global message
    message: string;
    action: string;

    constructor(private modalService: ModalService,
                private releaseServerService: ReleaseServerService,
                private productService: ProductService,
                private buildService: BuildService,
                private regressionTestService: RegressionTestService) {
    }

    ngOnInit(): void {
        this.allTestReports = [];
        this.testRequests = [];
        this.releaseCenters = [];
        this.products = [];
        this.changeRows = [];
        this.deleteRows = [];
        this.insertRows = [];
        this.buildMap = {};
        this.buildLoadingMap = {};
        this.includeHiddenBuildsFlag = {};
        this.selectedReport = {};
        this.diffReport = new FileDiffReport();
        this.leftBuild = new Build();
        this.rightBuild = new Build();
        this.loadTestReports();
        this.loadAllReleaseCenters();
        this.startPolling();
    }

    ngOnDestroy(): void {
        if (this.interval) {
            clearInterval(this.interval);
        }
    }

    clearExistingTestRequests() {
        this.testRequests = [];
    }

    addNewTestRequest() {
        const newTestRequest = new TestRequest();
        newTestRequest.buildId = '';
        newTestRequest.productKey = '';
        newTestRequest.centerKey = '';
        this.testRequests.push(newTestRequest);
    }

    loadTestReports() {
        this.testReportsLoading = true;
        this.regressionTestService.getTestReports().subscribe(
            response => {
                this.allTestReports = response;
                this.allTestReports.sort((a, b) => b['startDate'] - a['startDate']);
            },
            errorResponse => {
                this.message = errorResponse.error.errorMessage;
                this.openErrorModel();
            },
            () => {
                this.testReportsLoading = false;
            }
        );
    }

    getCenterName(centerKey) {
        const found = this.releaseCenters.find(item => item.id === centerKey);
        return found ? found.name : centerKey;
    }

    getProductName(centerKey, productKey) {
        const found = this.products.find(item => item.id === productKey && item.releaseCenter.id === centerKey);
        return found ? found.name : productKey;
    }

    loadAllReleaseCenters() {
        this.releaseServerService.getCenters().subscribe(
            response => {
                this.releaseCenters = response;
                for (let i = 0; i < this.releaseCenters.length; i++) {
                    this.loadProductsForCenter(this.releaseCenters[i].id);
                }
            },
            errorResponse => {
                this.message = errorResponse.error.errorMessage;
                this.openErrorModel();
            }
        );
    }

    loadProductsForCenter(centerKey) {
        this.productService.getProducts(centerKey, 1, 200).subscribe(response => {
            this.products = this.products.concat(response['content']);
        },
        errorResponse => {
            this.message = errorResponse.error.errorMessage;
            this.openErrorModel();
        });
    }

    getProductsByCenter(centerKey) {
        return !centerKey ? [] : this.products.filter(item => item.releaseCenter.id === centerKey);
    }

    getBuilds(centerKey, productKey, index) {
        const includeHiddenBuilds = this.includeHiddenBuildsFlag[index] ? this.includeHiddenBuildsFlag[index] : false;
        if (!centerKey || !productKey
            || (this.buildMap && this.buildMap.hasOwnProperty(centerKey + '-' + productKey + '-' + includeHiddenBuilds))) {
            return;
        }
        this.buildLoadingMap[centerKey + '-' + productKey] = true;
        this.buildService.getBuilds(centerKey, productKey, false, false, includeHiddenBuilds ? null : true).subscribe(
            response => {
                this.buildMap[centerKey + '-' + productKey + '-' + includeHiddenBuilds] = response['content'];
                this.buildLoadingMap[centerKey + '-' + productKey] = false;
            }
        );
    }

    getIncludeHiddenBuildFlag(index) {
        return this.includeHiddenBuildsFlag[index] ? this.includeHiddenBuildsFlag[index] : false;
    }

    setSelectedReport(report: Object) {
        this.selectedReport = report;
        const centerKey = this.selectedReport['centerKey'];
        const productKey = this.selectedReport['productKey'];
        const leftBuildId = this.selectedReport['leftBuildId'];
        const rightBuildId = this.selectedReport['rightBuildId'];

        this.leftBuild = new Build();
        this.rightBuild = new Build();
        this.buildService.getBuild(centerKey, productKey, leftBuildId, false, false).subscribe(
            reponse => {
                this.leftBuild = reponse;
            }
        );
        this.buildService.getBuild(centerKey, productKey, rightBuildId, false, false).subscribe(
            reponse => {
                this.rightBuild = reponse;
            }
        );
    }

    isLoadingBuilds(centerKey, productKey) {
        return this.buildLoadingMap[centerKey + '-' + productKey];
    }

    isObjectArray(obj) {
        return Array.isArray(obj);
    }

    runTests() {
        const validTestRequests = [];
        this.testRequests.forEach(obj => {
            if (this.missingFieldsCheck(obj).length === 0) {
                validTestRequests.push(obj);
            }
        });

        if (validTestRequests.length > 0) {
            this.openWaitingModel('Initiating Regression Tests');

            this.triggerTests(validTestRequests, this.buildService, this.regressionTestService).then(() => {
                this.loadTestReports();
                this.closeWaitingModel();
            });
        } else {
            this.message = 'No tests to run.';
            this.openErrorModel();
        }
    }

    triggerTests(validTestRequests, buildService, regressionTestService) {
        const promise = new Promise(function(resolve, reject) {
            const runTest = function(requests, index) {
                const testRequest = requests[index];
                buildService.cloneBuild(testRequest['centerKey'], testRequest['productKey'], testRequest['buildId']).subscribe(
                    response => {
                        const centerKey = response.product.releaseCenter.id;
                        const productKey = response.product.id;
                        const rightBuildKey = response.id;
                        buildService.updateBuildVisibility(centerKey, productKey, rightBuildKey, false).subscribe(() => {});
                        regressionTestService.compareBuilds(centerKey, productKey, testRequest['buildId'], rightBuildKey).subscribe(
                            () => {
                                index++;
                                if (index === validTestRequests.length) {
                                    resolve(null);
                                } else {
                                    runTest(requests, index);
                                }
                            }, () => {
                                index++;
                                if (index === validTestRequests.length) {
                                    resolve(null);
                                } else {
                                    runTest(requests, index);
                                }
                            }
                        );
                    }, () => {
                        index++;
                        if (index === validTestRequests.length) {
                            resolve(null);
                        } else {
                            runTest(requests, index);
                        }
                    }
                );
            };
            runTest(validTestRequests, 0);
        });
        return promise;

    }

    findDiff(fileName, ignoreIdComparison) {
        this.openWaitingModel('Generating Diff');
        this.selectedFileName = fileName;
        this.changeRows = [];
        this.deleteRows = [];
        this.insertRows = [];
        this.regressionTestService.findDiff(this.selectedReport['centerKey'],
                                            this.selectedReport['productKey'],
                                            this.selectedReport['leftBuildId'],
                                            this.selectedReport['rightBuildId'],
                                            fileName,
                                            this.selectedReport['compareId'],
                                            ignoreIdComparison).subscribe(
            () => {
                this.retrieveDiff(fileName, ignoreIdComparison, 1000);
            }
        );
    }

    getDisplayText(obj) {
        if (typeof obj === 'object' && obj != null) {
            return JSON.stringify(obj);
        } else {
           return (obj && obj != null) ? obj : '';
        }
    }

    retrieveDiff(fileName, ignoreIdComparison, interval) {
        setTimeout(() => {
            this.regressionTestService.retrieveDiff(this.selectedReport['centerKey'],
                                                    this.selectedReport['productKey'],
                                                    this.selectedReport['compareId'],
                                                    fileName,
                                                    ignoreIdComparison).subscribe(
                    response => {
                        if (response['status'] === 'RUNNING') {
                            this.retrieveDiff(fileName, ignoreIdComparison, 5000);
                        } else {
                            this.diffReport = response;
                            this.changeRows = response.changeRows;
                            this.deleteRows = response.deleteRows;
                            this.insertRows = response.insertRows;
                            this.closeWaitingModel();
                            this.openModal('diff-report-modal');
                        }
                    }
                );
        }, interval);
    }

    missingFieldsCheck(testRequest: TestRequest): Object[] {
        const missingFields = [];
        if (!testRequest.buildId) { missingFields.push('Build ID'); }
        if (!testRequest.productKey) { missingFields.push('Product ID'); }
        if (!testRequest.centerKey) { missingFields.push('Center ID'); }

        return missingFields;
    }

    private startPolling() {
        this.interval = setInterval(() => {
            this.allTestReports.forEach(report => {
                if (report['status'] === 'RUNNING') {
                    this.regressionTestService.getTestReport(report['centerKey'], report['productKey'], report['compareId']).subscribe(
                        response => {
                            if (response['status'] !== 'RUNNING') {
                                for (let i = 0; i < this.allTestReports.length; i++) {
                                    if (this.allTestReports[i]['compareId'] === response['compareId']) {
                                        this.allTestReports[i] = response;
                                        break;
                                    }
                                }
                                this.allTestReports.sort((a, b) => b['startDate'] - a['startDate']);
                            }
                        }
                    );
                }
            });
        }, 120000);
    }

    openModal(name) {
        this.modalService.open(name);
    }

    closeModal(name) {
        this.modalService.close(name);
    }

    private openWaitingModel(action: string) {
        this.action = action;
        this.openModal('waiting-modal');
    }

    private closeWaitingModel() {
        this.closeModal('waiting-modal');
    }

    private openSuccessModel() {
        this.openModal('success-modal');
    }

    private openErrorModel() {
        this.openModal('error-modal');
    }
}
