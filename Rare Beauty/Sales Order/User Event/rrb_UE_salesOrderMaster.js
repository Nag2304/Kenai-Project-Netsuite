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
      const salesOrderRecord = context.newRecord;

      // Sales Channel
      const salesChannel = salesOrderRecord.getValue({
        fieldId: 'cseg_rbb_channel',
      });
      log.debug(strLoggerTitle, ' Sales Channel: ' + salesChannel);
      //

      let soAmount = 0;
      const soLineCount = salesOrderRecord.getLineCount({ sublistId: 'item' });
      for (let index = 0; index < soLineCount; index++) {
        const amount = salesOrderRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'amount',
          line: index,
        });
        soAmount += amount;
      }

      log.debug(strLoggerTitle, ' Sales Amount: ' + soAmount);
      // Sales Channel = Indie
      if (
        salesChannel == '5' &&
        soAmount > 0 &&
        soAmount >= 250 &&
        soAmount < 500
      ) {
        salesOrderRecord.setValue({
          fieldId: 'shippingcost',
          value: 19.95,
        });
      }
      //
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
  const afterSubmit = (scriptContext) => {
    const strLoggerTitle = ' After Submit ';
    log.audit(
      strLoggerTitle,
      '|>----------------' + strLoggerTitle + '-Entry----------------<|'
    );
    //
    try {
      if (scriptContext.type !== scriptContext.UserEventType.DELETE) {
        const salesOrderRecordId = scriptContext.newRecord.id;
        //
        const salesOrderRecord = record.load({
          type: 'salesorder',
          id: salesOrderRecordId,
        });

        const location = salesOrderRecord.getValue({ fieldId: 'location' });

        const shipAddress = salesOrderRecord.getValue({
          fieldId: 'shipaddress',
        });

        log.debug(strLoggerTitle, { location, shipAddress });

        if (location === '6' && shipAddress.includes('United Kingdom')) {
          const salesOrderLineCount = salesOrderRecord.getLineCount({
            sublistId: 'item',
          });
          const salesOrderTotal = salesOrderRecord.getValue({
            fieldId: 'total',
          });
          log.debug(strLoggerTitle, { salesOrderTotal });
          //
          /* --------------------------- Line Count - Begin --------------------------- */
          for (let index = 0; index < salesOrderLineCount; index++) {
            const vatLine = salesOrderRecord.findSublistLineWithValue({
              sublistId: 'item',
              fieldId: 'item',
              value: 1620,
            });

            log.debug(strLoggerTitle, 'Vat line Found ' + vatLine);
            if (index === salesOrderLineCount - 1 && vatLine === -1) {
              log.debug(strLoggerTitle, ' Adding new VAT line');
              //
              const lastIndex = salesOrderLineCount;
              salesOrderRecord.insertLine({
                sublistId: 'item',
                line: lastIndex,
              });
              salesOrderRecord.setSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                value: 1620,
                line: lastIndex,
              });
              const vatTotal = ((20 * salesOrderTotal) / 100).toFixed(2);

              log.debug(strLoggerTitle, 'VAT Total: ' + vatTotal);

              salesOrderRecord.setSublistValue({
                sublistId: 'item',
                fieldId: 'rate',
                value: vatTotal,
                line: lastIndex,
              });
              salesOrderRecord.setSublistValue({
                sublistId: 'item',
                fieldId: 'amount',
                value: vatTotal,
                line: lastIndex,
              });
            }
          }
          /* --------------------------- Line Count - End --------------------------- */
          //
        }
        salesOrderRecord.save();
        log.debug(strLoggerTitle, 'Sales Order Record Saved Successfully');
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
  /* --------------------------- After Submit - End --------------------------- */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.beforeLoad = beforeLoad;
  exports.beforeSubmit = beforeSubmit;
  exports.afterSubmit = afterSubmit;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
