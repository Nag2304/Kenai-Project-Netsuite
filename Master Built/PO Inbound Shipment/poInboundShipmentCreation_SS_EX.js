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
      var inboundShipmentSearchObj = search.create({
        type: "inboundshipment",
        filters: [
          {
            name: "custrecord_recordadded",
            join: "inboundshipmentitem",
            operator: "is",
            values: ["F"],
          },
          {
            name: "formulanumeric",
            formula:
              "CASE WHEN {purchaseorder.quantityshiprecv} < {purchaseorder.quantity}  THEN 1 ELSE 0 END",
            operator: "equalto",
            values: ["1"],
          },
        ],
        columns: [
          search.createColumn({
            name: "shipmentnumber",
            label: "Shipment Number",
          }),
          search.createColumn({
            name: "status",
            label: "Status",
          }),
          search.createColumn({
            name: "expecteddeliverydate",
            label: "Expected Delivery Date",
          }),
          search.createColumn({
            name: "tranid",
            join: "purchaseOrder",
            label: "Document Number",
          }),
          search.createColumn({
            name: "internalid",
            label: "Internal ID",
          }),
          search.createColumn({
            name: "item",
            join: "purchaseOrder",
            label: "item",
          }),
          search.createColumn({
            name: "quantityshiprecv",
            join: "purchaseOrder",
            label: "Quantity Fulfilled/Received",
          }),
          search.createColumn({
            name: "quantityonshipments",
            join: "purchaseOrder",
            label: "Quantity on Shipments",
          }),
          search.createColumn({
            name: "quantityexpected",
            label: "Items - Quantity Expected",
          }),
        ],
      });
      /* ---------------------------- Create Search End --------------------------- */

      //
      /* ---------------------------- Count Search Begin ---------------------------- */
      var searchResultCount = inboundShipmentSearchObj.runPaged().count;
      //  log.debug({ title: "Results", details: searchResultCount });
      /* ---------------------------- Count Search End ---------------------------- */
      //
      if (searchResultCount > 0) {
        /* ---------------------------- Run Search Begin ---------------------------- */
        var resultSet = inboundShipmentSearchObj.run();
        // now take the first portion of data.
        var currentRange = resultSet.getRange({
          start: 0,
          end: 1000,
        });
        var i = 0; // iterator for all search results
        var j = 0; // iterator for current result range 0..999
        while (j < currentRange.length) {
          var result = currentRange[j];
          // Purchase Order Document Number
          var purchaseOrderDocumentNumber = result.getValue({
            join: "purchaseOrder",
            label: "Document Number",
            name: "tranid",
          });
          // Inbound SHipment Number
          var inboundShipmentNumber = result.getValue({
            name: "shipmentnumber",
            label: "Shipment Number",
          });

          // Status
          var status = result.getValue({
            name: "status",
            label: "Status",
          });
          // Expected Delivery Date
          var expecteddeliverydate = result.getValue({
            name: "expecteddeliverydate",
            label: "Expected Delivery Date",
          });
          // Internal ID
          var internalIdInboundShipment = result.getValue({
            name: "internalid",
            label: "Internal ID",
          });

          // Item
          var purchaseItem = result.getValue({
            name: "item",
            join: "purchaseOrder",
            label: "item",
          });
          //Quantity Received
          var quantityReceived = result.getValue({
            name: "quantityshiprecv",
            join: "purchaseOrder",
            label: "Quantity Fulfilled/Received",
          });
          //Quantity Shipped
          var quantityShipped = result.getValue({
            name: "quantityonshipments",
            join: "purchaseOrder",
            label: "Quantity on Shipments",
          });
          //
          //Quantity Expected
          var quantityExpected = result.getValue({
            name: "quantityexpected",
            label: "Items - Quantity Expected",
          });
          /* ----------------------- Custom Record Search Begin ----------------------- */
          var poInboundShipmentSearchObj = search.create({
            type: "customrecord_cr_poinboundshipmentreport",
            filters: [
              {
                name: "custrecord_ponumber",
                operator: "is",
                values: [purchaseOrderDocumentNumber],
              },
              {
                name: "custrecord_iteminternalid",
                operator: "equalto",
                values: [purchaseItem],
              },
              {
                name: "custrecord_inboundshipmentno",
                operator: "isempty",
                values: ["0"],
              },
            ],
            columns: [
              search.createColumn({
                name: "internalid",
                label: "Internal ID",
              }),
            ],
          });
          //
          /* ---------------------------- Count Search Begin ---------------------------- */
          var customSearchResultCount =
            poInboundShipmentSearchObj.runPaged().count;
          /* ---------------------------- Count Search End ---------------------------- */
          //
          if (customSearchResultCount > 0) {
            poInboundShipmentSearchObj.run().each(function (result) {
              var successFlag = "N";
              var poInboundShipmentInternalID = result.getValue({
                name: "internalid",
                label: "Internal ID",
              });
              if (poInboundShipmentInternalID > 0) {
                /* -------------------------- Order Updation Begin -------------------------- */
                var rec = record.load({
                  type: "customrecord_cr_poinboundshipmentreport",
                  id: poInboundShipmentInternalID,
                  isDynamic: true,
                });
                // Set Inbound Shipment Number Value
                if (inboundShipmentNumber) {
                  rec.setValue({
                    fieldId: "custrecord_inboundshipmentno",
                    value: inboundShipmentNumber,
                  });
                }
                // Expected Delivery Date
                if (expecteddeliverydate) {
                  expecteddeliverydate = format.parse({
                    value: expecteddeliverydate,
                    type: format.Type.DATE,
                  });
                  rec.setValue({
                    fieldId: "custrecord_expecteddate",
                    value: expecteddeliverydate,
                  });
                }
                // Set Status Value
                if (status) {
                  rec.setValue({
                    fieldId: "custrecord_status",
                    value: status,
                  });
                }
                // Set Quantity Shipped
                if (quantityShipped) {
                  rec.setValue({
                    fieldId: "custrecord_totalshipped",
                    value: quantityShipped,
                  });
                }
                //Quantity Received
                if (quantityReceived) {
                  rec.setValue({
                    fieldId: "custrecord_received",
                    value: quantityReceived,
                  });
                }
                //Quantity Expected
                if (quantityExpected) {
                  rec.setValue({
                    fieldId: "custrecord_inboundshipqty",
                    value: quantityExpected,
                  });
                }
                rec.setValue({
                  fieldId: "custrecord_remainqty",
                  value: null,
                });
                /* ---------------------------- Get Values Begin ---------------------------- */
                var quantityOrdered = rec.getValue({
                  fieldId: "custrecord_ordquantity",
                });
                var remainingQty = Number(quantityOrdered - quantityShipped);
                var poInternalID = rec.getValue({
                  fieldId: "custrecord_pointernalid",
                });
                var poVendorName = rec.getValue({
                  fieldId: "custrecord_vendorname",
                });
                var poVendorInternalID = rec.getValue({
                  fieldId: "custrecord_vendorinternalid",
                });
                var poItem = rec.getValue({
                  fieldId: "custrecord_critem",
                });
                var poItemInternalID = rec.getValue({
                  fieldId: "custrecord_iteminternalid",
                });
                var poItemLineID = rec.getValue({
                  fieldId: "custrecord_polineid",
                });
                var poOrderQuantity = rec.getValue({
                  fieldId: "custrecord_ordquantity",
                });
                /* ---------------------------- Get Values End ---------------------------- */
                rec.save();
                /* -------------------------- Order Updation End -------------------------- */
                //
                /* -------------------------- Order Creation Begin -------------------------- */
                var customRec = record.create({
                  type: "customrecord_cr_poinboundshipmentreport",
                  isDynamic: true,
                });
                /* ---------------------------- Set Values Begin ---------------------------- */
                customRec.setValue({
                  fieldId: "custrecord_ponumber",
                  value: purchaseOrderDocumentNumber,
                });
                customRec.setValue({
                  fieldId: "custrecord_pointernalid",
                  value: Number(poInternalID),
                });
                customRec.setValue({
                  fieldId: "custrecord_vendorname",
                  value: poVendorName,
                });
                customRec.setValue({
                  fieldId: "custrecord_vendorinternalid",
                  value: Number(poVendorInternalID),
                });
                customRec.setValue({
                  fieldId: "custrecord_critem",
                  value: poItem,
                });
                customRec.setValue({
                  fieldId: "custrecord_iteminternalid",
                  value: Number(poItemInternalID),
                });
                customRec.setValue({
                  fieldId: "custrecord_polineid",
                  value: Number(poItemLineID),
                });
                customRec.setValue({
                  fieldId: "custrecord_ordquantity",
                  value: Number(poOrderQuantity),
                });
                if (expecteddeliverydate) {
                  customRec.setValue({
                    fieldId: "custrecord_expecteddate",
                    value: expecteddeliverydate,
                  });
                }
                customRec.setValue({
                  fieldId: "custrecord_remainqty",
                  value: Number(remainingQty),
                });
                /* ---------------------------- Set Values End ---------------------------- */
                customRec.save();
                /* -------------------------- Order Creation End -------------------------- */
                //
                successFlag = "Y";
              } else {
                successFlag = "N";
              }
              if (successFlag === "Y") {
                var rec = record.load({
                  type: record.Type.INBOUND_SHIPMENT,
                  id: internalIdInboundShipment,
                });
                var linecount = rec.getLineCount({ sublistId: "items" });
                for (var l = 0; l < linecount; l++) {
                  rec.setSublistValue({
                    sublistId: "items",
                    fieldId: "custrecord_recordadded",
                    line: l,
                    value: true,
                  });
                }
                rec.save();
              }
              return true;
            });
          }
          /* ----------------------- Custom Record Search End ----------------------- */
          //
          // finally:
          i++;
          j++;
          if (j == 1000) {
            // check if it reaches 1000
            j = 0; // reset j an reload the next portion
            currentRange = resultSet.getRange({
              start: i,
              end: i + 1000,
            });
          }
        }
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
