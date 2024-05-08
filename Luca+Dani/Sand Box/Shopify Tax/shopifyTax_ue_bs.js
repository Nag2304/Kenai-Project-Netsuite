/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(["N/record", "N/log"], function (record, log) {
  var exports = {};
  /* ------------------------ Before Submit Script Begin ------------------------ */
  function beforeSubmit(scriptContext) {
    var rec = scriptContext.newRecord;
    try {
      //Get ETAIL DISCOUNT TOTAL VARIANCE
      var etailDiscountTotalVariance = rec.getValue({
        fieldId: "custbody_celigo_etail_disc_total_var",
      });
      //get orderstatus
      var orderStatus = rec.getValue({
        fieldId: "orderstatus",
      });
      if (orderStatus === "D") {
        //check if the sales order has any related records.
        var linksItemCount = rec.getLineCount({ sublistId: "links" });
        /* --------------------------- Links Sublist Begin --------------------------- */
        for (var k = 0; k < linksItemCount; k++) {
          var linksId = rec.getSublistValue({
            sublistId: "links",
            fieldId: "id",
            line: k,
          });
          // var linksType = rec.getSublistValue({
          //   sublistId: "links",
          //   fieldId: "type",
          //   line: k,
          // });
          // var linksTranId = rec.getSublistValue({
          //   sublistId: "links",
          //   fieldId: "tranid",
          //   line: k,
          // });
          log.debug({
            title: "Cash Sale Record",
            details: [linksId],
          });
          if (linksId) {
            /* ----------------------------- Cash Sale Begin ---------------------------- */
            var cashSaleRecord = record.load({
              type: "cashsale",
              id: Number(linksId),
              isDynamic: true,
            });
            //Cash Item Line Count
            var cashSaleLineItemCount = cashSaleRecord.getLineCount({
              sublistId: "item",
            });
            log.debug({
              title: "cash sale line item count",
              details: cashSaleLineItemCount,
            });
            ///Get ETAIL DISCOUNT TOTAL VARIANCE from Cash Sale
            var etailDiscountTotalVarianceCashSale = cashSaleRecord.getValue({
              fieldId: "custbody_celigo_etail_disc_total_var",
            });
            log.debug({
              title: "cash sale discount",
              details: etailDiscountTotalVarianceCashSale,
            });

            for (var n = 0; n < cashSaleLineItemCount; n++) {
              /* --------------------------- Cash Sublist Begin --------------------------- */
              var itemRecordDisplay = cashSaleRecord.getSublistValue({
                sublistId: "item",
                fieldId: "item_display",
                line: n,
              });
              var itemRecordRate = cashSaleRecord.getSublistValue({
                sublistId: "item",
                fieldId: "rate",
                line: n,
              });
              var itemRecordRateAbs = Math.abs(itemRecordRate);
              log.debug({
                title: "Cash Sale Item",
                details: itemRecordDisplay,
              });
              if (itemRecordDisplay === "Shopify Tax Variance") {
                if (itemRecordRateAbs > 0.05) {
                  cashSaleRecord.removeLine({
                    sublistId: "item",
                    line: n,
                    ignoreRecalc: true,
                  });

                  cashSaleRecord.setValue({
                    fieldId: "discountitem",
                    value: 208,
                  });
                  cashSaleRecord.setValue({
                    fieldId: "discountrate",
                    value: Number(etailDiscountTotalVarianceCashSale),
                  });
                  break;
                }
              }
              /* --------------------------- Cash Sublist End --------------------------- */
            }
            cashSaleRecord.save({
              enableSourcing: true,
              ignoreMandatoryFields: true,
            });
            /* ----------------------------- Cash Sale End ---------------------------- */
          }
          break;
        }
        /* --------------------------- Links Sublist End --------------------------- */
      }

      //Line Item Count
      var lineItemCount = rec.getLineCount({ sublistId: "item" });
      /* --------------------------- Item Sublist Begin --------------------------- */
      for (var i = 0; i < lineItemCount; i++) {
        var itemRecordDisplay = rec.getSublistValue({
          sublistId: "item",
          fieldId: "item_display",
          line: i,
        });
        var itemRecordRate = rec.getSublistValue({
          sublistId: "item",
          fieldId: "rate",
          line: i,
        });
        var itemRecordRateAbs = Math.abs(itemRecordRate);
        if (itemRecordDisplay === "Shopify Tax Variance") {
          if (itemRecordRateAbs > 0.05) {
            rec.removeLine({
              sublistId: "item",
              line: i,
              ignoreRecalc: true,
            });

            rec.setValue({ fieldId: "discountitem", value: 208 });
            rec.setValue({
              fieldId: "discountrate",
              value: Number(etailDiscountTotalVariance),
            });
            break;
          }
        }

        /* --------------------------- Item Sublist End --------------------------- */
      }
    } catch (err) {
      log.debug({ title: "Shopify Tax Failed to Load", details: err });
    }
  }
  /* ------------------------ Before Sumbit Script End ------------------------ */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.beforeSubmit = beforeSubmit;
  return exports;
  /* ------------------------------ Exports End ----------------------------- */
});
