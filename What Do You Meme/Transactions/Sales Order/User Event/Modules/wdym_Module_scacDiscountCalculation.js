/**
 * @NApiVersion 2.x
 * @NModuleScope SameAccount
 */

/**
 * File name: wdym_Module_scacDiscountCalculation.js
 * Author           Date       Version               Remarks
 * nagendrababu 27th Aug 2024   1.00        Initial Creation of the script
 *
 */

/* global define,log */

define([], () => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ------------------------ SCAC Calculation - Begin ------------------------ */
  /**
   *
   * @param {object} context
   * @returns {boolean}
   */
  const scacCalculation = (context) => {
    const loggerTitle = ' SCAC Calculation ';
    log.debug(
      loggerTitle,
      '|>--------------------' + loggerTitle + '-Entry--------------------<|'
    );
    //
    try {
      if (
        context.type !== context.UserEventType.CREATE &&
        context.type !== context.UserEventType.EDIT
      ) {
        return;
      }

      var salesOrder = context.newRecord;

      // Fetch the SAC Amount fields
      const sacAmount1 = salesOrder.getValue({
        fieldId: 'custbody_sac1_amount',
      });
      const sacAmount2 = salesOrder.getValue({
        fieldId: 'custbody_sac2_amount',
      });

      // Check if SAC Amount 1 is populated
      if (!sacAmount1) {
        log.audit(loggerTitle, 'SAC Amount 1 not populated Script will abort');
        return;
      }

      // Calculate the total SAC discount amount
      let totalDiscountAmount = parseFloat(sacAmount1) || 0;
      if (sacAmount2) {
        totalDiscountAmount += parseFloat(sacAmount2) || 0;
      }

      log.debug(
        loggerTitle,
        'Total SAC Discount Amount: ' + totalDiscountAmount
      );

      salesOrder.setValue({
        fieldId: 'discountitem',
        value: 3023, // SAC Discount internal ID
      });
      salesOrder.setValue({
        fieldId: 'discountrate',
        value: -totalDiscountAmount.toFixed(2), // Negative to apply discount
      });

      log.debug(
        loggerTitle,
        'Discount Applied - Discount item applied to sales order'
      );
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>--------------------' + loggerTitle + '-Exit--------------------<|'
    );
    return true;
  };
  /* ------------------------ SCAC Calculation - End ------------------------ */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.beforeSubmit = scacCalculation;
  return exports;
  /* ------------------------------- Exports End ------------------------------ */
});
