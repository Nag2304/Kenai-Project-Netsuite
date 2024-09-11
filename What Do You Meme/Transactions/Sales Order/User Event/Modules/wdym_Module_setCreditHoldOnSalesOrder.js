/**
 * @NApiVersion 2.x
 * @NModuleScope SameAccount
 */

/**
 * File name:wdym_Module_setCreditHoldOnSalesOrder.js
 * Author           Date       Version               Remarks
 * nagendrababu  10th Sep 2024 1.00       Initial creation of the module file.
 * nagendrababu  11th Sep 2024 1.01       Removed the double calculation of transaction amount and disabled the saved search.
 *
 */

/* global define,log */

define(['N/search', 'N/record'], (search, record) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ------------------------- Set Credit Hold - Begin ------------------------- */
  const setCreditHold = (scriptContext) => {
    const loggerTitle = ' Set Credit Hold ';
    log.debug(
      loggerTitle,
      '|>----------------' + loggerTitle + '- Begin ----------------<|'
    );
    //
    try {
      if (scriptContext.type === scriptContext.UserEventType.CREATE) {
        const salesRecord = scriptContext.newRecord;

        const customerId = salesRecord.getValue({ fieldId: 'entity' });

        // Load the customer record to check the credit hold status
        const customerRecord = record.load({
          type: 'customer',
          id: customerId,
        });

        // Retrieve the current credit hold status from the customer record
        const creditHoldStatus = customerRecord.getValue({
          fieldId: 'creditholdoverride',
        });

        // Extract the number of days overdue and past due amount from the customer's lookup fields
        const daysOverdue = customerRecord.getValue({
          fieldId: 'daysoverdue',
        });

        // Credit Limit
        const creditLimit = customerRecord.getValue({
          fieldId: 'creditlimit',
        });

        // Balance
        const balance =
          Number(
            customerRecord.getValue({
              fieldId: 'balance',
            })
          ) || 0;

        //Unbilled Orders
        const unBilledOrders =
          Number(
            customerRecord.getValue({
              fieldId: 'unbilledorders',
            })
          ) || 0;

        // Log the days overdue and the credit hold status for debugging purposes
        log.debug(
          loggerTitle,
          'Days Overdue: ' +
            daysOverdue +
            ' Credit Hold Status: ' +
            creditHoldStatus +
            ' Credit Limit: ' +
            creditLimit +
            ' Balance: ' +
            balance +
            ' Un-billed Orders: ' +
            unBilledOrders
        );
        //
        /* ---------------------- Credit Hold Check Logic - Begin ---------------------- */

        if (
          creditHoldStatus === 'ON' ||
          (creditHoldStatus === 'AUTO' && !creditLimit)
        ) {
          salesRecord.setValue({
            fieldId: 'custbody_wdym_credit_hold',
            value: true,
          });
          log.debug(
            loggerTitle,
            ' Credit Hold Check Box set to true for credit limit ON OR AUTO'
          );
        } else if (creditHoldStatus === 'AUTO') {
          // Transaction Amount
          let transactionAmount =
            (creditHoldCalculationforSOAndInv(customerId) || 0) +
            (balance || 0) +
            (unBilledOrders || 0);
          if (!transactionAmount) {
            transactionAmount = salesRecord.getValue({ fieldId: 'total' });
          }
          //
          log.debug(loggerTitle, ' Transaction amount: ' + transactionAmount);
          if (transactionAmount > Number(creditLimit)) {
            salesRecord.setValue({
              fieldId: 'custbody_wdym_credit_hold',
              value: true,
            });
            log.debug(
              loggerTitle,
              ' Credit Hold Check Box set to true for credit limit AUTO'
            );
          }
        }
      }
      /* ---------------------- Credit Hold Check Logic - End ------------------------ */
      //
    } catch (error) {
      log.error(
        loggerTitle +
          ' caught an exception and internal id of sales order is ' +
          scriptContext.id,
        error
      );
    }
    //
    log.debug(
      loggerTitle,
      '|>----------------' + loggerTitle + '- End ----------------<|'
    );
  };
  /* ------------------------- Set Credit Hold - End ------------------------- */
  //
  /* ------------------------- Helper Functions - Begin ------------------------- */
  //
  /* ************************** creditHoldCalculationforSOAndInv - Begin ************************** */
  /**
   *
   * @param {Number} customerId
   * @returns {Number}
   */
  const creditHoldCalculationforSOAndInv = (customerId) => {
    const loggerTitle = ' Credit Hold Calculations for SO and INV ';
    log.debug(
      loggerTitle,
      '|>----------------' + loggerTitle + '- Begin ----------------<|'
    );
    //
    let total = 0;
    try {
      const transactionSearchObj = search.create({
        type: 'transaction',
        filters: [
          ['type', 'anyof', 'SalesOrd'],
          'AND',
          ['mainline', 'is', 'T'],
          'AND',
          ['customer.internalidnumber', 'equalto', customerId],
          'AND',
          ['status', 'anyof', 'SalesOrd:A', 'SalesOrd:B'],
        ],
        columns: [
          search.createColumn({
            name: 'amount',
            summary: 'SUM',
            label: 'Amount',
          }),
        ],
      });
      const searchResultCount = transactionSearchObj.runPaged().count;
      log.debug('transactionSearchObj result count', searchResultCount);
      //
      transactionSearchObj.run().each(function (result) {
        total = Number(
          result.getValue({
            name: 'amount',
            summary: 'SUM',
            label: 'Amount',
          })
        );
      });
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>----------------' + loggerTitle + '- End ----------------<|'
    );
    return total ? total : 0;
  };
  /* ************************** creditHoldCalculationforSOAndInv - End ************************** */
  //
  /* ------------------------- Helper Functions - End ------------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.beforeSubmit = setCreditHold;
  return exports;
  /* ------------------------------- Exports End ------------------------------ */
});
