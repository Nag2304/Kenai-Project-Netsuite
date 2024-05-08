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
      var previousShipmentNumber = 0;
      /* ---------------------------- Create Search Begin --------------------------- */
      var poInboundShipmentSearchObj = search.create({
        type: "customrecord_cr_poinboundshipmentreport",
        filters: [
          {
            name: "custrecord_inboundshipmentno",
            operator: "greaterthan",
            values: ["0"],
          },
        ],
        columns: [
          search.createColumn({
            name: "custrecord_inboundshipmentno",
            summary: "GROUP",
            label: "Inbound Shipment #",
          }),
          search.createColumn({
            name: "internalid",
            summary: "GROUP",
            label: "Internal ID",
          }),
          search.createColumn({
            name: "custrecord_pointernalid",
            summary: "GROUP",
            label: "PO Internal ID",
          }),
          search.createColumn({
            name: "custrecord_iteminternalid",
            summary: "GROUP",
            label: "Item Internal ID",
          }),
        ],
      });
      /* ---------------------------- Create Search End --------------------------- */
      //
      /* ---------------------------- Count Search Begin ---------------------------- */
      var searchResultCount = poInboundShipmentSearchObj.runPaged().count;
      /* ---------------------------- Count Search End ---------------------------- */
      //
      // log.debug({ title: "Total Results", details: searchResultCount });
      if (searchResultCount > 0) {
        /* ---------------------------- Run Search Begin ---------------------------- */
        var resultSet = poInboundShipmentSearchObj.run();
        var currentRange = resultSet.getRange({
          start: 0,
          end: 1000,
        });
        var i = 0; // iterator for all search results
        var j = 0; // iterator for current result range 0..999
        while (j < currentRange.length) {
          var result = currentRange[j];
          //Inbound Shipment Number
          // Inbound SHipment Number
          var inboundShipmentNumber = Number(
            result.getValue({
              name: "custrecord_inboundshipmentno",
              summary: "GROUP",
              label: "Inbound Shipment #",
            })
          );
          var poInternalID = result.getValue({
            name: "custrecord_pointernalid",
            summary: "GROUP",
            label: "PO Internal ID",
          });
          var itemInternalID = result.getValue({
            name: "custrecord_iteminternalid",
            summary: "GROUP",
            label: "Item Internal ID",
          });
          var customInternalID = Number(
            result.getValue({
              name: "internalid",
              summary: "GROUP",
              label: "Internal ID",
            })
          );
          /* ---------------------------- Create Search Begin --------------------------- */
          var inboundShipmentSearchObj = search.create({
            type: "inboundshipment",
            filters: [
              {
                name: "shipmentnumber",
                operator: "anyof",
                values: [inboundShipmentNumber],
              },
              {
                name: "internalid",
                join: "purchaseorder",
                operator: "anyof",
                values: [poInternalID],
              },
              {
                name: "internalidnumber",
                join: "item",
                operator: "equalto",
                values: [itemInternalID],
              },
            ],
            columns: [
              search.createColumn({
                name: "internalid",
                label: "Internal ID",
              }),
            ],
          });
          /* ---------------------------- Create Search End --------------------------- */
          //
          /* ---------------------------- Count Search Begin ---------------------------- */
          var customSearchResultCount =
            inboundShipmentSearchObj.runPaged().count;
          /* ---------------------------- Count Search End ---------------------------- */
          if (customSearchResultCount > 0) {
            // log.debug({
            //   title: "Record Matched",
            //   details: [itemInternalID, poInternalID, inboundShipmentNumber],
            // });
            inboundShipmentSearchObj.run().each(function (result) {
              var inboundShipmentInternalID = Number(
                result.getValue({
                  name: "internalid",
                  label: "Internal ID",
                })
              );
              if (inboundShipmentInternalID > 0) {
                var rec = record.load({
                  type: record.Type.INBOUND_SHIPMENT,
                  id: inboundShipmentInternalID,
                });
                var status = rec.getValue({
                  fieldId: "shipmentstatus",
                });
                var date = rec.getValue({
                  fieldId: "expecteddeliverydate",
                });
                if (date) {
                  date = format.parse({
                    value: date,
                    type: format.Type.DATE,
                  });
                }
                var linecount = rec.getLineCount({ sublistId: "items" });
                for (var l = 0; l < linecount; l++) {
                  var purchaseOrderLineLevel = rec.getSublistValue({
                    sublistId: "items",
                    fieldId: "purchaseorder",
                    line: l,
                  });
                  var itemId = Number(
                    rec.getSublistValue({
                      sublistId: "items",
                      fieldId: "itemid",
                      line: l,
                    })
                  );
                  if (
                    purchaseOrderLineLevel == poInternalID &&
                    itemId == itemInternalID
                  ) {
                    var quantityReceived = rec.getSublistValue({
                      sublistId: "items",
                      fieldId: "quantityreceived",
                      line: l,
                    });
                    var totalShipped = rec.getSublistValue({
                      sublistId: "items",
                      fieldId: "quantityexpected",
                      line: l,
                    });
                    break;
                  }
                }
              }
              if (customInternalID > 0) {
                var rec = record.load({
                  type: "customrecord_cr_poinboundshipmentreport",
                  id: customInternalID,
                  isDynamic: true,
                });
                if (status) {
                  rec.setValue({
                    fieldId: "custrecord_status",
                    value: status,
                  });
                }
                if (date) {
                  rec.setValue({
                    fieldId: "custrecord_expecteddate",
                    value: date,
                  });
                }
                if (quantityReceived) {
                  rec.setValue({
                    fieldId: "custrecord_received",
                    value: quantityReceived,
                  });
                }
                if (totalShipped) {
                  rec.setValue({
                    fieldId: "custrecord_totalshipped",
                    value: totalShipped,
                  });
                }
                rec.save();
              }
              return true;
            });
          }

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
        /* ---------------------------- Run Search End ---------------------------- */
      }
    } catch (err) {
      log.debug({
        title: "Script Log",
        details: err,
      });
    }
  }
  /* ------------------------- Scheduled Script End ------------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.execute = execute;
  return exports;
  /* ------------------------------ Exports End ----------------------------- */
});
