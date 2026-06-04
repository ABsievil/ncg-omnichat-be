import * as ExcelJS from 'exceljs';
import {
    BOLD_FONT,
    CENTER_ALIGNMENT,
    DEFAULT_BORDER_STYLE,
    DEFAULT_FONT_NAME,
    DEFAULT_FONT_SIZE,
    DEFAULT_TITLE_FONT,
    LEFT_ALIGNMENT,
    MAX_COLUMN_WIDTH,
    SOLID_FILL_PATTERN,
    SUMMARY_FILL_PATTERN,
} from 'src/common/file/constants/excel-bulder.constants';

export class ExcelBuilder {
    private workbook: ExcelJS.Workbook;
    private sheets: Record<string, ExcelJS.Worksheet> = {};

    constructor() {
        this.workbook = new ExcelJS.Workbook();
    }

    /**
     * @description Hàm tạo worksheet mới cho workbook
     */
    addWorksheet(name: string, headers?: string[]): this {
        const sheet = this.workbook.addWorksheet(name);

        if (headers) {
            const headerRow = sheet.addRow(headers);
            this.applyRowStyles(headerRow, {
                font: BOLD_FONT,
                alignment: CENTER_ALIGNMENT,
                border: DEFAULT_BORDER_STYLE,
            });
        }

        this.sheets[name] = sheet;
        return this;
    }

    /**
     * @description Hàm add row cho sheet
     */
    addRow<T>(
        sheetName: string,
        row: T[],
        styles?: Parameters<typeof this.applyRowStyles>[1]
    ): this {
        const sheet = this.sheets[sheetName];
        if (!sheet) throw new Error(`Sheet ${sheetName} not found`);
        const addedRow = sheet.addRow(row);

        const defaultStyles = styles || { border: DEFAULT_BORDER_STYLE };
        this.applyRowStyles(addedRow, defaultStyles);

        return this;
    }

    /**
     * @description Hàm add row space cho sheet
     */
    addRowSpace(
        sheetName: string,
        count: number = 1,
        styles?: Parameters<typeof this.applyRowStyles>[1],
        row: number = 1
    ): this {
        const sheet = this.sheets[sheetName];
        if (!sheet) throw new Error(`Sheet ${sheetName} not found`);

        const rowsToInsert = Array.from({ length: count }, () => []);
        sheet.spliceRows(row, 0, ...rowsToInsert);

        if (styles) {
            for (let i = 0; i < count; i++) {
                this.applyRowStyles(sheet.getRow(row + i), styles);
            }
        }

        return this;
    }

    /**
     * @description Hàm add title cho sheet
     */
    addTitle(
        sheetName: string,
        title: string,
        value: string,
        merge = true,
        font = DEFAULT_TITLE_FONT
    ): this {
        const sheet = this.sheets[sheetName];
        if (!sheet) throw new Error(`Sheet ${sheetName} not found`);

        sheet.spliceRows(1, 0, []);

        sheet.getCell(1, 1).value = {
            richText: [
                { text: `${title}: `, font: { ...font, bold: true } },
                { text: value, font: { ...font, bold: false } },
            ],
        };

        const titleRow = sheet.getRow(1);
        titleRow.alignment = LEFT_ALIGNMENT;

        if (merge) {
            const lastCol = sheet.columns.length || 5;
            sheet.mergeCells(1, 1, 1, lastCol);
        }

        return this;
    }

    /**
     * @description Hàm add summary cho sheet
     */
    addSummary(sheetName: string, summaryText: string): this {
        const sheet = this.sheets[sheetName];
        if (!sheet) throw new Error(`Sheet ${sheetName} not found`);

        const summaryRow = sheet.addRow([summaryText]);

        const lastCol = sheet.columns.length || 5;

        sheet.mergeCells(summaryRow.number, 1, summaryRow.number, lastCol);

        const mergedCell = sheet.getCell(summaryRow.number, 1);
        mergedCell.font = BOLD_FONT;
        mergedCell.alignment = LEFT_ALIGNMENT;
        mergedCell.fill = SUMMARY_FILL_PATTERN;
        mergedCell.border = DEFAULT_BORDER_STYLE;

        return this;
    }

