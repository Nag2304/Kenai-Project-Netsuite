/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 */
define(["N/record", "N/currentRecord", "N/log"], function (
  record,
  currentRecord,
  log
) {
  const exports = {};
  /* ------------------------ Save Record Begin ------------------------ */
  function saveRecord() {
    const salesRecord = currentRecord.get();
    //TODO: log.debug({ title: "Sales Order Record", details: salesRecord });
    /* --------------------------- Sales Order Begin --------------------------- */
    if (salesRecord.type === "salesorder") {
      //Get Currency from the Sales Order
      const currency = salesRecord.getValue({ fieldId: "currency" });
      //TODO: log.debug({ title: "Currency", details: currency });

      //Get the customer ID from the sales order
      const customerID = salesRecord.getValue({ fieldId: "entity" });

      //Load the customer record
      const customerRecord = record.load({ type: "customer", id: customerID });

      //Get the Default Price Level
      var customerRecordPriceLevel = customerRecord.getValue({
        fieldId: "pricelevel",
      });
      //TODO: log.debug({title: "Customer Record Price Level",details: customerRecordPriceLevel,});

      const lineItemCount = salesRecord.getLineCount({ sublistId: "item" });
      //TODO: log.debug({ title: "Line Item Count", details: lineItemCount });

      if (lineItemCount > 0) {
        /* ----------------------- Sublist Load Begin ----------------------- */
        try {
          for (var i = 0; i < lineItemCount; i++) {
            /* ------------------------- Line Level Values Begin ------------------------ */
            var itemId = salesRecord.getSublistValue({
              sublistId: "item",
              fieldId: "item",
              line: i,
            });
            if (itemId) {
              var itemType = salesRecord.getSublistValue({
                sublistId: "item",
                fieldId: "itemtype",
                line: i,
              });
              var defaultPriceLevelSales = salesRecord.getSublistValue({
                sublistId: "item",
                fieldId: "custcol_rbb_default_price_level",
                line: i,
              });
              if (!defaultPriceLevelSales) {
                if (customerRecordPriceLevel) {
                  defaultPriceLevelSales = Number(customerRecordPriceLevel);
                } else {
                  break;
                }
              } else if (
                Number(defaultPriceLevelSales) ===
                  Number(customerRecordPriceLevel) &&
                customerRecordPriceLevel
              ) {
                defaultPriceLevelSales = Number(defaultPriceLevelSales);
              } else if (
                Number(defaultPriceLevelSales) !==
                  Number(customerRecordPriceLevel) &&
                customerRecordPriceLevel
              ) {
                defaultPriceLevelSales = Number(customerRecordPriceLevel);
              } else {
                defaultPriceLevelSales = Number(defaultPriceLevelSales);
              }

              itemType = itemType.toLowerCase().concat("item");
              //TODO: log.debug({ title: "item Line Level",details: [itemId, itemType, defaultPriceLevelSales],});
              /* ------------------------- Line Level Values End ------------------------ */
              //
              /* ------------------------ Load Item Record Begin ------------------------ */
              var itemRecord = record.load({
                type: itemType,
                id: itemId,
              });
              //TODO:log.debug({ title: "Item Record", details: itemId,});

              var sublistIdVal = "price" + currency;
              //TODO: log.debug({ title: "Sublist Name", details: sublistIdVal });

              //var sublists = itemRecord.getSublists();
              //TODO: log.debug({ title: "Total Sublists", details: sublists });

              var itemRecordLineCount = itemRecord.getLineCount({
                sublistId: sublistIdVal,
              });

              for (var j = 0; j < itemRecordLineCount; j++) {
                var itemPriceLevel = itemRecord.getSublistValue({
                  sublistId: sublistIdVal,
                  fieldId: "pricelevel",
                  line: j,
                });
                itemPriceLevel = Number(itemPriceLevel);
                if (itemPriceLevel === defaultPriceLevelSales) {
                  var itemPriceLevelCurrency = itemRecord.getSublistValue({
                    sublistId: sublistIdVal,
                    fieldId: "price_" + currency + "_",
                    line: j,
                  });
                  //TODO: log.debug({ title: "Item Price Level", details: itemPriceLevel });
                  break;
                }
              }
              /* ------------------------ Load Item Record End ------------------------ */

              salesRecord.selectLine({
                sublistId: "item",
                line: i,
              });
              if (defaultPriceLevelSales) {
                salesRecord.setCurrentSublistValue({
                  sublistId: "item",
                  fieldId: "custcol_rbb_default_price_level",
                  line: i,
                  value: defaultPriceLevelSales,
                });
                //TODO: log.debug({ title: "Value set at item price level" });
              }
              if (itemPriceLevelCurrency) {
                salesRecord.setCurrentSublistValue({
                  sublistId: "item",
                  fieldId: "custcol_rbb_default_price",
                  line: i,
                  value: itemPriceLevelCurrency,
                });
                //TODO: log.debug({ title: "Value set at item price" });
              }
              salesRecord.commitLine({
                sublistId: "item",
              });
            }
          }
        } catch (err) {
          log.debug({ title: "Record Failed", details: err });
        }
        /* ----------------------- Sublist Load End ----------------------- */
      }
    }
    /* --------------------------- Sales Order End --------------------------- */
    return true;
  }
  /* ------------------------ Save Record End ------------------------ */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.saveRecord = saveRecord;
  return exports;
  /* ------------------------------ Exports End ----------------------------- */
});
