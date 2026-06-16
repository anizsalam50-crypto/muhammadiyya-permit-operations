import ExcelJS from "exceljs";
import type { Permit, Prisma } from "@prisma/client";
import { FORMULA_CATALOG } from "@/lib/formula-catalog";
import { calculatePermit, normalizeStatus } from "@/lib/calculations";
import { FIRST_DATA_ROW, HEADER_ROW, WORKBOOK_COLUMNS, WORKBOOK_SHEET_NAME } from "@/lib/workbook-columns";

type ParsedPermit = Omit<Prisma.PermitCreateInput, "rawData" | "formulas"> & {
  rawData: string;
  formulas: string;
};

const columnLookup = new Map(WORKBOOK_COLUMNS.map((column) => [column.excel, column]));

function serialToDate(value: number) {
  const excelEpoch = Date.UTC(1899, 11, 30);
  return new Date(excelEpoch + value * 24 * 60 * 60 * 1000);
}

function cellText(cell: ExcelJS.Cell) {
  const value = cell.value;

  if (value === null || value === undefined) return null;

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "object") {

    if ("result" in value) {
      return String(value.result ?? "");
    }

    if ("formula" in value) {
      return String(value.result ?? "");
    }

    if ("hyperlink" in value) {
      return String(value.text ?? value.hyperlink ?? "");
    }

    if ("richText" in value) {
      return value.richText.map(part => part.text).join("");
    }

    if ("text" in value) {
      return String(value.text ?? "");
    }
  }

  return String(value).trim();
}

