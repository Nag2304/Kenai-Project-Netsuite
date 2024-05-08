/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(["N/record", "N/log"], function (record, log) {
  const exports = {};
  /* ------------------------ Before Submit Script Begin ------------------------ */
  function beforeSubmit(scriptContext) {
    try {
      var rec = scriptContext.newRecord;
      var lineItemCount = rec.getLineCount({ sublistId: "item" });
      log.debug({
        title: "Total Lines",
        details: [lineItemCount],
      });
      /* --------------------------- Item Sublist Begin --------------------------- */
      if (lineItemCount > 0) {
        for (var i = 0; i < lineItemCount; i++) {
          // Nominal Width
          var nominalWidth = rec.getSublistValue({
            sublistId: "item",
            fieldId: "custcol_nominal_width",
            line: i,
          });
          // Nominal Thickness
          var nominalThickness = rec.getSublistValue({
            sublistId: "item",
            fieldId: "custcol_nominal_thickness",
            line: i,
          });
          // Linear Feet
          var linearFeet = rec.getSublistValue({
            sublistId: "item",
            fieldId: "quantity",
            line: i,
          });
          // Board Feet
          var boardFeet = rec.getSublistValue({
            sublistId: "item",
            fieldId: "custcol_dm_po_board_feet",
            line: i,
          });
          log.debug({
            title: "VALUES",
            details: [nominalWidth, nominalThickness, linearFeet, boardFeet],
          });
          /* ---------------------------- Board Feet Calculations Begin ---------------------------- */

          if (
            boardFeet === null ||
            boardFeet === 0 ||
            boardFeet === undefined ||
            boardFeet === ""
          ) {
            boardFeet = linearFeet * (nominalWidth / 12) * nominalThickness;
            boardFeet = boardFeet.toFixed(3);
            rec.setSublistValue({
              sublistId: "item",
              fieldId: "custcol_dm_po_board_feet",
              line: i,
              value: boardFeet,
            });
          }
          /* ---------------------------- Board Feet Calculations End ---------------------------- */
          //
          /* ------------------ Board Length Rate Calculations Begin ------------------ */
          //Amount
          var amount = rec.getSublistValue({
            sublistId: "item",
            fieldId: "amount",
            line: i,
          });

          if (boardFeet > 0 && amount > 0) {
            var boardLengthRate = rec.getSublistValue({
              sublistId: "item",
              fieldId: "custcol_dm_board_length_rate",
              line: i,
            });

            if (
              boardLengthRate === 0 ||
              boardLengthRate === null ||
              boardLengthRate === undefined ||
              boardLengthRate === ""
            ) {
              boardLengthRate = amount / boardFeet;
              boardLengthRate = boardLengthRate.toFixed(3);
              rec.setSublistValue({
                sublistId: "item",
                fieldId: "custcol_dm_board_length_rate",
                line: i,
                value: boardLengthRate,
              });
            }
          }
          /* ------------------ Board Length Rate Calculations End ------------------ */
        }
      }

      /* --------------------------- Item Sublist End--------------------------- */
    } catch (err) {
      log.debug({
        title: "Calculate Board Length Script Occured with Error",
        details: err,
      });
    }
  }
  /* ------------------------ Before Sumbit Script End ------------------------ */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.beforeSubmit = beforeSubmit;
  return exports;
  /* ------------------------------ Exports End ----------------------------- */
});
