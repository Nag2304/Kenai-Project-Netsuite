/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
/*global define,log*/

define(['N/record'], (record) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* --------------------------- Before Load - Begin -------------------------- */
  const beforeLoad = (context) => {
    const loggerTitle = 'Before Load';
    log.audit(
      loggerTitle,
      '|>-----------------' + loggerTitle + '- Entry-----------------<|'
    );
    //
    try {
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>-----------------' + loggerTitle + '- Exit-----------------<|'
    );
  };
  /* ---------------------------- Before Load - End --------------------------- */
  //
  /* -------------------------- Before Submit - Begin ------------------------- */
  const beforeSubmit = (context) => {
    const loggerTitle = 'Before Submit';
    log.audit(
      loggerTitle,
      '|>-----------------' + loggerTitle + '- Entry-----------------<|'
    );
    //
    try {
      log.debug(loggerTitle, 'Context Type: ' + context.type);
      //

      const purchaseOrderRecord = context.newRecord;
      //
      const poLineItemCount = purchaseOrderRecord.getLineCount({
        sublistId: 'item',
      });

      for (let index = 0; index < poLineItemCount; index++) {
        const item = purchaseOrderRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'item',
          line: index,
        });
        const itemType = purchaseOrderRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'itemtype',
          line: index,
        });
        let recItem;
        if (itemType == 'InvtPart') {
          recItem = record.load({
            type: record.Type.INVENTORY_ITEM,
            id: item,
          });
        }
        //
        log.debug(loggerTitle + ' Item Fields', { item, itemType, recItem });
        //
        let itemPrice;
        if (recItem) {
          const lineCount = recItem.getLineCount({ sublistId: 'price1' });
          //

          //
          for (let index1 = 0; index1 < lineCount; index1++) {
            const priceLevelName = recItem.getSublistValue({
              sublistId: 'price1',
              fieldId: 'pricelevelname',
              line: index1,
            });
            log.debug(loggerTitle + ' Price Levels', priceLevelName);
            if (priceLevelName === 'Ecommerce (MSRP)') {
              itemPrice = recItem.getSublistValue({
                sublistId: 'price1',
                fieldId: 'price_1_',
                line: index1,
              });
              log.debug(loggerTitle, 'Item price: ' + itemPrice);
            }
          }
        }
        if (itemPrice) {
          purchaseOrderRecord.setSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_ecom_retail_price',
            line: index,
            value: itemPrice,
          });
        }
      }
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>-----------------' + loggerTitle + '- Exit-----------------<|'
    );
  };
  /* --------------------------- Before Submit - End -------------------------- */
  //
  /* -------------------------- After Submit - Begin -------------------------- */
  const afterSubmit = (context) => {
    const loggerTitle = 'After Submit';
    log.audit(
      loggerTitle,
      '|>-----------------' + loggerTitle + '- Entry-----------------<|'
    );
    //
    try {
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>-----------------' + loggerTitle + '- Exit-----------------<|'
    );
  };
  /* --------------------------- After Submit - End --------------------------- */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.beforeLoad = beforeLoad;
  exports.beforeSubmit = beforeSubmit;
  exports.afterSubmit = afterSubmit;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
