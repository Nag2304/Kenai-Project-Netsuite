/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
/*global define,log*/

define(['N/search'], (search) => {
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
      if (context.type === context.UserEventType.CREATE) {
        const invoiceRecord = context.newRecord;
        //

        const createdFrom = invoiceRecord.getValue({ fieldId: 'createdfrom' });

        const salesOrderSearchFields = search.lookupFields({
          type: search.Type.SALES_ORDER,
          id: createdFrom,
          columns: ['class'],
        });

        const salesChannel = salesOrderSearchFields.class[0].value;

        log.debug(loggerTitle, 'Sales Channel :' + salesChannel);

        if (salesChannel === '1') {
          const shipDate = invoiceRecord.getValue({ fieldId: 'shipdate' });

          if (shipDate) {
            invoiceRecord.setValue({ fieldId: 'trandate', value: shipDate });
          }
        }
      }
      //
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
