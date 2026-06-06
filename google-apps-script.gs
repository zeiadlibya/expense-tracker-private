const TRANSACTIONS_SHEET = "transactions";
const SPLITS_SHEET = "splits";

function doGet(event) {
  const params = event.parameter || {};
  const callback = params.callback || "callback";
  const payload = {
    success: true,
    transactions: readTransactions(),
    splits: readSplits()
  };

  return ContentService
    .createTextOutput(`${callback}(${JSON.stringify(payload)});`)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function doPost(event) {
  const params = event.parameter || {};

  if (params.action === "saveAll") {
    const transactions = JSON.parse(params.transactions || params.payload || "[]");
    const splits = JSON.parse(params.splits || "{}");
    writeTransactions(transactions);
    writeSplits(transactions, splits);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet(name) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(name);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(name);
  }

  return sheet;
}

function writeTransactions(transactions) {
  const sheet = getSheet(TRANSACTIONS_SHEET);
  const rows = [
    [
      "id",
      "type",
      "amount",
      "description",
      "category",
      "paymentMethod",
      "date",
      "createdAt"
    ]
  ];

  transactions.forEach((item) => {
    rows.push([
      item.id || "",
      item.type || "",
      Number(item.amount || 0),
      item.description || item.note || "",
      item.category || "",
      item.paymentMethod || "",
      item.date || "",
      item.createdAt || ""
    ]);
  });

  sheet.clearContents();
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
}

function writeSplits(transactions, splits) {
  const sheet = getSheet(SPLITS_SHEET);
  const rows = [
    ["transactionId", "date", "savings", "expenses", "emergency", "kind"],
    ["__total__", "", Number(splits.savings || 0), Number(splits.expenses || 0), Number(splits.emergency || 0), "total"]
  ];

  transactions
    .filter((item) => item.type === "income" && item.splits)
    .forEach((item) => {
      rows.push([
        item.id || "",
        item.date || "",
        Number(item.splits.savings || 0),
        Number(item.splits.expenses || 0),
        Number(item.splits.emergency || 0),
        "income"
      ]);
    });

  sheet.clearContents();
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
}

function readTransactions() {
  const sheet = getSheet(TRANSACTIONS_SHEET);
  const values = sheet.getDataRange().getValues();
  const splitRows = readSplitRows();

  if (values.length <= 1) return [];

  return values.slice(1)
    .filter((row) => row[0])
    .map((row) => {
      const id = String(row[0]);
      const item = {
        id,
        type: String(row[1]),
        amount: Number(row[2] || 0),
        description: String(row[3] || ""),
        category: String(row[4] || ""),
        paymentMethod: String(row[5] || ""),
        date: String(row[6] || ""),
        createdAt: Number(row[7] || 0)
      };

      if (item.type === "income" && splitRows[id]) {
        item.splits = splitRows[id];
      }

      return item;
    });
}

function readSplits() {
  const sheet = getSheet(SPLITS_SHEET);
  const values = sheet.getDataRange().getValues();
  const splits = { savings: 0, expenses: 0, emergency: 0 };

  values.slice(1).forEach((row) => {
    const id = String(row[0] || "");
    const kind = String(row[5] || "");

    if (id === "__total__" || kind === "total") {
      splits.savings = Number(row[2] || 0);
      splits.expenses = Number(row[3] || 0);
      splits.emergency = Number(row[4] || 0);
    }
  });

  return splits;
}

function readSplitRows() {
  const sheet = getSheet(SPLITS_SHEET);
  const values = sheet.getDataRange().getValues();
  const rows = {};

  values.slice(1).forEach((row) => {
    const id = String(row[0] || "");
    const kind = String(row[5] || "");

    if (!id || id === "__total__" || kind === "total") return;

    rows[id] = {
      savings: Number(row[2] || 0),
      expenses: Number(row[3] || 0),
      emergency: Number(row[4] || 0)
    };
  });

  return rows;
}
