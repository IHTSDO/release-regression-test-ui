import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ProductService } from '../../services/product/product.service';
import { ReleaseCenter } from '../../models/releaseCenter';
import { ModalService } from '../../services/modal/modal.service';
import { Product } from '../../models/product';
import { RegressionTestService } from '../../services/regressionTest/regression-test.service';
import { TestRequest } from '../../models/testRequest';
import { ReleaseServerService } from '../../services/releaseServer/release-server.service';
import { BuildService } from '../../services/build/build.service';
import { DiffRow } from '../../models/diffRow';
import { FileDiffReport } from '../../models/fileDiffReport';
import { Build } from '../../models/build';
import { MatPaginator } from '@angular/material/paginator';
import { PermissionService } from '../../services/permission/permission.service';

enum BuildViewMode {
    PUBLISHED = 'Published',
    ALL_RELEASES = 'All Builds'
}

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {

    @ViewChild('reportPaginator') reportPaginator: MatPaginator;

    interval: any;
    testReportsLoading = false;
    BuildViewMode = BuildViewMode;
    environment: string;
    dangerInput: string;

    allTestReports: any[]; // hold all test reports
    filteredTestReports: any[]; // hold filtered test reports
    testRequests: TestRequest[]; // hold all test requests
    releaseCenters: ReleaseCenter[];
    products: Product[];
    buildMap: Object;
    clonedBuildMap: Object;
    buildLoadingMap: Object;
    selectedReport: Object;
    selectedFileName: string;
    selectedReleaseCenter: string;
    selectedProduct: string;
    selectedCompareId: string;
    leftBuild: Build;
    rightBuild: Build;
    selectedBuildToPublish: Build;
    publishingBuilds: string[];
    roles: any;

    // Diff file report
    diffReport: FileDiffReport;
    changeRows: DiffRow[];
    deleteRows: DiffRow[];
    insertRows: DiffRow[];

    // global message
    message: string;
    action: string;

    // pagination
    totalReport = 0;
    pageSize = 10;

    constructor(private modalService: ModalService,
                private releaseServerService: ReleaseServerService,
                private productService: ProductService,
                private buildService: BuildService,
                private permissionService: PermissionService,
                private regressionTestService: RegressionTestService) {
    }

    ngOnInit(): void {
        this.roles = this.permissionService.roles;
        this.allTestReports = [];
        this.filteredTestReports = [];
        this.testRequests = [];
        this.releaseCenters = [];
        this.products = [];
        this.changeRows = [];
        this.deleteRows = [];
        this.insertRows = [];
        this.buildMap = {};
        this.buildLoadingMap = {};
        this.selectedReport = {};
        this.selectedBuildToPublish = new Build();
        this.diffReport = new FileDiffReport();
        this.leftBuild = new Build();
        this.rightBuild = new Build();
        this.loadTestReports();
        this.loadAllReleaseCenters();
        this.startPolling();
        this.publishingBuilds = [];
        this.clonedBuildMap = {};
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
        newTestRequest.viewMode = 'PUBLISHED';
        newTestRequest.includeHiddenBuilds = false;
        this.testRequests.push(newTestRequest);
    }

    loadTestReports() {
        this.testReportsLoading = true;
        this.totalReport = 0;
        this.regressionTestService.getTestReports().subscribe(
            response => {
                this.allTestReports = response;
                this.totalReport = this.allTestReports.length;
                this.allTestReports.sort((a, b) => b['startDate'] - a['startDate']);
                this.filterTestReports();
                if (this.allTestReports.length === 0) {
                    this.testReportsLoading = false;
                }
                let count = 0;
                for (let i = 0; i < this.allTestReports.length; i++) {
                    const centerKey = this.allTestReports[i]['centerKey'];
                    const productKey = this.allTestReports[i]['productKey'];
                    const rightBuildId = this.allTestReports[i]['rightBuildId'];
                    this.buildService.getBuild(centerKey, productKey, rightBuildId, true, false).subscribe(
                        reponse => {
                            this.clonedBuildMap[reponse.id] = reponse;
                            count++;
                            if (count === this.allTestReports.length) {
                                this.testReportsLoading = false;
                            }
                        },() => {
                            this.testReportsLoading = false;
                            count++;
                            if (count === this.allTestReports.length) {
                                this.testReportsLoading = false;
                            }
                        }
                    );
                }
            },
            errorResponse => {
                this.message = errorResponse.error.errorMessage;
                this.openErrorModel();
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
                this.releaseCenters.sort((a, b) => {
                    if (b['id'] === 'international') {
                        return 1;
                    } else {
                        return a['name'].localeCompare(b['name']);
                    }
                });
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

    getBuilds(request: TestRequest) {
        const includeHiddenBuilds = request.includeHiddenBuilds;
        const centerKey = request.centerKey;
        const productKey = request.productKey;
        if (!centerKey || !productKey
            || (this.buildMap
                && this.buildMap.hasOwnProperty(centerKey + '-' + productKey + '-' + request.viewMode + '-' + includeHiddenBuilds))) {
            return;
        }
        this.buildLoadingMap[centerKey + '-' + productKey] = true;
        if (request.viewMode === 'PUBLISHED') {
            this.buildService.getPublishedBuilds(centerKey, productKey).subscribe(
                response => {
                    response.sort((a, b) => new Date(b['id']).getTime() - new Date(a['id']).getTime());
                    this.buildMap[centerKey + '-' + productKey + '-' + request.viewMode + '-' + includeHiddenBuilds] = response;
                    this.buildLoadingMap[centerKey + '-' + productKey] = false;
                }
            );
        } else {
            this.buildService.getBuilds(centerKey, productKey, false, false, request.viewMode, includeHiddenBuilds ? null : true).subscribe(
                response => {
                    response['content'].sort((a, b) => new Date(b['id']).getTime() - new Date(a['id']).getTime());
                    this.buildMap[centerKey + '-' + productKey + '-' + request.viewMode + '-' + includeHiddenBuilds] = response['content'];
                    this.buildLoadingMap[centerKey + '-' + productKey] = false;
                }
            );
        }

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
            },
            error => {
                if (error.status === 404) {
                    // A fallback to production published releases
                    this.buildService.getPublishedBuilds(centerKey, productKey).subscribe(
                        response => {
                            if (response && response.length !== 0) {
                                const foundBuilds = response.filter(item => item.id === leftBuildId);
                                if (foundBuilds.length !== 0) {
                                    this.leftBuild = foundBuilds[0];
                                    for (const prop in this.leftBuild) {
                                        if (prop.endsWith('url')) {
                                            this.leftBuild[prop] = this.leftBuild[prop].replace('dev-', '').replace('uat-', '');
                                        }
                                    }
                                }
                            }
                        }
                    );
                }
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
                        const centerKey = response.releaseCenterKey;
                        const productKey = response.productKey;
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
           return obj;
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
                        if (response['status'] !== 'FAILED' && response['status'] !== 'PASSED'
                            && response['status'] !== 'FAILED_TO_COMPARE' && response['status'] !== 'COMPLETED') {
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

    deleteReport(centerKey, productKey, compareId) {
        this.message = '';
        this.regressionTestService.deleteTestReport(centerKey, productKey, compareId).subscribe(
            () => {
                this.closeDeleteComfirmationModel();
                this.message = 'The report ' + compareId + ' has been deleted successfully.';
                this.openSuccessModel();
                this.reportPaginator.firstPage();
                this.loadTestReports();
            },
            errorResponse => {
                this.message = errorResponse.error.errorMessage;
                this.closeDeleteComfirmationModel();
                this.openErrorModel();
            }
        );
    }

    isReportRunningOutOfTime(report) {
        if (report) {
            const now = Date.now();
            const startTime = new Date(report['startDate']).getTime();

            return (now - startTime) > 14400000; // exceed 4 hours
        }
        return false;
    }

    missingFieldsCheck(testRequest: TestRequest): Object[] {
        const missingFields = [];
        if (!testRequest.buildId) { missingFields.push('Build ID'); }
        if (!testRequest.productKey) { missingFields.push('Product ID'); }
        if (!testRequest.centerKey) { missingFields.push('Center ID'); }

        return missingFields;
    }

    getValidationComparisonItems(details) {
        const json = JSON.parse(details);
        return json && json['comparisonItems'] ? json['comparisonItems'] : [];
    }

    getNewAssertions(details) {
        const json = JSON.parse(details);
        return json && json['newAssertions'] ? json['newAssertions'] : [];
    }

    getRemovedAssertions(details) {
        const json = JSON.parse(details);
        return json && json['removedAssertions'] ? json['removedAssertions'] : [];
    }

    getChangedAssertions(details) {
        const json = JSON.parse(details);
        return json && json['changedAssertions'] ? json['changedAssertions'] : [];
    }

    openURL(url) {
        window.open(url, '_blank');
    }

    refreshPaginatedTestReports() {
        if (this.reportPaginator) {
            this.reportPaginator.firstPage();
        }
    }

    handlePageChange(event) {
        if (event.pageSize !== this.pageSize) {
            this.pageSize = event.pageSize;
            this.reportPaginator.firstPage();
        }
        this.filterTestReports();
    }

    filterTestReports() {
        let pageIndex = 0;
        if (this.reportPaginator) {
            pageIndex = this.reportPaginator.pageIndex;
        }
        this.filteredTestReports = this.filterTestReportsByPage(this.allTestReports, this.pageSize, pageIndex);
    }

    filterTestReportsByPage(testReports: any[], pageSize: number, pageIndex: number): any[] {
        const startIndex = pageIndex * pageSize;
        const endIndex = startIndex + pageSize;
        return testReports.slice(startIndex, endIndex);
    }

    private startPolling() {
        this.interval = setInterval(() => {
            this.filteredTestReports.forEach(report => {
                if (report['status'] !== 'PASSED' && report['status'] !== 'FAILED' && report['status'] !== 'FAILED_TO_COMPARE') {
                    this.regressionTestService.getTestReport(report['centerKey'], report['productKey'], report['compareId']).subscribe(
                        response => {
                            for (let i = 0; i < this.filteredTestReports.length; i++) {
                                if (this.filteredTestReports[i]['compareId'] === response['compareId']) {
                                    this.filteredTestReports[i] = response;
                                    break;
                                }
                            }
                            for (let i = 0; i < this.allTestReports.length; i++) {
                                if (this.allTestReports[i]['compareId'] === response['compareId']) {
                                    this.allTestReports[i] = response;
                                    break;
                                }
                            }
                        }
                    );
                }
            });
        }, 120000);
    }

    openPublishingBuildConfirmationModal(report: Object) {
        this.selectedBuildToPublish = this.clonedBuildMap[report['rightBuildId']];
        this.openModal('publish-danger-modal');

    }

    canPublishBuild(report: Object) {
        const centerKey = report['centerKey'];
        const rightBuildId = report['rightBuildId'];
        const releaseCenter = this.releaseCenters.find(item => item.id === centerKey);
        const build = this.clonedBuildMap[rightBuildId];
        return (build && (build.status === 'BUILT' || build.status === 'RELEASE_COMPLETE' || build.status === 'RELEASE_COMPLETE_WITH_WARNINGS'))
                && this.roles && releaseCenter && releaseCenter.codeSystem
                && ((this.roles.hasOwnProperty('GLOBAL') && (
                        (<Array<String>> this.roles['GLOBAL']).indexOf('RELEASE_ADMIN') !== -1
                        || (<Array<String>> this.roles['GLOBAL']).indexOf('RELEASE_MANAGER') !== -1
                        )
                    )
                    ||
                    (this.roles.hasOwnProperty(releaseCenter.codeSystem) && (
                            (<Array<String>> this.roles[releaseCenter.codeSystem]).indexOf('RELEASE_ADMIN') !== -1
                        ||  (<Array<String>> this.roles[releaseCenter.codeSystem]).indexOf('RELEASE_MANAGER') !== -1
                        )
                    ));
    }

    isBuildPublishing(buildId: string) {
        return this.publishingBuilds.indexOf(buildId) !== -1;
    }

    isBuildPublished(buildId: string) {
        return this.clonedBuildMap[buildId] && this.clonedBuildMap[buildId].tags && this.clonedBuildMap[buildId].tags.indexOf('PUBLISHED') !== -1;
    }

    publishBuild(build: Build) {
        this.closeModal('publish-danger-modal');
        this.openWaitingModel('Publishing Build');
        this.publishingBuilds.push(build.id);
        this.buildService.publishBuild(build.releaseCenterKey, build.productKey, build.id).subscribe(
            () => {
                const interval = setInterval(() => {
                    this.buildService.getPublishingBuildStatus(build.releaseCenterKey, build.productKey, build.id).subscribe(
                        status => {
                            if (status) {
                                if (status['status'] === 'COMPLETED') {
                                    this.buildService.getBuild(build.releaseCenterKey, build.productKey, build.id, false, false).subscribe(response => {
                                        build.tags = response.tags;
                                        this.publishingBuilds = this.publishingBuilds.filter(item => item !== build.id);
                                        this.closeWaitingModel();
                                        if (status['message']) {
                                            this.message = status['message'];
                                            this.message += '.\nPlease contact technical support to get help resolving this.';
                                            this.openErrorModel();
                                        } else {
                                            this.message = 'The build has been published successfully.';
                                            this.openSuccessModel();
                                        }
                                    });
                                    clearInterval(interval);
                                } else if (status['status'] === 'FAILED') {
                                    this.publishingBuilds = this.publishingBuilds.filter(item => item !== build.id);
                                    this.message = status['message'];
                                    this.closeWaitingModel();
                                    this.openErrorModel();
                                    clearInterval(interval);
                                } else {
                                    // do nothing
                                }
                            }
                        },
                        errorResponse => {
                            if (errorResponse.status === 404) {
                                this.publishingBuilds = this.publishingBuilds.filter(item => item !== build.id);
                                this.buildService.getBuild(build.releaseCenterKey, build.productKey, build.id, false, false).subscribe(response => {
                                    build.tags = response.tags;
                                    this.closeWaitingModel();
                                });
                            } else {
                                this.publishingBuilds = this.publishingBuilds.filter(item => item !== build.id);
                                this.message = errorResponse.error.errorMessage;
                                this.closeWaitingModel();
                                this.openErrorModel();
                            }
                            clearInterval(interval);
                        }
                    );
                }, 10000);
            }
        );
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

    private closeDeleteComfirmationModel () {
        this.closeModal('delete-confirmation-modal');
    }
}
