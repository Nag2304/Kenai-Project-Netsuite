/**
 * @NApiVersion 2.x
 * @NModuleScope SameAccount
 */

/**
 * File name: wdym_Module_sacDiscountUpdate.js
 * Author           Date       Version               Remarks
 * nagendrababu 12th Nov 2024   1.03        Updated SAC Discount Calculation to strip % symbol
 *
 */

/* global define, log */

define([], () => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */

  /* ------------------------ SAC Discount Calculation - Begin ------------------------ */
  /**
   *
   * @param {object} context
   * @returns {boolean}
   */
  const sacDiscountCalculation = (context) => {
    const loggerTitle = ' SAC Discount Calculation ';
    log.debug(
      loggerTitle,
      '|>--------------------' + loggerTitle + '-Entry--------------------<|'
    );

    try {
      if (
        context.type !== context.UserEventType.CREATE &&
        context.type !== context.UserEventType.EDIT
      ) {
        return;
      }

      var salesOrder = context.newRecord;

      // Fetch header-level discount fields, ensuring they default to '0' if null
      const sacDisc1Str =
        salesOrder.getValue({ fieldId: 'custbody_wdym_sac1_disc' }) || '0';
      const sacDisc2Str =
        salesOrder.getValue({ fieldId: 'custbody_wdym_sac2_disc' }) || '0';

      // Ensure sacDisc1Str and sacDisc2Str are treated as strings
      const sacDisc1 = parseFloat(String(sacDisc1Str).replace('%', '')) || 0;
      const sacDisc2 = parseFloat(String(sacDisc2Str).replace('%', '')) || 0;

      // Fetch the SAC Amount fields
      const sacAmount1 =
        parseFloat(salesOrder.getValue({ fieldId: 'custbody_sac1_amount' })) ||
        0;
      const sacAmount2 =
        parseFloat(salesOrder.getValue({ fieldId: 'custbody_sac2_amount' })) ||
        0;

      let totalDiscountAmount;

      // If both header SAC discounts are NULL, use the existing logic
      if (sacDisc1 === 0 && sacDisc2 === 0) {
        totalDiscountAmount = sacAmount1 + sacAmount2;

        salesOrder.setValue({
          fieldId: 'discountitem',
          value: 3476, // SAC Discount internal ID
        });
        salesOrder.setValue({
          fieldId: 'discountrate',
          value: -totalDiscountAmount.toFixed(2), // Negative to apply discount
        });
        log.debug(
          loggerTitle,
          'Existing discount logic applied with total discount amount: ' +
            totalDiscountAmount
        );
      } else {
        // If either SAC DISC 1 or SAC DISC 2 is NOT NULL, calculate percentage-based discount
        const totalDiscPercentage = sacDisc1 + sacDisc2; // Total discount percentage

        // Add discount item SAC % Discount with combined percentage value
        const discountItemId = 3476; // Adjust item ID based on environment

        salesOrder.setValue({
          fieldId: 'discountitem',
          value: discountItemId,
        });
        salesOrder.setValue({
          fieldId: 'discountrate',
          value: -totalDiscPercentage.toFixed(2), // Set as a negative percentage
        });
        log.debug(
          loggerTitle,
          'Percentage discount applied with total discount rate: ' +
            totalDiscPercentage +
            '%'
        );
      }

      // Update line-level fields with header discount values
      const lineCount = salesOrder.getLineCount({ sublistId: 'item' });
      for (let i = 0; i < lineCount; i++) {
        salesOrder.setSublistValue({
          sublistId: 'item',
          fieldId: 'custcol_wdym_sac1_disc',
          line: i,
          value: sacDisc1,
        });
        salesOrder.setSublistValue({
          sublistId: 'item',
          fieldId: 'custcol_wdym_sac2_disc',
          line: i,
          value: sacDisc2,
        });
      }

      log.debug(
        loggerTitle,
        'Discount Applied - SAC discount logic processed for sales order'
      );
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }

    log.debug(
      loggerTitle,
      '|>--------------------' + loggerTitle + '-Exit--------------------<|'
    );
    return true;
  };
  /* ------------------------ SAC Discount Calculation - End ------------------------ */

  /* ------------------------------ Exports Begin ----------------------------- */
  exports.beforeSubmit = sacDiscountCalculation;
  return exports;
  /* ------------------------------- Exports End ------------------------------ */
});
