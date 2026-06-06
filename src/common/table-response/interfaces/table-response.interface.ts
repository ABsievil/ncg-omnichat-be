export interface ITableResponseColumn {
    name: string;
    bgColorMap?: Record<string, string>;
    textColorMap?: Record<string, string>;
    [key: string]: unknown;
}
