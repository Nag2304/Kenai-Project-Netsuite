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
      var includePersonalizedValue = rec.getValue({
        fieldId: "custbody_ld_peronalized_item",
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
          if (itemRecordType === "Assembly") {
            var assemblyItemRecord = record.load({
              type: "assemblyitem",
              id: itemRecordId,
              isDynamic: true,
            });
            //TODO: log.debug({ details: assemblyItemRecord });
            var assemblyItemIsPersonalized = assemblyItemRecord.getValue({
              fieldId: "custitem_ld_personalized_item",
            });
            //TODO: log.debug({ details: assemblyItemIsPersonalized });
          }
          if (assemblyItemIsPersonalized) {
            flagSet = "Y";
            break;
          }
          /* --------------------------- Item Sublist End --------------------------- */
        }
        if (flagSet === "Y" && !includePersonalizedValue) {
          rec.setValue({
            fieldId: "custbody_ld_peronalized_item",
            value: true,
          });
        } else if (!includePersonalizedValue) {
          rec.setValue({
            fieldId: "custbody_ld_peronalized_item",
            value: false,
          });
        }
      }
      /* --------------------------- Sales Order End --------------------------- */
    } catch (err) {
      log.debug({
        title: "Personalized Script Failed to Execute",
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
