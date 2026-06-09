export const WORKBOOK_SHEET_NAME = "SHATEE PERMIT";
export const HEADER_ROW = 5;
export const FIRST_DATA_ROW = 6;

export const WORKBOOK_COLUMNS = [
  { key: "workType", excel: "B", header: null, label: "Work type" },
  { key: "statusMuroorTasriya", excel: "C", header: "status muroor and tasriya", label: "Status" },
  { key: "muroorPermitNo", excel: "D", header: "Muroor Permit No:", label: "Muroor permit no." },
  { key: "muroorStatusRemainingDate", excel: "E", header: "Muroor Status (Remaining Date)", label: "Muroor remaining status", calculated: true },
  { key: "muroorElapsedDays", excel: "F", header: null, label: "Muroor elapsed days", calculated: true },
  { key: "muroorPermitDays", excel: "G", header: "Remaining", label: "Muroor permit days", calculated: true },
  { key: "muroorGregorianEnd", excel: "H", header: "GEORGIAN END", label: "Muroor Gregorian end", calculated: true },
  { key: "muroorGregorianStart", excel: "I", header: "GEORGIAN START", label: "Muroor Gregorian start", calculated: true },
  { key: "muroorEnd", excel: "J", header: "Muroor End", label: "Muroor end" },
  { key: "muroorStart", excel: "K", header: "Muroor start", label: "Muroor start" },
  { key: "statusRemainLength", excel: "L", header: "Status\nRemain Length", label: "Status remain length", calculated: true },
  { key: "remainingDays", excel: "M", header: "الأيام المتبقية", label: "Remaining days", calculated: true },
  { key: "expiredDays", excel: "N", header: "أيام منتهية", label: "Expired days", calculated: true },
  { key: "permitDays", excel: "O", header: "أيام التصريح", label: "Permit days", calculated: true },
  { key: "workEndDate", excel: "P", header: "تاريخ نهاية العمل", label: "Work end date" },
  { key: "workStartDate", excel: "Q", header: "تاريخ بداية العمل", label: "Work start date" },
  { key: "permitNumberUsed", excel: "R", header: "رقم التصريحused ", label: "Used permit no." },
  { key: "contractorName", excel: "S", header: "اسم المقاول", label: "Contractor" },
  { key: "lengthMeters", excel: "T", header: "الطول-متر", label: "Length (m)" },
  { key: "demolitionVolume", excel: "U", header: "الدمرات m3 طن", label: "Demolition m3/ton" },
  { key: "lineNumber", excel: "V", header: "LINE NUMBER", label: "Line number" },
  { key: "notes", excel: "W", header: "ملاحظات", label: "Notes" },
  { key: "extensionNumber", excel: "X", header: "رقم تمديد", label: "Extension no." },
  { key: "streetName", excel: "Y", header: "STREET NAME", label: "Street" },
  { key: "permitNumber", excel: "Z", header: "رقم التصريح", label: "Permit no." },
  { key: "requestNumber", excel: "AA", header: "رقم الطلب", label: "Request no." },
  { key: "sector", excel: "AB", header: "القطاع", label: "Sector" },
  { key: "lineName", excel: "AC", header: "اسم الخط", label: "Line name" },
  { key: "districtName", excel: "AD", header: "اسم الحي", label: "District" },
  { key: "serialNumber", excel: "AF", header: "م", label: "Serial no.", calculated: true },
  { key: "contractNumber", excel: "AG", header: "رقم العقد", label: "Contract no." },
  { key: "reportStartDate", excel: "AQ", header: null, label: "Report start date", calculated: true },
  { key: "reportEndDate", excel: "AR", header: null, label: "Report end date", calculated: true },
  { key: "reportLengthMeters", excel: "AS", header: null, label: "Report length", calculated: true },
  { key: "reportStreetName", excel: "AT", header: null, label: "Report street", calculated: true },
  { key: "reportLineNumber", excel: "AU", header: null, label: "Report line no.", calculated: true }
] as const;

export type WorkbookColumnKey = (typeof WORKBOOK_COLUMNS)[number]["key"];
