export enum ENUM_MIME_TYPE {
    // Text files
    TEXT_PLAIN = 'text/plain',
    TEXT_HTML = 'text/html',
    TEXT_CSS = 'text/css',
    TEXT_CSV = 'text/csv',
    APPLICATION_JSON = 'application/json',
    APPLICATION_XML = 'application/xml',

    // Image files
    IMAGE_JPEG = 'image/jpeg',
    IMAGE_PNG = 'image/png',
    IMAGE_GIF = 'image/gif',
    IMAGE_SVG = 'image/svg+xml',
    IMAGE_WEBP = 'image/webp',
    IMAGE_BMP = 'image/bmp',
    IMAGE_ICO = 'image/x-icon',

    // Document files
    APPLICATION_PDF = 'application/pdf',
    APPLICATION_MSWORD = 'application/msword', // .doc
    APPLICATION_DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    APPLICATION_EXCEL = 'application/vnd.ms-excel', // .xls
    APPLICATION_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    APPLICATION_POWERPOINT = 'application/vnd.ms-powerpoint', // .ppt
    APPLICATION_PPTX = 'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx

    // Archive files
    APPLICATION_ZIP = 'application/zip',
    APPLICATION_RAR = 'application/x-rar-compressed',
    APPLICATION_7Z = 'application/x-7z-compressed',
    APPLICATION_TAR = 'application/x-tar',
    APPLICATION_GZIP = 'application/gzip',

    // Audio files
    AUDIO_MP3 = 'audio/mpeg',
    AUDIO_WAV = 'audio/wav',
    AUDIO_OGG = 'audio/ogg',
    AUDIO_AAC = 'audio/aac',

    // Video files
    VIDEO_MP4 = 'video/mp4',
    VIDEO_AVI = 'video/x-msvideo',
    VIDEO_MOV = 'video/quicktime',
    VIDEO_WMV = 'video/x-ms-wmv',
    VIDEO_WEBM = 'video/webm',

    // Font files
    FONT_WOFF = 'font/woff',
    FONT_WOFF2 = 'font/woff2',
    FONT_TTF = 'font/ttf',
    FONT_OTF = 'font/otf',

    // Application files
    APPLICATION_JAVASCRIPT = 'application/javascript',
    APPLICATION_OCTET_STREAM = 'application/octet-stream', // Default binary
    APPLICATION_FORM_URLENCODED = 'application/x-www-form-urlencoded',
    MULTIPART_FORM_DATA = 'multipart/form-data',
}
