export const DEFAULT_FONT_NAME = 'Times New Roman';
export const DEFAULT_FONT_SIZE = 14;

export const DEFAULT_BORDER_STYLE = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' },
} as const;

export const CENTER_ALIGNMENT = {
    vertical: 'middle',
    horizontal: 'center',
} as const;

export const LEFT_ALIGNMENT = {
    vertical: 'middle',
    horizontal: 'left',
} as const;
export const SOLID_FILL_PATTERN = {
    type: 'pattern',
    pattern: 'solid',
} as const;

export const SUMMARY_FILL_PATTERN = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFFF00' },
} as const;

export const BOLD_FONT = {
    name: DEFAULT_FONT_NAME,
    size: DEFAULT_FONT_SIZE,
    bold: true,
};
export const DEFAULT_TITLE_FONT = {
    name: DEFAULT_FONT_NAME,
    size: DEFAULT_FONT_SIZE,
    bold: true,
};

export const DEFAULT_TITLE_SHEET_FONT = {
    name: DEFAULT_FONT_NAME,
    size: DEFAULT_FONT_SIZE,
    bold: true,
};

export const MAX_COLUMN_WIDTH = 50;
