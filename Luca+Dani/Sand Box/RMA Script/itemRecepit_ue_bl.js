/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 */

define(["N/record", "N/log"], function (record, log) {
  const exports = {};

  /* ------------------------ Before Load Script Begin ------------------------ */
  function beforeLoad(scriptContext) {
    const newRecord = scriptContext.newRecord;
    //TODO:log.debug({ title: newRecord, details: "New Record" });

    /* --------------------------- Item Receipt Begin --------------------------- */
    if (newRecord.type === "itemreceipt") {
      const createdFromId = newRecord.getValue({
        fieldId: "createdfrom",
      });
      // TODO: log.debug({ title: createdFromId, details: "Record Created From RMA", });

      try {
        /* ---------------------------- RMA Record Begin ---------------------------- */
        const rmaRecord = record.load({
          type: "returnauthorization",
          id: createdFromId,
          isDynamic: true,
        });
        const lineItemCount = rmaRecord.getLineCount({ sublistId: "item" });
        // TODO: log.debug({ title: lineItemCount });

        for (var i = 0; i < lineItemCount; i++) {
          var itemRecordId = rmaRecord.getSublistValue({
            sublistId: "item",
            fieldId: "item",
            line: i,
          });
          var itemRecordType = rmaRecord.getSublistValue({
            sublistId: "item",
            fieldId: "itemtype",
            line: i,
          });
          var itemRecordCostEstimate = rmaRecord.getSublistValue({
            sublistId: "item",
            fieldId: "costestimate",
            line: i,
          });
          // TODO: log.debug({title: itemRecordType,details:"The ItemRecord ID is " + itemRecordId + "It's line value is " +  i, });

          /* ------------------------ Load Item Record Begin ------------------------ */
          if (itemRecordType === "Assembly") {
            var assemblyItemRecord = record.load({
              type: "assemblyitem",
              id: itemRecordId,
              isDynamic: true,
            });
            var assemblyItemAvgCost = assemblyItemRecord.getValue({
              fieldId: "averagecost",
            });
          }
          /* ------------------------ Load Item Record End ------------------------ */
          log.debug({
            title: "Setting Value",
            details: "Script is working",
          });
          if (itemRecordCostEstimate === 0.0) {
            newRecord.setSublistValue({
              sublistId: "item",
              fieldId: "unitcostoverride",
              line: i,
              value: assemblyItemAvgCost,
            });
          } else {
            newRecord.setSublistValue({
              sublistId: "item",
              fieldId: "unitcostoverride",
              line: i,
              value: itemRecordCostEstimate,
            });
          }
        }
        /* ---------------------------- RMA Record End ---------------------------- */
      } catch (err) {
        log.debug({ title: "RMA Record Failed to Load" });
      }
    }
    /* --------------------------- Item Receipt End --------------------------- */
  }

  /* ------------------------ Before Load Script End ------------------------ */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.beforeLoad = beforeLoad;
  return exports;
  /* ------------------------------ Exports End ----------------------------- */
});
