/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(["N/record", "N/log", "N/format"], function (record, log, format) {
  const exports = {};
  /* ---------------------------- After Submit Begin --------------------------- */
  function afterSubmit(context) {
    if (context.type === context.UserEventType.CREATE) {
      // internal ID of the Purchase Order
      var po_internalID = context.newRecord.id;
      try {
        //load the Purchase Order Record
        var po = record.load({
          type: record.Type.PURCHASE_ORDER,
          id: po_internalID,
          isDynamic: true,
        });

        // Get the PO Number
        var poNumber = po.getValue({ fieldId: "tranid" });

        // Get the Vendor Name
        var poVendorName = po.getValue({ fieldId: "entityname" });

        // Get the Vendor Internal ID
        var poVendorInternalID = po.getValue({ fieldId: "entity" });

        /* ---------------------- Transaction Line Items Begin ---------------------- */
        var poLineItemCount = po.getLineCount({ sublistId: "item" });

        if (poLineItemCount > 0) {
          for (var i = 0; i < poLineItemCount; i++) {
            var poItem = po.getSublistValue({
              sublistId: "item",
              fieldId: "item_display",
              line: i,
            });
            var poItemInternalID = po.getSublistValue({
              sublistId: "item",
              fieldId: "item",
              line: i,
            });
            var poQtyReceived = po.getSublistValue({
              sublistId: "item",
              fieldId: "quantityreceived",
              line: i,
            });
            var poTotalShipped = po.getSublistValue({
              sublistId: "item",
              fieldId: "quantityonshipments",
              line: i,
            });
            var poOrderQuantity = po.getSublistValue({
              sublistId: "item",
              fieldId: "quantity",
              line: i,
            });
            var poExpectedReceiptDate = po.getSublistValue({
              sublistId: "item",
              fieldId: "expectedreceiptdate",
              line: i,
            });
            if (poExpectedReceiptDate) {
              poExpectedReceiptDate = format.parse({
                value: poExpectedReceiptDate,
                type: format.Type.DATE,
              });
            }

            var poItemLineID = i + 1;
            /* -------------------------- Create Custom Record -  Begin -------------------------- */
            var customRec = record.create({
              type: "customrecord_cr_poinboundshipmentreport",
              isDynamic: true,
            });
            /* ---------------------------- Set Values Begin ---------------------------- */
            customRec.setValue({
              fieldId: "custrecord_ponumber",
              value: poNumber,
            });
            customRec.setValue({
              fieldId: "custrecord_pointernalid",
              value: po_internalID,
            });
            customRec.setValue({
              fieldId: "custrecord_vendorname",
              value: poVendorName,
            });
            customRec.setValue({
              fieldId: "custrecord_vendorinternalid",
              value: poVendorInternalID,
            });
            customRec.setValue({
              fieldId: "custrecord_critem",
              value: poItem,
            });
            customRec.setValue({
              fieldId: "custrecord_iteminternalid",
              value: poItemInternalID,
            });
            customRec.setValue({
              fieldId: "custrecord_polineid",
              value: poItemLineID,
            });
            customRec.setValue({
              fieldId: "custrecord_received",
              value: poQtyReceived,
            });
            customRec.setValue({
              fieldId: "custrecord_totalshipped",
              value: poTotalShipped,
            });
            customRec.setValue({
              fieldId: "custrecord_ordquantity",
              value: poOrderQuantity,
            });
            customRec.setValue({
              fieldId: "custrecord_expecteddate",
              value: poExpectedReceiptDate,
            });
            /* ----------------------------- Set Values End ----------------------------- */
            //
            customRec.save();
            /* ------------------------ Create Custom Record End ------------------------ */
          }
        }

        /* ---------------------- Transaction Line Items End ---------------------- */
      } catch (err) {
        log.debug({ title: "Script encountered error", details: err });
      }
    }
  }
  /* ---------------------------- After Submit End --------------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.afterSubmit = afterSubmit;
  return exports;
  /* ------------------------------ Exports End ----------------------------- */
});