    /**
     * @description Hàm apply border cho row
     */
    private applyBorderToRow(
        row: ExcelJS.Row,
        borderStyle = DEFAULT_BORDER_STYLE
    ): void {
        row.eachCell(cell => {
            cell.border = borderStyle;
        });
    }

    /**
     * @description Hàm apply alignment cho row
     */
    private applyCellAlignment(
        row: ExcelJS.Row,
        alignment = CENTER_ALIGNMENT
    ): void {
        row.eachCell(cell => {
            cell.alignment = alignment;
        });
    }

    /**
     * @description Hàm apply fill cho row
     */
    private applyCellFill(
        row: ExcelJS.Row,
        fillPattern = SOLID_FILL_PATTERN
    ): void {
        row.eachCell(cell => {
            cell.fill = fillPattern;
        });
    }

    /**
     * @description Hàm apply font cho row
     */
    private applyRowFont(row: ExcelJS.Row, font: Partial<ExcelJS.Font>): void {
        row.eachCell(cell => {
            cell.font = { ...cell.font, ...font };
        });
    }

    /**
     * @description Hàm apply styles cho row
     */
    private applyRowStyles(
        row: ExcelJS.Row,
        options: {
            border?: typeof DEFAULT_BORDER_STYLE;
            alignment?: typeof CENTER_ALIGNMENT;
            fill?: typeof SOLID_FILL_PATTERN;
            font?: Partial<ExcelJS.Font>;
        } = {}
    ): void {
        const { border, alignment, fill, font } = options;

        if (border) this.applyBorderToRow(row, border);
        if (alignment) this.applyCellAlignment(row, alignment);
        if (fill) this.applyCellFill(row, fill);
        if (font) this.applyRowFont(row, font);
    }

    /**
     * @description Hàm set default font cho workbook
     */
    setWorkbookDefaultFont(
        font = { name: DEFAULT_FONT_NAME, size: DEFAULT_FONT_SIZE },
        autoFit = true
    ): this {
        Object.values(this.sheets).forEach(sheet => {
            sheet.eachRow(row => {
                row.eachCell(cell => {
                    if (!cell.font) {
                        cell.font = font;
                    }
                });
            });

            if (autoFit) {
                sheet.columns.forEach(col => {
                    let maxLength = 10;
                    col.eachCell({ includeEmpty: true }, cell => {
                        if (
                            cell.fill &&
                            (cell.fill as any).fgColor?.argb ===
                                (SUMMARY_FILL_PATTERN.fgColor as any)?.argb
                        ) {
                            return;
                        }

                        const len = cell.value
                            ? cell.value.toString().length
                            : 0;
                        if (len > maxLength) maxLength = len;
                    });
                    col.width = Math.min(maxLength + 5, MAX_COLUMN_WIDTH);
                });
            }
        });

        return this;
    }

    addTitleSheet(
        sheetName: string,
        title: string,
        row: number,
        column: number,
        merge: boolean = true,
        font = DEFAULT_TITLE_FONT
    ): this {
        const sheet = this.sheets[sheetName];
        if (!sheet) throw new Error(`Sheet ${sheetName} not found`);

        sheet.spliceRows(row, 0, [[]]);

        const cell = sheet.getCell(row, 1);
        cell.value = {
            richText: [{ text: `${title} `, font: { ...font, bold: true } }],
        };
        cell.border = {};
        cell.alignment = CENTER_ALIGNMENT;

        if (merge) {
            const lastCol = sheet.columns.length || column;
            sheet.mergeCells(row, 1, row, lastCol);
        }

        return this;
    }

    /**
     * @description Hàm build workbook
     */
    build(): ExcelJS.Workbook {
        return this.workbook;
    }

    /**
     * @description Hàm build buffer
     */
    async buildBuffer(): Promise<Buffer> {
        return Buffer.from(await this.workbook.xlsx.writeBuffer());
    }
}
