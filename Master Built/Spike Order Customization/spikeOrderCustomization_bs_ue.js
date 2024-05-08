/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 */
define(["N/log", "N/search"], function (log, search) {
  const exports = {};
  //
  /* ------------------------ Before Submit Begin ------------------------ */
  function beforeSubmit(scriptContext) {
    try {
      const rec = scriptContext.newRecord;
      const salesOrderLineItemCount = rec.getLineCount({ sublistId: "item" });
      if (salesOrderLineItemCount > 0) {
        for (var i = 0; i < salesOrderLineItemCount; i++) {
          var itemId = rec.getSublistValue({
            sublistId: "item",
            fieldId: "item",
            line: i,
          });
          var locationId = rec.getSublistValue({
            sublistId: "item",
            fieldId: "location",
            line: i,
          });
          var quantity = rec.getSublistValue({
            sublistId: "item",
            fieldId: "quantity",
            line: i,
          });
          // log.debug({
          //   title: "Line Item Values",
          //   details: [itemId, locationId, quantity],
          // });
          /* --------------------------- Search Begin -------------------------- */
          /* --------------------------- Create Search Begin -------------------------- */
          var itemlocationconfigurationSearchObj = search.create({
            type: "itemlocationconfiguration",
            filters: [
              ["location", "anyof", locationId],
              "AND",
              ["item", "anyof", itemId],
            ],
            columns: [
              search.createColumn({
                name: "reorderpoint",
                label: "Reorder Point",
              }),
            ],
          });
          /* --------------------------- Create Search End-------------------------- */
          /* -------------------------- Run the Search Begin -------------------------- */
          var searchResultCount =
            itemlocationconfigurationSearchObj.runPaged().count;
          // log.debug(
          //   "itemlocationconfigurationSearchObj result count",
          //   searchResultCount
          // );
          if (searchResultCount > 0) {
            itemlocationconfigurationSearchObj.run().each(function (result) {
              // .run().each has a limit of 4,000 results
              var reorderPoint = result.getValue({
                name: "reorderpoint",
                label: "Reorder Point",
              });
              var redorderPercent = Number(
                ((50 * reorderPoint) / 100).toFixed(0)
              );
              // log.debug({
              //   title: "Values",
              //   details: [reorderPoint, redorderPercent],
              // });
              if (quantity > redorderPercent) {
                rec.setSublistValue({
                  sublistId: "item",
                  fieldId: "custcol_kjm_spike_order",
                  line: i,
                  value: true,
                });
              }
              return true;
            });
          }
          /* --------------------------- Run the Search End --------------------------- */
          /* --------------------------- Search End -------------------------- */
        }
      }
    } catch (err) {
      log.debug({ title: "Error Occured", details: err });
    }
  }
  /* ------------------------ Before Submit End ------------------------ */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.beforeSubmit = beforeSubmit;
  return exports;
  /* ------------------------------ Exports End ----------------------------- */
});
