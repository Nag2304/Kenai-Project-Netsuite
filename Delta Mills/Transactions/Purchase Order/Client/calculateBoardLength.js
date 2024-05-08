/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 */
define(["N/log"], function (log) {
  const exports = {};
  /* ---------------------------- Validate Line Begin --------------------------- */
  function validateLine(context) {
    var currentRecord = context.currentRecord;
    var sublistId = context.sublistId;
    var line = context.line;
    if (sublistId == "item") {
      var itemId = currentRecord.getCurrentSublistValue({
        sublistId: sublistId,
        fieldId: "item",
      });
    }
    if (itemId == "" || itemId == null || itemId == "Nan") return true;

    var amount = currentRecord.getCurrentSublistValue({
      sublistId: "item",
      fieldId: "amount",
    });

    var boardFeet = currentRecord.getCurrentSublistValue({
      sublistId: "item",
      fieldId: "custcol_dm_po_board_feet",
    });

    if (boardFeet > 0 && amount > 0) {
      var boardLengthRate = amount / boardFeet;

      //?console.log(boardLengthRate);

      boardLengthRate = boardLengthRate.toFixed(3);

      //?console.log(quantity);

      currentRecord.setCurrentSublistValue({
        sublistId: "item",
        fieldId: "custcol_dm_board_length_rate",
        value: boardLengthRate,
        ignoreFieldChange: false,
      });
    }
    return true;
  }
  /* ---------------------------- Validate Line End --------------------------- */
  //
  /* --------------------------- Field Changed Begin -------------------------- */
  function fieldChanged(context) {
    var currentRecord = context.currentRecord;
    var sublistName = context.sublistId;
    var sublistFieldName = context.fieldId;
    //?console.log(sublistFieldName, sublistName);
    if (sublistName === "item" && sublistFieldName === "quantity") {
      var nominalWidth = currentRecord.getCurrentSublistValue({
        sublistId: "item",
        fieldId: "custcol_nominal_width",
      });
      var nominalThickness = currentRecord.getCurrentSublistValue({
        sublistId: "item",
        fieldId: "custcol_nominal_thickness",
      });
      var linearFeet = currentRecord.getCurrentSublistValue({
        sublistId: "item",
        fieldId: "quantity",
      });
      var boardFeet = linearFeet * (nominalWidth / 12) * nominalThickness;
      //?console.log(boardFeet);
      boardFeet = boardFeet.toFixed(3);

      currentRecord.setCurrentSublistValue({
        sublistId: "item",
        fieldId: "custcol_dm_po_board_feet",
        value: boardFeet,
        ignoreFieldChange: false,
      });
    }
  }
  /* --------------------------- Field Changed End -------------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.validateLine = validateLine;
  exports.fieldChanged = fieldChanged;
  return exports;
  /* ------------------------------ Exports End ----------------------------- */
});
