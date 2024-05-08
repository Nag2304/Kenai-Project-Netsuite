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
      '|>---------------------' +
        strLoggerTitle +
        '- Entry---------------------<|'
    );
    //
    try {
    } catch (error) {
      log.error(strLoggerTitle + ' Caught with an exception', error);
    }
    //
    log.audit(
      strLoggerTitle,
      '|>---------------------' +
        strLoggerTitle +
        '- Exit---------------------<|'
    );
  };
  /* ---------------------------- Before Load - End --------------------------- */
  //
  /* -------------------------- Before Submit - Begin ------------------------- */
  const beforeSubmit = (context) => {
    const strLoggerTitle = ' Before Submit ';
    log.audit(
      strLoggerTitle,
      '|>---------------------' +
        strLoggerTitle +
        '- Entry---------------------<|'
    );
    //
    try {
      const irRecord = context.newRecord;
      const createdFromRecord = irRecord.getValue({ fieldId: 'createdfrom' });
      const irItemArr = [];
      let rate = 0;
      //
      /* ---------------------- Item Receipt Record  - Begin ---------------------- */
      const irLineItemCount = irRecord.getLineCount({ sublistId: 'item' });
      for (let index = 0; index < irLineItemCount; index++) {
        const item = irRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'item',
          line: index,
        });
        irItemArr.push(item);
      }
      log.debug(strLoggerTitle + ' Item Receipt Array', irItemArr);
      /* ------------------------ Item Receipt Record - End ----------------------- */
      //
      /* ------------------------- Purchase Order - Begin ------------------------- */
      const poRecord = record.load({
        type: record.Type.PURCHASE_ORDER,
        id: createdFromRecord,
        isDynamic: false,
      });
      const poLineItemCount = poRecord.getLineCount({ sublistId: 'item' });
      for (let index1 = 0; index1 < poLineItemCount; index1++) {
        const poItem = poRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'item',
          line: index1,
        });
        if (irItemArr.includes(poItem)) {
          rate = poRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'rate',
            line: index1,
          });
          break;
        }
      }
      /* ------------------------- Purchase Order - End ------------------------- */
      //
      log.debug(strLoggerTitle + ' Rate ', ' Rate Value: ' + rate);
      if (rate) {
        irRecord.setValue({ fieldId: 'custbody_dm_originalrate', value: rate });
      }
    } catch (error) {
      log.error(strLoggerTitle + ' Caught with an exception', error);
    }
    //
    log.audit(
      strLoggerTitle,
      '|>---------------------' +
        strLoggerTitle +
        '- Exit---------------------<|'
    );
  };
  /* --------------------------- Before Submit - End -------------------------- */
  //
  /* -------------------------- After Submit - Begin -------------------------- */
  const afterSubmit = (context) => {
    const strLoggerTitle = ' After Submit ';
    log.audit(
      strLoggerTitle,
      '|>---------------------' +
        strLoggerTitle +
        '- Entry---------------------<|'
    );
    //
    try {
    } catch (error) {
      log.error(strLoggerTitle + ' Caught with an exception', error);
    }
    //
    log.audit(
      strLoggerTitle,
      '|>---------------------' +
        strLoggerTitle +
        '- Exit---------------------<|'
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
  //
});
