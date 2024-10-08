/**
 * @NApiVersion 2.x
 * @NModuleScope SameAccount
 */

/**
 * File name: rrb_Module_setShippingCostToTwentyPercent.js
 * Author           Date       Version               Remarks
 * nagendrababu 10.08.2024      1.00      Initial creation of script.
 *
 */

/* global define,log */

define([], () => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* --------------- Set Shipping Cost To Twenty Percent - Begin -------------- */
  /**
   *
   * @param {object} context
   */
  const setShippingCostToTwentyPercent = (context) => {
    const loggerTitle = 'Set Shipping Cost To Twenty Percent';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      const cashSaleRecord = context.newRecord;
      //
      const shippingCost = cashSaleRecord.getValue({ fieldId: 'shippingcost' });
      const reducedAmount = shippingCost * 0.2;
      const newShippingCost = shippingCost - reducedAmount;
      //
      log.debug(loggerTitle, { shippingCost, reducedAmount, newShippingCost });
      //
      if (newShippingCost !== shippingCost) {
        cashSaleRecord.setValue({
          fieldId: 'shippingcost',
          value: newShippingCost,
        });
        log.debug(
          loggerTitle,
          ' Shipping Cost set successfully: ' + newShippingCost
        );
      }
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
    return true;
  };
  /* --------------- Set Shipping Cost To Twenty Percent - End -------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.beforeSubmit = setShippingCostToTwentyPercent;
  return exports;
  /* ------------------------------- Exports End ------------------------------ */
});