function cellNumber(cell: ExcelJS.Cell) {
  const value = cell.value;
  const concrete = typeof value === "object" && value && "result" in value ? value.result : value;
  if (typeof concrete === "number" && Number.isFinite(concrete)) return concrete;
  const parsed = Number(String(concrete ?? "").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDateText(value: string) {
  const text = value.trim();
  const direct = new Date(text);
  if (!Number.isNaN(direct.getTime()) && /^\d{4}[-/]/.test(text)) return direct;

  const match = text.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
  if (!match) return Number.isNaN(direct.getTime()) ? null : direct;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3].length === 2 ? `20${match[3]}` : match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function cellDate(cell: ExcelJS.Cell) {
  const value = cell.value;
  const concrete = typeof value === "object" && value && "result" in value ? value.result : value;
  if (concrete instanceof Date) return concrete;
  if (typeof concrete === "number" && Number.isFinite(concrete)) return serialToDate(concrete);
  if (typeof concrete === "string" && concrete.trim()) {
    const parsed = parseDateText(concrete);
    if (parsed) return parsed;
  }
  return null;
}

function cellFormula(cell: ExcelJS.Cell) {
  const value = cell.value;
  if (typeof value === "object" && value && "formula" in value) return value.formula ? `=${value.formula}` : null;
  if (typeof value === "string" && value.startsWith("=")) return value;
  return null;
}

function cellHyperlink(cell: ExcelJS.Cell) {
  const value = cell.value;
  if (typeof cell.hyperlink === "string" && cell.hyperlink.trim()) return cell.hyperlink.trim();
  if (typeof value === "object" && value && "hyperlink" in value && typeof value.hyperlink === "string") {
    return value.hyperlink.trim();
  }
  return null;
}

function getCell(row: ExcelJS.Row, column: string) {
  return row.getCell(column);
}

function hasPermitIdentity(row: ExcelJS.Row) {
  return ["R", "Z", "AA", "S", "Y", "P", "Q"].some((column) => Boolean(cellText(getCell(row, column))));
}

export async function parsePermitWorkbook(buffer: ArrayBuffer, fileName: string) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.getWorksheet(WORKBOOK_SHEET_NAME) ?? workbook.worksheets[0];
  if (!worksheet) {
    throw new Error("No worksheet found in the uploaded workbook.");
  }

  const permits: ParsedPermit[] = [];
  const calculatedColumns = new Map<string, number>();

  for (let rowNumber = FIRST_DATA_ROW; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    if (!hasPermitIdentity(row)) continue;

    const rawData: Record<string, unknown> = {};
    const formulas: Record<string, string> = {};

    for (const [excelColumn, column] of columnLookup.entries()) {
      const cell = getCell(row, excelColumn);
      rawData[column.key] = cellText(cell);
      const formula = cellFormula(cell);
      if (formula) {
        formulas[column.excel] = formula;
        calculatedColumns.set(column.excel, (calculatedColumns.get(column.excel) ?? 0) + 1);
      }
    }

    const eValue = cellText(getCell(row, "E"));
console.log("COLUMN E VALUE =", eValue);
    permits.push({
      sourceSheet: worksheet.name,
      sourceRow: rowNumber,
      workType: cellText(getCell(row, "B")),
      statusMuroorTasriya: cellText(getCell(row, "C")),
      statusNormalized: normalizeStatus(cellText(getCell(row, "C"))),
      muroorPermitNo: cellText(getCell(row, "D")),
      muroorStatusRemainingDate: eValue,
      muroorStart: cellDate(getCell(row, "K")),
      muroorEnd: cellDate(getCell(row, "J")),
      statusRemainLength: cellText(getCell(row, "L")),
      workStartDate: cellDate(getCell(row, "Q")),
      workEndDate: cellDate(getCell(row, "P")),
      permitNumberUsed: cellText(getCell(row, "R")),
      contractorName: cellText(getCell(row, "S")),
      lengthMeters: cellNumber(getCell(row, "T")),
      demolitionVolume: cellText(getCell(row, "U")),
      lineNumber: cellText(getCell(row, "V")),
      notes: cellText(getCell(row, "W")),
      extensionNumber: cellText(getCell(row, "X")),
      streetName: cellText(getCell(row, "Y")),
      permitNumber: cellText(getCell(row, "Z")),
      permitLink: cellHyperlink(getCell(row, "Z")),
      requestNumber: cellText(getCell(row, "AA")),
      sector: cellText(getCell(row, "AB")),
      lineName: cellText(getCell(row, "AC")),
      districtName: cellText(getCell(row, "AD")),
      serialNumber: Math.trunc(cellNumber(getCell(row, "AF")) ?? permits.length + 1),
      contractNumber: cellText(getCell(row, "AG")),
      rawData: JSON.stringify(rawData),
      formulas: JSON.stringify(formulas)
    });
  }

  const formulaSummary = {
    fileName,
    sheetName: worksheet.name,
    headerRow: HEADER_ROW,
    firstDataRow: FIRST_DATA_ROW,
    calculatedColumns: Array.from(calculatedColumns.entries()).map(([column, count]) => ({ column, count })),
    formulaCatalog: FORMULA_CATALOG
  };

  return { sheetName: worksheet.name, permits, formulaSummary };
}

export async function buildPermitExport(permits: Permit[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "MUHAMMADIYYA Permit Operations";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(WORKBOOK_SHEET_NAME, {
    views: [{ state: "frozen", ySplit: HEADER_ROW }]
  });

  worksheet.getCell("C1").value = "PERMITS UPDATED";
  worksheet.getCell("K1").value = { formula: "TODAY()" };
  worksheet.getCell("P1").value = "MUHAMMADIYYA Permit Operations";

  for (const column of WORKBOOK_COLUMNS) {
    const cell = worksheet.getCell(`${column.excel}${HEADER_ROW}`);
    cell.value = column.header ?? column.label;
    cell.font = { bold: true, color: { argb: "FF172033" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  }
  worksheet.getCell(`AV${HEADER_ROW}`).value = "Permit Link";
  worksheet.getCell(`AW${HEADER_ROW}`).value = "Expiry Status";
  worksheet.getCell(`AX${HEADER_ROW}`).value = "Remaining Days";
  ["AV", "AW", "AX"].forEach((column) => {
    const cell = worksheet.getCell(`${column}${HEADER_ROW}`);
    cell.font = { bold: true, color: { argb: "FF172033" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  });

  permits.forEach((permit, index) => {
    const rowNumber = FIRST_DATA_ROW + index;
    const row = worksheet.getRow(rowNumber);
    const calculated = calculatePermit(permit);

    row.getCell("B").value = permit.workType;
    row.getCell("C").value = permit.statusMuroorTasriya;
    row.getCell("D").value = permit.muroorPermitNo;
    row.getCell("E").value = { formula: `IFERROR(G${rowNumber}-F${rowNumber},"")`, result: calculated.calculations.muroorRemainingDays ?? undefined };
    row.getCell("F").value = { formula: `TODAY()-K${rowNumber}`, result: calculated.calculations.muroorElapsedDays ?? undefined };
    row.getCell("G").value = { formula: `J${rowNumber}-K${rowNumber}`, result: calculated.calculations.muroorPermitDays ?? undefined };
    row.getCell("H").value = { formula: `VLOOKUP(J${rowNumber},'[1]Hijri-Gregorian-Solar_Hijri-V3'!$L:$M,2,FALSE)` };
    row.getCell("I").value = { formula: `VLOOKUP(K${rowNumber},'[1]Hijri-Gregorian-Solar_Hijri-V3'!$L:$M,2,FALSE)` };
    row.getCell("J").value = permit.muroorEnd;
    row.getCell("K").value = permit.muroorStart;
    row.getCell("L").value = permit.statusRemainLength;
    row.getCell("M").value = { formula: `O${rowNumber}-N${rowNumber}`, result: calculated.calculations.remainingDays ?? undefined };
    row.getCell("N").value = { formula: `TODAY()-Q${rowNumber}`, result: calculated.calculations.expiredDays ?? undefined };
    row.getCell("O").value = { formula: `P${rowNumber}-Q${rowNumber}`, result: calculated.calculations.permitDays ?? undefined };
    row.getCell("P").value = permit.workEndDate;
    row.getCell("Q").value = permit.workStartDate;
    row.getCell("R").value = permit.permitNumberUsed;
    row.getCell("S").value = permit.contractorName;
    row.getCell("T").value = permit.lengthMeters;
    row.getCell("U").value = permit.demolitionVolume;
    row.getCell("V").value = permit.lineNumber;
    row.getCell("W").value = permit.notes;
    row.getCell("X").value = permit.extensionNumber;
    row.getCell("Y").value = permit.streetName;
    row.getCell("Z").value = permit.permitLink
      ? { text: permit.permitNumber ?? permit.permitLink, hyperlink: permit.permitLink }
      : permit.permitNumber;
    row.getCell("AA").value = permit.requestNumber;
    row.getCell("AB").value = permit.sector;
    row.getCell("AC").value = permit.lineName;
    row.getCell("AD").value = permit.districtName;
    row.getCell("AF").value = permit.serialNumber ?? index + 1;
    row.getCell("AG").value = permit.contractNumber;
    row.getCell("AQ").value = { formula: `Q${rowNumber}`, result: permit.workStartDate ?? undefined };
    row.getCell("AR").value = { formula: `P${rowNumber}`, result: permit.workEndDate ?? undefined };
    row.getCell("AS").value = { formula: `T${rowNumber}`, result: permit.lengthMeters ?? undefined };
    row.getCell("AT").value = { formula: `Y${rowNumber}`, result: permit.streetName ?? undefined };
    row.getCell("AU").value = { formula: `V${rowNumber}`, result: permit.lineNumber ?? undefined };
    row.getCell("AV").value = permit.permitLink;
    row.getCell("AW").value = calculated.calculations.alertText;
    row.getCell("AX").value = calculated.calculations.remainingDays;
  });

  worksheet.columns.forEach((column) => {
    column.width = 16;
  });
  worksheet.getColumn("S").width = 24;
  worksheet.getColumn("Y").width = 28;
  worksheet.getColumn("W").width = 34;
  worksheet.getColumn("C").width = 22;
  worksheet.getColumn("AV").width = 42;
  worksheet.getColumn("AW").width = 20;
  worksheet.getColumn("AX").width = 16;
  worksheet.autoFilter = `B${HEADER_ROW}:AX${Math.max(HEADER_ROW, FIRST_DATA_ROW + permits.length - 1)}`;

  return workbook.xlsx.writeBuffer();
}
