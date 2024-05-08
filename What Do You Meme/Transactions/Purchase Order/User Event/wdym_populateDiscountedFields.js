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
  /* -------------------------- Before Submit - Begin ------------------------- */
  const beforeSubmit = (scriptContext) => {
    const strLoggerTitle = ' Before Submit';
    log.audit(
      strLoggerTitle,
      '|>-----------------' + strLoggerTitle + ' - Entry-----------------<|'
    );
    //
    try {
      const poRecord = scriptContext.newRecord;
      const isCreate =
        scriptContext.type === scriptContext.UserEventType.CREATE;
      const isUpdate = scriptContext.type === scriptContext.UserEventType.EDIT;
      const runDateUpdates = poRecord.getValue({
        fieldId: 'custbody_wdym_run_date_updates',
      });
      const receiveByDate = poRecord.getValue({ fieldId: 'duedate' });
      const lineItemCount = poRecord.getLineCount({ sublistId: 'item' });
      const createdFrom = poRecord.getValue({ fieldId: 'createdfrom' });
      //
      // Create
      if (isCreate) {
        for (let index = 0; index < lineItemCount; index++) {
          // Get Item Qty
          const itemQty = poRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'quantity',
            line: index,
          });

          const item = poRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'item',
            line: index,
          });

          const itemType = poRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'itemtype',
            line: index,
          });

          if (itemType == 'InvtPart') {
            const inventoryItemSearch = search.lookupFields({
              type: search.Type.INVENTORY_ITEM,
              id: item,
              columns: ['custitem_refresh_date'],
            });
            let refreshDate = inventoryItemSearch.custitem_refresh_date;
            if (refreshDate) {
              refreshDate = format.parse({
                value: refreshDate,
                type: format.Type.DATE,
              });
              poRecord.setSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_refresh_date',
                value: refreshDate,
                line: index,
              });
            }
          }

          if (receiveByDate) {
            // Set Expected Receipt Date
            poRecord.setSublistValue({
              sublistId: 'item',
              fieldId: 'expectedreceiptdate',
              value: receiveByDate,
              line: index,
            });
          }

          // Set Original Order Qty
          poRecord.setSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_wdym_orig_order_qty',
            value: itemQty,
            line: index,
          });
        }
        //
        if (createdFrom) {
          let lineLevelExpectedReceiveDate = null;
          for (let index1 = 0; index1 < lineItemCount; index1++) {
            lineLevelExpectedReceiveDate = poRecord.getSublistValue({
              sublistId: 'item',
              fieldId: 'expectedreceiptdate',
              line: index1,
            });
            log.debug(
              strLoggerTitle,
              ' Line Level Receive Date: ' + lineLevelExpectedReceiveDate
            );
          }
          if (lineLevelExpectedReceiveDate) {
            poRecord.setValue({
              fieldId: 'custbody_ex_factory_date',
              value: lineLevelExpectedReceiveDate,
            });
            log.debug(strLoggerTitle, 'Set Line Level Value');
          }
        }

        //
      }
      // Edit
      else if (isUpdate && runDateUpdates) {
        for (let index1 = 0; index1 < lineItemCount; index1++) {
          poRecord.setSublistValue({
            sublistId: 'item',
            fieldId: 'expectedreceiptdate',
            value: receiveByDate,
            line: index1,
          });
        }
      }
      //
    } catch (error) {
      log.error(strLoggerTitle + ' caught an exception', error);
    }
    //
    log.audit(
      strLoggerTitle,
      '|>-----------------' + strLoggerTitle + ' - Exit-----------------<|'
    );
  };
  /* --------------------------- Before Submit - End -------------------------- */
  //
  /* ------------------------- AfterSubmit - Begin ------------------------ */
  const afterSubmit = (scriptContext) => {
    const strLoggerTitle = ' After Submit';
    let netAmountTotal = 0;
    try {
      log.debug(strLoggerTitle, '|>------------Entry------------<|');
      //
      const poRecord = record.load({
        type: record.Type.PURCHASE_ORDER,
        id: scriptContext.newRecord.id,
        isDynamic: true,
      });

      const isCreate =
        scriptContext.type === scriptContext.UserEventType.CREATE;
      // Set Ex factory Date
      const createdFrom = poRecord.getValue({ fieldId: 'createdfrom' });
      //const createdFromText = poRecord.getText({ fieldId: 'createdfrom' });
      log.debug(strLoggerTitle, { createdFrom });

      const lineItemCount = poRecord.getLineCount({ sublistId: 'item' });

      //

      const poDiscountItemInternalId = poRecord.getValue({
        fieldId: 'custbody_wdym_po_discount',
      });

      const poDiscountText = poRecord.getText({
        fieldId: 'custbody_wdym_po_discount',
      });
      const poDiscountValue = parseFloat(poDiscountText.split('%')[0]);
      log.debug(
        strLoggerTitle,
        `PO DISCOUNT VALUE: ${poDiscountValue} PO DISCOUNT TEXT: ${poDiscountText} PO DISCOUNT ITEM INTERNAL ID: ${poDiscountItemInternalId}`
      );

      for (let index = 0; index < lineItemCount; index++) {
        // No discount item found add discount item at the end.
        log.debug(
          strLoggerTitle,
          `Index: ${index} LineItemCount: ${lineItemCount}`
        );

        poRecord.selectLine({ sublistId: 'item', line: index });

        // Get Item Qty
        const itemQty = poRecord.getCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'quantity',
        });
        //

        // Get Item Amount
        let itemAmount = poRecord.getCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'amount',
        });
        //

        // Get Item Rate
        let itemRate = poRecord.getCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'rate',
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
          poRecord.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_wdym_po_netrate',
            value: netRate,
          });
          poRecord.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_wdym_po_netamt',
            value: netAmount,
          });
        } else {
          // Set Custom Field Values - Net Rate and Net Amount
          poRecord.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_wdym_po_netrate',
            value: itemRate,
          });
          poRecord.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_wdym_po_netamt',
            value: itemAmount,
          });
        }

        //
        netAmountTotal += itemAmount;
        //
        poRecord.commitLine({ sublistId: 'item' });
        //
        if (index == lineItemCount - 1 && poDiscountText) {
          log.debug(strLoggerTitle, ' Adding new discount line');
          // Insert Discount Line
          poRecord.selectNewLine({
            sublistId: 'item',
          });
          poRecord.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'item',
            value: poDiscountItemInternalId,
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

          poRecord.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'rate',
            value: discountAmountTotal,
          });
          poRecord.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'amount',
            value: discountAmountTotal,
          });
          poRecord.commitLine({
            sublistId: 'item',
          });
          //
        }
      }

      for (let index1 = 0; index1 < lineItemCount; index1++) {
        poRecord.selectLine({ sublistId: 'item', line: index1 });

        // Get Item
        const item = poRecord.getCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'item',
        });

        // Get the Item Related Fields
        const itemLookUpFields = search.lookupFields({
          type: search.Type.INVENTORY_ITEM,
          id: String(item),
          columns: ['custitem_wdym_rfid', 'itemid'],
        });
        const itemNameRFID = itemLookUpFields.itemid;
        const isRFID = itemLookUpFields.custitem_wdym_rfid;

        // const lineSearchRFID = poRecord.findSublistLineWithValue({
        //   sublistId: 'item',
        //   fieldId: 'item',
        //   value: 2825,
        // });

        const lineSearchRFIDDescription = poRecord.findSublistLineWithValue({
          sublistId: 'item',
          fieldId: 'description',
          value: itemNameRFID,
        });

        log.debug(
          strLoggerTitle,
          `isRFID: ${isRFID} lineSearchRFIDDescription: ${lineSearchRFIDDescription}`
        );

        if (isRFID && lineSearchRFIDDescription === -1) {
          log.debug(strLoggerTitle, ' Adding new RFID Line');

          // Get Item Qty
          const itemQtyRFID = poRecord.getCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'quantity',
          });

          poRecord.selectNewLine({
            sublistId: 'item',
          });
          poRecord.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'item',
            value: 2825,
          });
          poRecord.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'description',
            value: itemNameRFID,
          });
          poRecord.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'quantity',
            value: itemQtyRFID,
          });
          poRecord.commitLine({
            sublistId: 'item',
          });
          log.debug(strLoggerTitle, ' Finished adding new RFID Line');
        }
      }

      // if (total) {
      //   poRecord.setValue({ fieldId: 'total', value: total });
      // }

      poRecord.save();
      log.debug(strLoggerTitle, '|>------------Exit------------<|');
    } catch (error) {
      log.error(strLoggerTitle + ' caught an exception', error);
    }
  };
  /* -------------------------- AfterSubmit - End ------------------------- */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.beforeSubmit = beforeSubmit;
  exports.afterSubmit = afterSubmit;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
  //
});
