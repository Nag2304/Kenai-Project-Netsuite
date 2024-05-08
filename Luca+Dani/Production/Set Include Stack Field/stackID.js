/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 */
define(["N/currentRecord", "N/log", "N/record"], function (
  currentRecord,
  log,
  record
) {
  const exports = {};
  /* ------------------------ Save Record Begin ------------------------ */
  function saveRecord() {
    try {
      /* --------------------------- Sales Order Begin --------------------------- */
      var flagSet = "N";

      var rec = currentRecord.get();
      //* var recId = rec.id;

      //Get the check box field id === INCLUDES STACK
      var includeStackValue = rec.getValue({
        fieldId: "custbody_ld_includes_stack",
      });

      //Get source === TRANSACTION SOURCE
      var source = Number(rec.getValue({ fieldId: "custbody_ld_source" }));

      if (source === 1) {
        const lineItemCount = rec.getLineCount({ sublistId: "item" });
        /* --------------------------- Item Sublist Begin --------------------------- */
        for (var i = 0; i < lineItemCount; i++) {
          var itemRecordId = rec.getSublistValue({
            sublistId: "item",
            fieldId: "item",
            line: i,
          });
          var itemRecordType = rec.getSublistValue({
            sublistId: "item",
            fieldId: "itemtype",
            line: i,
          });
          //Get Stack ID from the SALE === STACK ID
          var itemRecordStackID = rec.getSublistValue({
            sublistId: "item",
            fieldId: "custcol_ld_stack_id",
            line: i,
          });
          if (itemRecordType === "Assembly") {
            var assemblyItemRecord = record.load({
              type: "assemblyitem",
              id: itemRecordId,
              isDynamic: true,
            });
            //Get the checkbox value === IS STACK
            var assemblyItemIsStack = assemblyItemRecord.getValue({
              fieldId: "custitem_ld_item_is_stack",
            });
          }
          if (itemRecordStackID || assemblyItemIsStack) {
            flagSet = "Y";
            break;
          }
          /* --------------------------- Item Sublist End --------------------------- */
        }
        if (flagSet === "Y" && !includeStackValue) {
          rec.setValue({ fieldId: "custbody_ld_includes_stack", value: true });
        } else if (!includeStackValue) {
          rec.setValue({ fieldId: "custbody_ld_includes_stack", value: false });
        }
      }
      /* --------------------------- Sales Order End --------------------------- */
    } catch (err) {
      log.debug({ title: "Stack ID Script Failed to Execute", details: err });
    }

    return true;
  }
  /* ------------------------ Save Record End ------------------------ */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.saveRecord = saveRecord;
  return exports;
  /* ------------------------------ Exports End ----------------------------- */
});
