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
      if (
        context.type !== context.UserEventType.CREATE ||
        context.type !== context.UserEventType.EDIT
      ) {
        const salesOrderRecord = context.newRecord;
        //
        const customerID = parseInt(
          salesOrderRecord.getValue({ fieldId: 'custbody8' })
        );
        const customerIDCheck = isNaN(customerID);

        log.debug(loggerTitle, { customerID, customerIDCheck });

        if (!customerIDCheck) {
          const customerLookUpFields = search.lookupFields({
            type: search.Type.CUSTOMER,
            id: customerID,
            columns: ['custentity_customer_region', 'custentity_customer_type'],
          });
          const customerRegion =
            customerLookUpFields[0].custentity_customer_region.value;
          const customerType =
            customerLookUpFields[0].custentity_customer_type.value;
          //
          salesOrderRecord.setValue({ fieldId: 'entity', value: customerID });
          salesOrderRecord.setValue({
            fieldId: 'custbody_ccc_ws_cust_updated',
            value: true,
          });
          salesOrderRecord.setValue({
            fieldId: 'department',
            value: customerRegion,
          });
          salesOrderRecord.setValue({ fieldId: ' class', value: customerType });
        }
        //
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
