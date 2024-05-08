/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 */
define(["N/search", "N/record", "N/log", "N/format"], function (
  search,
  record,
  log,
  format
) {
  const exports = {};
  /* ------------------------- Scheduled Script Begin ------------------------- */
  function execute(context) {
    try {
      /* ---------------------------- Create Search Begin --------------------------- */
      var purchaseOrderSearchObj = search.create({
        type: "transaction",
        filters: [
          {
            name: "type",
            operator: "anyof",
            values: ["PurchOrd"],
          },
          {
            name: "formulanumeric",
            formula:
              "CASE WHEN {quantity} >{quantityshiprecv} then 1 else 0 END",
            operator: "equalto",
            values: ["1"],
          },
          {
            name: "status",
            operator: "anyof",
            values: ["PurchOrd:D", "PurchOrd:E", "PurchOrd:F"],
          },
        ],
        columns: [
          search.createColumn({ name: "internalid", label: "PO Internal ID" }),
          search.createColumn({ name: "tranid", label: "PO#" }),
          search.createColumn({ name: "item", label: "Item Name" }),
          search.createColumn({
            name: "internalid",
            join: "item",
            label: "Item internal ID",
          }),
          search.createColumn({ name: "quantity", label: "PO Quantity" }),
          search.createColumn({
            name: "quantityshiprecv",
            label: "PO Received",
          }),
          search.createColumn({
            name: "entityid",
            join: "vendor",
            label: "Vendor Name",
          }),
          search.createColumn({
            name: "internalid",
            join: "vendor",
            label: "Vendor Internal ID",
          }),
          search.createColumn({
            name: "line",
            label: "PO Line ID",
          }),
          search.createColumn({
            name: "expectedreceiptdate",
            label: "Expected Receipt Date",
          }),
          search.createColumn({
            name: "quantityonshipments",
            label: "Total Shipped",
          }),
        ],
      });

      /* ---------------------------- Create Search End --------------------------- */
      //
      /* ---------------------------- Count Search Begin ---------------------------- */
      var customSearchResultCount = purchaseOrderSearchObj.runPaged().count;
      /* ---------------------------- Count Search End ---------------------------- */
      //
      /* ------------------------- Run the Results - Begin ------------------------ */
      if (customSearchResultCount > 0) {
        purchaseOrderSearchObj.run().each(function (result) {
          /* -------------------------- Create Custom Record -  Begin -------------------------- */
          var customRec = record.create({
            type: "customrecord_cr_poinboundshipmentreport",
            isDynamic: true,
          });
          /* ---------------------------- Set Values Begin ---------------------------- */
          // * PO NUMBER
          customRec.setValue({
            fieldId: "custrecord_ponumber",
            value: result.getValue({ name: "tranid", label: "PO#" }),
          });
          // *
          // * PO INTERNAL ID
          customRec.setValue({
            fieldId: "custrecord_pointernalid",
            value: Number(
              result.getValue({ name: "internalid", label: "PO Internal ID" })
            ),
          });
          // *
          // * VENDOR NAME
          customRec.setValue({
            fieldId: "custrecord_vendorname",
            value: result.getValue({
              name: "entityid",
              join: "vendor",
              label: "Vendor Name",
            }),
          });
          // *
          // * VENDOR INTERNAL ID
          customRec.setValue({
            fieldId: "custrecord_vendorinternalid",
            value: result.getValue({
              name: "internalid",
              join: "vendor",
              label: "Vendor Internal ID",
            }),
          });
          // *
          // * ITEM NAME
          customRec.setValue({
            fieldId: "custrecord_critem",
            value: result.getValue({ name: "item", label: "Item Name" }),
          });
          // *
          // * ITEM INTERNAL ID
          customRec.setValue({
            fieldId: "custrecord_iteminternalid",
            value: result.getValue({
              name: "internalid",
              join: "item",
              label: "Item internal ID",
            }),
          });
          // *
          // * PO LINE ID
          customRec.setValue({
            fieldId: "custrecord_polineid",
            value: result.getValue({
              name: "line",
              label: "PO Line ID",
            }),
          });
          // *
          // * QUANTITY RECEIVED
          customRec.setValue({
            fieldId: "custrecord_received",
            value: result.getValue({
              name: "quantityshiprecv",
              label: "PO Received",
            }),
          });
          // *
          // * QUANTITY TOTAL SHIPPED
          customRec.setValue({
            fieldId: "custrecord_totalshipped",
            value: result.getValue({
              name: "quantityonshipments",
              label: "Total Shipped",
            }),
          });
          // *
          // * QUANTITY ORDERED
          customRec.setValue({
            fieldId: "custrecord_ordquantity",
            value: result.getValue({ name: "quantity", label: "PO Quantity" }),
          });
          // *
          // * EXPECTED RECEIPT DATE
          var poExpectedReceiptDate = result.getValue({
            name: "expectedreceiptdate",
            label: "Expected Receipt Date",
          });
          if (poExpectedReceiptDate) {
            poExpectedReceiptDate = format.parse({
              value: poExpectedReceiptDate,
              type: format.Type.DATE,
            });
            customRec.setValue({
              fieldId: "custrecord_expecteddate",
              value: poExpectedReceiptDate,
            });
          }
          // *
          /* ---------------------------- Set Values End ---------------------------- */
          customRec.save();
          /* ------------------------ Create Custom Record End ------------------------ */
          return true;
        });
        /* ------------------------- Run the Results - End ------------------------ */
      }
    } catch (err) {
      log.debug({ title: "Script Failed to Execute", details: err });
    }
  }
  /* ------------------------- Scheduled Script End ------------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.execute = execute;
  return exports;
  /* ------------------------------ Exports End ----------------------------- */
});
