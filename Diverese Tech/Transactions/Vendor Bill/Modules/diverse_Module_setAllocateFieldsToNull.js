/**
 * @NApiVersion 2.x
 * @NModuleScope SameAccount
 */

/**
 * File name: diverse_Module_setAllocateFieldsToNull.js
 * Author           Date       Version               Remarks
 * nagendrababu  19th Aug 2024  1.00           Initial creation of the script.
 *
 */

/* global define,log */

define([], () => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ------------------- Set Allocate Fields To Null - Begin ------------------ */
  const setAllocateFieldsToNull = (scriptContext) => {
    const loggerTitle = ' Set Allocate Fields To Null ';
    log.debug(loggerTitle, '|>--------' + loggerTitle + ' -Entry--------<|');
    //
    try {
      if (
        scriptContext.type === scriptContext.UserEventType.CREATE ||
        scriptContext.type === scriptContext.UserEventType.EDIT
      ) {
        const vbRecord = scriptContext.newRecord;
        //
        const allocateCheckBxBtn = vbRecord.getValue({
          fieldId: 'custbody_dct_allocate',
        });
        const allocationAmount = vbRecord.getValue({
          fieldId: 'custbody_dct_allocation_amount',
        });
        const allocationAccount = vbRecord.getValue({
          fieldId: 'custbody_dct_allocation_acct',
        });
        log.debug(loggerTitle, {
          allocateCheckBxBtn,
          allocationAccount,
          allocationAmount,
        });
        //
        // Set Fields to Null
        if (allocateCheckBxBtn) {
          vbRecord.setValue({ fieldId: 'custbody_dct_allocate', value: false });
        }

        if (allocationAmount) {
          vbRecord.setValue({
            fieldId: 'custbody_dct_allocation_amount',
            value: 0,
          });
        }

        if (allocationAccount) {
          vbRecord.setValue({
            fieldId: 'custbody_dct_allocation_acct',
            value: '',
          });
        }
        //
      }
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
    //
    log.debug(loggerTitle, '|>--------' + loggerTitle + ' -Exit--------<|');
  };
  /* ------------------- Set Allocate Fields To Null - End ------------------ */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.beforeSubmit = setAllocateFieldsToNull;
  return exports;
  /* ------------------------------- Exports End ------------------------------ */
});
