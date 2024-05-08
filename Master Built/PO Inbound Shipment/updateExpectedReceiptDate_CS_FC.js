/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 */
define(["N/record", "N/log", "N/format", "N/search"], function (
  record,
  log,
  format,
  search
) {
  const exports = {};
  /* --------------------------- Field Changed Begin -------------------------- */
  function fieldChanged(context) {
    try {
      var currentRecord = context.currentRecord;
      var sublistName = context.sublistId;
      var sublistFieldName = context.fieldId;
      var id = currentRecord.id;
      //console.log(currentRecord.id);
      if (
        (sublistName === "item" &&
          sublistFieldName === "expectedreceiptdate") ||
        (sublistName == "item" && sublistFieldName === "quantity")
      ) {
        //console.log("script executed.");
        /* ----------------------- Custom Record Search Begin ----------------------- */
        var itemId = currentRecord.getCurrentSublistValue({
          sublistId: "item",
          fieldId: "item",
        });
        var date = currentRecord.getCurrentSublistValue({
          sublistId: "item",
          fieldId: "expectedreceiptdate",
        });
        if (date) {
          date = format.parse({
            value: date,
            type: format.Type.DATE,
          });
        }
        var quantity = currentRecord.getCurrentSublistValue({
          sublistId: "item",
          fieldId: "quantity",
        });
        var quantityOnShipments = currentRecord.getCurrentSublistValue({
          sublistId: "item",
          fieldId: "quantityonshipments",
        });
        //console.log(quantity);
        var poInboundShipmentSearchObj = search.create({
          type: "customrecord_cr_poinboundshipmentreport",
          filters: [
            {
              name: "custrecord_pointernalid",
              operator: "equalto",
              values: [id],
            },
            {
              name: "custrecord_iteminternalid",
              operator: "equalto",
              values: [itemId],
            },
          ],
          columns: [
            search.createColumn({
              name: "internalid",
              label: "Internal ID",
            }),
          ],
        });
        /* ----------------------- Custom Record Search End ----------------------- */
        //
        /* ---------------------------- Count Search Begin ---------------------------- */
        var customSearchResultCount =
          poInboundShipmentSearchObj.runPaged().count;
        //console.log(customSearchResultCount);

        /* ---------------------------- Count Search End ---------------------------- */
        //
        if (customSearchResultCount > 0) {
          poInboundShipmentSearchObj.run().each(function (result) {
            var poInboundShipmentInternalID = result.getValue({
              name: "internalid",
              label: "Internal ID",
            });
            //console.log(poInboundShipmentInternalID);
            if (poInboundShipmentInternalID > 0) {
              var rec = record.load({
                type: "customrecord_cr_poinboundshipmentreport",
                id: poInboundShipmentInternalID,
                isDynamic: true,
              });

              // Expected Date
              if (date) {
                rec.setValue({
                  fieldId: "custrecord_expecteddate",
                  value: date,
                });
              }

              // Quantity
              if (quantity) {
                rec.setValue({
                  fieldId: "custrecord_ordquantity",
                  value: quantity,
                });
              }

              //Remaining Quantity
              var remQty = rec.getValue({
                fieldId: "custrecord_remainqty",
              });
              if (remQty) {
                var remQty1 = quantity - quantityOnShipments;
                if (remQty1) {
                  rec.setValue({
                    fieldId: "custrecord_remainqty",
                    value: remQty1,
                  });
                }
              }

              rec.save();
            }
            return true;
          });
        }
      }
    } catch (err) {
      log.debug({ title: "Script Error", details: err });
    }
  }
  /* --------------------------- Field Changed End -------------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.fieldChanged = fieldChanged;
  return exports;
  /* ------------------------------ Exports End ----------------------------- */
});
