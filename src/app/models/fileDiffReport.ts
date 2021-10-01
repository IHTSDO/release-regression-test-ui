import { DiffRow } from './diffRow';

export class FileDiffReport {
    fileName: string;
    leftBuildId: string;
    rightBuildId: string;
    status: string;
    diffRows: DiffRow[];
}
