/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(["N/record", "N/log"], function (record, log) {
  const exports = {};
  /* ------------------------ Before Submit Script Begin ------------------------ */
  function beforeSubmit(scriptContext) {
    log.debug({ details: scriptContext });
    const rec = scriptContext.newRecord;
    try {
      var flagSet = "N";
      /* --------------------------- Sales Order Begin --------------------------- */
      var includeStackValue = rec.getValue({
        fieldId: "custbody_ld_includes_stack",
      });
      //Get source
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
  }
  /* ------------------------ Before Sumbit Script End ------------------------ */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.beforeSubmit = beforeSubmit;
  return exports;
  /* ------------------------------ Exports End ----------------------------- */
});
