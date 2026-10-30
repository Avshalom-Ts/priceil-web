import { AdminApiError } from "./api";
import type { AdminCell, AdminColumn, AdminRow, AdminTable } from "./api";

export type AdminDraft = Record<string, string | boolean | null>;
export const tableLabels: Record<string, string> = {
  chains: "רשתות",
  stores: "סניפים",
  products: "מוצרים",
  product_groups: "קבוצות מוצרים",
  prices: "מחירים",
};
const fieldLabels: Record<string, string> = {
  id: "מזהה",
  chainId: "מזהה רשת",
  chainName: "שם רשת",
  subchainId: "מזהה תת־רשת",
  storeId: "מזהה סניף",
  subchainName: "שם תת־רשת",
  storeName: "שם סניף",
  storeType: "סוג סניף",
  address: "כתובת",
  city: "עיר",
  zipcode: "מיקוד",
  bikoretNo: "מספר ביקורת",
  lastUpdateDate: "תאריך עדכון מקור",
  latitude: "קו רוחב",
  longitude: "קו אורך",
  itemCode: "ברקוד",
  itemName: "שם מוצר",
  itemType: "סוג מוצר",
  manufacturerName: "שם יצרן",
  manufactureCountry: "ארץ ייצור",
  manufacturerDescription: "תיאור יצרן",
  unitQty: "יחידת כמות",
  quantity: "כמות",
  isWeighted: "מוצר שקיל",
  unitOfMeasure: "יחידת מידה",
  qtyInPackage: "כמות באריזה",
  groupId: "מזהה קבוצה",
  normalizedName: "שם מנורמל",
  name: "שם הקבוצה",
  price: "מחיר",
  unitOfMeasurePrice: "מחיר ליחידת מידה",
  allowDiscount: "מאפשר הנחה",
  itemStatus: "סטטוס מוצר",
  priceUpdateDate: "תאריך מחיר במקור",
  updatedAt: "עודכן במערכת",
};
const reasons: Record<string, string> = {
  "Primary key": "מזהה הרשומה",
  "Relationship key": "קישור לרשומה אחרת",
  "Server managed": "מנוהל על ידי השרת",
  "Derived identity": "ערך מחושב",
  "Source timestamp": "תאריך שמתקבל מהייבוא",
};
export const columnLabel = (column: AdminColumn) =>
  fieldLabels[column.key] ?? column.label;
export const readOnlyReason = (column: AdminColumn) =>
  reasons[column.readOnlyReason ?? ""] ??
  column.readOnlyReason ??
  "לצפייה בלבד";
export function displayCell(value: AdminCell | undefined): string {
  if (value === null) return "ללא ערך (NULL)";
  if (value === undefined) return "—";
  if (value === "") return "טקסט ריק";
  if (typeof value === "boolean") return value ? "כן" : "לא";
  return String(value);
}
export function createDraft(table: AdminTable, row: AdminRow): AdminDraft {
  return Object.fromEntries(
    table.columns
      .filter((column) => column.editable)
      .map((column) => {
        const value = row[column.key];
        return [
          column.key,
          value === null || typeof value === "boolean"
            ? value
            : String(value ?? ""),
        ];
      }),
  );
}
export function draftChanges(
  table: AdminTable,
  original: AdminRow,
  draft: AdminDraft,
) {
  const baseline = createDraft(table, original);
  const errors: Record<string, string> = {};
  const changes: AdminRow = {};
  let dirty = false;
  for (const column of table.columns.filter((column) => column.editable)) {
    const value = draft[column.key];
    if (value === baseline[column.key]) continue;
    dirty = true;
    let parsed: AdminCell = value;
    if (value === null) {
      if (!column.nullable) errors[column.key] = "השדה אינו יכול להיות ללא ערך";
    } else if (column.type === "boolean") {
      if (typeof value !== "boolean") errors[column.key] = "יש לבחור כן או לא";
    } else if (typeof value !== "string") errors[column.key] = "ערך לא תקין";
    else if (column.type === "text") {
      if (
        value.includes("\0") ||
        [...value].length > (column.maxLength ?? 10000)
      )
        errors[column.key] = "הטקסט ארוך מדי או מכיל תווים לא תקינים";
      else if (!column.nullable && !value.trim())
        errors[column.key] = "השדה אינו יכול להיות ריק";
    } else if (column.type === "integer") {
      parsed = Number(value);
      if (
        !/^-?\d+$/.test(value) ||
        !Number.isSafeInteger(parsed) ||
        parsed < (column.minimum ?? -2147483648) ||
        parsed > (column.maximum ?? 2147483647)
      )
        errors[column.key] = "יש להזין מספר שלם בטווח המותר";
    } else if (column.type === "decimal") {
      if (!/^-?\d+(?:\.\d+)?$/.test(value) || value.length > 64)
        errors[column.key] = "יש להזין מספר עשרוני, למשל 12.30";
      else {
        const [whole, fraction = ""] = value.replace(/^-/, "").split(".");
        if (
          whole.replace(/^0+/, "").length >
            (column.precision ?? 10) - (column.scale ?? 0) ||
          fraction.length > (column.scale ?? 0)
        )
          errors[column.key] =
            `מותרות עד ${column.precision ?? 10} ספרות בסך הכול ו־${column.scale ?? 0} אחרי הנקודה`;
        else if (
          (column.minimum !== undefined && Number(value) < column.minimum) ||
          (column.maximum !== undefined && Number(value) > column.maximum)
        )
          errors[column.key] = "המספר מחוץ לטווח המותר";
      }
    } else errors[column.key] = "השדה אינו ניתן לעריכה";
    if (!(column.key in errors) && parsed !== original[column.key])
      changes[column.key] = parsed;
  }
  return { dirty, changes, errors };
}
/** Keep only the user's edited fields while bringing untouched fields up to date. */
export function rebaseDraft(
  table: AdminTable,
  before: AdminRow,
  draft: AdminDraft,
  fresh: AdminRow,
): AdminDraft {
  const old = createDraft(table, before);
  return {
    ...createDraft(table, fresh),
    ...Object.fromEntries(
      Object.entries(draft).filter(([key, value]) => value !== old[key]),
    ),
  };
}
export function adminErrorMessage(error: unknown): string {
  if (!(error instanceof AdminApiError))
    return "החיבור נכשל. יש לבדוק את החיבור ולנסות שוב.";
  if (error.status === 401) return "ההתחברות פגה. יש להתחבר מחדש.";
  if (error.status === 403)
    return "אין הרשאה לבצע את הפעולה. נדרשת הרשאת מנהל.";
  if (error.status === 404)
    return "הרשומה או הטבלה אינן זמינות עוד. יש לרענן את הנתונים.";
  if (error.status === 429)
    return "בוצעו יותר מדי בקשות. יש להמתין כדקה ולנסות שוב.";
  if (error.status === 409 && /dependent|referenced/i.test(error.message))
    return "לא ניתן למחוק או לשנות את הרשומה כל עוד רשומות אחרות מקושרות אליה.";
  if (error.status === 409)
    return "הפעולה לא הושלמה: ייתכן שהרשומה השתנתה או שקיים ערך כפול. הטיוטה נשמרה; אפשר לטעון נתונים עדכניים ולבדוק שוב.";
  return error.message;
}
