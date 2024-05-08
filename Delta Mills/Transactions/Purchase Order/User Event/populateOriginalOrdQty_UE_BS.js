/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define([], function () {
  const exports = {};
  /* --------------------------- Before Submit Begin -------------------------- */
  function beforeSubmit(context) {
    if (context.type === context.UserEventType.CREATE) {
      // internal ID of the Purchase Order
      var rec = context.newRecord;

      var poLineItemCount = rec.getLineCount({
        sublistId: "item",
      });
      if (poLineItemCount) {
        for (var i = 0; i < poLineItemCount; i++) {
          //Standard Netsuite Quantity
          var netsuiteQuantity = rec.getSublistValue({
            sublistId: "item",
            fieldId: "quantity",
            line: i,
          });
          if (netsuiteQuantity) {
            // Set the Original Order Quantity
            rec.setSublistValue({
              sublistId: "item",
              fieldId: "custcol_dm_orig_po_qty",
              line: i,
              value: netsuiteQuantity,
            });
          }
        }
      }
    }
  }
  /* --------------------------- Before Submit End -------------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.beforeSubmit = beforeSubmit;
  return exports;
  /* ------------------------------ Exports End ----------------------------- */
});
