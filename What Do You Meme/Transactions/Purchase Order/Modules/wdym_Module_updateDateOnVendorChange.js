/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 */

/**
 * File name: wdym_Module_updateDateOnVendorChange.js
 * Author           Date       Version               Remarks
 * nagendrababu 06.28.2025      1.00       Initial creation of the script
 *
 */

/* global define,log */

define([], () => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  const REQUISITION_VENDOR_ID = '7613';
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ------------------ Update Date On Vendor Change - Begin ------------------ */
  const updateDateOnVendorChange = (context) => {
    const loggerTitle = ' Update Date on Vendor Change ';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      const eventType = context.type;
      if (eventType !== context.UserEventType.EDIT) {
        return;
      }

      const newRec = context.newRecord;
      const oldRec = context.oldRecord;

      const newVendorId = newRec.getValue({ fieldId: 'entity' });
      const oldVendorId = oldRec.getValue({ fieldId: 'entity' });

      log.debug(loggerTitle, {
        oldVendorId,
        newVendorId,
      });

      // Check if vendor was changed from 7613 to something else
      if (
        oldVendorId &&
        oldVendorId.toString() === REQUISITION_VENDOR_ID &&
        newVendorId &&
        newVendorId.toString() !== REQUISITION_VENDOR_ID
      ) {
        const today = new Date();
        newRec.setValue({
          fieldId: 'trandate',
          value: today,
        });
        log.audit(
          loggerTitle,
          `Vendor changed from 7613 to ${newVendorId}. trandate set to today.`
        );
      }
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
    //
  };
  /* ------------------- Update Date on Vendor Change - End ------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.beforeSubmit = updateDateOnVendorChange;
  return exports;
  /* ------------------------------- Exports End ------------------------------ */
});
