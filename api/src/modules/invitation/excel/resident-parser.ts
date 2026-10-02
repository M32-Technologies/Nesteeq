import ExcelJS from "exceljs";

type WorkbookBuffer = Parameters<ExcelJS.Xlsx["load"]>[0];

const HEADER_MAP = {
  "full name": "fullName",
  "email": "email",
  "phone number": "phoneNumber",
  "block": "block",
  "flat number": "flatNumber",
  "role": "role",
} as const;

type InviteField = (typeof HEADER_MAP)[keyof typeof HEADER_MAP];

const REQUIRED_FIELDS: InviteField[] = [
  "fullName",
  "email",
  "block",
  "flatNumber",
  "role",
];

export type ParsedInviteRow = {
  rowNumber: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  block: string;
  flatNumber: string;
  role: string;
};

const normalizeHeader = (header: string) =>
  header.trim().toLowerCase().replace(/\s+/g, " ");

const cellToString = (value: ExcelJS.CellValue): string => {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "object") {
    if ("text" in value && typeof value.text === "string") {
      return value.text.trim();
    }

    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText
        .map((item) => item.text)
        .join("")
        .trim();
    }

    return "";
  }

  return String(value).trim();
};

export const parseInviteWorkbook = async (
  buffer: Buffer
): Promise<ParsedInviteRow[]> => {
  const workbook = new ExcelJS.Workbook();

  await workbook.xlsx.load(buffer as unknown as WorkbookBuffer);

  const worksheet = workbook.getWorksheet("Residents");

  if (!worksheet) {
    throw new Error("Invalid template: Residents worksheet not found");
  }

  const headerRow = worksheet.getRow(1);

  const columnIndexToField = new Map<number, InviteField>();

  const foundFields = new Set<InviteField>();

  headerRow.eachCell({ includeEmpty: false }, (cell, columnNumber) => {
    const header = normalizeHeader(cellToString(cell.value));

    const mappedField = HEADER_MAP[header as keyof typeof HEADER_MAP];

    if (!mappedField) {
      return;
    }

    if (foundFields.has(mappedField)) {
      throw new Error(`Duplicate column found: ${cellToString(cell.value)}`);
    }

    foundFields.add(mappedField);
    columnIndexToField.set(columnNumber, mappedField);
  });

  const missingFields = REQUIRED_FIELDS.filter(
    (field) => !foundFields.has(field)
  );

  if (missingFields.length > 0) {
    throw new Error(
      `Invalid template. Missing required columns: ${missingFields.join(", ")}`
    );
  }

  const rows: ParsedInviteRow[] = [];

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }

    const parsedRow: ParsedInviteRow = {
      rowNumber,
      fullName: "",
      email: "",
      phoneNumber: "",
      block: "",
      flatNumber: "",
      role: "",
    };

    let hasAnyValue = false;

    columnIndexToField.forEach((field, columnNumber) => {
      const value = cellToString(row.getCell(columnNumber).value);

      parsedRow[field] = value;

      if (value) {
        hasAnyValue = true;
      }
    });

    if (hasAnyValue) {
      rows.push(parsedRow);
    }
  });

  return rows;
};
