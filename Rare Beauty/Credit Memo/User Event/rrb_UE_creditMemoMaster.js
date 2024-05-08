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
      if (
        context.type === context.UserEventType.CREATE ||
        context.type === context.UserEventType.EDIT
      ) {
        const newRecord = context.newRecord;

        // Get the currency value from the Credit Memo record
        const currency = newRecord.getValue({ fieldId: 'currency' });
        log.debug(strLoggerTitle, ' Currency: ' + currency);

        // Check if the currency is GBP or EUR
        if (currency === '2') {
          // Set the Account field to '1101 Accounts Receivable - GBP'
          newRecord.setValue({ fieldId: 'account', value: '217' });
        } else if (currency === '4') {
          // Set the Account field to '1102 Accounts Receivable - EUR'
          newRecord.setValue({ fieldId: 'account', value: '644' });
        }
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
  const afterSubmit = (scriptContext) => {
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
