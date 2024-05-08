/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

/*global define,log*/

define(['N/record', 'N/search', 'N/format'], (record, search, format) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ------------------------- BeforeSubmit - Begin ------------------------ */
  const beforeSubmit = (scriptContext) => {
    const strLoggerTitle = 'Before Submit';
    try {
      log.debug(strLoggerTitle, '|>------------Entry------------<|');
      //
      const vbRecord = scriptContext.newRecord;

      if (scriptContext.type === scriptContext.UserEventType.CREATE) {
        const postingPeriodId = vbRecord.getValue({
          fieldId: 'postingperiod',
        });

        const billDate = vbRecord.getValue({
          fieldId: 'trandate',
        });

        const postingPeriodSearch = search
          .create({
            type: search.Type.ACCOUNTING_PERIOD,
            columns: ['startdate'],
            filters: [['internalid', 'anyof', postingPeriodId]],
          })
          .run()
          .getRange({ start: 0, end: 1 });

        if (postingPeriodSearch.length > 0) {
          const startDate = postingPeriodSearch[0].getValue('startdate');
          // Convert the start date to a JavaScript Date object
          const startDateObj = format.parse({
            value: startDate,
            type: format.Type.DATE,
          });
          // If the bill date is before the posting period start date, set it to the start date
          if (billDate < startDateObj) {
            vbRecord.setValue({
              fieldId: 'trandate',
              value: startDateObj,
            });
          }
        }
      }

      const poDiscountText = vbRecord.getText({
        fieldId: 'custbody_wdym_po_discount',
      });
      const poDiscountValue = parseFloat(poDiscountText.split('%')[0]);
      log.debug(
        strLoggerTitle,
        `PO DISCOUNT VALUE: ${poDiscountValue} PO DISCOUNT TEXT: ${poDiscountText}`
      );

      // Check if header level discount item is populated.

      // Remove discount line
      const discLineNumber = vbRecord.findSublistLineWithValue({
        sublistId: 'item',
        fieldId: 'itemtype',
        value: 'Discount',
      });

      if (discLineNumber !== -1) {
        vbRecord.removeLine({
          sublistId: 'item',
          line: discLineNumber,
          ignoreRecalc: true,
        });
        log.debug(strLoggerTitle, 'Discount line found and removed');
      }
      //
      const lineItemCount = vbRecord.getLineCount({ sublistId: 'item' });
      for (let index = 0; index < lineItemCount; index++) {
        // No discount item found add discount item at the end.
        log.debug(
          strLoggerTitle,
          `Index: ${index} LineItemCount: ${lineItemCount}`
        );
        // Get Item Qty
        const itemQty = vbRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'quantity',
          line: index,
        });
        //

        // Get Item Amount
        let itemAmount = vbRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'amount',
          line: index,
        });
        //

        // Get Item Rate
        let itemRate = vbRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'rate',
          line: index,
        });
        //

        if (poDiscountText) {
          const netAmount = itemAmount - itemAmount * (poDiscountValue / 100);
          const netRate = (netAmount / itemQty).toFixed(3);

          // discountAmountTotal += netAmount;
          log.debug(
            strLoggerTitle,
            `Net Rate: ${netRate} Net Amount: ${netAmount} Item Amount: ${itemAmount} Item Qty: ${itemQty}`
          );
          //
          // Set Custom Field Values - Net Rate and Net Amount
          vbRecord.setSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_wdym_po_netrate',
            value: netRate,
            line: index,
          });
          vbRecord.setSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_wdym_po_netamt',
            value: netAmount,
            line: index,
          });
        } else {
          // Set Custom Field Values - Net Rate and Net Amount
          vbRecord.setSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_wdym_po_netrate',
            value: itemRate,
            line: index,
          });
          vbRecord.setSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_wdym_po_netamt',
            value: itemAmount,
            line: index,
          });
        }
      }

      log.debug(strLoggerTitle, '|>------------Exit------------<|');
    } catch (error) {
      log.error(strLoggerTitle + ' caught an exception', error);
    }
  };
  /* -------------------------- BeforeSubmit - End ------------------------- */
  //
  /* -------------------------- After Submit - Begin -------------------------- */
  const afterSubmit = (scriptContext) => {
    const strLoggerTitle = 'After Submit';
    try {
      log.debug(strLoggerTitle, '|>------------Entry------------<|');
      //
      const vbRecord = record.load({
        type: record.Type.VENDOR_BILL,
        id: scriptContext.newRecord.id,
      });

      if (vbRecord) {
        const poDiscountItemInternalId = vbRecord.getValue({
          fieldId: 'custbody_wdym_po_discount',
        });

        const poDiscountText = vbRecord.getText({
          fieldId: 'custbody_wdym_po_discount',
        });
        const poDiscountValue = parseFloat(poDiscountText.split('%')[0]);
        const lineItemCount = vbRecord.getLineCount({ sublistId: 'item' });

        let netAmountTotal = 0;

        for (let index = 0; index < lineItemCount; index++) {
          log.debug(
            strLoggerTitle,
            `Index: ${index} LineItemCount: ${lineItemCount}`
          );

          // Get Item Amount
          const itemAmount = vbRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'amount',
            line: index,
          });

          const netAmount = vbRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_wdym_po_netamt',
            line: index,
          });
          //

          log.debug(
            strLoggerTitle,
            `Net Amount: ${netAmount} item Amount: ${itemAmount}`
          );
          //

          // discountAmountTotal += netAmount;
          netAmountTotal += itemAmount;
          //

          // No discount item found add discount item at the end.
          if (index == lineItemCount - 1 && poDiscountText) {
            log.debug(strLoggerTitle, ' Adding new discount line');
            const lastIndex = lineItemCount;
            // Insert Discount Line
            vbRecord.insertLine({
              sublistId: 'item',
              line: lastIndex,
            });
            vbRecord.setSublistValue({
              sublistId: 'item',
              fieldId: 'item',
              value: poDiscountItemInternalId,
              line: lastIndex,
            });
            const discountAmountTotal = (
              netAmountTotal *
              (poDiscountValue / 100) *
              -1
            ).toFixed(2);

            log.debug(
              strLoggerTitle,
              ` Discount Amount Total: ${discountAmountTotal} Net Amount Total from discount line: ${netAmountTotal}`
            );

            vbRecord.setSublistValue({
              sublistId: 'item',
              fieldId: 'rate',
              value: discountAmountTotal,
              line: lastIndex,
            });
            vbRecord.setSublistValue({
              sublistId: 'item',
              fieldId: 'amount',
              value: discountAmountTotal,
              line: lastIndex,
            });

            //
          }
        }

        vbRecord.save();
      }
      log.debug(strLoggerTitle, '|>------------Exit------------<|');
    } catch (error) {
      log.error(strLoggerTitle + ' caught an exception', error);
    }
  };
  /* --------------------------- After Submit - End --------------------------- */
  //
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.beforeSubmit = beforeSubmit;
  exports.afterSubmit = afterSubmit;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
  //
});
