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
    const strLoggerTitle = ' Before Load ';
    log.audit(
      strLoggerTitle,
      '|>----------------' + strLoggerTitle + '-Entry----------------<|'
    );
    //
    try {
    } catch (error) {
      log.error(strLoggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      strLoggerTitle,
      '|>----------------' + strLoggerTitle + '-Exit----------------<|'
    );
  };
  /* ---------------------------- Before Load - End --------------------------- */
  //
  /* -------------------------- Before Submit - Begin ------------------------- */
  const beforeSubmit = (context) => {
    const strLoggerTitle = ' Before Submit ';
    log.audit(
      strLoggerTitle,
      '|>----------------' + strLoggerTitle + '-Entry----------------<|'
    );
    //
    try {
      const itemFulfillmentRecord = context.newRecord;
      // Sales Channel
      const salesChannel = itemFulfillmentRecord.getValue({
        fieldId: 'cseg_rbb_channel',
      });
      log.debug(strLoggerTitle, ' Sales Channel: ' + salesChannel);
      //

      // Created From
      const createdFrom = itemFulfillmentRecord.getValue({
        fieldId: 'createdfrom',
      });
      log.debug(strLoggerTitle, ' Created From: ' + createdFrom);
      //

      /* --------------------- Load Sales Order Record - Begin -------------------- */
      const soRecord = record.load({
        type: record.Type.SALES_ORDER,
        id: createdFrom,
      });
      let ifAmount = 0;
      const soLineCount = soRecord.getLineCount({ sublistId: 'item' });
      for (let index = 0; index < soLineCount; index++) {
        const amount = soRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'amount',
          line: index,
        });
        ifAmount += amount;
      }
      /* ---------------------- Load Sales Order Record - End --------------------- */
      //
      // Sales Channel = Indie
      if (
        salesChannel == '5' &&
        ifAmount > 0 &&
        ifAmount >= 250 &&
        ifAmount < 500
      ) {
        itemFulfillmentRecord.setValue({
          fieldId: 'shippingcost',
          value: 19.95,
        });
      }
    } catch (error) {
      log.error(strLoggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      strLoggerTitle,
      '|>----------------' + strLoggerTitle + '-Exit----------------<|'
    );
  };
  /* --------------------------- Before Submit - End -------------------------- */
  //
  /* -------------------------- After Submit - Begin -------------------------- */
  const afterSubmit = (context) => {
    const strLoggerTitle = ' After Submit ';
    log.audit(
      strLoggerTitle,
      '|>----------------' + strLoggerTitle + '-Entry----------------<|'
    );
    //
    try {
    } catch (error) {
      log.error(strLoggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      strLoggerTitle,
      '|>----------------' + strLoggerTitle + '-Exit----------------<|'
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
